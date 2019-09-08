const fs = require("fs")

module.exports = class FileReader {
  constructor(filePath) {
    /* The read file content */
    this.__fileContent = fs.readFileSync(filePath, { encoding: "utf-8" })

    /* The current cursor position */
    this.__cursorPosition = 0
  }

  /**
   * Read a single character from the content, respecting
   * the current cursor position.
   */
  readNextChar() {
    return this.__fileContent[this.__cursorPosition++]
  }

  /**
   * Check if cursor has reached the end of file.
   */
  hasNextChar() {
    return this.__cursorPosition < this.__fileContent.length
  }

  /**
   * Go back to the previous cursor position.
   */
  setCursorToPreviousPosition() {
    this.__cursorPosition--
  }
}
