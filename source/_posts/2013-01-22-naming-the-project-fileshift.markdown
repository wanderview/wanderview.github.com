---
layout: post
title: "Naming the Project: FileShift"
date: 2013-01-22 21:13
comments: false
categories: 
---

My [last post][] described some basic NetBIOS operations using [node.js][].
This was the first step towards my [larger project goal][] of integrating my
scanner with [DropBox][].  At the end of the post, however, I realized I
didn't have a good place to keep that final script pulling all my [npm][]
modules together.

To resolve this, I've decided to go ahead and give the overall project a
GitHub repository.  As a side benefit, the project also has a name besides
"the project".

From now on it will be called [FileShift][].

While I plan to build out the underlying infrastructure in separate [npm][]
modules, the core logic will end up here.  While its obviously very early in
the effort, ultimately I'd like to see this project support translating
between as many different file system protocols as possible.

If nothing else, this should keep me busy for a while.

---

The NetBIOS proxy script from my [last post][] can be found [here][].

[last post]: /blog/2013/01/20/working-with-netbios-in-node-dot-js/
[node.js]: http://nodejs.org
[larger project goal]: /blog/2013/01/13/xerox-plus-apple-equals-equals-equals-node-dot-js/
[DropBox]: http://dropbox.com
[netbios-session]: http://www.github.com/netbios-session
[netbios-name-service]: http://www.github.com/netbios-name-service
[FileShift]: http://www.github.com/wanderview/fileshift
[npm]: http://npmjs.org
[here]: https://github.com/wanderview/fileshift/blob/master/netbios-fwd.js
