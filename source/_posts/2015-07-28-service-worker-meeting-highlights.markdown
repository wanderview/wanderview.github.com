---
layout: post
title: "Service Worker Meeting Highlights"
date: 2015-07-28 13:30:00 -0700
comments: false
description: "Last week folks from Apple, Google, Microsoft, and Mozilla met in San Francisco to talk about service workers.  The focus was on addressing problems with the current spec and to discuss what new features should be added next."
image: /images/highlighter-square.jpg
categories: [mozilla,google,apple,microsoft,serviceworker,dom,cache,fetch]
---

{% img pull-right /images/highlighter-small.jpg %}

Last week folks from Apple, Google, Microsoft, and Mozilla met in San Francisco
to talk about service workers.  The focus was on addressing problems with the
current spec and to discuss what new features should be added next.

<!-- more -->

The [minutes][] for the meeting are online.  We covered a lot of ground, though,
and these notes are thirty pages long.  It seems many people will simply throw them
in the "tl;dr" bucket and move on.

The goal of this post is to try to distill the meeting into a few highlights that
are a bit more readable and still reflect what we accomplished.

The group came to agreement (more or less) on these items:

* [Integrating Fetch Event with Other Specs](#other-specs)
* [Fall-through or Foreign Fetch](#foreign-fetch)
* [No-fetch Optimization](#no-fetch)
* [Coordinated Updates](#updates)
* [Service-Worker-Max-Age Header](#max-age)
* [Meeting Planning](#meetings)

This list mainly focuses on the decisions that came out of the top level agenda
items.  There were many other discussions that did not resolve to any immediate
decision.  In addition, a lot of good work was done addressing many of the open
[v1 issues][].  Please see the [minutes][] if you want to delve into these
topics.

<a name="other-specs"></a>
## Integrating Fetch Event with Other Specs ##

The group decided to investigate and document how the fetch spec should be
integrated into pre-existing specs.

---

Currently service workers are defined in two specs:

* The [service worker spec][] defines how to register and message the worker
  objects.  It also defines the life cycle of service workers.
* The [fetch spec][] defines how network requests are performed.  At a particular
  point in these steps it calls out to the service worker spec to perform
  fetch event network interception.

Unfortunately, the majority of the other pre-existing specs do not currently use
the fetch spec to perform network requests.  Instead they use their own algorithm
or no specific algorithm at all.

This is a problem because many of the security checks in the fetch spec require
that attributes are set properly on the request.  Each spec must set the
appropriate Request context and mode.

In addition, its unclear if certain specs should not intercept at all.  For
example, it seems appcache requests should never produce service worker fetch
events, but what about things like CSP violation reports?

These questions are not currently answered by the available specs.

At the meeting last week, however, Google's [Matt Falkenhagen][] offered to help
us at least determine what Chrome currently ships.  We plan to examine each
network request call site to methodically determine the correct behavior and
attributes.  We will then document the result in the fetch spec until it
can be properly moved integrated into the other specs.

This is great news for Mozilla because the potential security holes here
are the main reason we chose [not to ship in Firefox 41][].

<a name="foreign-fetch"></a>
## Fall-through or Foreign Fetch ##

The group decided to pursue a fetch oriented design for communicating with
cross-origin service workers.

---

For a while now Google has been working on an addition to the spec to allow
service workers for different origins to communicate with one another.  This
would support use cases such as:

* Offline analytics
* Cloud storage APIs
* Efficiently sharing fonts

The solution was originally envisioned as an RPC-like API called
[navigator.connect()][].

Over time, however, the effort migrated to a system based on FetchEvent.  The
idea is to permit a service worker to intercept fetch events to its own origin.
So, for example, Google could register a service worker that receives fetch
events for analytics.js and instantly returns the script from the offline Cache.

In general, we prefer this fetch event based system better for a number of
reasons:

1. Its more "webby" using HTTP requests instead of RPC-like messags.
2. As a consequence its easy to provide offline support for REST APIs build on
   top of HTTP verbs like GET and POST.
3. Its progressive.  If a browser does not support this new system, then the
   requests simply go to the server as they used to.

While there is general agreement with the direction, we still need to work out
the details.  Google has proposed [fall-through fetch][], while Mozilla has
proposed [foreign fetch][].  They are very similar, however, and we don't
currently anticipate any difficult issues.

<a name="no-fetch"></a>
## No-fetch Optimization ##

The group decided to provide an API during the install event to explicitly
[opt-out of fetch events][] for a particular service worker.

---

Currently the registration API assumes that a service worker is going to be
handling fetch events.  You must provide a scope to identify the service
worker.  If a network request matches that scope, then you are going to get
a fetch event.  If you don't actually intend to handle the event, this adds
needless delay to network requests.

Many options were discussed, but the final solution we settled on is to
provide `disableFetch()` and `enableFetch()` methods on the install event.

<a name="updates"></a>
## Coordinated Updates ##

The group decided that we need to support [coordinated updates][] for
sites with multiple service workers.

---

Currently its difficult to use multiple service workers for the same site.
When you update their code, one will always update before the other one
creating the potential for bugs.

We need to spec an extension to the API to allow multiple service workers
to update together coherently.

<a name="max-age"></a>
## Service-Worker-Max-Age Header ##

The group decided to support the [Service-Worker-Max-Age header][].

---

Currently the update algorithm only examines the top level service worker
script to determine if there is a new version.  Code within imported scripts
is not examined.  This can make it awkward to trigger service worker updates
when one of these dependent scripts has changed.

The [Service-Worker-Max-Age header][] provides a way to opt-out of this
behavior by setting a maximum time to run any single version of the service
worker.

<a name="meetings"></a>
## Meeting Planning ##

Finally, the group decided to have more frequent face-to-face meetings.  The
next one will be held at [TPAC][] at the end of October.

---

<small>[Highlighter image][] courtesy of [photosteve101][].</small>

[minutes]: https://docs.google.com/document/d/1X5KvUxLjXS2kIWheYUzj6GOgwP2eGHj1cAuau-cn8sE/edit?usp=sharing
[v1 issues]: https://github.com/slightlyoff/ServiceWorker/issues?q=is%3Aopen+is%3Aissue+milestone%3A%22Version+1%22
[service worker spec]: https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html
[fetch spec]: https://fetch.spec.whatwg.org/
[Matt Falkenhagen]: https://twitter.com/FalkenMatto
[not to ship in Firefox 41]: /blog/2015/06/18/service-workers-will-not-ship-in-firefox-41/
[navigator.connect()]: https://github.com/mkruisselbrink/navigator-connect
[fall-through fetch]: https://github.com/slightlyoff/ServiceWorker/issues/684
[foreign-fetch]: https://wiki.whatwg.org/wiki/Foreign_Fetch
[opt-out of fetch events]: https://github.com/slightlyoff/ServiceWorker/issues/718#issuecomment-123530545
[Service-Worker-Max-Age header]: https://github.com/slightlyoff/ServiceWorker/issues/721
[coordinated updates]: https://github.com/slightlyoff/ServiceWorker/issues/727
[TPAC]: http://www.w3.org/2015/10/TPAC/
[Highlighter image]: https://www.flickr.com/photos/42931449@N07/5418401602
[photosteve101]: https://www.flickr.com/photos/42931449@N07/
