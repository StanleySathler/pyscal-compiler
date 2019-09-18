const path = require('path')
const FileReader = require('../../src/reader')
const Lexer = require('../../src/lexer')
const Token = require('../../src/token')
const TOKEN_NAMES = require('../../src/token/names')

describe('Given a Lexer', () => {
  describe('and it reads a code sample', () => {
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
        new Token(TOKEN_NAMES.id, 'class'),
        new Token(TOKEN_NAMES.id, 'CodeSample01'),
        new Token(TOKEN_NAMES.collon, ':'),

        new Token(TOKEN_NAMES.id, 'defstatic'),
        new Token(TOKEN_NAMES.id, 'void'),
        new Token(TOKEN_NAMES.id, 'main'),
        new Token(TOKEN_NAMES.openRoundBrackets, '('),
        new Token(TOKEN_NAMES.id, 'String'),
        new Token(TOKEN_NAMES.openBracket, '['),
        new Token(TOKEN_NAMES.closeBracket, ']'),
        new Token(TOKEN_NAMES.id, 'args'),
        new Token(TOKEN_NAMES.closeRoundBrackets, ')'),
        new Token(TOKEN_NAMES.collon, ':'),

        new Token(TOKEN_NAMES.id, 'double'),
        new Token(TOKEN_NAMES.id, 'age'),
        new Token(TOKEN_NAMES.semiCollon, ';'),

        new Token(TOKEN_NAMES.id, 'if'),
        new Token(TOKEN_NAMES.openRoundBrackets, '('),
        new Token(TOKEN_NAMES.id, 'age'),
        new Token(TOKEN_NAMES.OP_EQ, '=='),
        new Token(TOKEN_NAMES.CONST_DBL, '8.8'),
        new Token(TOKEN_NAMES.closeRoundBrackets, ')'),
        new Token(TOKEN_NAMES.collon, ':'),

        new Token(TOKEN_NAMES.id, 'hello'),
        new Token(TOKEN_NAMES.openRoundBrackets, '('),
        new Token(TOKEN_NAMES.CONST_STR, 'Compiler'),
        new Token(TOKEN_NAMES.COMMA, ','),
        new Token(TOKEN_NAMES.id, 'age'),
        new Token(TOKEN_NAMES.closeRoundBrackets, ')'),
        new Token(TOKEN_NAMES.semiCollon, ';'),

        new Token(TOKEN_NAMES.id, 'end'),
        new Token(TOKEN_NAMES.semiCollon, ';'),

        new Token(TOKEN_NAMES.id, 'end'),
        new Token(TOKEN_NAMES.semiCollon, ';'),

        new Token(TOKEN_NAMES.id, 'end'),
        new Token(TOKEN_NAMES.dot, '.'),
      ]

      expect(actual).toEqual(expected)
    })

    it('should add the identifiers to the symbol table', () => {
      const tableSymbol = lexer.getSymbolTable()
      expect(tableSymbol.get('class').toString()).toEqual('<KW_CLASS, class>')
      expect(tableSymbol.get('CodeSample01').toString()).toEqual('<ID, CodeSample01>')
      expect(tableSymbol.get('defstatic').toString()).toEqual('<KW_DEFSTATIC, defstatic>')
      expect(tableSymbol.get('void').toString()).toEqual('<KW_VOID, void>')
      expect(tableSymbol.get('main').toString()).toEqual('<KW_MAIN, main>')
      expect(tableSymbol.get('String').toString()).toEqual('<KW_STRING, String>')
      expect(tableSymbol.get('args').toString()).toEqual('<ID, args>')
      expect(tableSymbol.get('double').toString()).toEqual('<KW_DOUBLE, double>')
      expect(tableSymbol.get('age').toString()).toEqual('<ID, age>')
      expect(tableSymbol.get('if').toString()).toEqual('<KW_IF, if>')
      expect(tableSymbol.get('hello').toString()).toEqual('<ID, hello>')
      expect(tableSymbol.get('end').toString()).toEqual('<KW_END, end>')
    })

    it('should correctly count the lines', () => {
      expect(lexer.getLine()).toEqual(12)
    })
  })
})
