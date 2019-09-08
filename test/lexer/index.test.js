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
})
