# OrthoBoost Brand Persona Skills

The 11 OrthoBoost brand personas, packaged as installable Claude skills. Invoke a
persona and Claude writes copy in that voice **and** applies that persona's visual
design contract — a full overlay in one command.

Source of truth for each persona lives in `personas/<id>/persona.json`. The `SKILL.md`
files under `skills/` are **generated** — never hand-edit them.

> Status: pilot. 3 of 11 personas built (Dr. House, Dr. Rogers, D. K. Kardashian).
> The remaining 8 follow the same `persona.json` shape.

## Install

```bash
claude skills install github:jules-orthoboost/orthoboost-skills
```

Then in any session:

```
/orthoboost-personas      # router — lists all personas, helps you pick one
/dr-house                 # load the Dr. G. House overlay (Premium Family)
/dr-rogers                # Dr. M. Rogers (Family-Focused Community)
/dr-kardashian            # D. K. Kardashian (Luxury Wellness)
```

If you only know the client, start with `/orthoboost-personas` — it maps client
offices (Chang, Aloha, Renew, …) to the right persona.

## What's in the box

```
orthoboost-skills/
├── personas/<id>/persona.json   # SOURCE OF TRUTH (edit these)
├── persona.schema.json          # schema the JSON must satisfy
├── skills/<id>/SKILL.md         # GENERATED — do not edit
├── skills/orthoboost-personas/  # GENERATED router skill
├── scripts/generate.mjs         # persona.json → SKILL.md
├── scripts/test-divergence.mjs  # deterministic divergence + hygiene tests
└── tests/BASELINE.md            # how to run the subagent baseline test
```

## Workflow

```bash
npm run build    # regenerate all SKILL.md from persona.json
npm run test     # assert personas stay mutually distinct + descriptions stay clean
npm run check    # build + test (run before every commit)
```

**To edit a persona:** change `personas/<id>/persona.json`, then `npm run check`.

**To add a new persona:** create `personas/<new-id>/persona.json` matching
`persona.schema.json` (copy an existing one as a starting point), then `npm run check`.
The router regenerates itself automatically.

## Design notes

- **One JSON, many consumers.** The same `persona.json` that generates these skills can
  feed the ad-generator SPA and the brand-kit pipeline — edit the persona once, every
  tool stays in sync.
- **Hardened divergence.** The persona pages describe themselves softly ("modern, clean").
  Each `persona.json` adds a `divergenceContract` of concrete, checkable rules (headline
  type, layout, color, imagery) so the 11 personas never collapse into the same look.
- **Personas are fictional.** They are not clients. Each skill states this up front so
  Claude never tells a real office it "is" a persona.
