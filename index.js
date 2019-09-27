const Table = require('cli-table')
const path = require('path')
const Lexer = require('./src/lexer')
const FileReader = require('./src/reader')

/* Read the source code file */
// const filePath = path.resolve(__dirname, '../test/mocks/code-sample-01.pys')
const filePath = path.resolve(__dirname, process.argv[2])
const fileReader = new FileReader(filePath)

/* Run the Lexer analysis */
const lexer = new Lexer(fileReader)
lexer.run()

/* Build the tokens table */
const tokensTable = new Table({
  head: ['tag', 'lexem', 'line', 'column'],
  colWidths: [25, 20, 10, 10],
})

lexer.__tokens.forEach(token => {
  tokensTable.push([
    token.getName(),
    token.getValue(),
    token.getLine(),
    token.getColumn(),
  ])
})

/* Build table w/ Symbol Table */
const symbolTable = new Table({
  head: ['lexem', 'line', 'column'],
})

const symbols = lexer.getSymbolTable().getSymbols()
Object.keys(symbols).forEach(symbolLexem => {
  const line = symbols[symbolLexem].getLine()
  const column = symbols[symbolLexem].getColumn()
  symbolTable.push([symbolLexem, line, column])
})

/* Build the errors table */
const errorsTable = new Table({
  head: ['error'],
})

if (lexer.getErrors.length) {
  lexer.getErrors().map(error => {
    errorsTable.push([error])
  })
} else {
  errorsTable.push(['No errors were found!'])
}

console.log(tokensTable.toString())
console.log(symbolTable.toString())
console.log(errorsTable.toString())
