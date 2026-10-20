import { Item } from '@/engine'

/** A powerful crystal embodying the living essence of the enchanted forest. */
export class ForestHeartCrystal extends Item {
  constructor() {
    super({
      name: 'forest heart crystal',
      description:
        'A magnificent crystal that seems to contain an entire living forest within its ' +
        'translucent depths. Tiny lights dance inside like fireflies, and you can almost ' +
        'hear the whisper of wind through leaves when you hold it close. This crystal ' +
        'radiates immense magical power and represents the concentrated essence of all ' +
        'natural magic.',
    })
  }
}
