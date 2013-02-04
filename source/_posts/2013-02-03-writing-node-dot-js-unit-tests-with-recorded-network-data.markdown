---
layout: post
title: "Writing Node.js Unit Tests With Recorded Network Data"
date: 2013-02-03 22:59
comments: false
categories: 
---

Automated unit tests are a wonderful thing.  They help give you the
confidence to make difficult changes and are your first line of
defense against regressions.  Unfortunately, however, unit tests
typically only validate code against the same expectations and
pre-conceived notions we used to write the code in the first place.
All to often we later find our expectations do not match reality.

One way to minimize this problem is to write your tests using real world
data.  In the case of network code, this can be done by recording traffic
to a [pcap][] file and then playing it back as the input to your test.

In this post I will discuss how to do this in [node.js][] using the
[pcap-socket][] module.

## Module Overview

There are currently a couple of options for accessing [pcap][] data in
[node.js][]:

* The [pcap module][] provides a wrapper around the native libpcap library.
* The [pcap-parser][] module provides a pure JavaScript implementation.

In both cases, however, the data is provided in a raw form which still
includes the Ethernet frame, the IP header, and the TCP header.  The code
to be tested, however, probably expects data as provided by [net.Socket][]
with all of these headers stripped.  This makes it awkward and tedious to
write tests against [pcap][] files.

To address this problem I've written a socket compatibility wrapper around
[pcap-parser][] called [pcap-socket][].  This wrapper implements just enough
logic to parse and strip the network headers.  Data is then provided
to your test code using the same API provided by [net.Socket][].

Creating a [pcap-socket][] requires the path to the [pcap][] file and
an IP address:

```javascript
var PcapSocket = require ('pcap-socket');
var file = path.join(__dirname, 'data', 'http-session-winxp.pcap');
var psocket = new PcapSocket(file, '10.0.1.6');
```

The IP address is required in order to tell [pcap-socket][] which end of
the recorded session you would like to pretend to be.  Any data sent to this
address in your file will be treated as data to be delivered by the socket.

This handles the incoming side, but what about writing data out?

In this case the packets originating for your configured address in the
[pcap][] file will be ignored.  We are less interested in how the real
server responded during your recording than how the code under test responds.

Therefore, data written to the [pcap-socket][] gets placed in a separate
`output` stream.  This lets you write tests that examine and validate
responses for correctness.

This might be more clear with some pictures.

The following diagram represents the logical flow of data using a real
[net.Socket][] object.

{% img center /images/net-socket-simple.png %}

In contrast, the [pcap-socket][] configuration looks like this:

{% img center /images/pcap-socket-diagram.png %}

Here is an example of using the `output` stream to validate your code's
response.  Note, this uses the new streams2 API, but you can also use
the more traditional `on('data')` API as well.

```javascript
psocket.output.on('readable', function() {
  var chunk = psocket.output.read(156);
  if (chunk) {
    var str = chunk.toString();

    test.ok(str.match(/HTTP\/1.1 200 OK/));
    test.ok(str.match(/Content-Type: text\/plain/));
    test.ok(str.match(new RegExp(msg)));

    test.done();
  }
});
psocket.output.read(0);
```

## Record Your Network Data

Now that we've covered the basic [pcap-socket][] concepts, the next step is to
record some network data in the [pcap][] file format.  If you are already
comfortable with network monitoring tools, you may wish to skip to the next
section.

The easiest way to do this is either with the UNIX command line tool
[tcpdump][] or with the graphical [wireshark][] application.  In either
case, you first need to set up the monitoring tool with a filter matching
the type of data you want to collect.

For example, in [tcpdump][] you might do the following to record HTTP
sessions from a particular host.

```bash
sudo tcpdump -i en1 -w data.pcap port 80 and host 10.0.1.12
```

Note that `sudo` is required since putting the network interface
into promiscuous mode requires administrator privileges.  Also, you
typically must specify the correct network interface using the `-i`
option.  Here I am specifying my MacBook's wireless interface.

Once the filter is running, perform whatever actions you need to in
order to trigger the network traffic.  This could be using the browser to
hit a web page, executing a query against a database, etc.

Make sure to use save the results to a file using the `-w data.pcap`
option in [tcpdump][] or `Save As` in [wireshark][]..  You can then replay
the data at any time with this command:

```bash
tcpdump -r data.pcap
```

If you end up with more data in your file then you would like, you can
specify a more strict filter and write the data out again to a second
file.

```bash
tcpdump -r data.pcap -w data2.pcap host 10.0.1.6
```

Ideally you should aim to have the minimum amount of data in your file
required to represent a real-world instance of the situation you want
to test.

## Write Your Unit Test

Your unit test will typically need a few standard sections:

