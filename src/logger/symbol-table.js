const Table = require('cli-table')

module.exports = class SymbolTableLogger {
  constructor() {
    this.__table = new Table({
      head: ['lexem', 'line', 'column'],
    })
  }

  push(token) {
    this.__table.push([
      token.getValue(),
      token.getLine(),
      token.getColumn(),
    ])
  }

  print() {
    console.log(this.__table.toString())
  }
}
