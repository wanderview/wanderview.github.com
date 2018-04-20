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

## The Clients API

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

## The Problem

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

<img class="center-block" src="/images/service-workers-legacy-e10s.svg"/>

Changing the design of the Clients API to support multiple processes was the
first step in fixing this situation.

## More Problems

In addition to solving the cross-process problem described above, the Clients API
rewrite also ran into a number of other problems and constraints that had to be
addressed.

### about:blank

The Clients API is a powerful interface because it exposes a fundamental primitive
in the browser.  One of the unexpected side effects of this is that it also exposed
some of the little known legacy behavior in browsers.

In particular, while working on the Clients API I discovered browsers often create
"initial" windows with an "about:blank" URL prior to loading the final window.
This behavior mainly exists to support this use case:

``` html
<iframe id="frame" src="frame.html"></iframe>
<script>
// Synchronously access the iframe before its src can load.
var f = document.getElementById("frame");

// Set some global state on the iframe's global.  This will
// persist across the load of its src and be available to
// the new window.
f.foo = "bar";
</script>
```

This snippet of code works in all browsers, as far as I know.  Note, however, initial
about:blank window support like this is very *non-standard* for dynamicly created
iframes.  Different browsers are all over the map on behavior.

In any case, the Client API exposes windows in the same origin.  These about:blank
windows show up in `matchAll()` queries and can be communicated with via
`postMessage()`.

This behavior was somewhat unexpected and required spec discussions to determine if
it should indeed work this way or not.  In the end we decided to simply expose
clients as a simple primitive without any "magic" to hide this kind of thing
legacy browser functionality.

### Windows vs Workers

When Firefox was first written the browser only supported a single main thread for
all javascript globals.  Web workers were added later to allow scripts to run on
separate threads.

Unfortunately large portions of the codebase assume window-based code and
worker-based code often is supported as an afterthought.  You can see this in the
many APIs that reference `nsIDocument` and then may (or may not) have a secondary
API that takes something like `WorkerPrivate`.  The two systems are largely
separate and require different handling.

The Clients API, however, is a designed to expose javascript globals as Client
objects whether they are windows or workers.  It attempts to treat the two as
the same kind of browser primitive.  The new implementation therefore needed
to reduce the window-vs-worker technical debt where it could and bridge the
gap where it could not.

### FetchEvent.resultingClientId

An added factor to consider in this effort was a new feature added to the
spec.  The `FetchEvent.resultingClientId` is intended to represent the client
that will come into existence if a document navigation or worker script load
succeeds.  It represents a client before it exists.

While the work performed for Firefox 59 does not implement resultingClientId
yet, it was important to plan for it.  We really did not want to have to
rewrite the Clients API for a third time.

To that end the design needed to:

* Create the instantiate the potential Client before the network request.
* Determine the correct origin for the potential Client and properly handle
  if the network request redirected to a different origin.

These two items were particularly difficult to support for worker clients.

First, the internal network primitive in Firefox is called an nsIChannel
and can only be used on the main thread.  This means that any client
information attached to the nsIChannel would need to be used on a thread
different from the worker thread that owns the client.

Also, the existing worker code largely delayed determining its final
origin until after the nsIChannel completed loading.  This was a convenience
because our origin primitive, the nsIPrincipal, is also only permitted to
be used on the main thread.

Finally, the resultingClientId feature also interacted with the initial
about:blank windows mentioned earlier.  When an initial about:blank is
present then the resultingClientId already exists and is simply be
populated by the network load.

### Performance

The last issue to consider in the design was overall browser performance.
As with most features its possible to optimize some operations at the
expense of other operations.

What needs to be fast?  Is `clients.matchAll()` the most important feature
to optimize?

In this case I decided it was best to optimize for fast client creation
and destruction.  The browser creates a lot of globals over the course
of its lifetime.  These have a direct impact on user visibile performance
like page load time.  Its better to keep creation quick and make querying
take longer.

## Goals

Based on the problem space described above, I chose to focus the design
on these goals:

1. Equal support for both main thread windows and off-main-thread worker clients.
2. Client identity must be created before the non-subresource network request.
3. Threadsafe data type for referencing client identity across thread boundaries.
4. Serializable data type for referencing clients across process boundaries.
5. Ability to search list of known clients across process boundaries.
6. Ability to attach to a known client to query or control it.
7. Fast to create/destroy clients.

The next section will discuss how the new Clients API design meets these goals.

## Design

Basic Structure

Window ClientSource

Worker ClientSource

ClientInfo for threadsafe identity

nsIChannel integration

ClientHandle
