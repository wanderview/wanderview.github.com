---
layout: post
title: "Service Workers Will Not Ship in Firefox 41"
date: 2015-06-18 10:15:00 -0500
comments: true
categories: [mozilla,serviceworker,dom,push,fetch,cache]
---

In [my last post][] I tried to estimate when Service Workers would ship in
Firefox.  I was pretty sure it would not make it in 40, but thought 41 was a
possibility.  It's a few months later and things are looking clearer.

Unfortunately, Service Workers will not ship in Firefox 41.

<!-- more -->

While Service Workers are largely feature complete, we've had issues with the
network interception code.  It's become clear that implementing this feature
has introduced a number of security risks.  We need to perform a fresh security
audit before the code can ship.

This was a difficult decision to make, but we feel it was the right one
given the security implications.

That being said, it's still possible we will ship parts of the Service Worker
spec in Firefox 41:

* Specifically, push notifications are very close and may make it into the
release.  If this occurs we will add a preference to disable fetch event
while exposing the rest of the Service Worker API.  This will allow push-based
Service Workers while the network interception goes through its security audit.

* In addition, it seems likely that the Cache API will ship in Firefox 41.  While
this feature is not as useful without the fetch event, it's a large piece needed
to support offline web pages.  Getting it released moves us that much closer to
full offline support and will let us focus more people on polishing network
interception.

As always, we appreciate your support and patience.  Please don't hesitate to
contact us if you encounter any problems.

[my last post]: /blog/2015/03/24/service-workers-in-firefox-nightly
