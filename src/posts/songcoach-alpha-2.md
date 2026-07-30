---
title: SongCoach v1.1.0 — capture a whole playlist, hands-free
date: 2026-07-30
summary: The second SongCoach release adds an Apple Music mode that auto-captures a playlist song by song, plus library search, delete, and export/import.
thumb: songcoach-alpha-2.jpg
---

A quick follow-up to [the first release](../songcoach/): **SongCoach
v1.1.0 (Alpha 2)** is out, and it's all about the practice workflow. Four new things in this new release:

**Apple Music mode** — the big one. Turn it on, then just play a song or a whole
playlist in Apple Music, and SongCoach captures each track for you: it starts and
stops cleanly at every song boundary and sends each finished song to the stem
queue, one after another, until you hit Stop. Pause the music and the recording
pauses with it, so there's no dead air and every song stays one clean take. Tracks
separate one at a time in the background with live progress — *queued →
separating → done* — and each one picks up its cover art from Apple Music. Set a
playlist going and come back to a library full of drum stems.

**Search + pagination** — as the library grows, a search box filters by song and
artist as you type, and the list paginates so long libraries stay tidy. Both run
entirely in the app.

**Delete a recording** — a trash button (with a confirm) in the player. It's a
soft delete: the item leaves your library, but the audio on disk is never touched,
so nothing is truly lost.

**Export &amp; import** — move your whole library between Macs in two clicks.
Export downloads it as a single `.zip`; import merges one back in. As always it
stays local — the zip is the only thing that leaves your machine, and only if you
carry it there yourself.

There's also a pile of reliability work under the hood: capture segmenting, the
stem queue, delete edge cases, and a frozen-app crash where the Apple Music
watcher couldn't see playback.

It's still macOS 13+ on Apple Silicon, and still free and open source. Grab
`SongCoach.dmg` from the
[releases page](https://github.com/nigelfds/songcoach/releases).
