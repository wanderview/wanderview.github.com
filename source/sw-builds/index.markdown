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
additional error checking enabled and will run a slower than normal.  Therefore,
these builds are not suitable for performance testing.

Please use a [new profile][] dedicated to Service Worker testing.

Builds created on February 9, 2015:

* **Windows:** [installer exe][win-exe] | [zip][win-zip] | [checksum][win-sum]
* **Mac:** [dmg][mac-dmg] | [checksum][mac-sum]
* **Linux:** [tar.bz][linux-tar.bz] | [checksum][linux-sum]
* **Android:** [apk][android-apk] | [checksum][android-sum]
* **FirefoxOS**: *currently unavailable due to e10s issues*

There are a number of known issues with these builds.  These issues include:

* Service Worker registrations fail in e10s mode. ([bug 1130570][])
* Service Worker registrations do not currently persist.  There are some
  issues with windows builds when the patches from [bug 984050][] are included.
* [Trained to Thrill][] deadlocks during image element interception when an
  in-progress `fetch()` Response is passed to `respondWith()`. This presents
  as blank image frames and a browser that will not shut down cleanly.  You
  must kill the process if you get into this state. ([bug 1130803][])

If you encounter other issues, please [file a bug][] in the "DOM" component.

These builds have the following modified preferences:

* **Disable e10s** - browser.tabs.remote.autostart.1 set to false
* **Enable ServiceWorkers API** - dom.serviceworkers.enabled set to true
* **Enable Fetch API** - dom.fetch.enabled set to true
* **Enable Cache API** - dom.caches.enabled set to true

These builds are based on [mozilla-central revision 342c5706df11][].

Patches for the following bugs have been applied:

* Cache API ([bug 940273][])
* CrossProcessPipe ([bug 1093357][])
* Cache support for CrossProcessPipe ([bug 1110814][])
* Fetch event ([bug 1065216][])
* Stream cloning ([bug 1100398][])
* Fetch Request and Response clone() ([bug 1073231][])

Notable patches **not** included are:

* Persistent Service Worker registrations is not included due to stability
  issues on win32. ([bug 984050][])

The exact patches used for this build can be found in this [mercurial patch queue][].

[Service Workers]: https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html
[new profile]: https://support.mozilla.org/en-US/kb/profile-manager-create-and-remove-firefox-profiles
[win-exe]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/firefox-38.0a1.en-US.win32.installer.exe
[win-zip]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/firefox-38.0a1.en-US.win32.zip
[win-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/firefox-38.0a1.en-US.win32.checksums
[mac-dmg]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/firefox-38.0a1.en-US.mac64.dmg
[mac-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/firefox-38.0a1.en-US.mac64.checksums
[linux-tar.bz]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/firefox-38.0a1.en-US.linux-x86_64.tar.bz2
[linux-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/firefox-38.0a1.en-US.linux-x86_64.checksums
[android-apk]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/fennec-38.0a1.en-US.android-arm.apk
[android-sum]: https://people.mozilla.org/~bkelly/sw-builds/20150209/debug/fennec-38.0a1.en-US.android-arm.checksums
[mozilla-central revision 342c5706df11]: http://hg.mozilla.org/mozilla-central/file/342c5706df11
[bug 1130570]: https://bugzilla.mozilla.org/show_bug.cgi?id=1130570
[bug 940273]: https://bugzilla.mozilla.org/show_bug.cgi?id=940273
[Trained to Thrill]: https://github.com/jakearchibald/trained-to-thrill
[bug 1130803]: https://bugzilla.mozilla.org/show_bug.cgi?id=1130803
[file a bug]: https://bugzilla.mozilla.org/enter_bug.cgi?format=guided#h=dupes|Core|
[bug 1093357]: https://bugzilla.mozilla.org/show_bug.cgi?id=1093357
[bug 1110814]: https://bugzilla.mozilla.org/show_bug.cgi?id=1110814
[bug 1065216]: https://bugzilla.mozilla.org/show_bug.cgi?id=1065216
[bug 1100398]: https://bugzilla.mozilla.org/show_bug.cgi?id=1100398
[bug 1073231]: https://bugzilla.mozilla.org/show_bug.cgi?id=1073231
[bug 984050]: https://bugzilla.mozilla.org/show_bug.cgi?id=984050
[mercurial patch queue]: https://github.com/wanderview/gecko-patches/tree/4b9711fbf0626c3721455df9ba0b893d0aad90ad

