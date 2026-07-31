---
title: CarCalc can now compare cars side by side
date: 2026-07-31
summary: A new Compare tab in CarCalc puts up to three EVs head to head on specs alone — price, practicality, energy and ownership — with the best in each row marked, and a link you can share.
thumb: car-calc-compare.jpg
---

[CarCalc](../car-calc/), the EV calculator I wrote about a few days ago, just
grew a second tab. The first tab answers *"how much car can I afford, and which
ones?"* — it's all about your salary and the way you pay. This new **Compare**
tab answers a different question: *"between these specific cars, which is
actually better?"*

## Specs, not salary

The deliberate thing about it is what it leaves out. Pick up to three cars and it
lines them up side by side — but it costs nothing under a lease, a loan or cash,
so **nothing here depends on what you earn**. It's the same dataset as the first
tab, viewed as pure specifications. The two tabs even share the same drive-away
figure under the hood, so they can never quietly disagree about the same car's
price.

That split turned out to be freeing: the compare view can just be a clean table
of facts, with no inputs to fill in first.

## The best in each row, marked

Every row where "better" actually means something gets a **winner**, ticked and
highlighted — and the tool knows which direction is good. Lower wins on price,
energy use and insurance; higher wins on boot space, towing, range, battery and
warranty. Rows where more isn't better — seats, body type, powertrain — are just
stated, never scored. (Three cars with five seats each shouldn't have a "winner".)

The rows are grouped the way you'd actually weigh a car up:

- **Price** — list price, estimated Victorian drive-away, whether it sits under
  the $91,661 FBT threshold, and resale after five years.
- **Practicality** — body type, seats, boot space (seats up *and* down), braked
  towing.
- **Energy** — battery size, electric range, energy use, and — now that the
  dataset includes plug-in hybrids — total range and petrol use, which only
  appear when a PHEV is actually in the mix rather than printing a column of
  dashes.
- **Ownership** — warranty, estimated annual insurance, and the date each row's
  data was sourced.

## A link you can share

The comparison lives in the URL, so any three-car match-up is a link you can send
someone. Here's
[Kia EV5 vs BYD Sealion 7 vs Leapmotor C10](https://carcalc.nig.fm/?tab=compare&compare=kia-ev5-air-long-range%2Cbyd-sealion-7-premium%2Cleapmotor-c10-design-lr)
— open it and it loads with those three already picked.

The dataset has grown a fair bit too, to **35 brands, 87 models and 216
variants**, now including PHEVs alongside the pure-electric cars. And it's all the
same as before under the hood: everything is computed locally and
deterministically, nothing calls a model, and it still never asks for your email.

Have a play at [carcalc.nig.fm](https://carcalc.nig.fm) — and, as always, it's
general information only, not financial advice.
