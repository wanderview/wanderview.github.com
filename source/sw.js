---
---

// Use a prefix string to differentiate cache objects for the blog
// from other github repo's hosted on the same origin.
var prefix = 'blog - ';

// Every time the site is generated we update the cache version based
// on the current time.  This ensures any modifications to the blog
// will trigger an update.
var version = prefix + '{{ site.time }}';

// List all static resources, except for:
//  - RSS feeds
//  - unused pagination pages we never link to
//  - flash player support which we never use
var assets = [
'/',
'/allposts/',
{% for post in site.posts %}
'{{ post.url }}',
{% endfor %}
{% for page in site.pages %}
{% unless page.url contains '.xml' or page.url contains '/posts/' %}'{{ page.url }}',{% endunless %}
{% endfor %}
{% for file in site.static_files %}
{% unless file.path contains 'jwplayer' %}'{{ file.path }}',{% endunless %}
{% endfor %}
];

addEventListener('install', function(evt) {
  skipWaiting();
  // Pre-cache all static resources we define above.
  evt.waitUntil(caches.open(version).then(function(cache) {
    return cache.addAll(assets);
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
      // After removing old cache objects, begin controlling open windows
      // immediately.
      clients.claim();
    });
  }));
});

addEventListener('fetch', function(evt) {
  // We don't cache any cross-origin resources.  Immediately return for
  // any such requests.  No sense paying the price for a .respondWith().
  if (!evt.request.url.startsWith(registration.scope)) {
    return;
  }

  // Since the main page index changes semi-frequently when new posts
  // are added, always go to the network first and fall back to the cache.
  // This lets visitors see new posts immediately.
  if (evt.request.url === registration.scope ||
      evt.request.url === registration.scope + 'index.html' ) {
    evt.respondWith(fetch(evt.request).catch(function(e) {
      return caches.open(version).then(function(cache) {
        return cache.match(evt.request);
      });
    }));
    return;
  }

  // Otherwise, load all other resources and pages from the cache first.
  // Fall back to the network if its missing from the cache for some
  // reason.  Finally, provide a semi-decent explanation if the network
  // fails as well.  Otherwise the user might see a confusing browser
  // error message.
  //
  // Note: We use ignoreSearch in the cache.match() call because the
  //       noise.png is sometimes loaded with a randomized query value.
  evt.respondWith(caches.open(version).then(function(cache) {
    return cache.match(evt.request, { ignoreSearch: true });
  }).then(function(response) {
    return response ||
      fetch(evt.request).catch(function(e) {
        return new Response('The network is unreachable and this page is not cached.');
      });
  }));
});
