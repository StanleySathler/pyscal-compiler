const path = require('path')
const FileReader = require('../../src/reader')
const Lexer = require('../../src/lexer')
const Token = require('../../src/token')
const TOKEN_NAMES = require('../../src/token/names')

describe('Given a Lexer', () => {
  describe('for the first code sample', () => {
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
        new Token(TOKEN_NAMES.id, 'end'),
        new Token(TOKEN_NAMES.dot, '.'),
      ]

      expect(actual).toEqual(expected)
    })
  })

  describe('for the second code sample', () => {
    let filePath, fileReader, lexer

    beforeEach(() => {
      filePath = path.resolve(__dirname, '../mocks/code-sample-02.pys')
      fileReader = new FileReader(filePath)
      lexer = new Lexer(fileReader)
      lexer.run()
    })

    it('should generate the correct tokens', () => {
      const actual = lexer.getTokens()
      const expected = [
        new Token(TOKEN_NAMES.id, 'class'),
        new Token(TOKEN_NAMES.id, 'CodeSample02'),
        new Token(TOKEN_NAMES.collon, ':'),
        new Token(TOKEN_NAMES.id, 'def'),
        new Token(TOKEN_NAMES.id, 'void'),
        new Token(TOKEN_NAMES.id, 'hello'),
        new Token(TOKEN_NAMES.openRoundBrackets, '('),
        new Token(TOKEN_NAMES.id, 'String'),
        new Token(TOKEN_NAMES.id, 'name'),
        new Token(TOKEN_NAMES.closeRoundBrackets, ')'),
        new Token(TOKEN_NAMES.collon, ':'),
        new Token(TOKEN_NAMES.id, 'end'),
        new Token(TOKEN_NAMES.semiCollon, ';'),
        new Token(TOKEN_NAMES.id, 'end'),
        new Token(TOKEN_NAMES.dot, '.'),
      ]

      expect(actual).toEqual(expected)
    })
  })
})
