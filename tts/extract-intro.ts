/**
 * Prints the Act I intro as plain text for speech synthesis. The all-caps
 * `[bold]` heading becomes a spoken sentence, speech keeps its quotation
 * marks, the other `[markup]` tags are stripped, and the closing "Let's get
 * started" help line is dropped, since it is a UI instruction, not narration.
 */
import { Act1 } from "../web/src/act1/Act1";

const intro = new Act1()
    .getActIntro()
    .replace(/\[bold\](.*?)\[\/bold\]/, (_match, title: string) => {
        const lower = title.toLowerCase().replace(":", ".");
        return `${lower.replace(/(^|\. )(\w)/g, (m) => m.toUpperCase())}.`;
    })
    .replace(/\[\/?dialogue\]/g, '"')
    .replace(/\[\/?[a-z_]+\]/g, "")
    .replace(/\nLet's get started![^\n]*\n?/, "")
    .trim();

console.log(intro);
