---
layout: post
title: "Working with NetBIOS in node.js"
date: 2013-01-20 21:29
comments: false
categories: 
---

Lately I've been caught in the middle of a [dispute between my Xerox scanner and Mac OS X][].
The Mac only wants to use modern versions of SMB to share
files and is giving the scanner the cold shoulder.  In an attempt to mediate
this issue I've turned to hacking on ancient protocols in [node.js][].

So far I've tackled [NetBIOS][] and thought I would share some of the code
I've come up with.

The first step to finding or advertising a NetBIOS name is to start up a
[netbios-name-service][] instance.

``` javascript
    var NBService = require('netbios-name-service');

    var nameService = new NBService();
    nameService.start(function() {
      console.log('NetBIOS name service started');
    });
```

Then, if you want to search for a service, like say a printer, you can
execute the following code.

``` javascript
    var NBName = require('netbios-name');

    var queryName = new NBName({name: 'PRINTER'});
    nameService.find(queryName, function(error, address) {
      console.log('Found NetBIOS name [' + queryName + '] at [' + address + ']');
    });
```

Note, you must use the [netbios-name][] module in order to properly define
names in order to search, advertise, or perform other operations.  This module
provides a simple class that combines the simple NetBIOS name with additional
information such as the scope ID (aka domain name) and a suffix byte indicating
the what type of node is being represented.

For the problem at hand, however, I don't need to search for a name. Instead
I want to advertise the node.js server via NetBIOS so that the scanner can
push files to us.

``` javascript
    var myName = new NBName({name: 'XYKON-2'});
    nameService.add({nbname: myName});
```

This causes the service to monitor UDP port 137 for broadcast queries looking
for the name `XYKON-2`.  If a query occurs, then the service will automatically
respond with the IP address of the server.

So this allows the scanner to find our server, but what about handling the
NetBIOS traffic containing the actual file operations?

To deal with this part of the problem we need to use the [netbios-session][]
module.  Here is code to receive incoming NetBIOS sessions.

``` javascript
    var net = require('net');
    var NBSession = require('netbios-session');

    var server = net.createServer(function(socket) {
      var sessionIn = new NBSession({autoAccept: true});

      sessionIn.on('message', function(msg) {
        console.log('NetBIOS session message with [' + msg.length + '] bytes');
      });

      sessionIn.on('connect', function() {
        console.log('New NetBIOS session from [' socket.remoteAddress + ']');
      });

      sessionIn.attach(socket);
    });

    server.listen(139);
```

The [netbios-session][] class is essentially a wrapper around a TCP socket.
After calling `new` to create a new instance, you need to call `connect()`
or, in this case, `attach()`.  Here we are using `attach()` to associate the
session with a new TCP socket.

Once the session is ready to send and receive data it will emit the `'connect'`
event.  At this point `'message'` events will occur whenever a message is
received from the remote peer.  Messages can be sent using the `write()`
method.

So, now that we are receiving data from the scanner, we need to forward this
on to my Mac's SMB service listening on port 445.

Now, it turns out, direct SMB connections to port 445 actually use the NetBIOS
session header to implement message framing, but it skips all of the initial
session negotiation that normally occurs.

So, to achieve our forwarding we want to create a second session to port
445 using the `'direct'` constructor option.

``` javascript
    var sessionOut = new Session({direct: true});
    sessionOut.connect(445, '127.0.0.1');
```

After this, we can take messages we receive from `sessionIn` events and pass
them straight to `'sessionOut.write()'`.  Since SMB is bidirectional, we also
need to pass messages in the reverse direction.  With a bit of back-pressure
logic sprinkled in, this code looks like the following:

``` javascript
    sessionIn.on('message', _forward.bind(null, sessionOut, sessionIn));
    sessionOut.on('message', _forward.bind(null, sessionIn, sessionOut));

    function _forward(dst, src, msg) {
      var flushed = dst.write(msg);
      if (!flushed) {
        src.pause();
        dst.once('drain', src.resume.bind(src));
      }
    }
```

Putting all the pieces together we end up with the following.

``` javascript netbios-fwd.js http://www.github.com/wanderview/fileshift/blob/master/netbios-fwd.js Source File
'use strict';

var NBService = require('netbios-name-service');
var NBSession = require('netbios-session');
var NBName = require('netbios-name');
var net = require('net');

var NAME = 'XYKON-2';
var SCOPE_ID = 'example.com';
var FWD_PORT = 445;
var FWD_HOST = '127.0.0.1';

var server = net.createServer(function(socket) {
  var sessionIn = new NBSession({paused: true, autoAccept: true});

  sessionIn.on('connect', function() {
    var sessionOut = new NBSession({direct: true});

    var endHandler = function() {
      sessionIn.end();
      sessionOut.end();
    };
    var errorHandler = function(error) {
      console.log(error);
      endHandler();
    };

    sessionIn.on('end', endHandler);
    sessionOut.on('end', endHandler);

    sessionIn.on('error', errorHandler);
    sessionOut.on('error', errorHandler);

    sessionIn.on('message', _forward.bind(null, sessionOut, sessionIn));
    sessionOut.on('message', _forward.bind(null, sessionIn, sessionOut));

    sessionOut.on('connect', sessionIn.resume.bind(sessionIn));

    sessionOut.connect(FWD_PORT, FWD_HOST);
  });

  sessionIn.attach(socket);
});

function _forward(dst, src, msg) {
  var flushed = dst.write(msg);
  if (!flushed) {
    src.pause();
    dst.once('drain', src.resume.bind(src));
  }
}

server.listen(139);

var nameService = new NBService();
nameService.start(function() {
  var myName = new NBName({name: NAME, scopeId: SCOPE_ID, suffix: 0x20});
  nameService.add({nbname: myName});
});
```

We now have a fully functional proxy server for connecting devices that only
speak NetBIOS up to modern, direct SMB servers.

Of course, this assumes that the underlying SMB protocol is compatible
with the destination.  It turns out, the new Mac OS X SMB server has some
[additional restrictions][].  While I can connect through the proxy using
`net use` on Windows XP, my scanner still fails to connect.

Looking in the log I found this:

``` bash
    smbd[91973]: 127.0.0.1 SMB client not supported - Unicode strings are required
```

Unfortunately this implementation is not even a temporary work around
for my problem since the scanner doesn't know how to talk Unicode.

So, it looks like I will be diving into the SMB protocol next so that I can
intercept the file operations directly in node.

---

All the modules used in this post are available on GitHub and npm:

* [netbios-name][]
* [netbios-name-service][]
* [netbios-session][]

The end script is available on Github in the [fileshift][] project.

[dispute between my Xerox scanner and Mac OS X]: /blog/2013/01/13/xerox-plus-apple-equals-equals-equals-node-dot-js/
[node.js]: http://nodejs.org
[NetBIOS]: http://tools.ietf.org/rfc/rfc1001.txt
[netbios-name]: http://www.github.com/wanderview/node-netbios-name#readme
[netbios-name-service]: http://www.github.com/wanderview/node-netbios-name-service#readme
[netbios-session]: http://www.github.com/wanderview/node-netbios-session#readme
[additional restrictions]: http://support.apple.com/kb/HT4698?viewlocale=en_US
[fileshift]: http://www.github.com/wanderview/fileshift
