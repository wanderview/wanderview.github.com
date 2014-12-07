---
layout: post
title: "Implementing the ServiceWorker Cache API in Gecko"
date: 2014-11-27 14:15:50 -0500
comments: true
categories: [mozilla,serviceworker,dom,cache]
---
For the last few months I've been heads down, implementing the ServiceWorker
Cache API in gecko.  All the work to this point has been done on a project
branch, but the code is finally reaching a point where it can land in
mozilla-central.  Before this can happen, of course, it needs to be peer
reviewed.  The patch, however, is going to be large and complex.  To
ease the pain for the reviewer I thought it would be helpful to provide a
high-level description of how things are put together.

<!--more-->

Building Blocks
===============
The Cache API is implemented in C++ based on the following Gecko primitives:

* **WebIDL DOM Binding**

    All new DOM objects in gecko now use our new [WebIDL bindings][].

* **PBackground IPC**

    [PBackground][] is an IPC facility that connects a child actor to a parent
    actor.  The parent actor is always in the parent process.  PBackground,
    however, allows the child actor to exist in either a remote child content
    process or within the same parent process.  This allows us to build
    services that support both [electrolysis][] (e10s) and our more traditional
    single process model.

    Another advantage of PBackground is that the IPC calls are handled by a
    worker thread rather than the parent process main thread.  This helps
    avoid stalls due to other main thread work.

* **Quota Manager**

    [Quota Manager][] is responsible for managing the disk space used by web
    content.  It determines when quota limits have been reached and will
    automatically delete old data when necessary.

* **SQLite**

    [mozStorage][] is an API that provides access to an SQLite database.

* **File System**

    Finally, the Cache uses raw files in the file system.

Alternatives
============
We did consider a couple alternatives to implementing a new storage engine for
Cache.  Mainly, we thought about using the existing **HTTP cache** or building
on top of **IndexedDB**.  For various reasons, however, we chose to build on
top of these primitives instead.  Ultimately it came down to the Cache spec not
quite lining up with these solutions.

For example, HTTP cache makes optimizations such that it only stores a single
resource for a given URL while the Cache API allows multiple Responses to be
stored for a URL.  In addition, the HTTP cache doesn't use the quota management
system and adding it would be a significant amount of work.

IndexedDB, on the other hand, is based on structured cloning which does not
currently support streaming data.  Given that Responses could be quite large
and come in from the network slowly, we thought streaming was a priority to
reduce the amount of required memory.

Also, while not a technical issue, IndexedDB was also undergoing a significant
rewrite at the time which we felt would have delays Cache implementation.

10,000 Foot View
================
With those primitives in mind, the overall structure of the Cache implementation
looks like this:

{% img /images/cache-high-level-design.png %}

Here we see from left-to-right:

* **JS Script**

    Web content running in a JavaScript context on the far left.  This could be
    in a ServiceWorker, a normal Web Worker, or on the main thread.

* **DOM Object**

    The script calls into the C++ DOM object using the [WebIDL bindings][].
    This layer does some argument validation and conversion, but is mostly just
    a pass through to the other layers.  Since most of the Cache API is
    asynchronous the DOM object also returns a [Promise][].  A unique RequestId
    is passed through to the other layers and used to find the Promise on
    completion.

* **Child and Parent IPC Actors**

    The connection between the processes is represented by a child and a parent
    actor.  These have a one-to-one correlation.  In the Cache API request
    messages are sent from the child-to-parent and response messages are
    sent back from the parent-to-child.  All of these messages are asynchronous
    and non-blocking.

* **Manager**

    This where things start to get a bit more interesting.  The Cache spec
    requires each origin to get its own, unique CacheStorage instance.  This
    is accomplished by creating a separate per-origin Manager object.  These
    Manager objects can come and go as DOM objects are used and the garbage
    collected, but there is only ever one Manager for each origin.

