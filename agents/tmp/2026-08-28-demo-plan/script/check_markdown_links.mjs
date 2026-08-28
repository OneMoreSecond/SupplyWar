import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const files = process.argv.slice(2);
const missing = [];
for (const file of files) {
  const markdown = readFileSync(file, "utf8");
  for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, "").split("#", 1)[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const path = resolve(dirname(file), decodeURIComponent(target));
    if (!existsSync(path)) missing.push(`${file}: ${target}`);
  }
}
if (missing.length > 0) throw new Error(`Missing Markdown targets:\n${missing.join("\n")}`);
process.stdout.write(`${files.length} Markdown files have valid local links.\n`);
