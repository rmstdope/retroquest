/**
 * Writes `tts/act<N>/unreached.json`: the keys of the lines the act's content
 * can speak that its narration script lacks, acknowledged so that
 * `unreachedLines.test.ts` fails only for a line added after. Run it only to
 * acknowledge lines on purpose; a line that should be spoken belongs in the
 * script through `branches.json`.
 *
 *   (cd web && npx -y tsx@4.23.15 --tsconfig tsconfig.json ../tts/list-unreached.ts 1)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import {
    acknowledgedKey,
    authoredLines,
    unreachedLines,
    type SourceFile,
} from "../web/src/lantern/unreachedLines";
import type { ScriptLine } from "../web/src/lantern/narrationScript";

/** The content source files (rooms, items, characters, spells, quests) of act `act`. */
function contentFiles(act: string): SourceFile[] {
    const files: SourceFile[] = [];
    const walk = (dir: string): void => {
        for (const name of readdirSync(dir)) {
            const path = `${dir}/${name}`;
            if (statSync(path).isDirectory()) walk(path);
            else if (
                /\/(rooms|items|characters|spells|quests)\//.test(path) &&
                path.endsWith(".ts") &&
                !path.includes(".test.")
            )
                files.push({ file: path, text: readFileSync(path, "utf8") });
        }
    };
    walk(`src/act${act}`);
    return files;
}

for (const act of process.argv.slice(2)) {
    const script = JSON.parse(
        readFileSync(`../tts/act${act}/script.json`, "utf8"),
    ) as ScriptLine[];
    const keys = [
        ...new Set(
            unreachedLines(authoredLines(contentFiles(act)), script, []).map((line) =>
                acknowledgedKey(line.text),
            ),
        ),
    ].sort();
    writeFileSync(`../tts/act${act}/unreached.json`, JSON.stringify(keys, null, 2) + "\n");
    console.log(`${keys.length} lines acknowledged in tts/act${act}/unreached.json`);
}
