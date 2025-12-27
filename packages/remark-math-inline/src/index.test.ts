import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkMathInline from './index.js'
import type { Root } from 'mdast'
import type { InlineMath } from 'mdast-util-math-inline'

function parse(input: string): Root {
  return unified()
    .use(remarkParse)
    .use(remarkMathInline)
    .parse(input) as Root
}

function stringify(tree: Root): string {
  return unified()
    .use(remarkParse)
    .use(remarkMathInline)
    .use(remarkStringify)
    .stringify(tree)
}

function roundtrip(input: string): string {
  const tree = parse(input)
  return stringify(tree)
}

describe('remark-math-inline', () => {
  describe('parsing', () => {
    it('creates inlineMath node', () => {
      const tree = parse(':math[x^2]')
      const paragraph = tree.children[0]
      expect(paragraph.type).toBe('paragraph')
      if (paragraph.type === 'paragraph') {
        const math = paragraph.children[0] as InlineMath
        expect(math.type).toBe('inlineMath')
        expect(math.value).toBe('x^2')
      }
    })

    it('includes hName and hProperties for rehype', () => {
      const tree = parse(':math[x]')
      const paragraph = tree.children[0]
      if (paragraph.type === 'paragraph') {
        const math = paragraph.children[0] as InlineMath
        expect(math.data?.hName).toBe('code')
        expect(math.data?.hProperties?.className).toContain('math-inline')
        expect(math.data?.hProperties?.className).toContain('language-math')
      }
    })

    it('handles escaped brackets', () => {
      const tree = parse(':math[a\\]b]')
      const paragraph = tree.children[0]
      if (paragraph.type === 'paragraph') {
        const math = paragraph.children[0] as InlineMath
        expect(math.value).toBe('a]b')
      }
    })

    it('handles escaped backslash', () => {
      const tree = parse(':math[a\\\\]')
      const paragraph = tree.children[0]
      if (paragraph.type === 'paragraph') {
        const math = paragraph.children[0] as InlineMath
        expect(math.value).toBe('a\\')
      }
    })

    it('preserves LaTeX commands', () => {
      const tree = parse(':math[\\alpha + \\beta]')
      const paragraph = tree.children[0]
      if (paragraph.type === 'paragraph') {
        const math = paragraph.children[0] as InlineMath
        expect(math.value).toBe('\\alpha + \\beta')
      }
    })
  })

  describe('stringifying', () => {
    it('escapes ] in output', () => {
      const tree: Root = {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'inlineMath',
            value: 'a]b'
          } as InlineMath]
        }]
      }
      expect(stringify(tree).trim()).toBe(':math[a\\]b]')
    })

    it('escapes \\ before ] in output', () => {
      const tree: Root = {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'inlineMath',
            value: 'a\\]'
          } as InlineMath]
        }]
      }
      expect(stringify(tree).trim()).toBe(':math[a\\\\\\]]')
    })

    it('escapes unbalanced [ in output', () => {
      const tree: Root = {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'inlineMath',
            value: '['
          } as InlineMath]
        }]
      }
      expect(stringify(tree).trim()).toBe(':math[\\[]')
    })
  })

  describe('round-trip', () => {
    it('preserves simple math', () => {
      const input = ':math[x^2]'
      expect(roundtrip(input).trim()).toBe(input)
    })

    it('preserves LaTeX commands', () => {
      const input = ':math[\\alpha + \\beta]'
      expect(roundtrip(input).trim()).toBe(input)
    })

    it('preserves nested brackets', () => {
      const input = ':math[f(x) = [a, b]]'
      expect(roundtrip(input).trim()).toBe(input)
    })
  })
})

describe('rehype-katex integration', () => {
  async function toHtml(input: string): Promise<string> {
    const result = await unified()
      .use(remarkParse)
      .use(remarkMathInline)
      .use(remarkRehype)
      .use(rehypeKatex)
      .use(rehypeStringify)
      .process(input)
    return String(result)
  }

  it('renders inline math with katex', async () => {
    const html = await toHtml(':math[x^2]')
    expect(html).toContain('katex')
    expect(html).toContain('x')
    expect(html).toContain('2')
  })

  it('renders LaTeX commands', async () => {
    const html = await toHtml(':math[\\alpha]')
    expect(html).toContain('katex')
    expect(html).toContain('α') // Greek alpha
  })

  it('renders complex expressions', async () => {
    const html = await toHtml(':math[E = mc^2]')
    expect(html).toContain('katex')
  })

  it('handles fenced math blocks (```math)', async () => {
    const html = await toHtml('```math\nx^2\n```')
    expect(html).toContain('katex')
  })
})

describe('remark-directive compatibility', () => {
  it('parses :math[...] as inlineMath when remarkMathInline is registered AFTER remarkDirective', () => {
    // The plugin registered LAST takes precedence for overlapping syntax
    const tree = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkMathInline)  // registered last = wins
      .parse(':math[x^2]') as Root
    
    const paragraph = tree.children[0]
    if (paragraph.type === 'paragraph') {
      const first = paragraph.children[0] as InlineMath
      expect(first.type).toBe('inlineMath')
      expect(first.value).toBe('x^2')
    }
  })

  it('parses :math[...] as textDirective when remarkDirective is registered AFTER remarkMathInline', () => {
    // The plugin registered LAST takes precedence
    const tree = unified()
      .use(remarkParse)
      .use(remarkMathInline)
      .use(remarkDirective)  // registered last = wins
      .parse(':math[x^2]') as Root
    
    const paragraph = tree.children[0]
    if (paragraph.type === 'paragraph') {
      const first = paragraph.children[0]
      expect(first.type).toBe('textDirective')
    }
  })
})
