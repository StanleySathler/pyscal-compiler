class Token {
  constructor(name, value, line, column) {
    this.__name = name
    this.__value = value
    this.__line = line
    this.__column = column
  }

  getName() {
    return this.__name
  }

  getValue() {
    return this.__value
  }

  getLine() {
    return this.__line
  }

  getColumn() {
    return this.__column
  }

  toString() {
    return `<${this.__name}, ${this.__value}, ${this.__line}, ${this.__column}>`
  }
}

module.exports = Token
