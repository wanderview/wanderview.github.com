---
layout: post
title: "Flipkart, Google, and the Web"
date: 2016-06-10 11:04:20 -0700
comments: false
description: "A post describing my concerns with Flipkart, Google, and the Web."
categories: web
---

This week I [vented my frustration on Twitter][] about what I see as an issue
with Flipkart, Google, and maintaining the open web.  I want to take this time
to elaborate on exactly what I think the problem is.

<!-- more -->

To start, lets step back and take a look at the situation from an outsider's
point of view.  [Flipkart introduced][] their new Progressive Web App (PWA),
Flipkart Lite, in November 2015.

<a href="https://medium.com/@AdityaPunjani/building-flipkart-lite-a-progressive-web-app-2c211e641883#.8s518y8ke">
{% img center-block /images/flipkart-lite-announce.png 400 %}
</a>

This was great news and very exciting.  I think everyone was happy to see
them back on the web.

It was also clear that the Chrome team had worked hard to get them back.  They
listened to Flipkart's concerns and helped build mobile web solutions to solve
them.  This was also great.

Because of this, however, Google was [directly associated][] with Flipkart's
new site.

<a href="http://blogs.wsj.com/digits/2015/11/09/google-lures-flipkart-back-to-the-mobile-web/">
{% img center-block highlight /images/wsj-google-flipkart.png 400 %}
</a>

Eventually Google began [promoting Flipkart Lite][] directly on their own site.

<a href="https://developers.google.com/web/showcase/2016/flipkart">
{% img center-block /images/google-flipkart-case.png 400 %}
</a>

Again, its great to show the success that companies can achieve by building on
the web instead of closed native platforms.

The problem, however, is that Flipkart Lite uses a technique that is very
damaging to the health of the web.  At the time of launch, users received
the following experience if they visited Flipkart Lite in any browser other than
Chrome:

{% img center-block /images/flipkart.gif 280 %}

Here they are redirecting browsers that are not in their whitelist to the
native app Play Store.  They are showing zero web content and forcing
users to a different application on their device without consent.

This is still the experience users receive today on Firefox (and I believe
Edge).  This is 7 months after launch.

I believe that this combination:

1. The site was developed in collaboration with the majority share browser.
2. The site was promoted by the majority share browser as an example that
   other developers should consider emulating.
3. The site uses a technique that is actively hostile to interoperability with
   other browsers.
4. The majority share browser has not included any caveat about avoiding this
   hostile technique in its promotion of the site.

sends a dangerous, unintended message.

Developers and project managers could easily end up "just doing what Flipkart
did" and replicate this redirect to the native store.  But what happens when
these other sites invariably have budget constraints and only bother with Chrome
and Safari?

In that case the web takes a step closer to a siloed ecosystem just like native
apps.  URL sharing becomes harder.  User choice is ignored.  New browsers are
blocked from entering the market with fresh ideas.

I do, however, think this is an **unintended** message.  I truly believe that the Chrome
developers want to see a healthy, open web.  I believe them when they say they
[discouraged Flipkart from using a UA block][].

I also believe the Flipkart team when they say they are
[committed to building for the open web][].  And to their credit they are on the
verge of [finally removing the UA block][].

These perspectives, however, are all relatively buried.  None of the top level
announcements or case studies mention any of this.  The first blog post mentions
Chrome 11 times and no other browser.  There are many developers who don't
have the time to attend conferences, watch recorded talks, or monitor the
Twitter replies from Google developers.

Google's Alex Russell [believes the web is in crisis][] and that this means
[we shouldn't care how sites are built][].

I agree with this to a degree and think the web definitely needs help on mobile.
I don't, however, think that means we should just throw out all the things that
make the web great.  If we do, what have we saved?

Jason Grigsby points out [building PWA sites is a win-win for the web][].  Either:

1. the web is in crisis and we save it, or
2. the web is not in crisis and we just make it better

Unfortunately this is only true if people build truly progressive, interoperable
PWA sites.  In reality there is a third option:

* We build siloed PWAs and lose the benefits of the open web.

I for one think this would be a shame.  I think we have to speak out if we
see the native app siloed perspective creeping on to the web.

[vented my frustration on Twitter]: https://twitter.com/wanderview/status/740506444211073024
[Flipkart introduced]: https://medium.com/@AdityaPunjani/building-flipkart-lite-a-progressive-web-app-2c211e641883#.8s518y8ke
[directly associated]: http://blogs.wsj.com/digits/2015/11/09/google-lures-flipkart-back-to-the-mobile-web/
[promoting Flipkart Lite]: http://blogs.wsj.com/digits/2015/11/09/google-lures-flipkart-back-to-the-mobile-web/
[discouraged Flipkart from using a UA block]: https://twitter.com/slightlylate/status/740557181989195776
[committed to building for the open web]: https://www.youtube.com/watch?v=fGTUIlEM0m8&feature=youtu.be&t=1153
[finally removing the UA block]: https://twitter.com/adityapunjani/status/740547472905240577
[believes the web is in crisis]: https://twitter.com/slightlylate/status/740227744340926464
[we shouldn't care how sites are built]: https://twitter.com/slightlylate/status/740228592794107905
[building PWA sites is a win-win for the web]: http://blog.cloudfour.com/android-instant-apps-progressive-web-apps-and-the-future-of-the-web/
