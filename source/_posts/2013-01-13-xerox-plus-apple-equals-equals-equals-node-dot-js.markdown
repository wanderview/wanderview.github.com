---
layout: post
title: "Xerox + Apple === Node.js"
date: 2013-01-13 21:02
comments: false
categories: 
---

{% img right /images/xerox6128mfp.jpg 275 265 %}

<!-- more -->

In 2010 my wife and I decided to buy a fancy all-in-one, networked, laser
printer and scanner.  We were tired of the long, onerous tasks of cleaning
ink cartridges and walking over to the scanner to plug in our laptops.  A
person can only take so much.

After extensive research we settled on a [Xerox Phaser 6128MFP][].  It was
a color printer with built-in ethernet.  Scanning wrote files directly to a
shared drive or sent them over email.  It wasn't cheap, but clearly this was
the device for us.  After a few minutes on [Newegg][] it was ours.

[Xerox Phaser 6128MFP]: http://www.office.xerox.com/multifunction-printer/color-multifunction/phaser-6128mfp/enus.html
[Newegg]: http://newegg.com

For nearly a year, all was well.  We scanned.  We printed.  A few times in
color at first, to prove that it worked, and then mostly in black-and-white
so as not to be wasteful.

{% img left /images/apple-mac-os-x-lion-10-7.jpg %}

Then in August, 2011 we decided to upgrade our laptops.  Snow Leopard was
clearly not fierce enough and we needed to move to Lion.  I had waited
a full month after release to upgrade in an attempt to avoid major problems.
There were a few complaints online, but overall it seemed like a safe upgrade.

Of course, after installing Lion we ran into problems.  Low and behold, Apple
had chosen to discontinue support for the NetBIOS session protocol including
SMB over NetBIOS.  Its as if they thought a [protocol from 1987][]
wasn't good enough any more.  This [broke networked scanning][] for many
people, including us.

[protocol from 1987]: http://tools.ietf.org/rfc/rfc1002.txt
[broke networked scanning]: https://discussions.apple.com/thread/3208098?start=0&tstart=0

No problem, I thought, I'll just switch to the email delivery method instead.
I soon discovered, however, that the Xerox firmware only supports sending
email over unencrypted SMTP.  Besides the obvious security concerns, this
would not work because both my wife and I use gmail which requires SSL/TSL.

This left us with only a few solutions:

 1. Try [configuration changes][] reported to have varying levels of success.
 2. Install and configure Samba on both our laptops.
 3. Setup a linux server on our home network to server as an SMTP MTA or file
    server.
 4. Walk over to the scanner and plug the USB cable into the laptop.

[configuration changes]: https://discussions.apple.com/thread/3196311?start=30&tstart=

{% img right /images/nodejs-dark.png 245 332 %}

After careful consideration I have chosen to try something completely
different:

I'm now working on a [Node.js][] server to receive scanned files over
NetBIOS/SMB and push them up to [Dropbox][].

[Node.js]: http://nodejs.org
[Dropbox]: http://dropbox.com

Ultimately I'd like to host this server on an embedded device like a
[Raspberry Pi][], [Soekris][], or [Gumstix][].  To make it easier to
deploy on these platforms I'm working towards a pure JavaScript
implementation.

[Raspberry Pi]: http://www.raspberrypi.org/
[Soekris]: http://soekris.com/
[Gumstix]: https://www.gumstix.com/

While not the most direct solution, it has a number of benefits:

* Provides a permanent solution that is uncoupled from our chosen laptop
  operating systems.
* Gives me the opportunity to learn more about node.js, JavaScript, and
  some new (to me) protocols.  I'd rather learn about these things than
  configuration files.
* Allows me to contribute some code and get more involved with the node.js
  community.
* Could potentially provide a foundation for integrating any number of legacy
  devices and applications.  There are undoubtedly small business and
  enterprise IT shops trying to figure out how to tie their aging, legacy
  equipment into fancy new cloud services.  Perhaps this code will be helpful.

I figure as long as I am starting a project, I might as well start a blog as
well.  While all the code is hosted on [GitHub][], I'll periodically post
more updates on my progress here.  The next post will be coming soon and will
cover proxying NetBIOS sessions using node.js.

[GitHub]: http://www.github.com/wanderview
