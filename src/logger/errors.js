const Table = require('cli-table')

module.exports = class ErrorsLogger {
  constructor() {
    this.__table = new Table({
      head: ['error'],
    })
  }

  push(error) {
    this.__table.push([error])
  }

  print() {
    console.log(this.__table.toString())
  }
}
