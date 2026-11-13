/**
 * Writes `tts/act<N>/unreached.json`: the keys of the lines the act's content
 * can speak that its narration script lacks, acknowledged so that
 * `unreachedLines.test.ts` fails only for a line added after. Run it only to
 * acknowledge lines on purpose; a line that should be spoken belongs in the
 * script through `branches.json`.
 *
 *   (cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/list-unreached.ts 1)
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
    acknowledgedKey,
    authoredLines,
    contentFiles,
    unreachedLines,
} from "../web/src/lantern/unreachedLines";
import type { ScriptLine } from "../web/src/lantern/narrationScript";

for (const act of process.argv.slice(2)) {
    const script = JSON.parse(
        readFileSync(`../tts/act${act}/script.json`, "utf8"),
    ) as ScriptLine[];
    const keys = [
        ...new Set(
            unreachedLines(authoredLines(contentFiles(".", act)), script, []).map((line) =>
                acknowledgedKey(line.text),
            ),
        ),
    ].sort();
    writeFileSync(`../tts/act${act}/unreached.json`, JSON.stringify(keys, null, 2) + "\n");
    console.log(`${keys.length} lines acknowledged in tts/act${act}/unreached.json`);
}
