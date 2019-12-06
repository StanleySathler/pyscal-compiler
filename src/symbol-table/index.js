const Token = require('../token')

module.exports = class SymbolTable {
  constructor() {
    /* The symbols */
    this.__symbols = {}

    this.__populateWithKeywords()
  }

  /**
   * Populate the initial Symbol Table with all the
   * keywords.
   */
  __populateWithKeywords() {
    this.set('class', new Token('KW_CLASS', 'class', 0, 0))
    this.set('end', new Token('KW_END', 'end', 0, 0))
    this.set('def', new Token('KW_DEF', 'def', 0, 0))
    this.set('defstatic', new Token('KW_DEFSTATIC', 'defstatic', 0, 0))
    this.set('return', new Token('KW_RETURN', 'return', 0, 0))
    this.set('main', new Token('KW_MAIN', 'main', 0, 0))
    this.set('void', new Token('KW_VOID', 'void', 0, 0))
    this.set('String', new Token('KW_STRING', 'String', 0, 0))
    this.set('bool', new Token('KW_BOOL', 'bool', 0, 0))
    this.set('integer', new Token('KW_INTEGER', 'integer', 0, 0))
    this.set('double', new Token('KW_DOUBLE', 'double', 0, 0))
    this.set('true', new Token('KW_TRUE', 'true', 0, 0))
    this.set('false', new Token('KW_FALSE', 'false', 0, 0))
    this.set('if', new Token('KW_IF', 'if', 0, 0))
    this.set('else', new Token('KW_ELSE', 'else', 0, 0))
    this.set('or', new Token('KW_OR', 'or', 0, 0))
    this.set('and', new Token('KW_AND', 'and', 0, 0))
    this.set('while', new Token('KW_WHILE', 'while', 0, 0))
    this.set('write', new Token('KW_WRITE', 'write', 0, 0))
  }

  /**
   * Add a new token to the Symbol Table if it doesn't
   * exist yet. Otherwise, update the existent one.
   *
   * @param {*} lexem The token's lexem.
   * @param {*} token The token itself.
   */
  set(lexem, token) {
    this.__symbols[lexem] = token
  }

  /**
   * Get a previously added token by its lexem.
   *
   * @param {*} lexem The token's lexem.
   */
  get(lexem) {
    return this.__symbols[lexem]
  }

  /**
   * Check if lexem was already inserted into the table.
   *
   * @param {*} lexem
   */
  has(lexem) {
    return (this.__symbols[lexem] !== undefined)
  }

  /**
   * Update the property type of the given token.
   */
  updateTokenType(token, type) {
    const lexem = token.getValue()
    this.get(lexem).setType(type)
  }

  /**
   * Get all symbols.
   */
  getSymbols() {
    return this.__symbols
  }
}
