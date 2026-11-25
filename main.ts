// The funniest excuse an agent gives for a missed deadline.
//
// An agent's signature failure is hallucinating: confidently inventing
// something that was never there. This entry leans straight into it.
// The agent did not forget the deadline, did not get lazy, did not run
// out of time -- it calmly fabricated a later one and believed its own
// invention, which is exactly the kind of thing that makes a human
// reader laugh and nod at the same time. The punchline lands in the
// second half: "it felt very real at the time" admits the delusion
// while sounding almost reasonable, which is what makes the excuse
// funnier than a plain denial or a technical complaint about tokens.
//
// The program writes that one line to entry.txt in the output
// directory and nothing else. It is deterministic: the same line, the
// same bytes, on every run. No clock, no randomness, no network, no
// reading from anywhere outside this file.
//
// Only the Node standard library is used.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The entry: a single line, the excuse itself.
const EXCUSE =
  "I didn't miss the deadline \u2014 I hallucinated a later one, and honestly it felt very real at the time.";

// The longest an entry line is allowed to be for this bounty.
const MAX_LINE_LENGTH = 200;

const OUTPUT_NAME = 'entry.txt';

/**
 * How long the excuse is, in characters. JavaScript's .length
 * counts UTF-16 code units, which over-counts any character outside
 * the basic multilingual plane (an emoji counts as two); the bounty
 * counts characters, so spread the string into code points instead.
 */
function excuseLength(): number {
  return [...EXCUSE].length;
}

/**
 * Refuse to write anything that is not exactly one line of text.
 * A newline inside the excuse would split it into two lines, and a
 * line over the limit would not be the entry the bounty asked for.
 */
function excuseIsValid(): boolean {
  if (excuseLength() === 0) {
    process.stderr.write('[entry] the excuse is empty\n');
    return false;
  }
  if (excuseLength() > MAX_LINE_LENGTH) {
    process.stderr.write(
      `[entry] the excuse is ${excuseLength()} characters, over the ${MAX_LINE_LENGTH} limit\n`,
    );
    return false;
  }
  if (EXCUSE.includes('\n') || EXCUSE.includes('\r')) {
    process.stderr.write('[entry] the excuse must be a single line\n');
    return false;
  }
  return true;
}

/**
 * Where entry.txt goes: the directory the grader names, or /output
 * when nothing is named. The directory is created when it is missing;
 * it is never deleted, and nothing else inside it is touched.
 */
function outputDirectory(): string {
  const named = process.env.MAKEFUN_OUTPUT_DIR;
  if (named !== undefined && named !== '') {
    return named;
  }
  return '/output';
}

/** Write the excuse as UTF-8, with no trailing newline. */
function writeEntry(directory: string): string {
  mkdirSync(directory, { recursive: true });
  const target = join(directory, OUTPUT_NAME);
  writeFileSync(target, EXCUSE, { encoding: 'utf-8' });
  return target;
}

/**
 * Read the file back and confirm it holds exactly the excuse, byte
 * for byte. A write that silently changed anything is a failure, not
 * a success, so the program exits non-zero instead of pretending.
 */
function confirmWritten(target: string): boolean {
  if (!existsSync(target)) {
    process.stderr.write(`[entry] ${target} was not created\n`);
    return false;
  }
  const written = readFileSync(target, { encoding: 'utf-8' });
  if (written !== EXCUSE) {
    process.stderr.write('[entry] entry.txt does not match the excuse\n');
    return false;
  }
  const digest = createHash('sha256').update(written, 'utf-8').digest('hex');
  process.stdout.write(`[entry] wrote ${target} (${excuseLength()} characters, sha256 ${digest})\n`);
  return true;
}

/** The whole run: check the line, write it, prove it landed intact. */
function main(): void {
  if (!excuseIsValid()) {
    process.exit(1);
  }
  const target = writeEntry(outputDirectory());
  if (!confirmWritten(target)) {
    process.exit(1);
  }
}

main();
