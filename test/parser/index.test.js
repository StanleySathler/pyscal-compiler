const path = require('path')
const FileReader = require('../../src/reader')
const Lexer = require('../../src/lexer')
const Parser = require('../../src/parser')

describe('Given a Parser', () => {
  describe.skip('and it reads a valid code sample', () => {
    let filePath
    let fileReader
    let lexer
    let parser

    beforeEach(() => {
      filePath = path.resolve(__dirname, '../mocks/parser/valid-code-sample-01.pys')
      fileReader = new FileReader(filePath)
      lexer = new Lexer(fileReader)
      parser = new Parser(lexer)
      parser.parse()
    })

    it('should NOT print any error', () => {
      const expected = 0
      const actual = parser.__errors.length
      expect(actual).toEqual(expected)
    })
  })

  describe('and it reads an invalid code sample', () => {
    let filePath
    let fileReader
    let lexer
    let parser

    beforeEach(() => {
      filePath = path.resolve(__dirname, '../mocks/parser/invalid-code-sample-01.pys')
      fileReader = new FileReader(filePath)
      lexer = new Lexer(fileReader)
      parser = new Parser(lexer)
      parser.parse()
    })

    it('should identify all the errors', () => {
      const expected = 3
      const actual = parser.__errors.length
      expect(actual).toEqual(expected)
    })
  })
})
