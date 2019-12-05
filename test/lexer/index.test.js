const path = require('path')
const FileReader = require('../../src/reader')
const Lexer = require('../../src/lexer')
const Token = require('../../src/token')
const TOKEN_NAMES = require('../../src/token/names')

describe('Given a Lexer', () => {
  describe('and it reads a valid code sample', () => {
    let filePath
    let fileReader
    let lexer
    const tokens = []

    beforeEach(() => {
      filePath = path.resolve(__dirname, '../mocks/code-sample-01.pys')
      fileReader = new FileReader(filePath)
      lexer = new Lexer(fileReader)

      while (lexer.getFileReader().hasNextChar())
        tokens.push(lexer.nextToken())
    })

    it('should generate the correct tokens', () => {
      const expected = [
        new Token(TOKEN_NAMES.KW_CLASS, 'class', 0, 0),
        new Token(TOKEN_NAMES.ID, 'CodeSample01', 4, 19),
        new Token(TOKEN_NAMES.COLON, ':', 4, 20),

        new Token(TOKEN_NAMES.KW_DEFSTATIC, 'defstatic', 0, 0),
        new Token(TOKEN_NAMES.KW_VOID, 'void', 0, 0),
        new Token(TOKEN_NAMES.KW_MAIN, 'main', 0, 0),
        new Token(TOKEN_NAMES.OPN_RND_BRACKET, '(', 5, 23),
        new Token(TOKEN_NAMES.KW_STRING, 'String', 0, 0),
        new Token(TOKEN_NAMES.OPN_BRACKET, '[', 5, 30),
        new Token(TOKEN_NAMES.CLS_BRACKET, ']', 5, 31),
        new Token(TOKEN_NAMES.ID, 'args', 5, 36),
        new Token(TOKEN_NAMES.CLS_RND_BRACKET, ')', 5, 37),
        new Token(TOKEN_NAMES.COLON, ':', 5, 38),

        new Token(TOKEN_NAMES.KW_DOUBLE, 'double', 0, 0),
        new Token(TOKEN_NAMES.ID, 'age', 6, 15),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 6, 16),

        new Token(TOKEN_NAMES.KW_DOUBLE, 'double', 0, 0),
        new Token(TOKEN_NAMES.ID, 'points', 7, 18),
        new Token(TOKEN_NAMES.OP_ASG, '=', 7, 20),
        new Token(TOKEN_NAMES.OP_NGT, '-', 7, 22),
        new Token(TOKEN_NAMES.CONST_INT, '4', 7, 23),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 7, 24),

        new Token(TOKEN_NAMES.KW_IF, 'if', 0, 0),
        new Token(TOKEN_NAMES.OPN_RND_BRACKET, '(', 9, 9),
        new Token(TOKEN_NAMES.ID, 'age', 6, 15),
        new Token(TOKEN_NAMES.OP_EQ, '==', 9, 15),
        new Token(TOKEN_NAMES.CONST_DBL, '8.8', 9, 19),
        new Token(TOKEN_NAMES.CLS_RND_BRACKET, ')', 9, 20),
        new Token(TOKEN_NAMES.COLON, ':', 9, 21),

        new Token(TOKEN_NAMES.ID, 'hello', 10, 12),
        new Token(TOKEN_NAMES.OPN_RND_BRACKET, '(', 10, 13),
        new Token(TOKEN_NAMES.CONST_STR, 'Compiler', 10, 23),
        new Token(TOKEN_NAMES.COMMA, ',', 10, 24),
        new Token(TOKEN_NAMES.ID, 'age', 6, 15),
        new Token(TOKEN_NAMES.CLS_RND_BRACKET, ')', 10, 29),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 10, 30),

        new Token(TOKEN_NAMES.ID, 'hola', 11, 11),
        new Token(TOKEN_NAMES.OPN_RND_BRACKET, '(', 11, 12),
        new Token(TOKEN_NAMES.CLS_RND_BRACKET, ')', 11, 15),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 11, 16),

        new Token(TOKEN_NAMES.KW_END, 'end', 0, 0),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 12, 9),

        new Token(TOKEN_NAMES.KW_END, 'end', 0, 0),
        new Token(TOKEN_NAMES.SEMI_COLON, ';', 13, 7),

        new Token(TOKEN_NAMES.KW_END, 'end', 0, 0),
        new Token(TOKEN_NAMES.DOT, '.', 14, 5),

        new Token(TOKEN_NAMES.EOF, 'EOF', 15, 1)
      ]

      expect(tokens).toEqual(expected)
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
      expect(tableSymbol.get('hello').toString()).toEqual('<ID, hello, 10, 12>')
      expect(tableSymbol.get('end').toString()).toEqual('<KW_END, end, 0, 0>')
    })

    it('should correctly count the lines', () => {
      expect(lexer.getLine()).toEqual(15)
    })
  })

  describe('and it reads an invalid code sample', () => {
    let filePath
    let fileReader
    let lexer
    const tokens = []

    beforeEach(() => {
      filePath = path.resolve(__dirname, '../mocks/invalid-code-sample-01.pys')
      fileReader = new FileReader(filePath)
      lexer = new Lexer(fileReader)

      while (lexer.getFileReader().hasNextChar())
        tokens.push(lexer.nextToken())
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
      expect(tokens[14].toString()).toEqual(`<${TOKEN_NAMES.CONST_DBL}, 8.2, 5, 23>`)
    })
  })
})
