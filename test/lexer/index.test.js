const path = require('path')
const FileReader = require('../../src/reader')
const Lexer = require('../../src/lexer')
const Token = require('../../src/token')
const TOKEN_NAMES = require('../../src/token/names')

describe('Given a Lexer', () => {
  describe('and it reads a valid code sample', () => {
    let filePath, fileReader, lexer

    beforeEach(() => {
      filePath = path.resolve(__dirname, '../mocks/code-sample-01.pys')
      fileReader = new FileReader(filePath)
      lexer = new Lexer(fileReader)
      lexer.run()
    })

    it('should generate the correct tokens', () => {
      const actual = lexer.getTokens()
      const expected = [
        new Token(TOKEN_NAMES.ID, 'class', 4, 6),
        new Token(TOKEN_NAMES.ID, 'CodeSample01', 4, 19),
        new Token(TOKEN_NAMES.COLON, ':', 4, 20),

        new Token(TOKEN_NAMES.ID, 'defstatic', 5, 12),
        new Token(TOKEN_NAMES.ID, 'void', 5, 17),
        new Token(TOKEN_NAMES.ID, 'main', 5, 22),
        new Token(TOKEN_NAMES.OPN_RND_BRACKET, '(', 5, 23),
        new Token(TOKEN_NAMES.ID, 'String', 5, 29),
        new Token(TOKEN_NAMES.OPN_BRACKET, '[', 5, 30),
        new Token(TOKEN_NAMES.CLS_BRACKET, ']', 5, 31),
        new Token(TOKEN_NAMES.ID, 'args', 5, 36),
        new Token(TOKEN_NAMES.CLS_RND_BRACKET, ')', 5, 37),
        new Token(TOKEN_NAMES.COLON, ':', 5, 38),

        new Token(TOKEN_NAMES.ID, 'double', 6, 11),
        new Token(TOKEN_NAMES.ID, 'age', 6, 15),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 6, 16),

        new Token(TOKEN_NAMES.ID, 'if', 8, 7),
        new Token(TOKEN_NAMES.OPN_RND_BRACKET, '(', 8, 9),
        new Token(TOKEN_NAMES.ID, 'age', 8, 12),
        new Token(TOKEN_NAMES.OP_EQ, '==', 8, 15),
        new Token(TOKEN_NAMES.CONST_DBL, '8.8', 8, 19),
        new Token(TOKEN_NAMES.CLS_RND_BRACKET, ')', 8, 20),
        new Token(TOKEN_NAMES.COLON, ':', 8, 21),

        new Token(TOKEN_NAMES.ID, 'hello', 9, 12),
        new Token(TOKEN_NAMES.OPN_RND_BRACKET, '(', 9, 13),
        new Token(TOKEN_NAMES.CONST_STR, 'Compiler', 9, 23),
        new Token(TOKEN_NAMES.COMMA, ',', 9, 24),
        new Token(TOKEN_NAMES.ID, 'age', 9, 28),
        new Token(TOKEN_NAMES.CLS_RND_BRACKET, ')', 9, 29),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 9, 30),

        new Token(TOKEN_NAMES.ID, 'end', 10, 8),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 10, 9),

        new Token(TOKEN_NAMES.ID, 'end', 11, 6),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 11, 7),

        new Token(TOKEN_NAMES.ID, 'end', 12, 4),
        new Token(TOKEN_NAMES.DOT, '.', 12, 5),

        new Token(TOKEN_NAMES.EOF, 'EOF', 13, 1)
      ]

      expect(actual).toEqual(expected)
    })

    it('should add the identifiers to the symbol table', () => {
      const tableSymbol = lexer.getSymbolTable()
      expect(tableSymbol.get('class').toString()).toEqual('<KW_CLASS, class, 0, 0>')
      expect(tableSymbol.get('CodeSample01').toString()).toEqual('<ID, CodeSample01, 4, 19>')
      expect(tableSymbol.get('defstatic').toString()).toEqual('<KW_DEFSTATIC, defstatic, 0, 0>')
      expect(tableSymbol.get('void').toString()).toEqual('<KW_VOID, void, 0, 0>')
      expect(tableSymbol.get('main').toString()).toEqual('<KW_MAIN, main, 0, 0>')
      expect(tableSymbol.get('String').toString()).toEqual('<KW_STRING, String, 0, 0>')
      expect(tableSymbol.get('args').toString()).toEqual('<ID, args, 5, 36>')
      expect(tableSymbol.get('double').toString()).toEqual('<KW_DOUBLE, double, 0, 0>')
      expect(tableSymbol.get('age').toString()).toEqual('<ID, age, 6, 15>')
      expect(tableSymbol.get('if').toString()).toEqual('<KW_IF, if, 0, 0>')
      expect(tableSymbol.get('hello').toString()).toEqual('<ID, hello, 9, 12>')
      expect(tableSymbol.get('end').toString()).toEqual('<KW_END, end, 0, 0>')
    })

    it('should correctly count the lines', () => {
      expect(lexer.getLine()).toEqual(13)
    })
  })

  describe('and it reads an invalid code sample', () => {
    let filePath, fileReader, lexer

    beforeEach(() => {
      filePath = path.resolve(__dirname, '../mocks/invalid-code-sample-01.pys')
      fileReader = new FileReader(filePath)
      lexer = new Lexer(fileReader)
      lexer.run()
    })

    it('should catch the first lexical error', () => {
      const expectedMessage = "[5:21] Lexical error: unexpected 'l'"
      expect(lexer.getErrors()[0]).toEqual(expectedMessage)
    })

    it('(panic mode) should identify the unexpected chars', () => {
      const expectedMessages = [
        "[5:21] Lexical error: unexpected 'l'",
        "[5:22] Lexical error: unexpected '@'"
      ]

      expect(lexer.getErrors()[0]).toEqual(expectedMessages[0])
      expect(lexer.getErrors()[1]).toEqual(expectedMessages[1])
    })

    it('(panic mode) should build the correct lexem', () => {
      const tokens = lexer.getTokens()
      expect(tokens[14].toString()).toEqual(`<${TOKEN_NAMES.CONST_DBL}, 8.2, 5, 23>`)
    })
  })
})
