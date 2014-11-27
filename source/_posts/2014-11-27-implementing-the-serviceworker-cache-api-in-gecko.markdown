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

1. **Use resources efficiently on mobile devices.**
2. **Support both single-process and multi-process configurations.**
3. **Integrate with the quota and permissions systems.**

Can't you just reuse some existing code?
========================================
When we first started implementing ServiceWorkers we considered a few
different options for Cache:

1. **Use HTTP cache.**
2. **Use IndexedDB.**
3. **Build from scratch.**

High Level Design
=================

[fetch]: https://fetch.spec.whatwg.org/
[response]: https://fetch.spec.whatwg.org/#response-class
[cache]: https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cache-objects
[primer]: http://jakearchibald.com/2014/service-worker-first-draft/
