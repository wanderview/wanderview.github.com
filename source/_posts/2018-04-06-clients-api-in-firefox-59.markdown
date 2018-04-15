---
layout: post
title: "Clients API in Firefox 59"
date: 2018-04-06 22:50:36 -0400
comments: false
categories: [mozilla,serviceworker,dom]
---

Firefox 59 shipped a few weeks ago and includes a new implementation of the
service worker Clients API.  It took me close to a year to design and code
these changes.  This post will discuss why the Clients API needed to be
reworked and will describe the new architecture.

<!-- more -->

The Clients API
---------------

First, what is the service worker Clients API?

In short, the Clients API:

1. Represents all globals (windows/iframes/workers/etc) as Client objects.
2. Allows scripts to query the list of all same-origin Client objects active in the
   browser using the `Clients.matchAll()` method.
3. Allows scripts to create new window Client objects using the `Clients.openWindow()`
   method.
4. Allows scripts to interact with a given Client via methods like `postMessage()`,
   `focus()`, and `navigate()`.
5. Allows service worker scripts to take control of clients that match its scope
   using the `clients.claim()` method.

Here is an example script the queries all of the same-origin Client objects
and posts a message telling them what kind of Client they are.

```javascript
let list = await clients.matchAll({ includeUncontrolled: true });
list.forEach(client => {
  client.postMessage('You are a ' + client.type + ' client!');
});
```

Currently the Clients API is only exposed on service worker threads.  In the
future it [may be exposed on window and worker globals][] as well.

For more information on the Clients API itself, please see the [documentation on MDN][].

[may be exposed on window and worker globals]: https://github.com/w3c/ServiceWorker/issues/955
[documentation on MDN]: https://developer.mozilla.org/en-US/docs/Web/API/Clients

The Problem
-----------

The Clients API originall shipped in Firefox 44 and was more or less feature complete
in Firefox 45.  So what's the problem?  Why did it need to get be overhauled?

In short, the answer is electrolysis project, or "e10s" for short.

When service workes and the Clients API were originally implemented Firefox ran in
a single process.  All windows, workers, and related service workers were expected
to coexist within a single process.

*insert diagram*

The e10s project, however, moved the browser to a multiple process architecture
with a separate priviledged "parent" process and one or more sandboxed "child"
processes.  Firefox moved to a single child process in release 48 and to
multiple child processes in release 54.

Ever since then Firefox has limped along in a "mostly compatible" mode:

1. Service workers are managed in each process separately.
2. Registration state is propagated between processes to keep them in sync.
3. It is possible to run two instances of the same service worker in different
   proceses at the same time.
4. The Clients API can only observe and control windows and workers within
   the same process running the service worker script.

*insert diagram*

Changing the design of the Clients API to support multiple processes was the
first step in fixing this situation.

More Problems
-------------

* Support windows and workers as clients
* Support initial about:blank behavior
* Support nsIChannel on separate thread from workers
* Prepare to support FetchEvent.resultingClientId

Goals
-----

* Equal support for both main thread windows and OMT worker clients
* Client identity must be created before the non-subresource network request
* Threadsafe data type for referencing client identity
* Serializable data type for referencing clients across process boundaries
* Ability to search list of known clients across process boundaries
* Ability to attach to a known client to query or control it
* Fast to create/destroy clients

Design
------

Pretty pictures...