* **Context**

    When a Manager has a disk operation to perform it first needs to take a
    number of stateful steps to configure the QuotaManager properly.  All of
    this logic is wrapped up in what is called the Context.  I'll go into
    more detail on this later, but suffice it to say that the Context handles
    all the QuotaManager nitty gritty and then executes an Action at the
    right time.

* **Action**

    An Action is essentially a command object which performs a set of IO
    operations within a Context and then asynchronously calls back to the
    Manager when they are complete.  There are many different Action objects,
    but in general you can think of each Cache method, like `match()` or
    `put()`, having its own Action.

* **File System**

    Finally, the Action objects access the file system through the SQLite
    database, file streams, or the nsIFile interface.

Closer Look
===========
Lets take a closer look at some of the more interesting parts of the system.
Most of the action takes place in the Manager and Context, so lets start
there.

Manager
-------
As I mentioned above, the Cache spec indicates each origin should have its own
isolated `caches` object.  This maps to a single Manager instance for all
CacheStorage and Cache objects for scripts running in the same origin:

{% img /images/cache-singleton-manager.png %}

Its important that all operations for a single origin are routed through the
same Manager because operations in different script contexts can interact with
one another.

For example, lets consider the following Cache calls from scripts running in
two separate child processes.

1. Process 1 calls `caches.open('foo')`.
2. Process 1's promise from step 1 resolves with a Cache object.
3. Process 2 calls `caches.delete('foo')`.

At this point process 1 has a Cache object that has been removed from the
`caches` CacheStorage index.  Any additional calls to `caches.open('foo')`
will create a new Cache object.

But how should the Cache returned to Process 1 behave?  Its a bit poorly
defined in the spec, but the current interpretation is that it should behave
normally.  The sript in process 1 should continue to be able to access
data in the Cache using `match()`.  In addition, it should be able to store
values using `put()`, although this is somewhat pointless if the Cache is
not in `caches` anymore.  In the future, a `caches.put()` call may be added
to let a Cache object to be re-inserted into the CacheStorage.

In any case, the key here is that the `caches.delete()` call in process 2
must understand that a Cache object is in use.  It cannot simply delete all
the data for the Cache.  Instead we must reference count all uses of the
Cache and only remove the data when they are all released.

The Manager is the central place where all of this reference tracking is
implemented and these races are resolved.

A similar issue can happen with `cache.match(req)` and `cache.delete(req)`.  If
the matched Response is still referenced, then the body data file needs to
remain available for reading.  Again, the Manager handles this by tracking
outstanding references to open body files.  This is actually implemented by using
an additional actor called a StreamControl which will be shown in the
`cache.match()` trace below.

Context
-------
There are a number of stateful rules that must be followed in order to use the
QuotaManager.  The Context is designed to implement these rules in a way that
hides the complexity from the rest of the Cache as much as possible.

Roughly the rules are:

1. First, we must extract various information from the `nsIPrincipal` by calling
   `QuotaManager::GetInfoFromPrincipal()` on the main thread.  This call
   includes querying some permissions for the principal.  Since the permissions
   can change over time the value returned from this call should not be cached.
2. Next, the Cache must call `QuotaManager::WaitForOpenAllowed()` on the main
   thread.  A callback is provided to this call so that we can be notified when
   the open is permitted.  This callback occurrs on the main thread.
3. Once we receive the callback we must next call
   `QuotaManager::EnsureOriginIsInitialized()` on the QuotaManager IO thread.
   This returns a pointer to the origin-specific directory in which we should
   store all our files.
4. The Cache code is now free to interact with the file system in the directory
   retrieved in the last step.  These file IO operations can take place on any
   thread.  There are some small caveats about using QuotaManager specific APIs
   for SQLite and file streams, but for the most part these simply require
   providing information from the `GetInfoFromPrincipal()` call.
5. Once all file operations are complete we must call
   `QuotaManager::AllowNextSynchronizedOp()` on the main thread.  All file streams
   and SQLite database connections must be closed before making this call.

