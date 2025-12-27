# micromark-extension-math-inline

[micromark](https://github.com/micromark/micromark) extension for inline math syntax (`:math[...]`).

## Install

```bash
npm install micromark-extension-math-inline
```

## Usage

```javascript
import { micromark } from 'micromark'
import { mathInline } from 'micromark-extension-math-inline'

const html = micromark(':math[E = mc^2]', {
  extensions: [mathInline()]
})
```

## Tokens

- `mathInline` — The whole construct
- `mathInlineMarker` — The `:math[` opener and `]` closer
- `mathInlineData` — The math content

## Syntax

- Starts with `:math[` (no whitespace allowed)
- Ends with `]` (with bracket balancing)
- Cannot span multiple lines
- Must not be preceded by a word character (a-z, A-Z, 0-9, _)

## Escaping

- `\]` → escaped `]` (doesn't close)
- `\\` → escaped `\`
- `\[` → escaped `[` (doesn't affect bracket depth)

## License

MIT
