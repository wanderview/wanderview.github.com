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

High Level Design
=================

{% img right /images/cache_high_level_design.png %}

CacheStorage.open()
-------------------
{% img right /images/cache_open_sequence.png %}

Cache.match()
-------------
{% img right /images/cache_match_sequence.png %}

[fetch]: https://fetch.spec.whatwg.org/
[response]: https://fetch.spec.whatwg.org/#response-class
[cache]: https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cache-objects
[primer]: http://jakearchibald.com/2014/service-worker-first-draft/