In theory we could perform the `EnsureOriginIsInitialized()` call in step 3 only
once if we also implemented the `nsIOfflineStorage` interface.  This interface
would allow the QuotaManager to tell us to shutdown any IO work since the origin
directory is being deleted.

Currently the Cache does not do this, however, because the `nsIOfflineStorage`
interface is expected to change significantly in the near future.  Instead, Cache
simply calls the `EnsureOriginIsInitialized()` method each time to re-create the
directory if necessary.  Once the API stabilizes the Cache will be updated to
receive all such notifications from QuotaManager.

An additional consequnce of not getting the `nsIOfflineStorage` callbacks is
that the Cache must proactively call `QuotaManager::AllowNextSynchronizedOp()`
so that the next QuotaManager client for the origin can do work.  The Context
does this by issueing the `AllowNextSynchronizedOp()` in its destructor.  All
in-flight Action objects hold a reference to the Context keeping it alive.
Once the Actions complete the Context reference count drops to zero and is
destructed.  In effect, the Context is a reference counted RAII object for
working with the QuotaManager.

The Manager currently creates the Context lazily on the first Action.  As long
as Actions are still in-flight, then additional Actions are opportunistically
dispatched on the same Context.  If there is a lull in activity, then the
Context is released and QuotaManager::AllowNextSynchronizedOp()` is called.
Again, once the `nsIOfflineStorage` equivalent callbacks are implemented then
the Context can be left open for longer periods.

Streams and IPC
---------------

Database Schema
---------------

Yak Trace
---------
Now that we have the lay of the land, lets trace what happens in Cache when
you do something like this:

```
// photo by leg0fenris: https://www.flickr.com/photos/legofenris/
var troopers = 'blob:https://mdn.github.io/6d4a4e7e-0b37-c342-81b6-c031a4b9082c'

