import fs from "fs";

const transcriptPath =
  "C:/Users/ysc02/.cursor/projects/c-Users-ysc02-Desktop-competition/agent-transcripts/f2cc760c-d21e-49bf-a914-fd61f6d81d05/f2cc760c-d21e-49bf-a914-fd61f6d81d05.jsonl";
const outPath = new URL("../data/agentPersonas.json", import.meta.url);

const raw = fs.readFileSync(transcriptPath, "utf8");
const line = raw.split(/\n/).find((l) => l.includes("academic__academic-anthropologist"));
if (!line) {
  console.error("transcript line not found");
  process.exit(1);
}
const o = JSON.parse(line);
const textBlock = o.message.content.find((x) => x.type === "text");
const t = textBlock.text;
let start = t.indexOf('[{"id"');
if (start < 0) start = t.indexOf("[{\n  {\n    \"id\"");
if (start < 0) start = t.search(/\[\s*\{\s*\n\s*"id"\s*:/);
if (start < 0) {
  console.error("could not find array start");
  process.exit(1);
}

/** bracket-aware slice for top-level JSON array */
function extractArray(s, from) {
  if (s[from] !== "[") return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (inStr) {
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return s.slice(from, i + 1);
    }
  }
  return null;
}

const jsonStr = extractArray(t, start);
if (!jsonStr) {
  console.error("could not extract array");
  process.exit(1);
}
const arr = JSON.parse(jsonStr);
fs.mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(arr, null, 2), "utf8");
console.log("wrote", outPath.pathname, "entries", arr.length);
