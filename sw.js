---
---
'use strict';

// Use a prefix string to differentiate cache objects for the blog
// from other github repo's hosted on the same origin.
var prefix = 'blog - ';

// Every time the site is generated we update the cache version based
// on the current time.  This ensures any modifications to the blog
// will trigger an update.
var version = prefix + '{{ site.time }}';

// Resources needed to display our offline page.
var offlineAssets = [
  '/offline/',
  '/assets/main.css',
  '/assets/minima-social-icons.svg',
  '/images/wifi-1-bar-xxl.png',
];


addEventListener('install', function(evt) {
  skipWaiting();
  // Only pre-cache resources needed to show our offline failure page.  All
  // other resources are added via read-through-caching.
  evt.waitUntil(caches.open(version).then(function(cache) {
    return cache.addAll(
      offlineAssets.map(url => new Request(url, { cache: 'no-cache' }))
    );
  }));
});

addEventListener('activate', function(evt) {
  // Delete all old cache objects, but only for the blog.  Don't delete
  // cache objects for other github repo's hosted on same domain.
  evt.waitUntil(caches.keys().then(function(cacheList) {
    return Promise.all(cacheList.filter(function(cacheName) {
      if (cacheName === version || !cacheName.startsWith(prefix)) {
        return;
      }
      return caches.delete(cacheName);
    })).then(function() {
      clients.claim();
    });
  }));
});

function networkFirst(evt) {
  // Current browser implementations require waitUntil() to be called
  // synchronously during the event dispatch.  In the future we should
  // be able to move the evt.waitUntil() down to directly where we
  // need it in the respondWith() async handling.
  var waitUntilResolve;
  evt.waitUntil(new Promise(function(resolve) {
    waitUntilResolve = resolve;
  }));

  var cache;
  evt.respondWith(caches.open(version).then(function(c) {
    cache = c;
    return fetch(evt.request);
  }).then(function(response) {
    waitUntilResolve(cache.put(evt.request, response.clone()));
    return response;
  }).catch(function(e) {
    return cache.match(evt.request);
  }).then(function(response) {
    // Always resolve the waitUntil promise. This is a no-op if we already
    // resolved the promise with cache.put() above.
    waitUntilResolve();
    return response || cache.match('/offline/');
  }).then(function(response) {
    // Final fallback in case our offline cached resources get busted.
    return response ||
      new Response('Offline and content unavailable.');
  }));
}

// Perform read-through caching, looking at the cache first.
function cacheFirst(evt) {
  // Current browser implementations require waitUntil() to be called
  // synchronously during the event dispatch.  In the future we should
  // be able to move the evt.waitUntil() down to directly where we
  // need it in the respondWith() async handling.
  var waitUntilResolve;
  evt.waitUntil(new Promise(function(resolve) {
    waitUntilResolve = resolve;
  }));

  var cache;
  evt.respondWith(caches.open(version).then(function(c) {
    cache = c;
    return cache.match(evt.request);
  }).then(function(response) {
    return response || fetch(evt.request).then(function(response) {
      waitUntilResolve(cache.put(evt.request, response.clone()));
      return response;
    });
  }).catch(function(e) {
    return cache.match('/offline/');
  }).then(function(response) {
    // Always resolve the waitUntil promise. This is a no-op if we already
    // resolved the promise with cache.put() above.
    waitUntilResolve();
    return response;
  }).then(function(response) {
    // Final fallback in case our offline cached resources get busted.
    return response ||
      new Response('Offline and content unavailable.');
  }));
}

addEventListener('fetch', function(evt) {
  // We don't cache any cross-origin resources.  Immediately return for
  // any such requests.  No sense paying the price for a .respondWith().
  if (!evt.request.url.startsWith(registration.scope)) {
    return;
  }

  // Do not attempt to cache any RSS feeds.
  if (evt.request.url.endsWith('.xml')) {
    return;
  }

  // Allow users to discover new posts immediately by going to the network
  // first for the main blog index.  Fall back to cache.
  if (evt.request.url === registration.scope ||
      evt.request.url === registration.scope + 'index.html') {
    networkFirst(evt);
    return;
  }

  // All other resources attempt to use the cache first and fall back to
  // the network.
  cacheFirst(evt);
});
