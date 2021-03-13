# Fetchler

Fetch wrapping library.

Currently alpha release, initial pass. There are no unit tests and is not well tested in the wild. Don't use this.

## Purpose

I've written and rewritten tons of fetching modules over the years, basically a new one for every project I've taken on, and I finally got fed up with doing the same thing over and over with minor changes each time, so I finally made one that I can reuse. This published to npm as `fetchler` and my intent is release it to the public once I'm happy with it. But for now it's just something I'm playing around with. 

I am currently using it in [Portaler](https://github.com/Portaler-Zone/portaler-core/tree/main/packages/frontend) to test it in the wild. Once I'm happy with it, I'll write some proper unit tests and all that stuff to make it a real library.

## Workspaces

Right now it's just a single package, but the idea is to add in at least React & Node versions which would be included under /packages along with core. 
