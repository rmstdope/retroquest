import { describe, expect, it } from 'vitest'
import {
  FEEDBACK_MAX,
  failureText,
  headingFrom,
  lettersIn,
  versionLabel,
} from './feedbackReport'

describe('headingFrom', () => {
  it('is the first line', () => {
    expect(headingFrom('The door sticks\nand then more')).toBe(
      'The door sticks',
    )
  })

  it('skips blank lines before the first', () => {
    expect(headingFrom('\n  \n  Hello there \nrest')).toBe('Hello there')
  })

  it('is cut at a word to at most 120 characters', () => {
    const words = Array.from({ length: 40 }, () => 'abcdef').join(' ')
    const heading = headingFrom(words)
    expect(heading.length).toBeLessThanOrEqual(120)
    expect(heading.endsWith('abcdef')).toBe(true)
    expect(words.startsWith(heading)).toBe(true)
  })

  it('is cut hard when one word is longer than the limit', () => {
    expect(headingFrom('x'.repeat(300))).toBe('x'.repeat(120))
  })
})

describe('lettersIn', () => {
  it('counts letters and digits, not spaces or marks', () => {
    expect(lettersIn(' a b ! ')).toBe(2)
    expect(lettersIn('åäö1')).toBe(4)
  })
})

describe('versionLabel', () => {
  it('joins version, act and room', () => {
    expect(versionLabel('1.0.0+abc', 'Act I', 'Riverbank')).toBe(
      '1.0.0+abc · Act I · Riverbank',
    )
  })

  it('is at most 64 characters, cutting the room first', () => {
    const label = versionLabel('1.0.0+abc', 'Act I', 'R'.repeat(100))
    expect(label.length).toBeLessThanOrEqual(64)
    expect(label.startsWith('1.0.0+abc · Act I · R')).toBe(true)
  })

  it('leaves out an act and room that are not known yet', () => {
    expect(versionLabel('1.0.0', '', '')).toBe('1.0.0')
  })
})

describe('failureText', () => {
  const rate = (retryAfterSeconds: number): string =>
    failureText({ code: 'rate_limited', retryAfterSeconds, message: '' }, true)

  it('rounds the wait up to whole minutes', () => {
    expect(rate(61)).toBe('Too many reports just now. Try again in 2 minutes.')
    expect(rate(600)).toBe(
      'Too many reports just now. Try again in 10 minutes.',
    )
  })

  it('says 1 minute when it is one', () => {
    expect(rate(1)).toBe('Too many reports just now. Try again in 1 minute.')
    expect(rate(60)).toBe('Too many reports just now. Try again in 1 minute.')
  })

  it('says the service could not be reached when offline or silent', () => {
    const offline =
      "Couldn't reach the feedback service. Check your connection and try again."
    expect(failureText({ code: 'network', message: '' }, true)).toBe(offline)
    expect(failureText({ code: 'request_timeout', message: '' }, true)).toBe(
      offline,
    )
  })

  it('names the picture when it was too large', () => {
    expect(failureText({ code: 'too_large', message: '' }, true)).toBe(
      'The picture of the screen is too large to send. Untick it and try again.',
    )
  })

  it('says something went wrong for anything else', () => {
    const other = "Something went wrong and it wasn't sent. Try again later."
    expect(failureText({ code: 'too_large', message: '' }, false)).toBe(other)
    expect(failureText({ code: 'forbidden', message: '' }, true)).toBe(other)
    expect(failureText({ code: 'upstream_failed', message: '' }, true)).toBe(
      other,
    )
    expect(
      failureText({ code: 'unexpected', status: 418, message: '' }, true),
    ).toBe(other)
    expect(
      failureText(
        { code: 'invalid_report', field: 'title', message: '' },
        true,
      ),
    ).toBe(other)
  })

  it('has the box limit the service takes', () => {
    expect(FEEDBACK_MAX).toBe(5000)
  })
})