* Create the [pcap-socket][] from the [pcap][] file.
* Write some response validation code that reads from the `output` stream.
* Pass the [pcap-socket][] to your code in some way.  Hopefully there
  is an easy way to introduce the [pcap-socket][] in place of [net.Socket][].
  You may need to get creative here or refactor the code to support this.

As an example, lets test everyone's first [node.js][] program; the simple
hello world web server:

```javascript
// Setup an HTTP server to test
var server = http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
});
```

Most of this test is actually shown in snippets above, but I will repeat
them here for clarity.

First, create the [pcap-socket][]:

```javascript
var file = path.join(__dirname, 'data', 'http-session-winxp.pcap');
var psocket = new PcapSocket(file, '10.0.1.6');
```

Here the [pcap][] file is stored in the file
`'./data/http-session-winxp.pcap'`.  I used `tcpdump` to examine the file
and determine that the web server was bound to the IP address `10.0.1.6`.

Next, write code that validates the response that should occur.

```javascript
psocket.output.on('readable', function() {
  var chunk = psocket.output.read(156);
  if (chunk) {
    var str = chunk.toString();

    test.ok(str.match(/HTTP\/1.1 200 OK/));
    test.ok(str.match(/Content-Type: text\/plain/));
    test.ok(str.match(new RegExp(msg)));

    test.done();
  }
});
psocket.output.read(0);
```

Finally, to supply the [pcap-socket][] to the HTTP server we take advantage
of the fact that it internally listens for the `'connection'` event in order
to begin processing a new session.

```javascript
server.emit('connection', psocket);
```

All together the test looks like this:

```javascript
var PcapSocket = require('pcap-socket');

var http = require('http');
var path = require('path');

module.exports.http = function(test) {
  test.expect(3);

  var msg = 'Hello World\n';

  // Setup an HTTP server to test
  var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(msg);
  });

  // Configure the pcap socket to provide real, recorded network data
  var file = path.join(__dirname, 'data', 'http-session-winxp.pcap');
  var psocket = new PcapSocket(file, '10.0.1.6');

  // When the server sends back a response, validate that it makes sense
  psocket.output.on('readable', function() {
    // Read the full response; length determined by looking at pcap file
    var chunk = psocket.output.read(156);
    if (chunk) {
      var str = chunk.toString();

      test.ok(str.match(/HTTP\/1.1 200 OK/));
      test.ok(str.match(/Content-Type: text\/plain/));
      test.ok(str.match(new RegExp(msg)));

      test.done();
    }
  });
  psocket.output.read(0);

  // Supply the pcap socket to the HTTP server as a new connection
  server.emit('connection', psocket);
};
```

## A More Complex Example

The HTTP example is a good start, but ideally it would be nice to test a
more complex case that spans a longer TCP session.

The following code tests the [netbios-session][] module against a [pcap][]
recording between my scanner and a Windows XP virtual machine.  It validates
the request, positive response, and subsequent message stream.

```javascript
var Session = require('../session');

var NBName = require('netbios-name');
var PcapSocket = require('pcap-socket');
var path = require('path');

var FILE = path.join(__dirname, 'data', 'netbios-ssn-full-scanner-winxp.pcap');
module.exports.server = function(test) {
  test.expect(7);
  var psocket = new PcapSocket(FILE, '10.0.1.12');

  var session = new Session();

  // validate expected request
  session.attach(psocket, function(error, request) {
    test.equal(null, error);
    test.equal('VMWINXP', request.callTo.name);
    test.equal('PRINTER', request.callFrom.name);
    request.accept();
  });

  // validate that we receive all the expected bytes in the session
  var length = 0;
  session.on('message', function(msg) {
    length += msg.length;
  });

  // validate positive response
  psocket.output.on('readable', function() {
    var chunk = psocket.output.read(4);
    if (chunk) {
      test.equal(0x82, chunk.readUInt8(0));
      test.equal(0, chunk.readUInt8(1));
      test.equal(0, chunk.readUInt16BE(2));
    }
  });
  psocket.output.read(0);

  // validate session completes properly
  session.on('end', function() {
    test.equal(438, length);
    test.done();
  });
};
```

[node.js]: http://nodejs.org
[pcap-socket]: https://www.github.com/wanderview/node-pcap-socket#readme
[pcap]: http://en.wikipedia.org/wiki/Pcap
[tcpdump]: http://www.tcpdump.org/
[wireshark]: http://www.wireshark.org/
[pcap module]: https://github.com/mranney/node_pcap#readme
[pcap-parser]: https://github.com/nearinfinity/node-pcap-parser#readme
[net.Socket]: http://nodejs.org/api/net.html#net_class_net_socket
[netbios-session]: https://github.com/wanderview/node-netbios-session#readme
