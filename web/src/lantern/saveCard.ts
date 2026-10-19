const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** "Act 1" (as saves store it) → "Act I"; other names stay as they are. */
export function actLabel(act: string | null): string {
  if (!act) return ''
  const match = /^Act (\d+)$/.exec(act)
  return match ? `Act ${ROMAN[Number(match[1]) - 1] ?? match[1]}` : act
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** When a save was made: "Today · 14:51", "Yesterday · 19:40", "14 Oct · 21:14". */
export function savedWhen(timestamp: string | null, now = new Date()): string {
  if (!timestamp) return ''
  const time = new Date(timestamp)
  if (Number.isNaN(time.getTime())) return ''
  const clock = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(time, now)) return `Today · ${clock}`
  if (sameDay(time, yesterday)) return `Yesterday · ${clock}`
  return `${time.getDate()} ${MONTHS[time.getMonth()]} · ${clock}`
}
