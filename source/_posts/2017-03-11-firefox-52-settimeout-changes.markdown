---
layout: post
title: "Firefox 52 setTimeout() Changes"
date: 2017-03-13 09:30:00 -0400
comments: false
large-image: /images/event-queue-yielding-timer-queue-twitter.png
description: Firefox 52 hit the release channel last week and includes a few changes to `setTimeout()` and `setInterval()`.
categories: [mozilla,dom,timer]
---

Firefox 52 hit the release channel last week and it includes a few [changes to
`setTimeout()` and `setInterval()`][].  In particular, we have changed how we
schedule and execute timer callbacks in order to reduce the possibility of
jank.

<!-- more -->

To start, consider the following simple demo site (you may not want to run
it yourself):

  [Demo Site][]

When you click the "Start" button the site will begin flooding the browser
with `setTimeout()` calls.  Each callback will call `setTimeout()` twice.
This results in an exponential explosion of timers.  Clicking "Stop" will
cause the timers to stop calling `setTimeout()`.

The animated GIF is there so that you can visually see if any jank occurs.
(This is a great technique I am stealing from [Nolan Lawson][]'s [IDB
performance post][]).

Traditionally, browsers will begin dropping frames when this sort of thing
happens and the GIF will stop animating.  For example, this video shows
Firefox 45 ESR running the demo:

<video src="/videos/timer-flood-45esr.mp4" controls width="80%" class="center-block"></video>

In Firefox 52, however, we have made changes which allows the browser to
mostly survive this use case.  This video shows that, while there is a
brief pause, the animated GIF continues to play fairly smoothly in spite
of the timer flood.

<video src="/videos/timer-flood-52.mp4" controls width="80%" class="center-block"></video>

How Does It Work?
-----------------

Firefox achieves this by implementing **yielding** between timer callbacks.
After a timer callback is executed we allow any other non-timer event pending
in the queue to complete before running the next timer callback.

For example, consider the case where we have a number of timer callbacks that
want to run at the same time as a vsync refresh.  Its a bit of a race which
events will get to run first.  The refresh, however, is often considered more
important because if it's delayed then the site's frame-per-second will drop.

With this in mind, consider the "best" case and "worst" case for scheduling
the events:

<img src="/images/event-queue-flood.svg" width="100%" class="center-block"/>

In the best case the refresh runs first and is not delayed.  In the worst
case the refresh is delayed until all the timer callbacks have executed.  In
extreme cases, like the demo above, this delay can be quite long.

Yielding between timer callbacks changes the situation so that the worst case
looks like this instead:

<img src="/images/event-queue-yielding-effect.svg" width="100%" class="center-block"/>

Now, the refresh will be delayed by at most one timer callback.

In reality we don't actually re-arrange events in the event queue.  Perhaps
a better way to think of it is that timers are stored in a separate queue.
Only a single timer is allowed to be scheduled on the main event queue at
any time.

<img src="/images/event-queue-yielding-timer-queue.svg" width="100%" class="center-block"/>

So after "callback 1" completes here "callback 2" will be placed on the
main event queue at the end.  This allows the refresh event to execute next.

Is This Throttling?
-------------------

No.  Typically "timer throttling" means introducing some amount of delay
into each timer.  For example, if you call `setTimeout(func, 5)` in a
background tab most browsers will delay the timer callback for at least
one second.

Yielding is different in that it allows timers to run at **full speed** if
the main thread is idle.  Yielding only causes timers to be delayed if the
main thread is busy.  (Of course, if the main thread is busy then timers
have always run the risk of being delayed.)

That being said, if we detect that the timer queue is backing up we do
begin throttling timers.  This backpressure helps avoid exhausting memory
when a script is generating more `setTimeout()` calls than can be executed.
This back pressure is tuned to only trigger in extreme cases and most sites
should not experience it.

Is This Prioritization?
-----------------------

