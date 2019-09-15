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
    this.set('class', new Token('KW_CLASS', 'class'))
    this.set('end', new Token('KW_END', 'end'))
    this.set('def', new Token('KW_DEF', 'def'))
    this.set('defstatic', new Token('KW_DEFSTATIC', 'defstatic'))
    this.set('return', new Token('KW_RETURN', 'return'))
    this.set('main', new Token('KW_MAIN', 'main'))
    this.set('void', new Token('KW_VOID', 'void'))
    this.set('String', new Token('KW_STRING', 'String'))
    this.set('bool', new Token('KW_BOOL', 'bool'))
    this.set('integer', new Token('KW_INTEGER', 'integer'))
    this.set('double', new Token('KW_DOUBLE', 'double'))
    this.set('true', new Token('KW_TRUE', 'true'))
    this.set('false', new Token('KW_FALSE', 'false'))
    this.set('if', new Token('KW_IF', 'if'))
    this.set('else', new Token('KW_ELSE', 'else'))
    this.set('or', new Token('KW_OR', 'or'))
    this.set('and', new Token('KW_AND', 'and'))
    this.set('while', new Token('KW_WHILE', 'while'))
    this.set('write', new Token('KW_WRITE', 'write'))
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
}
