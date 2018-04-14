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

* Support multi-process service workers

More Problems
-------------

* Support initial about:blank behavior
* Support windows and workers as clients
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
