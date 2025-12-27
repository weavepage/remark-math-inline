import type { CompileContext, Extension, Token } from 'mdast-util-from-markdown'
import type { Literal } from 'mdast'

export interface InlineMath extends Literal {
  type: 'inlineMath'
  data?: {
    hName: string
    hProperties: { className: string[] }
    hChildren: Array<{ type: 'text'; value: string }>
  }
}

declare module 'mdast' {
  interface PhrasingContentMap {
    inlineMath: InlineMath
  }
}

export function mathInlineFromMarkdown(): Extension {
  let mathValue = ''

  return {
    enter: {
      mathInline: enterMathInline,
      mathInlineData: enterMathInlineData
    },
    exit: {
      mathInlineData: exitMathInlineData,
      mathInline: exitMathInline
    }
  }

  function enterMathInline(this: CompileContext, token: Token): void {
    // @ts-expect-error: inlineMath is a custom node type
    this.enter({ type: 'inlineMath', value: '' }, token)
  }

  function enterMathInlineData(this: CompileContext): void {
    mathValue = ''
  }

  function exitMathInlineData(this: CompileContext, token: Token): void {
    mathValue = processEscapes(this.sliceSerialize(token))
  }

  function exitMathInline(this: CompileContext, token: Token): void {
    // @ts-expect-error: accessing custom node
    const node = this.stack[this.stack.length - 1] as InlineMath
    node.value = mathValue
    node.data = {
      hName: 'code',
      hProperties: { className: ['language-math', 'math-inline'] },
      hChildren: [{ type: 'text', value: mathValue }]
    }
    this.exit(token)
  }
}

function processEscapes(input: string): string {
  return input.replace(/\\([\]\\])/g, '$1')
}
