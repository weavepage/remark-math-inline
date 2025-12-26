# Remark Inline Math Extension Plan

A standalone remark plugin providing clean, modern inline math syntax for Markdown.

## Motivation

The current standard for inline math in Markdown (`$...$`) has problems:
- **Ambiguity** - `$` conflicts with currency notation
- **Poor parsing** - Single `$` delimiters are hard to parse reliably
- **Tooling issues** - Many Markdown parsers don't handle `$` well

This project provides a cleaner alternative using explicit, unambiguous syntax.

---

## Package Overview

### Repository Name: `remark-math-inline`

A monorepo publishing **3 npm packages**:

| Package | Purpose | Who uses it |
|---------|---------|-------------|
| `micromark-extension-math-inline` | Tokenizer | Advanced users |
| `mdast-util-math-inline` | AST from/to markdown | Advanced users |
| `remark-math-inline` | Remark plugin wrapper | General remark users |

This follows the same pattern as `remarkjs/remark-math`.

A single-purpose package for inline math:

| Extension | Syntax | Purpose |
|-----------|--------|---------|
| `remark-math-inline` | `:math[E = mc^2]` | Inline math expressions |

### What About Block Math?

**Block math via fenced ` ```math ` blocks is supported by `rehype-katex` / `rehype-mathjax` in many pipelines.** This project verifies and documents that behavior.

The existing `rehype-katex` and `rehype-mathjax` plugins from `remarkjs/remark-math` handle fenced code blocks with `math` language. They look for elements with `language-math` class and render them as display-mode math.

```markdown
```math
E = mc^2
```
```

This works out of the box with:
```js
unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeKatex)  // Already handles ```math blocks!
```

**No additional plugin needed for block math.** We only need to solve inline math.

---

## Package: `remark-math-inline`

### Syntax

```markdown
The formula :math[E = mc^2] shows mass-energy equivalence.

