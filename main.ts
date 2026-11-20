// Leonida Platinum Roadbook v8 — my hand-in program for this entry.
// Revision note (second pass): the dossier build below is unchanged, but I
// re-checked it against the kit's scorer caps after the full data file landed
// — 55 trophies, 66 KB of guides, 4 screenshots — and the plumbing still fits
// inside every cap, so nothing here needed to change except this comment.
//
// What this build is, in my own words: a fresh, offline GTA VI trophy guide
// and tracker that I wrote from the kit starter plus my own research notes.
// It covers all 55 official trophies with a cited guide each, a three-step
// roadmap to the platinum, a missables view built around the one trophy that
// can truly be missed, and a checklist that saves in the browser and exports
// and imports as JSON. The spoiler rule is strict on purpose: with story
// spoilers hidden, an unearned story trophy shows nothing of itself anywhere.
// The program below is only plumbing — it copies app/ and screenshots/ into
// the output folder and writes the dossier with the kit's vendored library,
// exactly as the starter does, because the scorer rebuilds that dossier and
// compares the two byte for byte. Leave vendor/makefun-frontend.ts alone.
//
// Run it locally with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with: node serve.ts, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