var legoBox;
Promise.all([
  fetch(troopers),
  caches.open('legos')
]).then(function(results) {
  var response = results[0];
  legoBox = results[1];
  return legoBox.put(troopers, response);
}).then(function() {
  return legoBox.match(troopers);
}).then(function(response) {
  // invade rebel base
});
```

While it might seem the first Cache operation is `caches.open()`, its actually
just accessing `caches`.  When the `caches` attribute is first accessed on the
global we create the CacheStorage DOM object and IPC actors.

{% img /images/cache-create-actor.png %}

I've numbered each step in order to show the sequence of events.  These steps
are roughly:

1. The global WebIDL binding for `caches` creates a new CacheStorage object
   and returns it immediately to the script.
2. Asynchronously, the CacheStorage object creates a new child IPC actor.  Since
   this may not complete immediately, any requests coming in will be queued
   until actor is ready.  Of course, since all the operations use Promises, this
   queueing is transparent to the content script.
3. The child actor in turn sends a message to the parent process to create a
   corresponding parent actor.  This message includes the [principal][]
   describing the content script's origin and other identifying information.
4. Before permitting any actual work to take place the principal provided to
   the actor must be verified.  For various reasons this can only be done on
   the main thread.  So an asynchronous operation is triggered to do examine
   the principal and any operations coming in are queued.
5. Once the principal is verified we return to the worker thread.
6. Assuming verification succeeded, then the origin's Manager can now be
   accessed or created.  (This is actually deferred until the first operation,
   though.)

Now that we have the `caches` object we can get on with the `open()`.  This
sequence of steps is more complex:

{% img /images/cache-open-sequence.png %}

There are a lot more steps here.  To avoid making this blog post any more
boring than necessary, I'll focus on just the interesting ones.

As with the creation trace above, **steps 1 to 4** are basically just passing
the `open()` arguments across to the Manager.  Your basic digital plumbing at
work.

**Steps 5 and 6** make sure the Context exists and schedules an Action to
run on the IO thread.

Next, in **step 7**, the Action will perform the actual work involved.  It
must find the Cache if it already exists or create a new Cache.  This basically
involves reading and writing an entry in the SQLite database.  The result is
a unique CacheId.

**Steps 8 to 11** essentially just return the CacheId back to the actor layer.

You may have noticed we skipped step 10 fiddling with the Context. I'll get to
that below in the Manager/Context deep dive.

At this point we need to create a new actor for the CacheId.  This Cache actor
can then be passed back to the child process where it gets a child actor.
Finally a Cache DOM object is constructed and used to resolve the Promise
returned to the JS script in first step.  All of this occurs in **steps 12 to
17**.

On the off chance you're still reading this section, the script next performs
a `put()` on the cache:

{% img /images/cache-put-sequence.png %}

This trace looks similar to the last with the main difference occuring in the
Action on the right.  While this is true, its important to note that the
IPC serialization in this case includes a data stream for the Response body.
This stream serialization occurs in different ways depending on the source,
but the main thing to understand is that the body data may not all be available
when the `put()` occurrs.  We may just have the first few bytes and will have
to wait for further data to come in.

With that in mind the Action needs to do the following:

* Stream body data to files on disk.  This happens asynchronously on the IO
  thread.  The Action and the Context are kept alive this entire time.
* Update the SQLite database to reflect the new Request/Response pair with
  a file name pointer to the body.

All of the result steps are essentially just there to indicate completion
as `put()` resolves undefined in the success case.

Finally the script can use `match()` to read the data back out of the Cache:

{% img /images/cache-match-sequence.png %}

In this trace the Action must first query the SQLite tables to determine if
the Request exists in the Cache.  If it does, then it opens a stream to the
body file.

Its important to note, again, that this is just opening a stream.  The Action
is only accessing the file system directory structure and opening a file
descriptor to the body.  Its not actually reading any of the data for the
body yet.

Once the matched Response data and body file stream are passed back to the
parent actor, we must create an extra actor for the stream.  This actor is
then passed back to the child process and used to create a ReadStream.

A ReadStream is a wrapper around the body file stream.  This wrapper will
send a message back to the parent whenever the stream is closed.  In addition,
it allows the Manager to signal the stream that a shutdown is occuring and
the stream should be immediately closed.

The body file stream itself is serialized back to the child process by
dup()'ing the file descriptor opened by the Action.

Ultimately the body file data is read from the stream when the content script
calls `Response.text()` or one of the other body consumption methods.

[fetch]: https://fetch.spec.whatwg.org/
[response]: https://fetch.spec.whatwg.org/#response-class
[cache]: https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cache-objects
[primer]: http://jakearchibald.com/2014/service-worker-first-draft/
[WebIDL bindings]:
[PBackground]:
[electrolysis]:
[Quota Manager]:
[mozStorage]:

DRAFT STUFF
===========

What are you implementing?
==========================
The ServiceWorker Cache API allows content script to store and retrieve
[Fetch][fetch] [Response][response] objects.  Each page gets a CacheStorage
object unique to their origin.  You then have multiple Cache objects that can
be accessed in each CacheStorage.  This lets you manage your cached resources in
cohesive collections.

To fully understand the API you should read the [spec][cache] and Jake
Archibald's excellent [ServiceWorker primer][primer].  That being said, here is a
short example script using Cache:

```javascript
var url = 'http://example.com/hello.jpg';
var cache;

