import type { Options } from 'mdast-util-to-markdown'
import type { InlineMath } from './from-markdown.js'

export function mathInlineToMarkdown(): Options {
  return {
    handlers: {
      // @ts-expect-error: inlineMath is a custom node type
      inlineMath: handleInlineMath
    },
    unsafe: [
      {
        character: ':',
        after: 'math\\[',
        inConstruct: ['phrasing']
      }
    ]
  }
}

function handleInlineMath(node: InlineMath): string {
  return ':math[' + escapeValue(node.value) + ']'
}

function escapeValue(value: string): string {
  // Pre-count ] to know how many we have for balancing
  let remainingClose = 0
  for (const char of value) {
    if (char === ']') remainingClose++
  }
  
  let result = ''
  let bracketDepth = 0
  
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    
    if (char === '[') {
      // Escape if there aren't enough remaining ] to balance
      if (bracketDepth >= remainingClose) {
        result += '\\['
      } else {
        bracketDepth++
        result += char
      }
    } else if (char === ']') {
      remainingClose--
      if (bracketDepth > 0) {
        // Balanced bracket, no escape needed
        bracketDepth--
        result += char
      } else {
        // Unbalanced, must escape
        result += '\\]'
      }
    } else if (char === '\\') {
      // Escape backslash if followed by ] or \ or [ (to prevent creating escape sequences)
      const next = value[i + 1]
      if (next === ']' || next === '\\' || next === '[') {
        result += '\\\\'
      } else {
        result += '\\'
      }
    } else {
      result += char
    }
  }
  return result
}
