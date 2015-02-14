---
layout: post
title: "A Very Special Valentines Day Build"
date: 2015-02-14 14:26:52 -0500
comments: false
description: "A gift to you on Valentines Day.  New Firefox builds with persistent Service Worker registrations."
image: /images/sw-candy-heart.jpg
categories: [mozilla,serviceworker,dom,cache,fetch]
---

{% img pull-right /images/sw-candy-heart.jpg %}

Last week we [introduced some custom Firefox builds][] that include our
work-in-progress on Service Workers.  The goal of these builds is to enable
wider testing of our implementation as it continues to progress.

These builds have been updated today, February 14:

  [Firefox Service Worker Builds][]

This week's build provides a number of improvements:

* [Andrea Marchesini][] landed [bug 984050][] in Nightly implementing
  peristent Service Worker registrations.  Previously registrations would
  be forgotten once the browser was closed.  Obviously, persistent
  registrations is a key feature necessary to implement offline web apps
  with Service Workers.
* [Nikhil Marathe][] has a patch in [bug 1130065][] that fixes some of the
  trickier aspects of activating a Service Worker for a document.
* The Paris team has also been investigating using Service Workers on
  FirefoxOS.  With Andrea's help this work is being moved into the tree and
  is also included in this build.
* As a result, this build now includes a FirefoxOS build for the Flame device
  based on the v18D firmware.

Also, some patches that were included in last week's build have landed in the
tree for Nightly:

* As mentioned above, persistent registrations landed in [bug 984050][].
* Improvements to gecko's stream infrastructure to support cloning also landed
  in [bug 1100398][].

As always, please let us know if you have any questions or run into any
problems.  Thank you for your assistance in testing this new feature!

[introduced some custom Firefox builds]: http://localhost:4000/blog/2015/02/10/introducing-firefox-service-worker-builds/
[Firefox Service Worker Builds]: /sw-builds
[Andrea Marchesini]: https://twitter.com/baku82845977
[Nikhil Marathe]: https://twitter.com/nikhilcutshort
[bug 984050]: https://bugzilla.mozilla.org/show_bug.cgi?id=984050
[bug 1130065]: https://bugzilla.mozilla.org/show_bug.cgi?id=1130065
[bug 1100398]: https://bugzilla.mozilla.org/show_bug.cgi?id=1100398
