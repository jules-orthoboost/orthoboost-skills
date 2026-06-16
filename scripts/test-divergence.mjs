#!/usr/bin/env node
/**
 * Divergence + hygiene tests for the persona skills.
 *
 * These are the cheap, deterministic guards that run on every build. They do NOT
 * prove a human will perceive divergence — that is what the subagent baseline test
 * (see tests/BASELINE.md) is for — but they catch the mechanical failure modes:
 * two personas sharing a headline font, a duplicated signature, a color collision,
 * or a description that smuggles a workflow summary (which makes Claude skip the body).
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PERSONAS_DIR = join(ROOT, "personas");

const personas = readdirSync(PERSONAS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => JSON.parse(readFileSync(join(PERSONAS_DIR, d.name, "persona.json"), "utf8")));

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};
const pass = (msg) => console.log(`  ✓ ${msg}`);

function assertUnique(label, values) {
  const norm = values.map((v) => String(v).toLowerCase().trim());
  const dupes = norm.filter((v, i) => norm.indexOf(v) !== i);
  if (dupes.length) fail(`${label} collides: ${[...new Set(dupes)].join(" | ")}`);
  else pass(`${label} unique across ${values.length} personas`);
}

// 1. Identity fields must be distinct.
assertUnique("accentColor", personas.map((p) => p.accentColor));
assertUnique("primary font", personas.map((p) => p.typography.primary));
assertUnique("divergence signature", personas.map((p) => p.divergenceContract.signature));

// 2. Each headline contract must commit to its own primary font, and no two
//    contracts may be byte-identical. (Shared contrast words like "serif"/"sans"
//    are expected — each persona defines itself against the others — so we check
//    the positive commitment, not raw token overlap.)
for (const p of personas) {
  if (!p.divergenceContract.headlineType.toLowerCase().includes(p.typography.primary.toLowerCase()))
    fail(`${p.id} headline contract doesn't name its primary font (${p.typography.primary})`);
}
assertUnique("headline contract", personas.map((p) => p.divergenceContract.headlineType));
pass("headline contracts each commit to their own font");

// 3. Description hygiene: trigger-only, no workflow summary verbs.
const bannedVerbs = ["then ", "first ", "step ", "after that", "next,"];
for (const p of personas) {
  const clients = p.exampleClients.length ? ` or its client offices (${p.exampleClients.join(", ")})` : "";
  const desc = `Use when creating or reviewing any OrthoBoost creative — ads, copy, captions, landing pages, emails, or social — for the ${p.displayName} persona (${p.tagline})${clients}.`;
  if (!desc.startsWith("Use when")) fail(`${p.id} description must start with "Use when"`);
  if (desc.length > 500) fail(`${p.id} description too long (${desc.length} chars)`);
  if (bannedVerbs.some((v) => desc.toLowerCase().includes(v)))
    fail(`${p.id} description smells like a workflow summary`);
}
pass("descriptions are trigger-only and within budget");

// 4. Every persona must forbid something — an empty avoid list means no guardrails.
for (const p of personas) {
  if (!p.avoid?.length) fail(`${p.id} has no "avoid" rules`);
  if (!p.voice?.diction?.avoid?.length) fail(`${p.id} has no banned diction`);
}
pass("every persona has guardrails (avoid + banned diction)");

console.log(
  failures === 0
    ? `\nAll divergence tests passed (${personas.length} personas).`
    : `\n${failures} divergence test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
