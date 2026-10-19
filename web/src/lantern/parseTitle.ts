/** The game's opening screen (Game.get_ascii_logo): the ASCII art and the music credits. */
export interface TitleScreen {
  art: string
  credits: string[]
}

const ART = /\[bold yellow\]\n?([\s\S]*?)\n?\[\/bold yellow\]/
const CREDITS = /\[bold\]Music track:\[\/bold\]\s*([\s\S]*)$/

export function parseTitle(text: string): TitleScreen {
  const credits = CREDITS.exec(text)?.[1] ?? ''
  return {
    art: ART.exec(text)?.[1] ?? '',
    credits: credits
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  }
}