Again, no.  Timer yielding is not quite the same as using a priority queue
and marking timer callbacks low priority.  In a strict prioritization scheme
it would be possible for low priority events to never run.  That is not the
case here.

In our timer yielding approach the next timer callback is run at the same
priority as all other events.  It may execute before other work.  It is
also guaranteed to be executed at some point.

What's The Catch?
------------------

While our general approach is to yield between timers, our end solution
doesn't actually do that.  We actually allow a limited number of timer
callbacks to run without yielding.  We do this to mitigate impact to
sites that use timers while saturating the main thread.

For example, consider a site that is:

1. Running an animation through a large number of timer callbacks.
2. The animation is saturating the main thread with painting.

In this case the timer callbacks will be throttled by the rate at which
the paints can happen.  When the browser cannot execute the paints at
60 FPS, then you will get at most one timer callback between each refresh
driver event.

<img src="/images/event-queue-expensive-paint.svg" width="100%" class="center-block"/>

This is not a problem for "closed loop" animations where you measure how long
things are taking to run and adjust your changes to match.  It can, however,
dramatically increase the overall animation time for "open loop" animations.

For example, consider this animation demonstration site:

 ["Open Loop" Animation Demo][]

Here the site pre-computes all the animation steps and schedules a separate
`setTimeout()` for each one.  Each timer callback simply modifies the DOM
for its step without measuring to see if the animation is behind.

This demo site will cause pretty much every modern browser to drop to zero
frames-per-second.  The total animation, however, will run quite quickly.

<video src="/videos/open-loop-animation-45.mp4" controls width="80%" class="center-block"></video>

In Firefox 52, however, we end up delaying many of the timers due
to our yielding.  This keeps the browser running at 30fps, but the animation
takes much longer to complete:

<video src="/videos/open-loop-animation-52.mp4" controls width="80%" class="center-block"></video>

This is an extreme case that we don't think reflects the typical behavior on
most sites.  There are many ways to implement this animation without scheduling
hundreds or thousands of simultaneous timers.  Its very likely that sites are
using these alternate methods to avoid triggering the poor FPS performance caused
by this technique.

That being said, we still want to avoid breaking existing sites if we can.  This
is why we are not enforcing a strict yield after every timer callback.  We hope
that by allowing a few timer callbacks to run without yielding we can mitigate
the impact to these kinds of workloads while still improving performance on
sites in general.

What's Next?
------------

These `setTimeout()` changes have just hit our release channel with Firefox 52.
We will be on the look-out for any compatibility problems in the wild.  So
far we have only had a [single bug report][] in the four months since this
landed in nightly.

If you believe you have a problem on your site in Firefox due to these changes
please [file a bug][] and [add me to the CC list][].

Barring large-scale problems we plan to continue refining this approach.  We will
likely change our limit on "timers allowed before yielding" to use a
time budget approach instead of a fixed number.  In addition, the [Quantum DOM][]
project will be experimenting with more changes to event queue scheduling in
general.

[changes to `setTimeout()` and `setInterval()`]: https://bugzilla.mozilla.org/show_bug.cgi?id=1300659
[Demo Site]: https://people-mozilla.org/~bkelly/timer-flood/index.html
[Nolan Lawson]: https://twitter.com/nolanlawson
[IDB performance post]: https://nolanlawson.com/2015/09/29/indexeddb-websql-localstorage-what-blocks-the-dom/
["Open Loop" Animation Demo]: https://mozdevs.github.io/servo-experiments/experiments/tiles/
[single bug report]: https://bugzilla.mozilla.org/show_bug.cgi?id=1342854
[file a bug]: https://bugzilla.mozilla.org/enter_bug.cgi?format=guided#h=dupes|Core|DOM
[add me to the CC list]: https://bugzilla.mozilla.org/user_profile?login=bkelly%40mozilla.com
[Quantum DOM]: https://billmccloskey.wordpress.com/2016/10/27/mozillas-quantum-project/
