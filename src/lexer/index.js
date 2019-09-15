const Token = require('../token')
const SymbolTable = require('../symbol-table')
const TOKEN_NAMES = require('../token/names')
const { isLetter, isNumber } = require('../utils')

const INITIAL_STATE = 0

module.exports = class Lexer {
  constructor(fileReader) {
    /* The source code file */
    this.__fileReader = fileReader

    /* The symbol table */
    this.__symbolTable = new SymbolTable()

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
          this.setState(6)
        }

        else if (char === '>') {
          this.setState(9)
        }

        else if (char === '=') {
          this.setState(12)
        }

        else if (char === '!') {
          this.setState(14)
        }

        else if (char === '/') {
          this.addToken(new Token('OP_DIV', '/'))
        }

        else if (char === '*') {
          this.addToken(new Token('OP_MULT', '*'))
        }

        else if (char === '-') {
          this.addToken(new Token('OP_SUB', '-'))
        }

        else if (char === '+') {
          this.addToken(new Token('OP_SUM', '+'))
        }

        else if (char === '(') {
          this.addToken(new Token(TOKEN_NAMES.openRoundBrackets, char))
        }

        else if (char === ')') {
          this.addToken(new Token(TOKEN_NAMES.closeRoundBrackets, char))
        }

        else if (char === ',') {
          this.addToken(new Token('COMMA', ','))
        }

        else if (char === ';') {
          this.addToken(new Token('SEMI_COLLON', ';'))
        }

        else if (char === ':') {
          this.addToken(new Token('COLLON', ':'))
        }

        else if (char === '"') {
          this.setState(32)
        }

        else if (isNumber(char)) {
          this.setState(27)
          this.appendToLexem(char)
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
          const lexem = this.getLexem()
          const token = new Token(TOKEN_NAMES.id, lexem)
          this.addToken(token)
          this.resetLexem()
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()

          if (!this.getSymbolTable().has(lexem)) {
            this.getSymbolTable().set(lexem, token)
          }
        }
      }

      /* State: 6 */
      else if (this.isState(6)) {
        if (char === '=') {
          this.addToken(new Token(TOKEN_NAMES.lessThanOrEqual, '<='))
          this.resetState()
        }

        else {
          this.addToken(new Token(TOKEN_NAMES.lessThan, '<'))
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }

      /* State: 9 */
      else if (this.isState(9)) {
        if (char === '=') {
          this.addToken(new Token(TOKEN_NAMES.OP_GE, '>='))
          this.resetState()
        }

        else {
          this.addToken(new Token(TOKEN_NAMES.OP_GT, '>'))
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }

      /* State: 12 */
      else if (this.isState(12)) {
        if (char === '=') {
          this.addToken(new Token(TOKEN_NAMES.OP_EQ, '=='))
          this.resetState()
        }

        else {
          this.addToken(new Token(TOKEN_NAMES.OP_ASG, '='))
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }

      /* State: 14 */
      else if (this.isState(14)) {
        if (char === '=') {
          this.addToken(new Token(TOKEN_NAMES.OP_NE, '!='))
          this.resetState()
        }

        else {
          this.addToken(new Token(TOKEN_NAMES.OP_NGT, '!'))
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }

      /* State: 27 */
      else if (this.isState(27)) {
        if (isNumber(char)) {
          this.appendToLexem(char)
          continue
        }

        else if (char === '.') {
          this.appendToLexem(char)
          this.setState(29)
        }

        else {
          this.addToken(new Token('CONST_INT', this.getLexem()))
          this.resetLexem()
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }

      /* State: 29 */
      else if (this.isState(29)) {
        if (isNumber(char)) {
          this.appendToLexem(char)
          this.setState(30)
        }

        else {
          // Should throw lexical error
        }
      }

      /* State: 30 */
      else if (this.isState(30)) {
        if (isNumber(char)) {
          this.appendToLexem(char)
        }

        else {
          this.addToken(new Token(TOKEN_NAMES.CONST_DBL, this.getLexem()))
          this.resetLexem()
          this.resetState()
          this.getFileReader().setCursorToPreviousPosition()
        }
      }

      /* State: 32 */
      else if (this.isState(32)) {
        if (char === '"') {
          this.addToken(new Token(TOKEN_NAMES.CONST_STR, this.getLexem()))
          this.resetLexem()
          this.resetState()
        }

        else {
          this.appendToLexem(char)
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

  /**
   * Get the symbol table instance.
   */
  getSymbolTable() {
    return this.__symbolTable
  }
}
