---
layout: post
title: "Introducing Firefox Service Worker Builds"
date: 2015-02-09 22:17:01 -0500
comments: true
description: "A blog post introducing a set of Firefox builds that include the Service Worker, Fetch, and Cache APIs."
categories: [mozilla,serviceworker,dom,cache,fetch]
---

About [two months ago I wrote][] that the Service Worker Cache code was entering
code review.  Our thought at the time was to quickly transition all of the
work that had been done on the maple project branch back into Nightly.  The
project branch wasn't really needed any more and the code could more easily be
tested by the community on Nightly.

Fast forward to today and, unfortunately, we are still working to make this
transition.  Much of the code from maple is still in review.  Meanwhile, the project
branch has languished and is not particularly useful any more.  Obviously, this
is a bad situation as it has made testing Service Workers with Firefox nearly
impossible.

To address this we are going to begin posting periodic builds of Nightly with
the relevant Service Worker code included.  These builds can be found here:

  [Firefox Service Worker Builds][]

<!-- more -->

This page will be updated as code changes or migrates into Nightly.

We are all very excited to see Service Workers adopted on the web and are
actively working to have it enabled in Firefox Nightly by the end of
March.  We hope that these builds will allow wider testing of our implementation
to help us reach that goal.

Thank you for your patience and understanding as we work through the issues
to get this feature landed and enabled in Nightly.

[two months ago I wrote]: /blog/2014/12/08/implementing-the-serviceworker-cache-api-in-gecko/
[Firefox Service Worker Builds]: /sw-builds
