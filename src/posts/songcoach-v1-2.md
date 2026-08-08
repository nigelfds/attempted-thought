---
title: SongCoach v1.2.0 — a stem for the singer
date: 2026-08-08
summary: SongCoach now splits every song into four stems, including an isolated vocal, plus waveform markers to flag the riffs and changes — and a way to upgrade older recordings.
thumb: songcoach-v1-2.jpg
---

My daughter has started learning to sing. She'd been watching my son and me drum
along to songs in [SongCoach](../songcoach/) — dropping the kit out of the mix and
playing over the top — and one evening she asked the obvious question: could she do
the same thing with her voice, and sing along to a song with the *vocals* taken
out?

That's this release. **SongCoach v1.2.0** is out, and it grew almost entirely out
of two things my kids wanted while practising.

## Four stems, including vocals

Every song now separates into **four** rows instead of three:

- **Full song** — the reference mix,
- **Drums** — the kit on its own,
- **Vocals** — the voice on its own, and
- **Backing** — bass, keys and everything else, with the drums *and* vocals pulled
  out.

You blend them with a per-stem fader, so you can set up whatever you're working on.
Mute the vocals and you've got a backing track to sing over; mute the drums and
it's the whole song minus the kit; solo the vocals to really hear what the singer
is doing. My daughter got her karaoke, my son and I kept our drum play-along —
same song, everyone happy.

## Markers — a heads-up for what's coming

The other idea came straight out of practising: you're playing along, and the big
fill or the key change lands before you're ready for it. So now you can **mark up a
recording**. Click the flag, click a spot on the waveform, and drop a marker — a
line across **all** the stems with a small "i" badge — then name it: "guitar solo",
"big fill", "key change". A live time tooltip follows your cursor while you place
it so you can land it exactly, and you can click a marker's "i" later to rename or
delete it. Markers are saved with the recording, so your annotations are there the
next time you open it.

## Bring your older recordings up to date

Anything you recorded before this release still shows three stems. Rather than make
you re-record, there's a **reprocess** button in the player (the circular-arrows
icon) that re-separates a song and adds the vocals and backing stems — it works
from the full-song audio each recording already keeps, so nothing needs
re-capturing, and your markers survive it. There's also a one-liner to upgrade the
whole library at once from the source tree.

A bit of polish, too: the four stem rows sit on the clean light panel with each
fader tinted its channel colour, and Apple Music mode's session panel gained a
refresh control so finished songs turn up in the library without relaunching.

Still macOS 13+ on Apple Silicon, still free and open source. Grab `SongCoach.dmg`
from the [releases page](https://github.com/nigelfds/songcoach/releases).
