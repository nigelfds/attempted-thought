---
title: SongCoach — pulling the drums out of any song
date: 2026-07-27
summary: A local macOS app that isolates the drum track from any song so you can learn it, then play along to the backing track. The first release is out.
thumb: songcoach.jpg
---

This year my son and I started learning the drums together. The most fun way to
get better — and the one that actually stuck — was to pick a song we love and
play along. But playing along to a finished recording is harder than it sounds:
the drummer is buried in the mix, so you can't quite hear what they're doing, and
once you *can* play the part, their drums fight with yours.

What we really wanted was two versions of every song — **drums only**, to hear
exactly what was played, and **the song with the drums removed**, to play over.
So Claude and I built it.

## What it is

[SongCoach](https://github.com/nigelfds/songcoach) is a small macOS app for
drummers, and the **first release is now up** on the
[downloads page](https://github.com/nigelfds/songcoach/releases).

You play any song through your Mac — a YouTube tab, Spotify, Apple Music, a local
file — and SongCoach captures the audio and splits it into three stems: the full
song, drums only, and the song without drums. Then it opens a player with three
synced waveforms, solo switching, an A–B loop you set by dragging on the
waveform, and a pitch-preserved slow-down, so you can drill four bars until
they're yours.

## The bits I found interesting

- **The separation is an AI model running on your own machine.** SongCoach uses
  [Demucs](https://github.com/adefossez/demucs) to pull the drums out — bundled
  and run in-process, so there's nothing to install and no server call. This was
  my first time embedding an ML model directly inside a shipping app, which was
  half the reason I wanted to build it.
- **It records your system audio, so it works with anything.** A tiny Swift
  helper taps the Mac's audio output with ScreenCaptureKit — no BlackHole or
  virtual audio device to set up. If your Mac can play it, SongCoach can capture
  it.
- **Everything stays on your machine.** No account, no cloud, nothing uploaded.
  Your recordings and stems live in a folder on disk, and the little database is
  just a disposable index rebuilt from those files — delete it, or move the
  folder to another Mac, and it still works.
- **It's a real desktop app.** Python, ffmpeg, the native capture helper, and the
  AI model are all frozen into one signed, notarized `.app` — no right-click
  "Open" dance, nothing else to install. Packaging a desktop app end to end was
  something I hadn't done in a long time, and getting it down to a
  drag-to-Applications DMG was oddly satisfying.

## Getting it

It's macOS 13+ on Apple Silicon for now. Grab the `SongCoach.dmg` from the
[releases page](https://github.com/nigelfds/songcoach/releases), drag it into
Applications, and grant the screen &amp; system-audio recording permission on
first capture. That's it.

It's also completely **free and open source** — MIT-licensed, with the whole
thing up on [GitHub](https://github.com/nigelfds/songcoach). Poke around, build
it yourself, or open an issue.

It's early — a v1 with rough edges — but it's already changed how we practise. If
you drum, I'd love to know what songs you take apart with it.
