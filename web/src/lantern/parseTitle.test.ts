import { describe, it, expect } from 'vitest'
import { parseTitle } from './parseTitle'

// As Game.get_ascii_logo() writes it (art shortened).
const LOGO = `
Welcome to
[bold yellow]
#####  ####
##  ## ##
[/bold yellow]
[bold]Music track:[/bold] Market by Conquest
Source: https://freetouse.com/music
Copyright Free Background Music`

describe('parseTitle', () => {
  it('splits the logo screen into the art and the music credits', () => {
    expect(parseTitle(LOGO)).toEqual({
      art: '#####  ####\n##  ## ##',
      credits: [
        'Market by Conquest',
        'Source: https://freetouse.com/music',
        'Copyright Free Background Music',
      ],
    })
  })

  it('copes with a screen without art or credits', () => {
    expect(parseTitle('Welcome')).toEqual({ art: '', credits: [] })
  })
})
