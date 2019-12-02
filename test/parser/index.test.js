const path = require('path')
const FileReader = require('../../src/reader')
const Lexer = require('../../src/lexer')
const Token = require('../../src/token')
const Parser = require('../../src/parser')
const TOKEN_NAMES = require('../../src/token/names')

describe('Given a Parser', () => {
  describe('and it reads a valid code sample', () => {
    let filePath
    let fileReader
    let lexer
    let parser

    beforeEach(() => {
      filePath = path.resolve(__dirname, '../mocks/code-sample-01.pys')
      fileReader = new FileReader(filePath)
      lexer = new Lexer(fileReader)
      parser = new Parser(lexer)
    })

    it('should NOT print any error', () => {
      const expected = 0
      const actual = parser.__errors.length
      expect(actual).toEqual(expected)
    })
  })
})
