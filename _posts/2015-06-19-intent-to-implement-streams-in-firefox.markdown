---
layout: post
title: "Intent to Implement Streams in Firefox"
date: 2015-06-19 13:50:00 -0500
comments: false
image: /images/logo-streams.svg
categories: mozilla,streams
---

<img class="pull-right" src="/images/logo-streams.svg" width="100"/>

In the next few months I intend to begin implementing the [Streams API][]
in the Gecko codebase.

<!-- more -->

Google has been working on this spec for a while and has shipped a small
subset of the API for the [fetch Response body][].  Over the last few months
I've worked with others at Mozilla and Google to try to evaluate if this
spec is suitable for Firefox.

This evaluation resulted in three main concerns that I believe have been
addressed.

Async Read
----------

The current spec proposes a `read()` function that always returns a promise.
We had concerns about possible performance problems with forcing an asynchronous
callback and creating an additional object on every read.

To investigate this issue we implemented a couple rough benchmarks to try to
determine what kind of performance could be expected.  The details here are a
bit long, so I wrote a separate post describing the [async read evaluation][].

The end conclusion, however, was the the currently proposed `read()` should not
be a problem in practice.

Algorithms Operating on the Public API
--------------------------------------

As currently proposed, the Streams spec defines certain algorithms in terms of
publicly exposed functions.

For example, `pipeTo()` is essentially spec'd as:

```
function doPipe() {
  lastRead = reader.read();
  Promise.all([lastRead, dest.ready]).then(([{ value, done }]) => {
    if (Boolean(done) === true) {
      closeDest();
    } else if (dest.state === 'writable') {
      lastWrite = dest.write(value);
      doPipe();
    }
  });
}
```

This calls the public `.read()` function on the source stream's reader and the
public `.write()` function on the sink stream.

At face value this is a fine thing to do.  It enables creating duck typed streams.
It also allows "JavaScripty" things like monkey patching these functions to observe
the stream.

```
var origWrite = dest.write;
dest.write = function(value) {
  console.log('Writing: ' + value);
  origWrite(value);
};
```

Unfortunately, providing this kind of feature makes certain kinds of optimizations
in the browser exceptionally hard.

For example, consider if the source stream and sink stream being piped together are
both C++ implemented streams.  Perhaps the source is a Response.body and the sink
is a file stream (which is not currently spec'd).

In this case, the browser should be able to perform the data copying on a separate
thread.  There is nothing that requires actually interrupting the JavaScript
event loop with copying operations.

That is, unless JavaScript monkey patches the `.read()` or `.write()` functions.
In that case, the browser must round-trip each value copy through the JavaScript
thread.

Even if we were to add checking for monkey patching vs unmodified public functions,
the checks add complexity and introduce performance penalties themselves.

To avoid these kinds of issues, it's cleanest if algorithms like `pipeTo()` are instead
spec'd to operate on internal data.  Instead of calling `.read()` they would "read from
the internal source".  Instead of calling `.write()` they would "write to the
internal sink".

While the original design was written in terms of public functions, I believe we have
consensus to move to an [internal object design][].

Transferring Streams Between Threads
------------------------------------

Finally, we feel it's important that the spec supports transferring streams from one
thread to another.  So for example, a fetch Response could be initiated on the main
thread in a window, the body stream passed to a Worker to process the data, and
finally streamed to storage.

Again, I believe we have an informal agreement on how to move forward.  The
[thread transfer issue][] outlines how the stream would be locked on the current
thread and conceptually drained as the new thread reads it.

For C++ source streams this may not result in any copying, but instead just moving
a handle over behind the scenes.  For JavaScript streams, the data would be read as
normal and copied across to the new thread.

This generally needs many of the same things required for off-main-thread
`pipeTo()`.  For example, in addition to the internal object design mentioned above,
the spec also uses a locked reader design which further supports these kinds of
optimizations.

Looking Forward
---------------

With these concerns in mind I intend to begin implementing Streams in Gecko.

In addition to providing an implementation, I believe this will allow me to be more
active in shaping the spec itself.  Many parts of the spec are stable, but things
are still changing.  Work is proceeding on writable streams, byte streams, and
transforms.  It's in everyone's interest to have more browser vendors actively
engaged in working with the spec to find issues early.

Shipping code will depend on how things finalize in the spec and the code, of
course.  My hope, however, is to have an implementation of the fetch Response
body stream shipping by the end of the year.  This is the same subset of the
spec currently shipped by Chrome.

Please let me know if you have any questions or concerns.

----

<small>Thank you to Domenic Denicola and Andrew Overholt for reviewing an earlier draft
of this post.</small>

[Streams API]: https://streams.spec.whatwg.org/
[fetch Response body]: https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/35_QSL1ABTY
[async read evaluation]: /blog/2015/06/19/evaluating-streams-api-async-read/
[internal object design]: https://github.com/whatwg/streams/issues/321
[thread transfer issue]: https://github.com/whatwg/streams/issues/276
