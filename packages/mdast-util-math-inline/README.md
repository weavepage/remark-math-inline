# mdast-util-math-inline

[mdast](https://github.com/syntax-tree/mdast) utilities for inline math (`:math[...]`).

## Install

```bash
npm install mdast-util-math-inline
```

## Usage

```javascript
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mathInline } from 'micromark-extension-math-inline'
import { mathInlineFromMarkdown, mathInlineToMarkdown } from 'mdast-util-math-inline'

// Parse
const tree = fromMarkdown(':math[x^2]', {
  extensions: [mathInline()],
  mdastExtensions: [mathInlineFromMarkdown()]
})

// Stringify
const md = toMarkdown(tree, {
  extensions: [mathInlineToMarkdown()]
})
```

## AST

### `InlineMath`

```typescript
interface InlineMath extends Literal {
  type: 'inlineMath'
  value: string
  data?: {
    hName: 'code'
    hProperties: { className: ['language-math', 'math-inline'] }
    hChildren: [{ type: 'text', value: string }]
  }
}
```

The `data` fields enable compatibility with `remark-rehype` and `rehype-katex`.

## Escaping

When serializing to markdown:
- `]` is escaped as `\]`
- `\` before `]` or `\` is escaped as `\\`
- Balanced brackets don't need escaping

## License

MIT
