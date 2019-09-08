module.exports.isLetter = function(char) {
  return (new RegExp(/^[a-zA-Z]$/)).test(char)
}

module.exports.isNumber = function(char) {
  return (new RegExp(/^[0-9]$/)).test(char)
}
