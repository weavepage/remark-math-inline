import { mathInline } from 'micromark-extension-math-inline'
import { mathInlineFromMarkdown, mathInlineToMarkdown } from 'mdast-util-math-inline'
import type { Processor } from 'unified'

export default function remarkMathInline(this: Processor) {
  const data = this.data()

  const micromarkExtensions =
    data.micromarkExtensions || (data.micromarkExtensions = [])
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
  const toMarkdownExtensions =
    data.toMarkdownExtensions || (data.toMarkdownExtensions = [])

  micromarkExtensions.push(mathInline())
  fromMarkdownExtensions.push(mathInlineFromMarkdown())
  toMarkdownExtensions.push(mathInlineToMarkdown())
}

export type { InlineMath } from 'mdast-util-math-inline'
