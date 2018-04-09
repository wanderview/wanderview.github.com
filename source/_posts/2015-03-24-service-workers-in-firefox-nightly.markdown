---
layout: post
title: "Service Workers in Firefox Nightly"
date: 2015-03-24 11:15:00 -0400
comments: false
description: "Service Worker testing is moving to Firefox Nightly."
image: /images/nightly-logo-tiny.png
categories: [mozilla,serviceworker,dom,cache,fetch]
---

<img class="pull-right" src="/images/nightly-logo-small.png" width="200"/>

I'm pleased to announce that we now recommend normal Nightly builds for testing
our implementation of Service Workers.  We will not be posting any more custom
builds here.

<!-- more -->

Now that [bug 1110814][] has landed in mozilla-central, Nightly has roughly the
same functionality as the last sw-build.  Just enable these preferences in
about:config:

* Set `dom.caches.enabled` to true.
* Set `dom.serviceWorkers.enabled` to true.

Please note that on Firefox OS you must enable an additional preference as well.
See [bug 1125961][] for details.

In addition, we've decided to move forward with enabling the Service Worker and
Cache API preferences by default in non-releases builds.  We expect the Cache
preference to be enabled in the tree today.  The Service Worker preference should
be enabled within the next week once [bug 931249][] is complete.

When Nightly merges to Aurora (Developer Edition), these preferences will also be
enabled by default there.  They will not, however, ride the trains to Beta or
Release yet.  We feel we need more time stabilizing the implementation before that
can occur.

So, unfortunately, I cannot tell you exactly which Firefox Release will ship with
Service Workers yet.  It will definitely not be Firefox 39.  Its possible Service
Workers will ship in Firefox 40, but its more likely to finally be enabled in
Firefox 41.

Developer Edition 39, however, will have Cache enabled and will likely also have
Service Workers enabled.

Finally, while the code is stabilizing you may see Service Worker registrations
and Cache data be deleted when you update the browser.  If we find that the data
format on disk needs to change we will simply be reseting the relevant storage
area in your profile.  Once the decision to ship is made any future changes will
then properly migrate data without any loss.  Again, this only effects Service
Worker registrations and data stored in Cache.

As always we appreciate your help testing, reporting bugs, and implementing code.

[bug 1110814]: https://bugzilla.mozilla.org/show_bug.cgi?id=1110814
[bug 1125961]: https://bugzilla.mozilla.org/show_bug.cgi?id=1125961#c35
[bug 931249]: https://bugzilla.mozilla.org/show_bug.cgi?id=931249
