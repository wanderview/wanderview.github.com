---
layout: post
title: "Initial Cache API Lands in Nightly"
date: 2015-03-09 11:05:00 -0400
comments: false
description: "Its been two busy weeks since the last Service Worker build and a lot has happened.  The first version of the Cache API has landed in Nightly along with many other improvements and fixes."
categories: [mozilla,serviceworker,dom,cache,fetch]
---

Its been two busy weeks since the last Service Worker build and a lot has
happened.  The first version of the Cache API has landed in Nightly along
with many other improvements and fixes.

<!-- more -->

The Cache is particularly important because it was perhaps the largest set
of patches blocking users from testing directly in Nightly.  Finally getting
it into the tree brings us much closer to the point where we don't need
these custom builds any more.

We're not there yet, though.  The custom builds will still be needed until
the following two issues are fixed:

* Cache.put() current does not work.  In order to fix this we must integrate
  Cache with the CrossProcessPipe.  These patches have been in the custom builds
  from the start, but we must complete the work in order for most Service Worker
  sites to be usable on Nightly. | [bug 1110814][]
* Service Worker scripts and their dependencies are not currently saved for
  offline access.  Obviously, we must fix this in order for Service Workers
  to provide true offline support.  This feature is in progress, but unfortunately
  is not in the custom build yet. | [bug 931249][]

Once these two bugs are fixed we will begin encouraging the community to test
with Nightly directly.

This week's build was updated as of yesterday, March 8:

  [Firefox Service Worker Builds][]

This build includes the following feature changes in Nightly:

* Cache API | [bug 940273][]
* FetchDriver channel stalls when Service Worker returns from fetch event too
  early | [bug 1130803][]
* remove Service Worker Cache "prefixMatch" option | [bug 1130452][]
* ServiceWorkerGlobalScope.close() should throw InvalidAccessError |
  [bug 1131353][]
* ServiceWorkerClients API spec changes | [bug 1058311][]
* Remove ServiceWorkerGlobalScope.scope | [bug 1132673][]
* ServiceWorker: client.postMessage should be dispatched to
  navigator.serviceWorker.onmessage | [bug 1136467][]

It also includes these bug fixes:

* navigator.serviceWorker.controller does not track underlying state |
  [bug 1131882][]
* Fix registration persistence in some activation cases | [bug 1131874][]
* Don't persist registrations that fail | [bug 1132141][]
* FetchDriver should check content load policy before proceeding |
  [bug 1139665][]
* Use correct principal for channel which updates ServiceWorker |
  [bug 1137419][]
* Seg Fault when calling cache.matchAll without parameters | [bug 1138916][]
* Crash in ActorChild::SetFeature | [bug 1140065][]
* Fix -Winconsistent-missing-override warnings introduced in Cache API |
  [bug 1139603][]
* disallow creating nested workers from ServiceWorker | [bug 1137398][]

Finally, a number of testing changes were made:

* Replace getServiced() with matchAll() in a couple of ServiceWorker tests |
  [bug 1137477][]
* Various ServiceWorker test fixes | [bug 1139561][]
* Remove activatingWorker warning in ServiceWorkerManager | [bug 1139990][]
* Remove a couple of unused test functions on ServiceWorkerContainer |
  [bug 1140120][]
* nice to have a test-interfaces.html for ServiceWorkers | [bug 1137816][]

Many thanks to all the contributors:

* [Andrea Marchesini][]
* [Catalin Badea][]
* [Daniel Holbert][]
* [Ehsan Akhgari][]
* [Giovanny Gongora][]
* [Honza Bambas][]
* Jason Gersztyn
* [Josh Mathews][]
* [Nikhil Marathe][]

Please let us know if you find any new issues.  Thank you!

[bug 1110814]: https://bugzilla.mozilla.org/show_bug.cgi?id=1110814
[bug 931249]: https://bugzilla.mozilla.org/show_bug.cgi?id=931249
[Firefox Service Worker Builds]: /sw-builds
[bug 940273]: https://bugzilla.mozilla.org/show_bug.cgi?id=940273
[bug 1131882]: https://bugzilla.mozilla.org/show_bug.cgi?id=1131882
[bug 1131874]: https://bugzilla.mozilla.org/show_bug.cgi?id=1131874
[bug 1132141]: https://bugzilla.mozilla.org/show_bug.cgi?id=1132141
[bug 1139665]: https://bugzilla.mozilla.org/show_bug.cgi?id=1139665
[bug 1130803]: https://bugzilla.mozilla.org/show_bug.cgi?id=1130803
[bug 1137419]: https://bugzilla.mozilla.org/show_bug.cgi?id=1137419
[bug 1137398]: https://bugzilla.mozilla.org/show_bug.cgi?id=1137398
[bug 1132673]: https://bugzilla.mozilla.org/show_bug.cgi?id=1132673
[bug 1136467]: https://bugzilla.mozilla.org/show_bug.cgi?id=1136467
[bug 1137477]: https://bugzilla.mozilla.org/show_bug.cgi?id=1137477
[bug 1139561]: https://bugzilla.mozilla.org/show_bug.cgi?id=1139561
[bug 1139990]: https://bugzilla.mozilla.org/show_bug.cgi?id=1139990
[bug 1058311]: https://bugzilla.mozilla.org/show_bug.cgi?id=1058311
[bug 1140120]: https://bugzilla.mozilla.org/show_bug.cgi?id=1140120
[bug 1131353]: https://bugzilla.mozilla.org/show_bug.cgi?id=1131353
[bug 1137816]: https://bugzilla.mozilla.org/show_bug.cgi?id=1137816
[bug 1138916]: https://bugzilla.mozilla.org/show_bug.cgi?id=1138916
[bug 1139603]: https://bugzilla.mozilla.org/show_bug.cgi?id=1139603
[bug 1140065]: https://bugzilla.mozilla.org/show_bug.cgi?id=1140065
[bug 1130452]: https://bugzilla.mozilla.org/show_bug.cgi?id=1130452
[Catalin Badea]: https://plus.google.com/+CatalinBadea/about
[Nikhil Marathe]: https://twitter.com/nikhilcutshort
[Ehsan Akhgari]: https://twitter.com/ehsanakhgari
[Daniel Holbert]: https://twitter.com/CodingExon
[Honza Bambas]: http://www.janbambas.cz/
[Giovanny Gongora]: https://twitter.com/Gioyik
[Josh Mathews]: https://twitter.com/lastontheboat
[Andrea Marchesini]: https://twitter.com/baku82845977
