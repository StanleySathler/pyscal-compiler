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
    this.__line = 1

    /* Current column */
    this.__column = 1

    /* Current lexem */
    this.__lexem = ''

    /* Found tokens */
    this.__tokens = []

    /* Error messages */
    this.__errors = []
  }

  /**
   * Get the next token.
   */
  nextToken() {
    let char = ''

    while (this.getFileReader().hasNextChar()) {
      char = this.getFileReader().readNextChar()
      this.incrementColumn()

      /* State: initial */
      if (this.isState(INITIAL_STATE)) {
        if (char === ' ' || char === '\t')
          continue

        else if (char === '\n') {
          this.incrementLine()
          this.resetColumn()
          continue
        }

        else if (char === '[') {
          return this.addToken(TOKEN_NAMES.OPN_BRACKET, '[')
        }

        else if (char === ']') {
          return this.addToken(TOKEN_NAMES.CLS_BRACKET, ']')
        }

        else if (char === '.') {
          return this.addToken(TOKEN_NAMES.DOT, '.')
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
          return this.addToken('OP_DIV', '/')
        }

        else if (char === '*') {
          return this.addToken('OP_MULT', '*')
        }

        else if (char === '-') {
          const lastTokenName = this.lastToken().getName()

          if (
            lastTokenName === TOKEN_NAMES.CONST_INT ||
            lastTokenName === TOKEN_NAMES.CONST_DBL ||
            lastTokenName === TOKEN_NAMES.ID ||
            lastTokenName === TOKEN_NAMES.CLS_RND_BRACKET
          ) {
            return this.addToken('OP_SUB', '-')
          }

          return this.addToken(TOKEN_NAMES.OP_NGT, '-')
        }

        else if (char === '+') {
          return this.addToken('OP_SUM', '+')
        }

        else if (char === '(') {
          return this.addToken(TOKEN_NAMES.OPN_RND_BRACKET, '(')
        }

        else if (char === ')') {
          return this.addToken(TOKEN_NAMES.CLS_RND_BRACKET, ')')
        }

        else if (char === ',') {
          return this.addToken('COMMA', ',')
        }

        else if (char === ';') {
          return this.addToken('SEMI_COLON', ';')
        }

        else if (char === ':') {
          return this.addToken('COLON', ':')
        }

        else if (char === '"') {
          this.setState(32)
        }

        else if (char === '#') {
          this.setState(34)
        }

        else if (isNumber(char)) {
          this.setState(27)
          this.appendToLexem(char)
        }

        else if (isLetter(char)) {
          this.appendToLexem(char)
          this.setState(4)
        }

        else {
          this.addError(`Lexical error: unexpected '${char}'`)
        }
      }

      /* State: 4 */
      else if (this.isState(4)) {
        if (isLetter(char) || isNumber(char) || char === '_') {
          this.appendToLexem(char)
        }

        else {
          const lexem = this.getLexem()
          this.resetLexem()
          this.resetState()
          this.backCursor()

          let token = this.getSymbolTable().get(lexem)

          /* Not added to the Symbol Table yet */
          if (!token) {
            token = this.addToken(TOKEN_NAMES.ID, lexem)
            this.getSymbolTable().set(lexem, token)
          }

          return token
        }
      }

      /* State: 6 */
      else if (this.isState(6)) {
        if (char === '=') {
          this.resetState()
          return this.addToken(TOKEN_NAMES.OP_LTE, '<=')
        }

        else {
          this.resetState()
          this.backCursor()
          return this.addToken(TOKEN_NAMES.OP_LT, '<')
        }
      }

      /* State: 9 */
      else if (this.isState(9)) {
        if (char === '=') {
          this.resetState()
          return this.addToken(TOKEN_NAMES.OP_GE, '>=')
        }

        else {
          this.resetState()
          this.backCursor()
          return this.addToken(TOKEN_NAMES.OP_GT, '>')
        }
      }

      /* State: 12 */
      else if (this.isState(12)) {
        if (char === '=') {
          this.resetState()
          return this.addToken(TOKEN_NAMES.OP_EQ, '==')
        }

        else {
          this.resetState()
          this.backCursor()
          return this.addToken(TOKEN_NAMES.OP_ASG, '=')
        }
      }

      /* State: 14 */
      else if (this.isState(14)) {
        if (char === '=') {
          this.resetState()
          return this.addToken(TOKEN_NAMES.OP_NE, '!=')
        }

        else {
          this.resetState()
          this.backCursor()
          return this.addToken(TOKEN_NAMES.OP_NOT, '!')
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
          const lexem = this.getLexem()
          this.resetState()
          this.backCursor()
          this.resetLexem()
          return this.addToken('CONST_INT', lexem)
        }
      }

      /* State: 29 */
      else if (this.isState(29)) {
        if (isNumber(char)) {
          this.appendToLexem(char)
          this.setState(30)
        }

        else {
          this.addError(`Lexical error: unexpected '${char}'`)
        }
      }

      /* State: 30 */
      else if (this.isState(30)) {
        if (isNumber(char)) {
          this.appendToLexem(char)
        }

        else {
          const lexem = this.getLexem()
          this.resetState()
          this.backCursor()
          this.resetLexem()
          return this.addToken(TOKEN_NAMES.CONST_DBL, lexem)
        }
      }

      /* State: 32 */
      else if (this.isState(32)) {
        if (char === '\n' || !this.getFileReader().hasNextChar()) {
          this.addError(`Lexical error: string not properly closed`)
        }

        else if (char === '"') {
          const lexem = this.getLexem()
          this.resetState()
          this.resetLexem()

          /* Empty strings shouldn't be considered tokens */
          if (lexem.length)
            return this.addToken(TOKEN_NAMES.CONST_STR, lexem)
        }

        else {
          this.appendToLexem(char)
        }
      }

      /* State: 34 */
      else if (this.isState(34)) {
        if (char === '\n') {
          this.resetState()
        }
      }

      else {
        this.addError(`Lexical error: unexpected '${char}'`)
      }

      if (char === '\n') {
        this.incrementLine()
        this.resetColumn()
      }
    }

    return this.addToken(TOKEN_NAMES.EOF, 'EOF')
  }

  /**
   * Back the cursor to one position behind.
   */
  backCursor() {
    this.getFileReader().setCursorToPreviousPosition()
    this.decrementColumn()
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
   * Get the current line.
   */
  getLine() {
    return this.__line
  }

  /**
   * Get the current column.
   */
  getColumn() {
    return this.__column
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
   * Decrement the current column.
   */
  decrementColumn() {
    this.__column--
  }

  /**
   * Reset the current column to 0.
   */
  resetColumn() {
    this.__column = 1
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
   * @returns {Token} the generated token
   */
  addToken(name, lexem) {
    const token = new Token(name, lexem, this.getLine(), this.getColumn())
    this.__tokens.push(token)
    return token
  }

  /**
   * Get all registered tokens.
   */
  getTokens() {
    return this.__tokens
  }

  /**
   * Get the last token.
   */
  lastToken() {
    return this.__tokens[this.__tokens.length - 1]
  }

  /**
   * Add an error message.
   *
   * @param {*} error The error message
   */
  addError(error) {
    if (this.__errors.length === 5)
      throw new Error('Maximum error limit reached!')

    const line = this.getLine()
    const column = this.getColumn()
    const message = `[${line}:${column}] ${error}`

    this.__errors.push(message)
  }

  /**
   * Get the registered errors.
   */
  getErrors() {
    return this.__errors
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
