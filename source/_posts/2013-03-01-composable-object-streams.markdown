---
layout: post
title: "Composable Object Streams"
date: 2013-03-01 00:17
comments: false
categories: 
---

In my [last post][] I introduced the [pcap-socket][] module to help test
against real, captured network data.  I was rather happy with
how that module turned out, so I decided to mock out [dgram][] next in order
to support testing UDP packets as well.

I almost immediately ran into a few issues:

1. The `dgram` module does not implement a streams2 [duplex][] API.  It
   still provides an old-style "spew-stream".
2. I wanted to share code with `pcap-socket` for parsing ethernet
   frames and IP headers.
3. I also wanted to implement some missing features such IP fragment
   reassembly.  These types of features require operating across multiple
   packets and therefore fit the streaming model better than the
   simple utility function approach.

Using the basic rebuffering byte streams provided by the new streams2 API
seemed problematic.  For one, UDP packets are distinct and shouldn't be
summarily rebuffered.  Also, I needed a way to extract packet header
information and pass it along with the byte stream.

I was considering a couple ways to proceed when [Raynos][] was kind enough
to implement [object streams][].

This seemed to solve a lot of my problems.  I could now turn off rebuffering
and I could pass arbitrary objects around.

The new object mode, however, did create one new issue.

Now that streams are not just ordered bytes, how can I write general purpose
composable streams other people could easily use?  If every person uses their
own object structure then it could be very difficult to put together separate
stream modules in a useful way.

Over time I came up with an approach that seemed to work well for the network
protocol domain.  Essentially, I structured messages like this:

```javascript
var msg = {
  data: buf,
  offset: 14,
  ether: {
    src: '01:02:03:04:05:06',
    dst: '06:05:04:03:02:01',
    type: 'ip',
    length: 14
  }
};
```

Each message is the combination of some binary `Buffer` data and additional
meta-data.  In this example I have an ethernet frame that's been parsed off
the start of the `msg.data` buffer.

After a full parsing chain:

```javascript
var ipstream = new IpStream();
var udpstream = new UdpStream();
ipstream.pipe(udpstream);

ipstream.write(msg);
var out = udpstream.read();
```

The resulting `out` message might look like this:

```javascript
var out = {
  data: buf,
  offset: 42,
  ether: {
    src: '01:02:03:04:05:06',
    dst: '06:05:04:03:02:01',
    type: 'ip',
    length: 14
  },
  ip: {
    src: '1.1.1.1',
    dst: '2.2.2.2',
    flags: {
      df: false,
      mf: false
    },
    protocol: 'udp',
    protocolCode: 17,
    offset: 0,
    id: 12345,
    length: 20
  },
  udp: {
    srcPort: 5432,
    dstPort: 52,
    dataLength: 500,
    length 8
  }
};
```

This lets us inspect all of the extracted information at the end of the
processing pipeline.

This approach also lets different stream implementations work together.  For
example, the `IpStream` can inspect the `msg.ether.type` property provided
by `EtherStream` to see if `msg` represents an IP packet or not.

This approach also allows streams to avoid stepping on each others toes.  Both
the `EtherStream` and `IpStream` produce `src` properties, but they don't
conflict because they are namespaced under `ether` and `ip`.

To help solicit feedback on this approach I started a [gist][] that outlines
the approach.  If you're interested or have an opinion please check it out.
I'd love to know if there is a better, more standard way to build these sorts
of object streams.

Oh, and I did finally implement the `dgram` mock object.  See the
[pcap-dgram][] module for examples.  Both it and `pcap-socket` are built on
top of the new [ether-stream][] and [ip-stream][].  And `ip-stream` does
indeed now support [fragmentation reassembly][].

Finally, all of these composable object streams are implemented using a
new base class module called [object-transform][].  It makes it fairly easy
to write these kinds of transformations.

Of course, this still leaves me with my first issue.  The [dgram][] core
module still does not provide a streams2 API.  If this message structure makes
sense, however, it should now be possible to provide this API without losing
the `rinfo` meta-data provided in the current `'message'` event.  UDP wouldn't
benefit from the back pressure improvements, but this would allow `dgram` to
easily `pipe()` into other composable stream modules.

Again, if you an opinion on if this is useful or how it can be improved, please
comment on the [gist][] or send me a [tweet][].

Thank you!

[last post]: /blog/2013/02/03/writing-node-dot-js-unit-tests-with-recorded-network-data/
[pcap-socket]: https://github.com/wanderview/node-pcap-socket#readme
[dgram]: http://nodejs.org/api/dgram.html
[duplex]: http://nodejs.org/docs/v0.9.10/api/stream.html#stream_class_stream_duplex
[Raynos]: https://github.com/Raynos
[object streams]: https://github.com/joyent/node/commit/444bbd4fa7315423a6b55aba0e0c12ea6534b2cb
[gist]: https://gist.github.com/wanderview/5062495
[pcap-dgram]: https://github.com/wanderview/node-pcap-dgram#readme
[ether-stream]: https://github.com/wanderview/node-ether-stream#readme
[ip-stream]: https://github.com/wanderview/node-ip-stream#readme
[fragmentation reassembly]: https://github.com/wanderview/node-ip-stream/commit/8bfc084b3222116ce92c71c2897547ec47e341e7
[object-transform]: https://github.com/wanderview/node-object-transform#readme
[tweet]: http://twitter.com/wanderview
