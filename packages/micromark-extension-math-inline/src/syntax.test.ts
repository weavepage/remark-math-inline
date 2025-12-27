import { describe, it, expect } from 'vitest'
import { micromark } from 'micromark'
import { mathInline } from './syntax.js'

function parse(input: string): string {
  return micromark(input, {
    extensions: [mathInline()],
    htmlExtensions: [{
      enter: {
        mathInline() {
          this.tag('<code class="math-inline">')
        }
      },
      exit: {
        mathInlineData(token) {
          this.raw(this.sliceSerialize(token))
        },
        mathInline() {
          this.tag('</code>')
        }
      }
    }]
  })
}

describe('mathInline tokenizer', () => {
  it('parses basic inline math', () => {
    expect(parse(':math[x]')).toBe('<p><code class="math-inline">x</code></p>')
  })

  it('parses math with spaces', () => {
    expect(parse(':math[E = mc^2]')).toBe('<p><code class="math-inline">E = mc^2</code></p>')
  })

  it('parses math in sentence', () => {
    expect(parse('The formula :math[x^2] is quadratic.')).toBe(
      '<p>The formula <code class="math-inline">x^2</code> is quadratic.</p>'
    )
  })

  describe('bracket balancing', () => {
    it('handles nested brackets', () => {
      expect(parse(':math[f(x) = [a, b]]')).toBe(
        '<p><code class="math-inline">f(x) = [a, b]</code></p>'
      )
    })

    it('handles multiple nested brackets', () => {
      expect(parse(':math[[a][b][c]]')).toBe(
        '<p><code class="math-inline">[a][b][c]</code></p>'
      )
    })
  })

  describe('escaping', () => {
    it('escapes ] with backslash', () => {
      expect(parse(':math[a\\]b]')).toBe('<p><code class="math-inline">a\\]b</code></p>')
    })

    it('escapes backslash before ]', () => {
      expect(parse(':math[a\\\\]')).toBe('<p><code class="math-inline">a\\\\</code></p>')
    })

    it('preserves backslash before other chars', () => {
      expect(parse(':math[\\alpha]')).toBe('<p><code class="math-inline">\\alpha</code></p>')
    })

    it('preserves backslash before [', () => {
      expect(parse(':math[\\[]')).toBe('<p><code class="math-inline">\\[</code></p>')
    })
  })

  describe('boundary conditions', () => {
    it('does NOT parse when preceded by word char', () => {
      expect(parse('foo:math[x]')).toBe('<p>foo:math[x]</p>')
    })

    it('parses after punctuation', () => {
      expect(parse('test(:math[x])')).toBe('<p>test(<code class="math-inline">x</code>)</p>')
    })

    it('parses after space', () => {
      expect(parse('test :math[x]')).toBe('<p>test <code class="math-inline">x</code></p>')
    })

    it('parses at start of document', () => {
      expect(parse(':math[x] test')).toBe('<p><code class="math-inline">x</code> test</p>')
    })

    it('does NOT parse with space after colon', () => {
      expect(parse(': math[x]')).toBe('<p>: math[x]</p>')
    })

    it('does NOT parse across newlines', () => {
      expect(parse(':math[x\ny]')).toBe('<p>:math[x\ny]</p>')
    })
  })
})
