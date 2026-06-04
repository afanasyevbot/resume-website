import { describe, it, expect } from 'vitest'
import { htmlToText } from '../html'

describe('htmlToText', () => {
  it('returns empty for empty', () => {
    expect(htmlToText('')).toBe('')
  })

  it('strips simple tags', () => {
    expect(htmlToText('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
  })

  it('decodes common entities', () => {
    expect(htmlToText('&lt;p&gt;A &amp; B&lt;/p&gt;')).toBe('A & B')
  })

  it('inserts newlines for block tags', () => {
    expect(htmlToText('<p>One</p><p>Two</p>')).toBe('One\nTwo')
  })

  it('handles Greenhouse double-encoded HTML', () => {
    const greenhouseStyle = '&lt;div&gt;&lt;h2&gt;About&lt;/h2&gt;&lt;p&gt;We&#39;re hiring.&lt;/p&gt;&lt;/div&gt;'
    expect(htmlToText(greenhouseStyle)).toBe("About\nWe're hiring.")
  })

  it('drops script tags entirely', () => {
    expect(htmlToText('<p>visible</p><script>bad()</script>')).toBe('visible')
  })

  it('decodes numeric entities', () => {
    expect(htmlToText('A&#65;B')).toBe('AAB')
  })

  it('collapses excess whitespace', () => {
    expect(htmlToText('<p>  hello   world  </p>')).toBe('hello world')
  })
})
