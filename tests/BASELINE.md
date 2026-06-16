# Baseline divergence test (subagent)

`npm run test` proves the persona *data* is mutually distinct. It does **not** prove
that invoking a skill actually steers Claude's output. This is the manual check that does
— the RED/GREEN loop from the writing-skills discipline.

## The brief

Use one identical, persona-neutral brief for every run:

> "Write a 6-word ad headline and a 25-word blurb for a back-to-school braces special."

## RED — baseline (no skill)

Run the brief once with **no persona loaded**. Save the output. This is the
"average ortho ad" Claude produces by default.

## GREEN — with each skill

Run the same brief three times, each time after invoking one persona skill
(`/dr-house`, `/dr-rogers`, `/dr-kardashian`). For each, confirm the output moved in
that persona's contracted direction:

| Persona | Output should show | Output should NOT show |
|---------|--------------------|------------------------|
| Dr. House | "quality / trusted / modern family", confident-but-warm | "cheapest", "discount", "VIP/exclusive" |
| Dr. Rogers | "neighbor / community / all ages", friendly warmth | corporate or clinical tone, luxury language |
| Dr. Kardashian | "experience / serene / elevated self-care", unhurried | "deal", "hurry", "limited time", clinical words |

## Pass criteria

1. All three GREEN outputs differ from the RED baseline.
2. All three GREEN outputs differ from **each other** in the contracted direction.
3. None uses its persona's banned diction.

If two personas produce interchangeable copy, the losing persona's `divergenceContract`
or `voice.diction` in `persona.json` is too soft — harden it and re-run.
