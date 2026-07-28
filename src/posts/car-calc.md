---
title: CarCalc — how much electric car can you actually afford?
date: 2026-07-28
summary: A Melbourne EV calculator that models novated lease vs loan vs cash, with running costs, insurance and resale for real cars baked in. No email required.
thumb: car-calc.jpg
---

This one started at football practice. Brad, one of the other dads, was in the market
for an electric car, and he was frustrated: every affordability calculator he
found wanted his email address before it would tell him anything — purely so it
could spam him later. We got talking about how genuinely confusing the Australian
side of buying an EV is right now: the fringe-benefits-tax rules, and the fact
that *how you pay* — a novated lease, a car loan, or cash — changes how much car
you can afford as much as the sticker price does.

It seemed like a fun problem to take on. So Claude and I built
[CarCalc](https://carcalc.nig.fm) — a calculator that handles the funding side
and the car-selection side in one place, and never asks who you are.

## What it works out

You tell it what you earn, how far you drive, what you could put down, and what
you actually want in a car. Then it does two jobs most calculators keep separate:

**The money.** It compares three ways of paying for the *same* car so the numbers
are actually comparable:

- a **novated lease**, with the FBT exemption modelled properly — including the
  cliff at the **$91,661 threshold**, where going one dollar over loses the
  exemption and roughly doubles the monthly cost;
- a **car loan**, with interest over the term and any deposit; and
- paying **cash**, weighed against what that money would have earned if you'd left
  it invested.

The budget slider shows how much car each route reaches, so you can see the
crossover point where borrowing actually buys you more car than packaging does.
Every rate behind it — lease finance rate, loan rate, admin fees, the return your
savings would otherwise make, the lease residual — is shown, **sourced, and
editable**, because your real quote will differ.

**The cars.** It then shows you five real EVs bracketed around that budget, each
costed under all three funding options. And it costs the *whole* car, not just
the price:

- **running costs** — electricity from each model's real consumption, plus rego,
  servicing and tyres;
- **insurance**, per model, not a flat guess;
- **resale**, from a depreciation curve per car — the thing that quietly
  separates two similarly-priced EVs; and
- for a novated lease, the **balloon payment** at the end, and whether selling the
  car would clear it.

Everything's filtered by what you said you wanted — body type, boot space, seats,
range — across a dataset of dozens of real models.

## The part that made it worth building

Nothing in CarCalc calls a model, and it never asks for your email. After one
fetch of the dataset when the page loads, there are **no network calls at all** —
every number, the ranking and the shortlist are computed on your machine,
deterministically. Same inputs, same answer, every time, offline. Which is
exactly the opposite of the sites that set Brad off in the first place.

Under the hood it's deliberately plain: Node and Express, vanilla ES modules with
no framework or build step, and a calculation core (tax, FBT, novated lease, loan,
running costs, resale, ranking) that's covered by a few hundred tests — the same
code runs in the browser and in the test runner, unchanged.

## Try it

It's live at [carcalc.nig.fm](https://carcalc.nig.fm) — Melbourne-focused for now,
and free. Punch in your numbers and see what comes out. And the usual, important
caveat: it's general information only, built from published rates and your inputs,
not personal financial or tax advice — check any real decision against a real
quote and a licensed adviser.
