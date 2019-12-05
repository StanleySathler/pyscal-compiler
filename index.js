const path = require('path')
const Lexer = require('./src/lexer')
const FileReader = require('./src/reader')
const TOKEN_NAMES = require('./src/token/names')
const TokensLogger = require('./src/logger/tokens')
const SymbolTableLogger = require('./src/logger/symbol-table')
const ErrorsLogger = require('./src/logger/errors')
const Parser = require('./src/parser')

/* Loggers */
const tokensLogger = new TokensLogger()
const symbolTableLogger = new SymbolTableLogger()
const errorsLogger = new ErrorsLogger()

/* Read the source code file */
const filePath = path.resolve(__dirname, process.argv[2])
const fileReader = new FileReader(filePath)

/* Instantiate the Lexer */
const lexer = new Lexer(fileReader)

// /* Build table w/ tokens */
// let token
// do {
//   token = lexer.nextToken()
//   tokensLogger.push(token)
// } while (token.getName() !== TOKEN_NAMES.EOF)

// /* Build table w/ Symbol Table */
// const symbols = lexer.getSymbolTable().getSymbols()
// Object.keys(symbols).forEach(symbolLexem => {
//   const token = symbols[symbolLexem]
//   symbolTableLogger.push(token)
// })

// /* Build the errors table */

// if (lexer.getErrors().length) {
//   lexer.getErrors().map(error => {
//     errorsLogger.push(error)
//   })
// } else {
//   errorsLogger.push('No errors were found!')
// }

// /* Print tables */
// tokensLogger.print()
// symbolTableLogger.print()
// errorsLogger.print()

const parser = new Parser(lexer)

parser.parse()