Euler's identity: :math[e^{i\pi} + 1 = 0]
```

### Why This Syntax

- **Explicit delimiters** - No ambiguity with currency or other uses of `$`
- **Directive-style** - Follows emerging `:name[content]` patterns in Markdown
- **Bracket matching** - Clear start/end boundaries
- **Tooling friendly** - Easy to parse, highlight, and transform

### Package Structure

Following the standard remark ecosystem pattern (same as `remarkjs/remark-math`):

```
remark-math-inline/
├── packages/
│   ├── micromark-extension-math-inline/
│   │   ├── src/
│   │   │   ├── syntax.ts      # Tokenizer for :math[...]
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── mdast-util-math-inline/
│   │   ├── src/
│   │   │   ├── from-markdown.ts
│   │   │   ├── to-markdown.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   └── remark-math-inline/
│       ├── src/
│       │   └── index.ts       # Unified plugin wrapper
│       ├── package.json
│       └── README.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json          # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.json
├── LICENSE
└── README.md
```

### AST Node

```typescript
interface InlineMath extends Literal {
  type: 'inlineMath'
  value: string  // The LaTeX content
  data?: {
    hName: 'code'
    hProperties: { className: ['language-math', 'math-inline'] }
  }
}
```

**Package responsibilities:**
- **`mdast-util-math-inline`**: MAY attach `data` fields (or expose an option). Advanced users may want different HTML mapping.
- **`remark-math-inline`**: MUST attach `data` fields. The wrapper guarantees "just works" with `remark-rehype` + `rehype-katex`.

This keeps the low-level utilities flexible while making the main plugin work out of the box.

### Escaping Rules

**Escape sequences:**
- `\]` → literal `]` (does not close the math)
- `\\` → literal `\`
- `\\]` → literal `\` followed by closing `]` (escape `\\` first, then `]` closes)

**Backslash is only special before `]` and `\`:**
- `\a` → literal `\a` (backslash preserved, not an escape)
- `\[` → literal `\[` (backslash preserved)
- `\n` → literal `\n` (LaTeX newline preserved)

This keeps LaTeX content untouched and avoids unwanted escapes.

**Stringify escaping (to-markdown):**
- Always escape `]` as `\]`
- Escape `\` as `\\` only when followed by `]` or `\` (to prevent creating escape sequences on re-parse)
- Example: value `\alpha` → `:math[\alpha]` (no added escaping)
- Example: value `\]` (backslash + bracket) → `:math[\\]]` (escaped backslash, then literal bracket closes)
- Example: value `a]b` → `:math[a\]b]`

**Bracket balancing:**
- Nested `[` and `]` are balanced: `:math[f(x) = [a, b]]` → value is `f(x) = [a, b]`
- Only unbalanced `]` closes the expression
- Escaped brackets `\]` do NOT count toward balancing
- `[` never needs escaping (it only affects balance, never terminates)
- Balance counting starts AFTER the `:math[` opener

**Boundaries:**
- Must start with exact sequence `:math[` (no whitespace: `:math [x]` does NOT parse)
- **Start condition**: `:math[` parses only if at start of document OR the immediately preceding character is NOT an ASCII word character
  - **Definition**: A "word character" means an ASCII letter (A–Z, a–z), digit (0–9), or underscore (_). No Unicode categories.
  - `foo:math[x]` → does NOT parse
  - `mass(:math[x])` → parses
  - `mass :math[x]` → parses
  - `mass—:math[x]` → parses (em-dash is not ASCII word char)
- Cannot span multiple lines (no `\n` or `\r\n` inside)
- Cannot appear inside code spans (code takes precedence in micromark)

**Edge cases to test:**
- `foo:math[x]` → does NOT parse
- `mass(:math[x])` → parses
- `time:math[12:30]` → does NOT parse
- `ratio:math[1:3]` → does NOT parse
- `http://example.com/:math[x]` → test and document actual behavior

### Directive Collision

The `:math[...]` syntax intentionally resembles the directive syntax (`:name[...]`). 

**If `remark-directive` is also used:**
- Our micromark extension should take precedence (register before directive)
- Document this explicitly for users
- Test with `remark-directive` present to ensure no conflicts
- **Add test that fails in wrong order** to document expected behavior

**README example:**
```js
unified()
  .use(remarkMathInline)   // must come before remarkDirective
  .use(remarkDirective)
```

**We do NOT integrate with `remark-directive`** — this is a standalone syntax, not a directive.

---

## Usage

### Install

```bash
npm install remark-math-inline rehype-katex
```

### Usage

```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMathInline from 'remark-math-inline'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'  // From remarkjs/remark-math
import rehypeStringify from 'rehype-stringify'

const processor = unified()
  .use(remarkParse)
  .use(remarkMathInline)   // Adds :math[...] support
  .use(remarkRehype)
  .use(rehypeKatex)        // Renders both inline math AND ```math blocks
  .use(rehypeStringify)

const html = await processor.process(`
# Math Example

Inline: :math[E = mc^2]

Block (already works with rehype-katex):
\`\`\`math
\\int_0^1 x^2 dx = \\frac{1}{3}
\`\`\`
`)
```

---

## Compatibility with `rehype-katex` / `rehype-mathjax`

This plugin is designed to work seamlessly with the existing `remarkjs/remark-math` ecosystem:

- **`rehype-katex`** - Looks for elements with `math-inline` class (inline) or `language-math` class (block)
- **`rehype-mathjax`** - Same behavior

The `remark-math-inline` plugin produces `inlineMath` nodes that `remark-rehype` converts to `<code class="math-inline">`, which `rehype-katex` renders as inline math.

**Note:** We do NOT support `$$...$$` syntax. For block math, use ` ```math ` fenced blocks (which `rehype-katex` already handles via `language-math` class).

**Key insight:** We don't need to fork or modify `rehype-katex`. We just need to produce the right AST nodes, and the existing rendering pipeline handles the rest.

---

## Implementation Phases

### Phase 1: Core Implementation
- [ ] Set up repo structure
- [ ] Implement `micromark-extension-math-inline` (tokenizer for `:math[...]`)
- [ ] Implement `mdast-util-math-inline` (from-markdown + to-markdown)
  - [ ] **Include `data.hName` and `data.hProperties`** for remark-rehype compatibility
  - [ ] `to-markdown`: escape `]` as `\]`, `\` as `\\` only when needed
- [ ] Implement `remark-math-inline` (unified plugin wrapper)
- [ ] Write tests
  - [ ] Escaping: `\]`, `\\`, `\\]`, and non-escapes (`\a`, `\[`, `\n`)
  - [ ] Bracket balancing
  - [ ] Boundary conditions (no whitespace, no newlines)
  - [ ] Code span precedence (`:math[x]` stays literal)
  - [ ] Works inside emphasis, links, etc.
  - [ ] **Round-trip serialization**: parse → stringify → parse gives same value

### Phase 2: Ecosystem Integration
- [ ] **Verify ` ```math ` works without remark-math** in: `remark-parse → remark-rehype → rehype-katex`
- [ ] Test with `rehype-katex` (from remarkjs/remark-math)
- [ ] Test with `rehype-mathjax`
- [ ] Test with `remark-directive` present (precedence check)
  - [ ] Test that wrong order fails (document as expected)
- [ ] **Test with `rehype-sanitize`** (default schema) → confirm math breaks, document fix
- [ ] Test with MDX
  - [ ] Adjacent to JSX: `Hello <X/> :math[x]`
  - [ ] Inside links/definitions
- [ ] Test with popular frameworks (Astro, Next.js, Docusaurus)

### Phase 3: Documentation
- [ ] Write comprehensive README
- [ ] Document escaping rules
- [ ] Document AST format
- [ ] Add examples
- [ ] **Recommended idiom for adjacency**: Use `word(:math[...])` when you want adjacency with no rendered space
- [ ] **Note about sanitizers**: `rehype-sanitize` may strip `className` values; link to schema customization

### Phase 4: Publish
- [ ] Publish to npm
- [ ] Submit to unified collective (optional)
- [ ] Announce / write blog post

---

## Comparison with Existing Solutions

| Feature | `remark-math` | `remark-math-inline` |
|---------|---------------|----------------------|
| Inline syntax | `$...$` | `:math[...]` |
| Block syntax | `$$...$$` | None (use ` ```math `) |
| Currency conflict | Yes | No |
| Parsing reliability | Fragile | Robust |
| CommonMark compatible | No | Yes |
| Directive-style | No | Yes |
| Works with rehype-katex | Yes | Yes (same AST nodes) |

### No `$$` Support — By Design

This plugin intentionally does **not** support `$$...$$` block math syntax. Instead, users should use fenced code blocks:

````markdown
```math
E = mc^2
```
````

**Why?**
- Fenced blocks are valid CommonMark
- Already supported by `rehype-katex` / `rehype-mathjax` (no plugin needed)
- Cleaner, more explicit syntax
- No ambiguity with dollar signs

This means `remark-math-inline` is a **complete replacement** for `remark-math` when combined with ` ```math ` blocks — not an addition to it.

---

## Implementation Notes

### Reusing `remarkjs/remark-math` Infrastructure

The `remark-math-inline` plugin should produce the same `inlineMath` AST node type that `remark-math` produces. This ensures compatibility with:

- `rehype-katex` - Already handles `inlineMath` nodes
- `rehype-mathjax` - Already handles `inlineMath` nodes
- Any other tooling built for the `remark-math` ecosystem

**Reference implementation:** Study `micromark-extension-math` and `mdast-util-math` from `remarkjs/remark-math` for patterns:
- https://github.com/remarkjs/remark-math/tree/main/packages/micromark-extension-math
- https://github.com/remarkjs/remark-math/tree/main/packages/mdast-util-math

### Key Differences from `remark-math`

| Aspect | `remark-math` | `remark-math-inline` |
|--------|---------------|----------------------|
| Tokenizer trigger | `$` character | `:math[` sequence |
| End delimiter | `$` | `]` (with bracket balancing) |
| Escaping | `\$` | `\]` |
| Block math | Included (`$$`) | Not included (use ` ```math `) |

---

## Open Questions

1. **Display mode for inline?**
   - Should `:Math[...]` (capital M) mean display mode?
   - Recommendation: No, use ` ```math ` blocks for display mode

2. **Contribution to remark-math?**
   - Could this be contributed upstream to `remarkjs/remark-math` as an alternative syntax?
   - Worth exploring after initial implementation proves stable


---

## License

MIT
