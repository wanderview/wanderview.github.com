---
layout: post
title: "Time Machine and npm"
date: 2013-01-15 22:34
comments: false
categories: 
---

Do you develop [npm][] modules on Mac OS X?  Do you also use Time Machine to
backup your work?

[npm]: http://npmjs.org

If you answered yes to both those questions, then there is a good chance you
will be looking at this dialogue box at some point.

<img class="center-block" src="/images/time-machine-failure.png"/>

<!-- more -->

I ran into this problem a couple weeks ago.  At first I thought my disk was
going bad, but all the Disk Utility checks ran fine.  Eventually I ended up
looking in the log and found this gem:

    Jan 15 22:25:37 xykon-2 com.apple.backupd[38289]: Error: (-36) SrcErr:NO Copying /Users/bkelly/Dropbox/devel/node-netbios-session/node_modules/netbios-name/name.js to /Volumes/xykon backup/Backups.backupdb/xykon (2)/2013-01-15-222534.inProgress/9C56F536-65EE-46B1-8EF6-481D98533409/Corsair SSD/Users/bkelly/Dropbox/devel/node-netbios-session/node_modules/netbios-name

Its quite long, but if you look closely you can see that its complaining
that it can't copy a file from `/usr/local/lib/node_modules` to a
`node_modules` directory in my development area.  In particular, it was
complaining about code that I recently had been referencing using `npm link`.

For those unaware, [npm link][] is a handy command that lets you work with
npm modules locally instead of installing them from the repository online.
It does this by creating symlinks in `/usr/local/lib/node_modules/`
and the `node_modules` directory within a module you are working on.  These
symlinks point to another local module that may have edits that you have not
yet published.

[npm link]: https://npmjs.org/doc/link.html

Of course, when you are done you may run `npm unlink` so that you can
`npm install` the module from the repository again.  This is where the
problem can occur.

Unfortunately, it appears that Time Machine will sometimes get upset if you
backup a symlink to a directory, convert the symlink back to a real directory,
and then try to backup again.

Indeed, after I knew to search for symlink related problems, Google revealed
that this problem is [not][] [new][].

[not]: http://www.machwerx.com/2012/04/01/time-machine-and-symlinks/
[new]: http://regex.info/blog/2012-11-20/2144

As mentioned in those other blogs, the solution to the problem is to delete
the problematic directories, run another backup, and then replace the data.
Fortunately, npm makes this fairly straightforward to do.

You can also add `/usr/local/lib/node_modules` to the Time Machine exclusions
to try to proactively avoid problems.

    tmutil addexclusion /usr/local/lib/node_modules

In fact, since the Time Machine exclusion is an attribute on the directory
itself, its in theory possible to enhance npm or write a wrapper script to
automatically set the exclusion whenever a new `node_modules` directory is
created.

Of course, you may be saying to yourself that you do this all the time and
have never had a problem.  Well, just to make things fun, it appears that Time
Machine only has problems with this situation periodically.  In fact, I tried
duplicating the error before writing this blog post and was unable to make it
happen.  Its unclear what other circumstances are required to trigger the
condition.

So your workflow may work for some time and then seemingly break at random.
Just be aware that it may be `npm link` related and try removing your
`node_modules` before scrapping the backup disk.
