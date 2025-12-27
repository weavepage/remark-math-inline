# remark-math-inline

A [remark](https://github.com/remarkjs/remark) plugin for inline math using clean, unambiguous `:math[...]` syntax.

## Why?

The standard `$...$` syntax for inline math has problems:
- **Ambiguity** — `$` conflicts with currency notation
- **Poor parsing** — Single `$` delimiters are hard to parse reliably
- **Tooling issues** — Many Markdown parsers don't handle `$` well

This plugin provides a cleaner alternative using explicit, directive-style syntax.

## Install

```bash
npm install remark-math-inline
```

## Usage

```javascript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMathInline from 'remark-math-inline'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'

const html = await unified()
  .use(remarkParse)
  .use(remarkMathInline)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeStringify)
  .process('The formula :math[E = mc^2] is famous.')

console.log(String(html))
```

### Markdown Syntax

```markdown
Inline math: :math[E = mc^2]

LaTeX commands work: :math[\alpha + \beta = \gamma]

Nested brackets are balanced: :math[f(x) = [a, b]]
```

### Block Math

For display-mode math, use fenced code blocks with `math` language:

````markdown
```math
\int_0^1 x^2 dx = \frac{1}{3}
```
````

This works out of the box with `rehype-katex` — no additional plugin needed.

## Escaping

- `\]` → literal `]` (doesn't close the math)
- `\\` → literal `\`
- Other backslash sequences are preserved as-is (e.g., `\alpha` stays `\alpha`)

## AST Node

The plugin creates `inlineMath` nodes compatible with `rehype-katex`:

```typescript
interface InlineMath {
  type: 'inlineMath'
  value: string
  data: {
    hName: 'code'
    hProperties: { className: ['language-math', 'math-inline'] }
    hChildren: [{ type: 'text', value: string }]
  }
}
```

## Adjacency

`:math[...]` must not be preceded by a word character. For adjacency without spaces, use parentheses:

```markdown
mass(:math[m])     <!-- Works -->
mass:math[m]       <!-- Does NOT parse -->
```

## Use with remark-directive

If you use both `remark-math-inline` and `remark-directive`, **the plugin registered last takes precedence** for `:math[...]` syntax.

```javascript
// Math wins:
unified()
  .use(remarkDirective)
  .use(remarkMathInline)  // registered last

// Directive wins:
unified()
  .use(remarkMathInline)
  .use(remarkDirective)   // registered last
```

## License

MIT
