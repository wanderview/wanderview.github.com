---
layout: post
title: "Firefox Service Worker Delays"
date: 2015-07-17 14:00:00 -0500
comments: false
description: "Why are service workers in Firefox taking so long to ship? In short security hardening, UX polish, and some spec ambiguity."
categories: [mozilla,serviceworker,dom,fetch]
---

Last month I [wrote][] that service workers would not ship in Firefox 41. In this
post I'd like to go into more detail about the work remaining to be done.

<!-- more -->

TL;DR
-----

The short version of this post is we need to:

* **Write tests to audit** every single place in the codebase that makes a network
  request to ensure that the **same-origin policy** cannot be broken.
* Clarify **ambiguities in the spec** where its unclear what kind of interception
  a particular network request should allow.
* Overcome **technical debt** in our network and security code which makes it
  difficult to handle interceptions consistently across all network requests.
* **Polish** the browser experience for both users and developers when service
  workers are in use.

[wrote]: /blog/2015/06/18/service-workers-will-not-ship-in-firefox-41
