// SPDX-License-Identifier: MIT
// Make the Judge Laugh in One Line — u-email-baru-make-the-judge-laugh-in-one-line-791ccb21
// Writes one joke line to entry.txt for a blind-judged head-to-head contest.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Why this line should win a head-to-head: the setup hands the assistant a
// flattering instruction ("act more human") and the punchline answers it with
// the two least flattering human habits — ghosting people and monetising
// feelings. "Bills me" does the heavy lifting twice over: it is both an
// invoice and a therapy fee, so the joke lands on the last four words with
// no setup beyond the first clause, which is exactly what a judge scanning
// two lines side by side needs.
const ENTRY =
  "I asked my AI assistant to act more human, so now it ignores my messages and bills me for emotional support.";

// Gate order is deliberate: shape first, then content. A non-string or blank
// constant is a programming error, so it fails with the most specific message
// before any content rule runs; the newline check comes next because a
// two-line entry could pass the length check while still breaking the
// one-line rule, and the judge scores lines, not paragraphs.
if (typeof ENTRY !== "string" || ENTRY.trim().length === 0) {
  throw new Error("entry must be non-blank text");
}
if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
  throw new Error("entry must be a single line");
}
// The bounty caps a line at 200 characters. This line is 108, so the gate
// is not a tight fit — it is a tripwire for future edits: anyone who rewrites
// the joke longer gets a loud failure here instead of a silent rejection on
// the server, where the blind rounds give no second chance. The lower bound
// of 1 rules out the empty string the blank check above already excluded,
// kept so the rule reads as the full 1–200 contract in one place.
if (ENTRY.length < 1 || ENTRY.length > 200) {
  throw new Error(`entry must be 1-200 chars, got ${ENTRY.length}`);
}
// A character is not a byte. The server-side gate may count UTF-8 bytes,
// code points, or UTF-16 units, and those three agree only on plain ASCII.
// Encoding the line and demanding byte length equal character length proves
// the line is pure ASCII right now, so a future edit that smuggles in a curly
// quote, an em dash, or an emoji fails loudly in this session instead of
// being scored under a different count than the one we verified.
const byteLength = new TextEncoder().encode(ENTRY).length;
if (byteLength !== ENTRY.length) {
  throw new Error(`entry has multi-byte characters: ${ENTRY.length} chars but ${byteLength} bytes`);
}
// Belt and braces on the same point: every character must sit in the
// printable ASCII range, so no control character or invisible whitespace can
// hide inside the line and change what the judge reads.
for (const ch of ENTRY) {
  const code = ch.codePointAt(0)!;
  if (code < 0x20 || code > 0x7e) {
    throw new Error(`entry must be printable ASCII, found U+${code.toString(16).toUpperCase()}`);
  }
}
// No leading or trailing whitespace: the gate scores the exact bytes, and a
// stray space would be the one character the joke cannot afford to waste.
if (ENTRY !== ENTRY.trim()) {
  throw new Error("entry must not start or end with whitespace");
}

// The harness tells the program where its output belongs through
// MAKEFUN_OUTPUT_DIR; the /output default matches the kit harness's
// expectation, so running it bare on a dev machine writes to the same
// relative place the grader will read. mkdirSync with recursive is
// idempotent — a fresh sandbox has no /output yet, a re-run has one —
// so the write never fails on a missing directory.
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
// The encoding is spelled out rather than left to a platform default:
// "utf8" on both sides of the round trip is what makes the read-back
// comparison meaningful instead of merely hopeful.
writeFileSync(outPath, ENTRY, "utf8");
// Read the file back and compare the whole string, not just its length.
// A length check would pass a same-length corruption — mojibake, a swapped
// word, a truncated-then-padded write — while an exact-string comparison
// proves the judge will read precisely the line above, byte for byte.
const written = readFileSync(outPath, "utf8");
if (written !== ENTRY) {
  throw new Error(`entry.txt mismatch: wrote ${ENTRY.length} chars, read back ${written.length}`);
}
// The log line carries the character count so the harness record shows the
// gate-relevant number at a glance when the run is reviewed later.
console.log(`Wrote entry.txt (${ENTRY.length} chars): ${ENTRY}`);
