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

/* Print generated tokens */
lexer.__tokens.forEach(token => {
  console.log(token.toString())
})
