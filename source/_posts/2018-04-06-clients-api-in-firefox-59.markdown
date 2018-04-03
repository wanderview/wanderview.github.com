---
layout: post
title: "Clients API in Firefox 59"
date: 2018-04-06 22:50:36 -0400
comments: false
categories: [mozilla,serviceworker,dom]
---

Fascinating intro...

<!-- more -->

The Clients API
---------------

* Summarize the api...

The Problem
-----------

* Support multi-process service workers

More Problems
-------------

* Support windows and workers as clients
* Support nsIChannel on separate thread from workers
* Prepare to support FetchEvent.resultingClientId
* Prepare to support site isolation

Goals
-----

* Equal support for both main thread windows and OMT worker clients
* Client identity must be created before the non-subresource network request
* Threadsafe data type for referencing client identity
* Serializable data type for referencing clients across process boundaries
* Ability to search list of known clients across process boundaries
* Ability to attach to a known client to query or control it
* Fast to create/destroy clients

Design
------

Pretty pictures...
