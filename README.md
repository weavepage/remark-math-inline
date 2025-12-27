# remark-math-inline

A remark plugin for clean, unambiguous inline math syntax using `:math[...]`.

## Why?

The standard `$...$` syntax has issues:
- **Ambiguity** — conflicts with currency notation
- **Fragile parsing** — single `$` delimiters are hard to parse reliably
- **Tooling issues** — many Markdown parsers struggle with `$`

This plugin provides `:math[E = mc^2]` as a cleaner alternative.

## Install

```bash
npm install remark-math-inline
```

## Usage

```typescript
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
  .process('The formula :math[E = mc^2] shows mass-energy equivalence.')
```

## Syntax

```markdown
Inline math: :math[E = mc^2]

Euler's identity: :math[e^{i\pi} + 1 = 0]

Nested brackets work: :math[f(x) = [a, b]]
```

### Escaping

- `\]` → literal `]` (does not close)
- `\\` → literal `\`
- Other backslashes are preserved: `\alpha` stays as `\alpha`

### Boundary Rules

- `:math[` must NOT be preceded by a word character (a-z, A-Z, 0-9, _)
- Cannot span multiple lines

```markdown
foo:math[x]     <!-- Does NOT parse -->
test(:math[x])  <!-- Parses -->
test :math[x]   <!-- Parses -->
```

## Block Math

For block/display math, use fenced code blocks:

````markdown
```math
\int_0^1 x^2 dx = \frac{1}{3}
```
````

This already works with `rehype-katex` — no additional plugin needed.

## Packages

This monorepo contains:

| Package | Purpose |
|---------|---------|
| `micromark-extension-math-inline` | Tokenizer |
| `mdast-util-math-inline` | AST utilities |
| `remark-math-inline` | Remark plugin |

For direct micromark or mdast integration, see the individual package READMEs.

## Adjacency

`:math[...]` cannot be preceded by a word character. Use parentheses for adjacency:

```markdown
mass(:math[m])     <!-- Works -->
mass:math[m]       <!-- Does NOT parse -->
```

## With remark-directive

If using both plugins, **the one registered last wins** for `:math[...]` syntax:

```typescript
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
