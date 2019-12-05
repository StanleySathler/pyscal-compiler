module.exports = class TreeNode {
  constructor() {
    this.__type = null
  }

  setType(type) {
    this.__type = type
  }

  getType() {
    return this.__type
  }
}
