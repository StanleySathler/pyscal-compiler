const Token = require('../token')
const TOKEN_NAMES = require('../token/names')
const { isLetter, isNumber } = require('../utils')

const INITIAL_STATE = 0

module.exports = class Lexer {
  constructor(fileReader) {
    /* The source code file */
    this.__fileReader = fileReader

    /* Automata's current state */
    this.__state = INITIAL_STATE

    /* Current line */
    this.__line = 0

    /* Current column */
    this.__column = 0

    /* Current lexem */
    this.__lexem = ''

    /* Found tokens */
    this.__tokens = []
  }

  /**
   * Run the Lexer phase.
   */
  run() {
    let char = ''

    while (this.getFileReader().hasNextChar()) {
      char = this.getFileReader().readNextChar()

      /* State: initial */
      if (this.isState(INITIAL_STATE)) {
        if (char === '[') {
          this.addToken(new Token(TOKEN_NAMES.openBracket, char))
        }

        else if (char === ']') {
          this.addToken(new Token(TOKEN_NAMES.closeBracket, char))
        }

        else if (char === '.') {
          this.addToken(new Token(TOKEN_NAMES.dot, char))
        }

        else if (char === '<') {
          this.appendToLexem(char)
          this.setState(6)
        }

        else if (char === '>') {
          this.appendToLexem(char)
          this.setState(9)
        }

        else if (char === ':') {
          this.addToken(new Token(TOKEN_NAMES.collon, char))
        }

        else if (char === '(') {
          this.addToken(new Token(TOKEN_NAMES.openRoundBrackets, char))
        }

        else if (char === ')') {
          this.addToken(new Token(TOKEN_NAMES.closeRoundBrackets, char))
        }

        else if (char === ';') {
          this.addToken(new Token(TOKEN_NAMES.semiCollon, char))
        }

        else if (isLetter(char)) {
          this.appendToLexem(char)
          this.setState(4)
        }
      }

      /* State: 4 */
      else if (this.isState(4)) {
        if (isLetter(char) || isNumber(char) || char === '_') {
          this.appendToLexem(char)
        }

        else {
          this.addToken(new Token(TOKEN_NAMES.id, this.getLexem()))
          this.resetLexem()
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }

      /* State: 6 */
      else if (this.isState(6)) {
        if (char === '=') {
          const lexem = this.getLexem()
          this.addToken(new Token(TOKEN_NAMES.lessThanOrEqual, `${lexem}${char}`))
          this.resetLexem()
          this.resetState()
        }

        else {
          this.addToken(new Token(TOKEN_NAMES.lessThan, this.getLexem()))
          this.resetLexem()
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }

      /* State: 9 */
      else if (this.isState(9)) {
        if (char === '=') {
          this.addToken(new Token(TOKEN_NAMES.OP_GE, '>='))
          this.resetLexem()
          this.resetState()
        }

        else {
          this.addToken(new Token(TOKEN_NAMES.OP_GT, '>'))
          this.resetLexem()
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }
    }
  }

  /**
   * Reset the current automata's state to 1 (initial one).
   */
  resetState() {
    this.setState(INITIAL_STATE)
  }

  /**
   * Set the current automata's state.
   *
   * @param {*} state the new automata's state.
   */
  setState(state) {
    this.__state = state
  }

  /**
   * Check if the given state is the current one.
   *
   * @param {*} state
   */
  isState(state) {
    return this.__state === state
  }

  /**
   * Increment by one the current line.
   */
  incrementLine() {
    this.__line++
  }

  /**
   * Increment the current column.
   */
  incrementColumn() {
    this.__column++
  }

  /**
   * Reset the current column to 0.
   */
  resetColumn() {
    this.__column = 0
  }

  /**
   * Append the given char to the lexem.
   *
   * @param {*} char the char that must be appended.
   */
  appendToLexem(char) {
    this.__lexem += char
  }

  /**
   * Get the current lexem.
   */
  getLexem() {
    return this.__lexem
  }

  /**
   * Reset (erase) the current lexem.
   */
  resetLexem() {
    this.__lexem = ''
  }

  /**
   * Push a new token into the tokens list.
   *
   * @param {*} token the token that must be added
   */
  addToken(token) {
    this.__tokens.push(token)
  }

  /**
   * Get all registered tokens.
   */
  getTokens() {
    return this.__tokens
  }

  /**
   * Get the file reader instance.
   */
  getFileReader() {
    return this.__fileReader
  }
}