// Open the Cache and fetch a file in parallel
Promise.all([
  caches.open('v1'),
  fetch(url)
]).then(function (results) {

  // Put the fetched Response in the Cache
  cache = results[0];
  var response = results[1];
  return cache.put(url, response);

}).then(function() {

  // Pull the Response back out of the Cache for processing
  return cache.match(url);

}).then(function (response) {

  console.log(response.text());
});
```

Sounds easy. What's the catch?
==============================
In addition to what the Cache spec says, there were some additional goals and
constraints to consider.

1. **Work well on mobile devices.**

    One of the main goals for ServiceWorkers is to support offline web apps.
    This is obviously very important for browsers running on mobile devices,
    such as FirefoxOS and Firefox for Android.  These devices tend to have much
    less memory than traditional desktop machines.  The design should take
    these limitations into account and favor memory efficiency where possible.

2. **Support both single-process and multi-process configurations.**

    Gecko currently provides both the traditional single-process setup and the
    multi-process configuration called electrolysis (e10s).  Both Firefox
    release and Firefox for Android currently run in single process. FirefoxOS
    and Firefox Nightly run in e10s.  The Cache must work in all of these
    products.

3. **Integrate with the quota and permissions systems.**

    The Cache API allows content scripts to store significant amounts of data
    on the user's disk.  To avoid abuse, the implementation must respect limits
    set by the user. This means integrating with the browser's quota management
    and permissions systems.

4. **Support scripts outside of ServiceWorkers.**

    While currently the spec only provides the Cache API on ServiceWorkers, the
    intention is to eventually make it available more broadly.  This means the
    implementation should support usage on the main thread and other types of
    web workers.

Can't you just reuse some existing code?
========================================
When we first started implementing ServiceWorkers we considered a few
different options for Cache:

1. **Use the HTTP cache.**

    One obvious approach would have been to reuse the existing HTTP cache for
    the new Cache API.  At first glance these two have a lot of similarity in
    what they do and the HTTP cache might simply need resource pinning to avoid
    automaticly aging out files.  Unfortunately, there are many more
    complications with this approach than just aging.

    First, the HTTP cache does not use the quota management system and adding
    support for it would be non-trivial.

    In addition, the HTTP cache does not implement caching the same way as the
    Cache API spec.  For example, with the Cache API you can end up with many
    different files stored for the same URL due to vary headers, there being
    multiple Cache objects per CacheStorage, and a different CacheStorage for
    each origin.  In contrast, the HTTP cache only ever stores a single file for
    any given resource URL.  This makes sense given typical browser usage, but
    does not fit the Cache API.  While we could add try to change HTTP cache to
    support all these differences, it seems prudent to allow it to follow its
    own implementation path without constraint from this other spec.

2. **Use IndexedDB.**

    Another approach would have been to build the Cache API on top of the
    existing IndexedDB (IDB) implementation.  The advantages here are that IDB
    is already battle tested on mobile devices in FirefoxOS.  It also is
    fully integrated into the quota managment system.

    Unfortunately, though, there were some disadvantages with this approach
    as well.  IDB is based on structured cloning data to be stored.  The Fetch
    Response objects, however, are designed to be streamed from the network to
    allow large values to be handled efficiently.  When we began implementation
    there was no way to structure clone a streamed value.  The ability to support
    streaming efficiently was considered important for memory efficiency.

    Also, it seems that the Cache API matching algorithms can be implemented
    more efficiently using an SQL oriented storage engine compared to the API
    provided by IDB.  While the IDB API is flexible, I've found it often
    requires reading more data into memory compared to using a more complex
    query engine.

    Finally, when the Cache API work was beginning, IDB was in the middle of
    being re-written to support web workers.  This re-write is just now
    finishing and would have delayed the Cache implementation quite a bit.

3. **Build from scratch.**

    Ultimately we decided to build a new storage engine due to the issues
    with using the HTTP cache and IndexedDB.  With this approach we could
    use the same underlying primitives that IndexedDB uses, such as SQLite,
    but make different design choices to better fit the Cache API.  Data
    could be streamed instead of structure cloned.  The database schema
    could be designed to fit the Cache API algorithms.

    Of course, this approach also has its disadvantages; the main one being
    increased code complexity.  The hope, however, is that we can eventually
    identify common problems and solutions with the IndexedDB implementation
    and factor these out into new, better primitives for future use.
