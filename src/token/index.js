class Token {
  constructor(name, value) {
    this.__name = name
    this.__value = value
  }

  toString() {
    return `<${this.__name}, ${this.__value}>`
  }
}

module.exports = Token
