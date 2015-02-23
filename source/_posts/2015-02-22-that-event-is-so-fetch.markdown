---
layout: post
title: "That Event Is So Fetch"
date: 2015-02-23 10:00:00 -0500
comments: false
description: "The Fetch Event and other Service Worker improvements land in Nightly. New Service Worker builds are published."
categories: [mozilla,serviceworker,dom,cache,fetch]
---
The Service Workers builds have been updated as of yesterday, February 22:

  [Firefox Service Worker Builds][]

<!-- more -->

Notable contributions this week were:

* [Josh Mathews][] landed Fetch Event support in Nightly.  This is important,
  of course, because without the Fetch Event you cannot actually intercept
  any network requests with your Service Worker. | [bug 1065216][]
* [Catalin Badea][] landed more of the Service Worker API in Nightly, including
  the ability to communicate with the Service Worker using `postMessage()`. |
  [bug 982726][]
* [Nikhil Marathe][] landed some more of his spec implementations to handle
  unloading documents correctly and to treat activations atomically. |
  [bug 1041340][] | [bug 1130065][]
* [Andrea Marchesini][] landed fixes for FirefoxOS discovered by the team in
  Paris. | [bug 1133242][]
* [Jose Antonio Olivera Ortega][] contributed a work-in-progress patch to force
  Service Worker scripts to update when `dom.serviceWorkers.test.enabled` is
  set. | [bug 1134329][]
* I landed my implementation of the Fetch Request and Response `clone()`
  methods. | [bug 1073231][]

As always, please let us know if you run into any problems.  Thank you for
testing!

[Josh Mathews]: https://twitter.com/lastontheboat
[Catalin Badea]: https://plus.google.com/+CatalinBadea/about
[Nikhil Marathe]: https://twitter.com/nikhilcutshort
[Andrea Marchesini]: https://twitter.com/baku82845977
[Jose Antonio Olivera Ortega]: https://github.com/jaoo
[Firefox Service Worker Builds]: /sw-builds
[bug 1065216]: https://bugzilla.mozilla.org/show_bug.cgi?id=1065216
[bug 982726]: https://bugzilla.mozilla.org/show_bug.cgi?id=982726
[bug 1073231]: https://bugzilla.mozilla.org/show_bug.cgi?id=1073231
[bug 1041340]: https://bugzilla.mozilla.org/show_bug.cgi?id=1041340
[bug 1130065]: https://bugzilla.mozilla.org/show_bug.cgi?id=1130065
[bug 1130570]: https://bugzilla.mozilla.org/show_bug.cgi?id=1130570
[Trained to Thrill]: https://github.com/jakearchibald/trained-to-thrill
[bug 1133242]: https://bugzilla.mozilla.org/show_bug.cgi?id=1133242
[bug 1134329]: https://bugzilla.mozilla.org/show_bug.cgi?id=1134329
[bug 1073231]: https://bugzilla.mozilla.org/show_bug.cgi?id=1073231
