#!/usr/bin/env node
/**
 * OrthoBoost persona-skill generator.
 *
 * Reads every personas/<id>/persona.json (the single source of truth),
 * validates it against persona.schema.json, and writes:
 *   - skills/<id>/SKILL.md            (one persona overlay skill each)
 *   - skills/orthoboost-personas/SKILL.md  (the router/index skill)
 *
 * SKILL.md files are GENERATED. Never hand-edit them — edit persona.json
 * and re-run `npm run build`.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PERSONAS_DIR = join(ROOT, "personas");
const SKILLS_DIR = join(ROOT, "skills");

const list = (a) => a.map((x) => `- ${x}`).join("\n");

function loadPersonas() {
  return readdirSync(PERSONAS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const file = join(PERSONAS_DIR, d.name, "persona.json");
      const data = JSON.parse(readFileSync(file, "utf8"));
      return { file, data };
    })
    .sort((a, b) => a.data.personaNumber - b.data.personaNumber);
}

function description(p) {
  const clients = p.exampleClients.length
    ? ` or its client offices (${p.exampleClients.join(", ")})`
    : "";
  return `Use when creating or reviewing any OrthoBoost creative — ads, copy, captions, landing pages, emails, or social — for the ${p.displayName} persona (${p.tagline})${clients}.`;
}

function personaSkill(p) {
  const fonts = [p.typography.primary, ...p.typography.fallbacks].join(", ");
  return `---
name: ${p.id}
description: ${description(p)}
---

# ${p.displayName} — ${p.tagline}

> Persona ${p.personaNumber} of 11 in the OrthoBoost brand system.
> Source of truth: ${p.sourceUrl}

**${p.displayName} is a fictional brand persona, not a real client office.** Apply this
voice and visual system to whichever client brief is in front of you — do not name,
address, or imply that the client *is* ${p.displayName}. ${
    p.exampleClients.length
      ? `Offices that fit this persona include: ${p.exampleClients.join(", ")}.`
      : ""
  }

## Positioning

${p.positioning}

## Voice contract

Lead with: **${p.voice.leadsWith}.**
Tone: ${p.voice.tone.join(", ")}.

**Messaging behavior:** ${p.messagingBehavior}

| Reach for | Never say |
|-----------|-----------|
| ${p.voice.diction.use.join(", ")} | ${p.voice.diction.avoid.join(", ")} |

## Divergence contract — make it unmistakably ${p.displayName}

These are hard rules, not vibes. They exist so this persona never looks like the other ten.

- **Headline type:** ${p.divergenceContract.headlineType}
- **Layout:** ${p.divergenceContract.layout}
- **Color:** ${p.divergenceContract.color}
- **Imagery:** ${p.divergenceContract.imagery}
- **Signature:** ${p.divergenceContract.signature}

## Design guidelines

**Typography** — ${fonts}. ${p.typography.weights}. ${p.typography.style}.

**Imagery**
${list(p.imagery)}

**Layout**
${list(p.layout)}

**Visual tone**
${list(p.visualTone)}

**Iconography**
${list(p.iconography)}

**Texture**
${list(p.texture)}

## Design principles

${list(p.designPrinciples)}

## What to avoid

${list(p.avoid)}

## Patient base (who the copy is talking to)

${list(p.patientBase)}
`;
}

function routerSkill(personas) {
  const rows = personas
    .map(
      (p) =>
        `| \`${p.id}\` | ${p.displayName} | ${p.tagline} | ${
          p.exampleClients.join(", ") || "—"
        } |`
    )
    .join("\n");
  return `---
name: orthoboost-personas
description: Use when starting any OrthoBoost creative task and you need to pick which of the 11 brand personas to apply, or when a client/brief is mentioned without a named persona.
---

# OrthoBoost Brand Personas — Router

OrthoBoost has 11 distinct practice personas. Each has its own voice and visual
system, published as an individual skill. **Pick one persona, then invoke its skill**
to load the full overlay before writing or reviewing creative.

Personas are fictional characters; the client offices in the last column are real
practices that fit each persona. Never tell a client they "are" a persona.

| Skill | Persona | Positioning | Fits client offices |
|-------|---------|-------------|---------------------|
${rows}

## How to choose

1. If the brief names a persona, use it.
2. If it names a client office, match it in the table above.
3. Otherwise infer from positioning: budget vs. premium vs. luxury, family vs. adult
   vs. pediatric, clinical-authority vs. wellness.

Once chosen, invoke that persona's skill (e.g. \`${personas[0].id}\`) for the full
voice + design contract.
`;
}

// --- minimal schema-ish validation (dependency-free) ---
function validate(p, file) {
  const errs = [];
  const need = JSON.parse(
    readFileSync(join(ROOT, "persona.schema.json"), "utf8")
  ).required;
  for (const k of need) if (!(k in p)) errs.push(`missing field: ${k}`);
  if (p.id && !/^[a-z0-9-]+$/.test(p.id)) errs.push(`bad id: ${p.id}`);
  if (p.accentColor && !/^#[0-9a-f]{6}$/.test(p.accentColor))
    errs.push(`bad accentColor: ${p.accentColor}`);
  if (errs.length) {
    throw new Error(`Invalid ${file}:\n  - ${errs.join("\n  - ")}`);
  }
}

const personas = loadPersonas();
let wrote = 0;
for (const { file, data } of personas) {
  validate(data, file);
  const dir = join(SKILLS_DIR, data.id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), personaSkill(data));
  wrote++;
  console.log(`  ✓ skills/${data.id}/SKILL.md`);
}

const routerDir = join(SKILLS_DIR, "orthoboost-personas");
if (!existsSync(routerDir)) mkdirSync(routerDir, { recursive: true });
writeFileSync(join(routerDir, "SKILL.md"), routerSkill(personas.map((x) => x.data)));
console.log(`  ✓ skills/orthoboost-personas/SKILL.md (router)`);
console.log(`\nGenerated ${wrote} persona skill(s) + 1 router from ${personas.length} persona file(s).`);
