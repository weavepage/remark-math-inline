import type {
  Construct,
  Effects,
  Extension,
  State,
  TokenizeContext,
  Code
} from 'micromark-util-types'

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    mathInline: 'mathInline'
    mathInlineMarker: 'mathInlineMarker'
    mathInlineData: 'mathInlineData'
  }
}

const mathInlineConstruct: Construct = {
  name: 'mathInline',
  tokenize: tokenizeMathInline,
  previous: previousMathInline
}

function previousMathInline(this: TokenizeContext, code: Code): boolean {
  // :math[ must not be preceded by an ASCII word character (a-z, A-Z, 0-9, _)
  if (code === null) return true // start of document
  if (
    (code >= 97 && code <= 122) || // a-z
    (code >= 65 && code <= 90) ||  // A-Z
    (code >= 48 && code <= 57) ||  // 0-9
    code === 95                     // _
  ) {
    return false
  }
  return true
}

function tokenizeMathInline(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  let bracketDepth = 0

  return start

  function start(code: Code): State | undefined {
    // Must start with ':'
    if (code !== 58) return nok(code) // :
    effects.enter('mathInline')
    effects.enter('mathInlineMarker')
    effects.consume(code)
    return colonConsumed
  }

  function colonConsumed(code: Code): State | undefined {
    if (code !== 109) return nok(code) // m
    effects.consume(code)
    return m
  }

  function m(code: Code): State | undefined {
    if (code !== 97) return nok(code) // a
    effects.consume(code)
    return ma
  }

  function ma(code: Code): State | undefined {
    if (code !== 116) return nok(code) // t
    effects.consume(code)
    return mat
  }

  function mat(code: Code): State | undefined {
    if (code !== 104) return nok(code) // h
    effects.consume(code)
    return math
  }

  function math(code: Code): State | undefined {
    if (code !== 91) return nok(code) // [
    effects.consume(code)
    effects.exit('mathInlineMarker')
    effects.enter('mathInlineData')
    return inside
  }

  function inside(code: Code): State | undefined {
    // Cannot span lines
    if (code === null || code === -5 || code === -4 || code === -3 || code === 10 || code === 13) {
      return nok(code)
    }

    // Backslash - potential escape
    if (code === 92) { // \
      effects.consume(code)
      return insideAfterBackslash
    }

    // Opening bracket - increase depth
    if (code === 91) { // [
      bracketDepth++
      effects.consume(code)
      return inside
    }

    // Closing bracket
    if (code === 93) { // ]
      if (bracketDepth > 0) {
        bracketDepth--
        effects.consume(code)
        return inside
      }
      // End of math
      effects.exit('mathInlineData')
      effects.enter('mathInlineMarker')
      effects.consume(code)
      effects.exit('mathInlineMarker')
      effects.exit('mathInline')
      return ok
    }

    effects.consume(code)
    return inside
  }

  function insideAfterBackslash(code: Code): State | undefined {
    // Cannot span lines
    if (code === null || code === -5 || code === -4 || code === -3 || code === 10 || code === 13) {
      return nok(code)
    }

    // The backslash was already consumed.
    // If this char is ] or \, it's escaped - consume and go back to inside
    // If this char is [, consume it WITHOUT incrementing bracket depth
    // Otherwise, go back to inside to handle normally
    
    if (code === 93 || code === 92 || code === 91) { // ] or \ or [ - consume without special handling
      effects.consume(code)
      return inside
    }

    // Not a special char - go back to inside to handle this char normally
    // (the backslash is already consumed as literal)
    return inside(code)
  }
}

export function mathInline(): Extension {
  return {
    text: {
      58: mathInlineConstruct // :
    }
  }
}

export { mathInlineConstruct }
