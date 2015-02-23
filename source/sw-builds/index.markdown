---
layout: page
title: "Firefox Service Worker Builds"
date: 2015-02-09 19:54
comments: false
sharing: true
footer: true
description: "A set of Firefox builds that include the Service Workers, Fetch, and Cache APIs."
---

[Service Workers][] are currently being implemented in Firefox.  While some support
is available in Nightly, a lot of code is still in development.  The following
links provide a snapshot of this work in progress.

Please note, these builds have debugging enabled.  This means they have
additional error checking enabled and will run slower than normal.  Therefore,
these builds are not suitable for performance testing.

Please use a [new profile][] dedicated to Service Worker testing.

Builds created on February 22, 2015:

* **Windows:** [installer exe][win-exe] | [zip][win-zip] | [checksum][win-sum]
* **Mac:** [dmg][mac-dmg] | [checksum][mac-sum]
* **Linux:** [tar.bz][linux-tar.bz] | [checksum][linux-sum]
* **Android:** [apk][android-apk] | [checksum][android-sum]
* **FirefoxOS**: [flame v18D][b2g-tar.gz] | [checksum][b2g-sum]

There are a number of known issues with these builds.  These issues include:

* Service Worker scripts and their `importScript()` dependencies are not
  cached offline yet.  Some caching may occur due to the HTTP cache, however.
  | [bug 931249][]
* `navigator.ServiceWorker.controller` does not track underlying state or
  fire events. There is a patch available, but it just missed making it into
  this week's build. | [bug 1131882][]
* [Trained to Thrill][] deadlocks during image element interception when an
  in-progress `fetch()` Response is passed to `respondWith()`. This presents
  as blank image frames and a browser that will not shut down cleanly.  You
  must kill the process if you get into this state.  This no longer triggers
  on Windows as an imgLoader assertion is now hit first. | [bug 1130803][]
* Aborting a fetch event by passing a non-Response to `respondWith()` results
  in a CORS error message.  Notably, this reliably happens when visiting
  [Trained to Thrill][] in e10s mode. | [bug 1133238][]

If you encounter other issues, please [file a bug][] in the "DOM" component.

These builds have the following modified preferences:

* **Disable e10s on Desktop** - browser.tabs.remote.autostart.1 set to false
* **Disable Network IPC Security on FirefoxOS** - network.disable.ipc.security
  to true
* **Enable ServiceWorkers API** - dom.serviceworkers.enabled set to true
* **Enable Fetch API** - dom.fetch.enabled set to true
* **Enable Cache API** - dom.caches.enabled set to true

These builds are based on [mozilla-central revision 86d2bb8bb1c9][].

Patches for the following bugs have been applied:

* Cache API | [bug 940273][]
* CrossProcessPipe | [bug 1093357][]
* Cache support for CrossProcessPipe | [bug 1110814][]
* Fix registration persistence in some activation cases | [bug 1131874][]
* Don't persist registrations that fail | [bug 1132141][]
* Always update Service Worker scripts when `dom.serviceWorkers.testing.enabled`
  is true. | [bug 1134329][]

The exact patches used for this build can be found in this [mercurial patch queue][].

Build history:

* **February 22, 2015:** [summary post][post-2] | [download][download-2]
* **February 14, 2015:** [summary post][post-1] | [download][download-1]
* **February  9, 2015:** [summary post][post-0] | [download][download-0]

[Service Workers]: https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html
[new profile]: https://support.mozilla.org/en-US/kb/profile-manager-create-and-remove-firefox-profiles
[win-exe]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/firefox-38.0a1.en-US.win32.installer.exe
[win-zip]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/firefox-38.0a1.en-US.win32.zip
[win-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/firefox-38.0a1.en-US.win32.checksums
[mac-dmg]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/firefox-38.0a1.en-US.mac64.dmg
[mac-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/firefox-38.0a1.en-US.mac64.checksums
[linux-tar.bz]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/firefox-38.0a1.en-US.linux-x86_64.tar.bz2
[linux-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/firefox-38.0a1.en-US.linux-x86_64.checksums
[android-apk]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/fennec-38.0a1.en-US.android-arm.apk
[android-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150222/debug/fennec-38.0a1.en-US.android-arm.checksums
[b2g-tar.gz]: https://people.mozilla.org/~bkelly/sw-builds/20150222/opt/b2g-38.0a1.en-US.android-arm.tar.gz
[b2g-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150222/opt/b2g-38.0a1.en-US.android-arm.checksums
[mozilla-central revision 86d2bb8bb1c9]: http://hg.mozilla.org/mozilla-central/file/86d2bb8bb1c9
[bug 931249]: https://bugzilla.mozilla.org/show_bug.cgi?id=931249
[bug 1131882]: https://bugzilla.mozilla.org/show_bug.cgi?id=1131882
[bug 940273]: https://bugzilla.mozilla.org/show_bug.cgi?id=940273
[Trained to Thrill]: https://github.com/jakearchibald/trained-to-thrill
[bug 1130803]: https://bugzilla.mozilla.org/show_bug.cgi?id=1130803
[bug 1133238]: https://bugzilla.mozilla.org/show_bug.cgi?id=1133238
[bug 1133242]: https://bugzilla.mozilla.org/show_bug.cgi?id=1133242
[file a bug]: https://bugzilla.mozilla.org/enter_bug.cgi?format=guided#h=dupes|Core|
[bug 1093357]: https://bugzilla.mozilla.org/show_bug.cgi?id=1093357
[bug 1110814]: https://bugzilla.mozilla.org/show_bug.cgi?id=1110814
[bug 1131874]: https://bugzilla.mozilla.org/show_bug.cgi?id=1131874
[bug 1132141]: https://bugzilla.mozilla.org/show_bug.cgi?id=1132141
[bug 1134329]: https://bugzilla.mozilla.org/show_bug.cgi?id=1134329
[mercurial patch queue]: https://github.com/wanderview/gecko-patches/tree/2400c07440f10357123cf4c185fc90353e158183
[post-2]: /blog/2015/02/23/that-event-is-so-fetch/
[download-2]: https://people.mozilla.org/~bkelly/sw-builds/20150222
[post-1]: /blog/2015/02/14/a-very-special-valentines-day-build/
[download-1]: https://people.mozilla.org/~bkelly/sw-builds/20150214
[post-0]: /blog/2015/02/10/introducing-firefox-service-worker-builds/
[download-0]: https://people.mozilla.org/~bkelly/sw-builds/20150209
