const Table = require('cli-table')

module.exports = class TokensLogger {
  constructor() {
    this.__table = new Table({
      head: ['tag', 'lexem', 'line', 'column'],
      colWidths: [25, 20, 10, 10],
    })
  }

  push(token) {
    this.__table.push([
      token.getName(),
      token.getValue(),
      token.getLine(),
      token.getColumn(),
    ])
  }

  print() {
    console.log(this.__table.toString())
  }
}
