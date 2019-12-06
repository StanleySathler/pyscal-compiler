/**
 * This parser implementation is based on a Non-Recursive Predictive Parser,
 * a Top-Down implementation for LL(1) grammars.
 */

const TreeNode = require('../node')
const TOKEN = require('../token/names')
const TYPE = require('../types')

module.exports = class Parser {
  constructor(lexer) {
    this.__lexer = lexer
    this.__nextReadToken = undefined
    this.__errors = []

    this.__matchedTokens = []
  }

  /**
   * Gets the symbol table from the lexer.
   */
  getSymbolTable() {
    return this.__lexer.getSymbolTable()
  }

  /**
   * Prints a semantic error.
   */
  throwSemanticError(message) {
    console.error(`(Semantic Error): ${message}`)

    this.__errors.push(message)

    if (this.__errors.length > 5)
      throw new Error('[PARSER . ERROR]: Maximum errors reached')
  }

  /**
   * Prints an error and controls the maximum of errors
   * allowed.
   */
  printError(expected) {
    const currentToken = this.__nextReadToken
    const lexem = currentToken.getValue()
    const line = currentToken.getLine()
    const column = currentToken.getColumn()
    const message = `(Syntatic Error) Ln ${line}, Col ${column}: Expected " ${expected} " but found " ${lexem} "`
    console.log(message)

    this.__errors.push(message)

    if (this.__errors.length > 5)
      throw new Error('[PARSER . ERROR]: Maximum errors reached')
  }

  /**
   * Gets the current token.
   */
  getCurrentToken() {
    return this.__nextReadToken
  }

  /**
   * Check if current token is equal to the given one.
   */
  isToken(token) {
    return this.getCurrentToken().getName() === token
  }

  /**
   * Reads the next token available in the input.
   */
  advance() {
    this.__nextReadToken = this.__lexer.nextToken()
  }

  /**
   * Compares if current token is equal to the expected.
   * If so, matches both tokens and advance to the next token.
   */
  match(expectedToken) {
    if (this.isToken(expectedToken)) {
      this.__matchedTokens.push(this.__nextReadToken.getValue())
      this.advance()
      return true
    }

    return false
  }

  /**
   * Prints an error and then just ignore the
   * current token.
   */
  skip(expected) {
    this.printError(expected)
    this.advance()
  }

  /**
   * Starts the parsing process. It parses the initial rule:
   * Programa -> Classe EOF
   */
  parse() {
    this.advance()

    this.parseClasse()

    if (!this.isToken(TOKEN.EOF))
      this.printError('$EOF')
  }

  /**
   * Classe -> class ID : ListaFuncao Main end .
   */
  parseClasse() {
    const expected = 'class'

    /* Classe -> class ID : ListaFuncao Main end . */
    if (this.match(TOKEN.KW_CLASS)) {
      const currentTokenRef = this.getCurrentToken()

      if (this.match(TOKEN.ID))
        this
          .getSymbolTable()
          .updateTokenType(currentTokenRef, TYPE.void)
      else
        this.printError('ID')

      if (!this.match(TOKEN.COLON))
        this.printError(':')

      this.parseListaFuncao()

      this.parseMain()

      if (!this.match(TOKEN.KW_END))
        this.printError('end')

      if (!this.match(TOKEN.DOT))
        this.printError('.')
    }

    else {
      /* Synch: Classe */
      /* FOLLOW(Classe) */
      if (this.isToken(TOKEN.EOF)) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseClasse()
      }
    }
  }

  /**
   * DeclaraID -> TipoPrimitivo ID ;
   */
  parseDeclaraID() {
    const expected = 'bool | integer | String | double | void'

    /* DeclaraID -> TipoPrimitivo ID ; */
    /* FIRST(TipoPrimitivo) */
    if (
      this.isToken(TOKEN.KW_BOOL) ||
      this.isToken(TOKEN.KW_INTEGER) ||
      this.isToken(TOKEN.KW_STRING) ||
      this.isToken(TOKEN.KW_DOUBLE) ||
      this.isToken(TOKEN.KW_VOID)
    ) {
      const currentTokenRef = this.getCurrentToken()
      const treeNodeTipoPrimitivo = this.parseTipoPrimitivo()

      if (this.match(TOKEN.ID))
        this
          .getSymbolTable()
          .updateTokenType(currentTokenRef, treeNodeTipoPrimitivo.getType())
      else
        this.printError('ID')

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
    }

    else {
      /* Synch: DeclaraID */
      /* FOLLOW(DeclaraID) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseDeclaraID()
      }
    }
  }

  /**
   * ListaFuncao -> ListaFuncaoLinha
   */
  parseListaFuncao() {
    const expected = 'def | defstatic'

    /* ListaFuncao -> ListaFuncaoLinha */
    /* FIRST(ListaFuncaoLinha) */
    if (
      this.isToken(TOKEN.KW_DEF) ||
      this.isToken(TOKEN.KW_DEFSTATIC)
    ) {
      this.parseListaFuncaoLinha()
    }

    else {
      /* Synch: ListaFuncao */
      /* FOLLOW(ListaFuncao) */
      if (this.isToken(TOKEN.KW_DEFSTATIC)) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseListaFuncao()
      }
    }
  }

  /**
   * ListaFuncaoLinha -> Funcao ListaFuncaoLinha | epsilon
   */
  parseListaFuncaoLinha() {
    /* ListaFuncaoLinha -> Funcao ListaFuncaoLinha */
    /* FIRST(Funcao) */
    if (this.isToken(TOKEN.KW_DEF)) {
      this.parseFuncao()
      this.parseListaFuncaoLinha()
    }

    /* ListaFuncaoLinha -> epsilon */
    /* FOLLOW(ListaFuncaoLinha) */
    else if (this.isToken(TOKEN.KW_DEFSTATIC))
      return

    /* Skip: Panic mode */
    else {
      this.skip('def')
      if (!this.isToken(TOKEN.EOF))
        this.parseListaFuncaoLinha()
    }
  }

  /**
   * Funcao -> def TipoPrimitivo ID ( ListaArg ) : RegexDeclaraId ListaCmd Retorno end ;
   */
  parseFuncao() {
    const expected = 'def'

    /* Funcao -> def TipoPrimitivo ID ( ListaArg ) : RegexDeclaraId ListaCmd Retorno end ; */
    if (this.match(TOKEN.KW_DEF)) {
      const currentTokenRef = this.getCurrentToken()
      const treeNodeTipoPrimitivo = this.parseTipoPrimitivo()

      if (this.match(TOKEN.ID))
        this
          .getSymbolTable()
          .updateTokenType(currentTokenRef, treeNodeTipoPrimitivo.getType())
      else
        this.printError('ID')

      if (!this.match(TOKEN.OPN_RND_BRACKET))
        this.printError('(')

      this.parseListaArg()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

      if (!this.match(TOKEN.COLON))
        this.printError(':')

      this.parseRegexDeclaraId()

      this.parseListaCmd()

      const treeNodeRetorno = this.parseRetorno()

      if (treeNodeRetorno.getType() !== treeNodeTipoPrimitivo.getType())
        this.throwSemanticError('Incompatible return type')

      if (!this.match(TOKEN.KW_END))
        this.printError('end')

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
    }

    else {
      /* Synch: Funcao */
      /* FOLLOW(Funcao) */
      if (
        this.isToken(TOKEN.KW_DEF) ||
        this.isToken(TOKEN.KW_DEFSTATIC)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseFuncao()
      }
    }
  }

  /**
   * RegexDeclaraId -> DeclaraID RegexDeclaraId | epsilon
   */
  parseRegexDeclaraId() {
    /* RegexDeclaraId -> DeclaraID RegexDeclaraId */
    /* FIRST(DeclaraId) */
    if (
      this.isToken(TOKEN.KW_BOOL) ||
      this.isToken(TOKEN.KW_INTEGER) ||
      this.isToken(TOKEN.KW_STRING) ||
      this.isToken(TOKEN.KW_DOUBLE) ||
      this.isToken(TOKEN.KW_VOID)
    ) {
      this.parseDeclaraID()
      this.parseRegexDeclaraId()
    }

    /* RegexDeclaraId -> epsilon */
    /* FOLLOW(RegexDeclaraId) */
    else if (
      this.isToken(TOKEN.KW_IF) ||
      this.isToken(TOKEN.KW_WHILE) ||
      this.isToken(TOKEN.ID) ||
      this.isToken(TOKEN.KW_WRITE) ||
      this.isToken(TOKEN.KW_RETURN) ||
      this.isToken(TOKEN.KW_END)
    ) {
      return
    }

    /* Skip: Panic mode */
    else {
      this.skip('bool | integer | String | double | void | if | while | ID | write | return | end')
      if (!this.isToken(TOKEN.EOF))
        this.parseRegexDeclaraId()
    }
  }

  /**
   * ListaArg -> Arg ListaArgLinha
   */
  parseListaArg() {
    const expected = 'bool | integer | String | double | void'

    /* FIRST(Arg) */
    if (
      this.isToken(TOKEN.KW_BOOL) ||
      this.isToken(TOKEN.KW_INTEGER) ||
      this.isToken(TOKEN.KW_STRING) ||
      this.isToken(TOKEN.KW_DOUBLE) ||
      this.isToken(TOKEN.KW_VOID)
    ) {
      this.parseArg()
      this.parseListaArgLinha()
    }

    else {
      /* Synch: ListaArg */
      /* FOLLOW(ListaArg) */
      if (this.isToken(TOKEN.CLS_RND_BRACKET)) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseListaArg()
      }
    }
  }

  /**
   * ListaArgLinha -> , ListaArg | epsilon
   */
  parseListaArgLinha() {
    /* ListaArgLinha -> , ListaArg */
    if (this.match(TOKEN.COMMA)) {
      this.parseListaArg()
    }

    /* ListaArgLinha -> epsilon */
    /* FOLLOW(ListaArgLinha) */
    else if (this.isToken(TOKEN.CLS_RND_BRACKET))
      return

    /* Skip: Panic mode */
    else {
      this.skip(', | )');
      if (!this.isToken(TOKEN.EOF))
        this.parseListaArgLinha()
    }
  }

  /**
   * Arg -> TipoPrimitivo ID
   */
  parseArg() {
    const expected = 'bool | integer | String | double | void'

    /* Arg -> TipoPrimitivo ID */
    /* FIRST(TipoPrimitivo) */
    if (
      this.isToken(TOKEN.KW_BOOL) ||
      this.isToken(TOKEN.KW_INTEGER) ||
      this.isToken(TOKEN.KW_STRING) ||
      this.isToken(TOKEN.KW_DOUBLE) ||
      this.isToken(TOKEN.KW_VOID)
    ) {
      const currentTokenRef = this.getCurrentToken()
      const treeNodeTipoPrimitivo = this.parseTipoPrimitivo()

      if (this.match(TOKEN.ID))
        this
          .getSymbolTable()
          .updateTokenType(currentTokenRef, treeNodeTipoPrimitivo.getType())
      else
        this.printError('ID')
    }

    else {
      /* Synch: Arg */
      /* FOLLOW(Arg) */
      if (
        this.isToken(TOKEN.COMMA) ||
        this.isToken(TOKEN.CLS_RND_BRACKET)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseArg()
      }
    }
  }

  /**
   * Retorno -> return Expressao ; | epsilon
   */
  parseRetorno() {
    const expected = 'return | end'
    const treeNodeRetorno = new TreeNode()

    /* Retorno -> return Expressao ; */
    if (this.match(TOKEN.KW_RETURN)) {
      const treeNodeExpressao = this.parseExpressao()

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')

      treeNodeRetorno.setType(treeNodeExpressao.getType())
      return treeNodeRetorno
    }

    /* Retorno -> epsilon */
    else if (this.isToken(TOKEN.KW_END)) {
      treeNodeRetorno.setType(TYPE.void)
      return treeNodeRetorno
    }

    /* Skip: Panic mode */
    else {
      this.skip(expected)
      if (!this.isToken(TOKEN.EOF))
        return this.parseRetorno()
    }
  }

  /**
   * Main -> defstatic void main (String[] ID) : RegexDeclaraId ListaCmd end ;
   */
  parseMain() {
    const expected = 'defstatic'

    /* Main -> defstatic void main (String[] ID) : RegexDeclaraId ListaCmd end ; */
    if (this.match(TOKEN.KW_DEFSTATIC)) {
      if (!this.match(TOKEN.KW_VOID))
        this.printError('void')

      if (!this.match(TOKEN.KW_MAIN))
        this.printError('main')

      if (!this.match(TOKEN.OPN_RND_BRACKET))
        this.printError('(')

      if (!this.match(TOKEN.KW_STRING))
        this.printError('String')

      if (!this.match(TOKEN.OPN_BRACKET))
        this.printError('[')

      if (!this.match(TOKEN.CLS_BRACKET))
        this.printError(']')

      const idTokenRef = this.getCurrentToken()

      if (this.match(TOKEN.ID))
        this
          .getSymbolTable()
          .updateTokenType(idTokenRef, TYPE.string)
      else
        this.printError(TOKEN.ID)

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

      if (!this.match(TOKEN.COLON))
        this.printError(':')

      this.parseRegexDeclaraId()

      this.parseListaCmd()

      if (!this.match(TOKEN.KW_END))
        this.printError('end')

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
    }

    else {
      /* Synch: Main */
      /* FOLLOW(Main) */
      if (this.isToken(TOKEN.KW_END)) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseMain()
      }
    }
  }

  /**
   * TipoPrimitivo -> bool | integer | String | double | void
   */
  parseTipoPrimitivo() {
    const expected = 'bool | integer | String | double | void'
    const treeNodeTipoPrimitivo = new TreeNode()

    if (this.match(TOKEN.KW_BOOL)) {
      treeNodeTipoPrimitivo.setType(TYPE.bool)
      return treeNodeTipoPrimitivo
    }

    else if (this.match(TOKEN.KW_STRING)) {
      treeNodeTipoPrimitivo.setType(TYPE.string)
      return treeNodeTipoPrimitivo
    }

    else if (
      this.match(TOKEN.KW_DOUBLE) ||
      this.match(TOKEN.KW_INTEGER)
    ) {
      treeNodeTipoPrimitivo.setType(TYPE.numerical)
      return treeNodeTipoPrimitivo
    }

    else if (this.match(TOKEN.KW_VOID)) {
      treeNodeTipoPrimitivo.setType(TYPE.void)
      return treeNodeTipoPrimitivo
    }

    else {
      /* Synch: TipoPrimitivo */
      /* FOLLOW(TipoPrimitivo) */
      if (this.isToken(TOKEN.ID)) {
        this.printError(expected)
        return treeNodeTipoPrimitivo
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          return this.parseTipoPrimitivo()
      }
    }
  }

  /**
   * ListaCmd -> ListaCmdLinha
   */
  parseListaCmd() {
    const expected = 'if | while | ID | write | return | end | else'

    /* FIRST(ListaCmdLinha) */
    if (
      this.isToken(TOKEN.KW_IF) ||
      this.isToken(TOKEN.KW_WHILE) ||
      this.isToken(TOKEN.ID) ||
      this.isToken(TOKEN.KW_WRITE) ||
      this.isToken(TOKEN.KW_RETURN) ||
      this.isToken(TOKEN.KW_END) ||
      this.isToken(TOKEN.KW_ELSE)
    ) {
      this.parseListaCmdLinha()
    }

    else {
      /* Synch: ListaCmd */
      /* FOLLOW(Synch) */
      if (
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseListaCmd()
      }
    }
  }

  /**
   * ListaCmdLinha -> Cmd ListaCmdLinha | epsilon
   */
  parseListaCmdLinha() {
    /* ListaCmdLinha -> Cmd ListaCmdLinha */
    /* FIRST(Cmd) */
    if (
      this.isToken(TOKEN.KW_IF) ||
      this.isToken(TOKEN.KW_WHILE) ||
      this.isToken(TOKEN.ID) ||
      this.isToken(TOKEN.KW_WRITE)
    ) {
      this.parseCmd()
      this.parseListaCmdLinha()
    }

    /* ListaCmdLinha -> epsilon */
    /* FOLLOW(ListaCmdLinha) */
    else if (
      this.isToken(TOKEN.KW_RETURN) ||
      this.isToken(TOKEN.KW_END) ||
      this.isToken(TOKEN.KW_ELSE)
    ) {
      return
    }

    /* Skip: Panic mode */
    else {
      this.skip('if | while | ID | write')
      if (!this.isToken(TOKEN.EOF))
        this.parseListaCmdLinha()
    }
  }

  /**
   * Cmd -> CmdIF | CmdWhile | ID CmdAtribFunc | CmdWrite
   */
  parseCmd() {
    const expected = 'if | while | ID | write'
    const currentTokenRef = this.getCurrentToken()
    const currentTokenLexem = currentTokenRef.getValue()

    /* Cmd -> CmdIF */
    if (this.isToken(TOKEN.KW_IF))
      this.parseCmdIF()

    /* Cmd -> CmdWhile */
    else if (this.isToken(TOKEN.KW_WHILE))
      this.parseCmdWhile()

    /* Cmd -> ID CmdAtribFunc */
    else if (this.match(TOKEN.ID)) {
      if (!this.getSymbolTable().has(currentTokenLexem))
        this.throwSemanticError(`Variable ${currentTokenLexem} not declared`)

      const treeNodeCmdAtribFunc = this.parseCmdAtribFunc()

      if (
        treeNodeCmdAtribFunc.getType() !== TYPE.void &&
        this.getSymbolTable().get(currentTokenLexem) &&
        this.getSymbolTable().get(currentTokenLexem).getType() !== treeNodeCmdAtribFunc.getType()
      )
        this.throwSemanticError(`Can't assign two variables of different types`)
    }

    /* Cmd -> CmdWrite */
    else if (this.isToken(TOKEN.KW_WRITE))
      this.parseCmdWrite()

    else {
      /* Synch: Cmd */
      /* FOLLOW(Cmd) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseCmd()
      }
    }
  }

  /**
   * CmdAtribFunc -> CmdAtribui | CmdFuncao
   */
  parseCmdAtribFunc() {
    const expected = '= | ('
    const treeNodeCmdAtribFunc = new TreeNode()

    /* CmdAtribFunc -> CmdAtribui */
    if (this.isToken(TOKEN.OP_EQ)) {
      const treeNodeCmdAtribui = this.parseCmdAtribui()
      treeNodeCmdAtribFunc.setType(treeNodeCmdAtribui.getType())
      return treeNodeCmdAtribFunc
    }

    /* CmdAtribFunc -> CmdFuncao */
    else if (this.isToken(TOKEN.OPN_RND_BRACKET)) {
      this.parseCmdFuncao()
      treeNodeCmdAtribFunc.setType(TYPE.void)
      return treeNodeCmdAtribFunc
    }

    else {
      /* Synch: CmdAtribFunc */
      /* FOLLOW(CmdAtribFunc) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError(expected)
        return treeNodeCmdAtribFunc
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          return this.parseCmdAtribFunc()
      }
    }
  }

  /**
   * CmdIF -> if ( Expressao ) : ListaCmd CmdIFLinha
   */
  parseCmdIF() {
    const expected = 'if'

    /* CmdIF -> if ( Expressao ) : ListaCmd CmdIFLinha */
    if (this.match(TOKEN.KW_IF)) {
      if (!this.match(TOKEN.OPN_RND_BRACKET))
        this.printError('(')

      const treeNodeExpressao = this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

      if (treeNodeExpressao.getType() !== TYPE.bool)
        this.throwSemanticError('Condition must result in a bool value')

      if (!this.match(TOKEN.COLON))
        this.printError(':')

      this.parseListaCmd()

      this.parseCmdIFLinha()
    }

    else {
      /* Synch: CmdIF */
      /* FOLLOW(CmdIF) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseCmdIF()
      }
    }
  }

  /**
   * CmdIFLinha -> end ; | else : ListaCmd end ;
   */
  parseCmdIFLinha() {
    const expected = 'end | else'

    /* CmdIFLinha -> end ; */
    if (this.match(TOKEN.KW_END)) {
      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
    }

    /* CmdIFLinha -> else : ListaCmd end ; */
    else if (this.match(TOKEN.KW_ELSE)) {
      if (!this.match(TOKEN.COLON))
        this.printError(':')

      this.parseListaCmd()

      if (!this.match(TOKEN.KW_END))
        this.printError('end')

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
    }

    else {
      /* Synch: CmdIFLinha */
      /* FOLLOW(CmdIFLinha) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseCmdIFLinha()
      }
    }
  }

  /**
   * CmdWhile -> while ( Expressao ) : ListaCmd end ;
   */
  parseCmdWhile() {
    expected = 'while'

    /* CmdWhile -> while ( Expressao ) : ListaCmd end ; */
    if (this.match(TOKEN.KW_WHILE)) {
      if (!this.match(TOKEN.OPN_RND_BRACKET))
        this.printError('(')

      const treeNodeExpressao = this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

      if (treeNodeExpressao.getType() !== TYPE.bool)
        this.throwSemanticError('Condition must result in a bool value')

      if (!this.match(TOKEN.COLON))
        this.printError(':')

      this.parseListaCmd()

      if (!this.match(TOKEN.KW_END))
        this.printError('end')

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
    }

    else {
      /* Synch: CmdWhile */
      /* FOLLOW(CmdWhile) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseCmdWhile()
      }
    }
  }

  /**
   * CmdWrite -> write ( Expressao ) ;
   */
  parseCmdWrite() {
    const expected = 'write'

    /* CmdWrite -> write ( Expressao ) ; */
    if (this.match(TOKEN.KW_WRITE)) {
      if (!this.match(TOKEN.OPN_RND_BRACKET))
        this.printError('(')

      const treeNodeExpressao = this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')

      if (treeNodeExpressao.getType() !== TYPE.string)
        this.throwSemanticError('Expression must be a string')
    }

    else {
      /* Synch: CmdWrite */
      /* FOLLOW(CmdWrite) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseCmdWrite()
      }
    }
  }

  /**
   * CmdAtribui -> = Expressao ;
   */
  parseCmdAtribui() {
    const expected = '='
    const treeNodeCmdAtribui = new TreeNode()

    /* CmdAtribui -> = Expressao ; */
    if (this.match(TOKEN.OP_EQ)) {
      const treeNodeExpressao = this.parseExpressao()

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')

      treeNodeCmdAtribui.setType(treeNodeExpressao.getType())
      return treeNodeCmdAtribui
    }

    else {
      /* Synch: CmdAtribui */
      /* FOLLOW(CmdAtribui) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError(expected)
        return treeNodeCmdAtribui
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          return this.parseCmdAtribui()
      }
    }
  }

  /**
   * CmdFuncao -> ( RegexExp ) ;
   */
  parseCmdFuncao() {
    if (this.match(TOKEN.OPN_RND_BRACKET)) {
      this.parseRegexExp()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
    }

    else {
      /* Synch: CmdFuncao */
      /* FOLLOW(CmdFuncao) */
      if (
        this.isToken(TOKEN.KW_IF) ||
        this.isToken(TOKEN.KW_WHILE) ||
        this.isToken(TOKEN.ID) ||
        this.isToken(TOKEN.KW_WRITE) ||
        this.isToken(TOKEN.KW_RETURN) ||
        this.isToken(TOKEN.KW_END) ||
        this.isToken(TOKEN.KW_ELSE)
      ) {
        this.printError('(')
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip('(')
        if (!this.isToken(TOKEN.EOF))
          this.parseCmdFuncao()
      }
    }
  }

  /**
   * RegexExp -> Expressao RegexExpLinha | epsilon
   */
  parseRegexExp() {
    /* FIRST(Expressao) */
    if (
      this.isToken(TOKEN.ID) ||
      this.isToken(TOKEN.CONST_INT) ||
      this.isToken(TOKEN.CONST_DBL) ||
      this.isToken(TOKEN.CONST_STR) ||
      this.isToken(TOKEN.KW_TRUE) ||
      this.isToken(TOKEN.KW_FALSE) ||
      this.isToken(TOKEN.OP_NGT) ||
      this.isToken(TOKEN.OP_NOT) ||
      this.isToken(TOKEN.OPN_RND_BRACKET)
    ) {
      this.parseExpressao()
      this.parseRegexExpLinha()
    }

    /* RegexExp -> epsilon */
    /* FOLLOW(RegexExp) */
    else if (this.isToken(TOKEN.CLS_RND_BRACKET)) {
      return
    }

    /* Skip: Panic mode */
    else {
      this.skip('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | ( | )')
      if (!this.isToken(TOKEN.EOF))
        this.parseRegexExp()
    }
  }

  /**
   * RegexExpLinha -> , Expressao RegexExpLinha | epsilon
   */
  parseRegexExpLinha() {
    /* RegexExpLinha -> , Expressao RegexExpLinha */
    if (this.match(TOKEN.COMMA)) {
      this.parseExpressao()
      this.parseRegexExpLinha()
    }

    /* RegexExpLinha -> epsilon */
    /* FOLLOW(RegexExpLinha) */
    else if (this.isToken(TOKEN.CLS_RND_BRACKET))
      return

    /* Skip: Panic mode */
    else {
      this.skip(', | )')
      if (!this.isToken(TOKEN.EOF))
        this.parseRegexExpLinha()
    }
  }

  /**
   * Expressao -> Exp1 ExpLinha
   */
  parseExpressao() {
    const expected = 'ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | ('
    const treeNodeExpressao = new TreeNode()

    /* FIRST(Exp1) */
    if (
      this.isToken(TOKEN.ID) ||
      this.isToken(TOKEN.CONST_INT) ||
      this.isToken(TOKEN.CONST_DBL) ||
      this.isToken(TOKEN.CONST_STR) ||
      this.isToken(TOKEN.KW_TRUE) ||
      this.isToken(TOKEN.KW_FALSE) ||
      this.isToken(TOKEN.OP_NGT) ||
      this.isToken(TOKEN.OP_NOT) ||
      this.isToken(TOKEN.OPN_RND_BRACKET)
    ) {
      const treeNodeExp1 = this.parseExp1()
      const treeNodeExpLinha = this.parseExpLinha()

      /* Semantic phase check */
      if (treeNodeExpLinha.getType() === TYPE.void)
        treeNodeExpressao.setType(treeNodeExp1.getType())
      else if (
        treeNodeExpLinha.getType() === treeNodeExp1.getType() &&
        treeNodeExpLinha.getType() === TYPE.bool
      )
        treeNodeExpressao.setType(TYPE.bool)
      else
        treeNodeExpressao.setType(TYPE.error)

      return treeNodeExpressao
    }

    else {
      /* Synch: Expressao */
      /* FOLLOW(Expressao) */
      if (
        this.isToken(TOKEN.CLS_RND_BRACKET) ||
        this.isToken(TOKEN.SEMI_COLON) ||
        this.isToken(TOKEN.COMMA)
      ) {
        this.printError(expected)
        return treeNodeExpressao
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          return this.parseExpressao()
      }
    }
  }

  /**
   * ExpLinha -> or Exp1 ExpLinha | and Exp1 ExpLinha | epsilon
   */
  parseExpLinha() {
    const treeNodeExpLinha = new TreeNode()

    /* ExpLinha -> or Exp1 ExpLinha | and Exp1 ExpLinha */
    if (this.match(TOKEN.KW_OR) || this.match(TOKEN.KW_AND)) {
      const treeNodeExp1 = this.parseExp1()
      const treeNodeExpLinha2 = this.parseExpLinha()

      /* Semantic phase check */
      if (
        treeNodeExpLinha2.getType() === TYPE.void &&
        treeNodeExp1.getType() === TYPE.bool
      ) {
        treeNodeExpLinha.setType(TYPE.bool)
      }

      else if (
        treeNodeExpLinha2.getType() === treeNodeExp1.getType() &&
        treeNodeExp1.getType() === TYPE.bool
      ) {
        treeNodeExpLinha.setType(TYPE.bool)
      }

      else
        treeNodeExpLinha.setType(TYPE.error)

      return treeNodeExpLinha
    }

    /* ExpLinha -> epsilon */
    /* FOLLOW(ExpLinha) */
    else if (
      this.isToken(TOKEN.CLS_RND_BRACKET) ||
      this.isToken(TOKEN.SEMI_COLON) ||
      this.isToken(TOKEN.COMMA)
    ) {
      treeNodeExpLinha.setType(TYPE.void)
      return treeNodeExpLinha
    }

    /* Skip: Panic mode */
    else {
      this.skip('or | and | ) | ; | ,')
      if (!this.isToken(TOKEN.EOF))
        return this.parseExpLinha()
    }
  }

  /**
   * Exp1 -> Exp2 Exp1Linha
   */
  parseExp1() {
    const expected = 'ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | ('
    const treeNodeExp1 = new TreeNode()

    /* FIRST(Exp2) */
    if (
      this.isToken(TOKEN.ID) ||
      this.isToken(TOKEN.CONST_INT) ||
      this.isToken(TOKEN.CONST_DBL) ||
      this.isToken(TOKEN.CONST_STR) ||
      this.isToken(TOKEN.KW_TRUE) ||
      this.isToken(TOKEN.KW_FALSE) ||
      this.isToken(TOKEN.OP_NGT) ||
      this.isToken(TOKEN.OP_NOT) ||
      this.isToken(TOKEN.OPN_RND_BRACKET)
    ) {
      const treeNodeExp2 = this.parseExp2()
      const treeNodeExp1Linha = this.parseExp1Linha()

      /* Semantic phase check */
      if (treeNodeExp1Linha.getType() === TYPE.void)
        treeNodeExp1.setType(treeNodeExp2.getType())

      else if (
        treeNodeExp2.getType() === treeNodeExp1Linha.getType() &&
        treeNodeExp2.getType() === TYPE.numerical
      ) {
        treeNodeExp1.setType(TYPE.bool)
      }

      else
        treeNodeExp1.setType(TYPE.error)

      return treeNodeExp1
    }

    else {
      /* Synch: Exp1 */
      /* FOLLOW(Exp1) */
      if (
        this.isToken(TOKEN.KW_OR) ||
        this.isToken(TOKEN.KW_AND) ||
        this.isToken(TOKEN.CLS_RND_BRACKET) ||
        this.isToken(TOKEN.SEMI_COLON) ||
        this.isToken(TOKEN.COMMA)
      ) {
        this.printError(expected)
        return treeNodeExp1
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          return this.parseExp1()
      }
    }
  }

  /**
   * Exp1Linha -> < Exp2 Exp1Linha | <= Exp2 Exp1Linha | > Exp2 Exp1Linha |
   * >= Exp2 Exp1Linha | == Exp2 Exp1Linha | != Exp2 Exp1Linha | epsilon
   */
  parseExp1Linha() {
    const treeNodeExp1Linha = new TreeNode()

    /*
     * Exp1Linha -> < Exp2 Exp1Linha | <= Exp2 Exp1Linha | > Exp2 Exp1Linha |
     * >= Exp2 Exp1Linha | == Exp2 Exp1Linha | != Exp2 Exp1Linha
     */
    if (
      this.match(TOKEN.OP_LT) ||
      this.match(TOKEN.OP_LTE) ||
      this.match(TOKEN.OP_GT) ||
      this.match(TOKEN.OP_GE) ||
      this.match(TOKEN.OP_EQ) ||
      this.match(TOKEN.OP_NE)
    ) {
      const treeNodeExp2 = this.parseExp2()
      const treeNodeExp1Linha2 = this.parseExp1Linha()

      /* Semantic phase check */
      if (
        treeNodeExp1Linha2.getType() === TYPE.void &&
        treeNodeExp2.getType() === TYPE.numerical
      ) {
        treeNodeExp1Linha.setType(TYPE.numerical)
      }

      else if (
        treeNodeExp1Linha2.getType() === treeNodeExp2.getType() &&
        treeNodeExp2.getType() === TYPE.numerical
      ) {
        treeNodeExp1Linha.setType(TYPE.numerical)
      }

      else
        treeNodeExp1Linha.setType(TYPE.error)

      return treeNodeExp1Linha
    }

    /* Exp1Linha -> epsilon */
    /* FOLLOW(Exp1Linha) */
    else if (
      this.isToken(TOKEN.KW_OR) ||
      this.isToken(TOKEN.KW_AND) ||
      this.isToken(TOKEN.CLS_RND_BRACKET) ||
      this.isToken(TOKEN.SEMI_COLON) ||
      this.isToken(TOKEN.COMMA)
    ) {
      treeNodeExp1Linha.setType(TYPE.void)
      return treeNodeExp1Linha
    }

    /* Skip: Panic mode */
    else {
      this.skip('< | <= | > | >= | == | != | or | and | ) | ; | ,')
      if (!this.isToken(TOKEN.EOF))
        return this.parseExp1Linha()
    }
  }

  /**
   * Exp2 -> Exp3 Exp2Linha
   */
  parseExp2() {
    const expected = 'ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | ('
    const treeNodeExp2 = new TreeNode()

    /* FIRST(Exp3) */
    if (
      this.isToken(TOKEN.ID) ||
      this.isToken(TOKEN.CONST_INT) ||
      this.isToken(TOKEN.CONST_DBL) ||
      this.isToken(TOKEN.CONST_STR) ||
      this.isToken(TOKEN.KW_TRUE) ||
      this.isToken(TOKEN.KW_FALSE) ||
      this.isToken(TOKEN.OP_NGT) ||
      this.isToken(TOKEN.OP_NOT) ||
      this.isToken(TOKEN.OPN_RND_BRACKET)
    ) {
      const treeNodeExp3 = this.parseExp3()
      const treeNodeExp2Linha = this.parseExp2Linha()

      /* Semantic phase check */
      if (treeNodeExp2Linha.getType() === TYPE.void)
        treeNodeExp2.setType(treeNodeExp3.getType())

      else if (
        treeNodeExp2Linha.getType() === treeNodeExp3.getType() &&
        treeNodeExp2Linha.getType() === TYPE.numerical
      ) {
        treeNodeExp2.setType(TYPE.numerical)
      }

      else
        treeNodeExp2.setType(TYPE.error)

      return treeNodeExp2
    }

    else {
      /* Synch: Exp2 */
      /* FOLLOW(Exp2) */
      if (
        this.isToken(TOKEN.OP_LT) ||
        this.isToken(TOKEN.OP_LTE) ||
        this.isToken(TOKEN.OP_GT) ||
        this.isToken(TOKEN.OP_GE) ||
        this.isToken(TOKEN.OP_EQ) ||
        this.isToken(TOKEN.OP_NE) ||
        this.isToken(TOKEN.KW_OR) ||
        this.isToken(TOKEN.KW_AND) ||
        this.isToken(TOKEN.CLS_RND_BRACKET) ||
        this.isToken(TOKEN.SEMI_COLON) ||
        this.isToken(TOKEN.COMMA)
      ) {
        this.printError(expected)
        return treeNodeExp2
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          return this.parseExp2()
      }
    }
  }

  /**
   * Exp2Linha -> + Exp3 Exp2Linha | - Exp3 Exp2Linha | epsilon
   */
  parseExp2Linha() {
    const node = new TreeNode()

    /* Exp2Linha -> + Exp3 Exp2Linha | - Exp3 Exp2Linha */
    if (this.match(TOKEN.OP_SUM) || this.match(TOKEN.OP_SUB)) {
      const nodeExp3 = this.parseExp3()
      const nodeExp2Linha = this.parseExp2Linha()

      /* Semantic phase check */
      if (
        nodeExp2Linha.getType() === TYPE.void &&
        nodeExp3.getType() === TYPE.numerical
      ) {
        node.setType(TYPE.numerical)
      }

      else if (
        nodeExp2Linha.getType() === nodeExp3.getType() &&
        nodeExp3.getType() === TYPE.numerical
      ) {
        node.setType(TYPE.numerical)
      }

      else
        node.setType(TYPE.error)

      return node
    }

    /* Exp2Linha -> epsilon */
    /* FOLLOW(Exp2Linha) */
    else if (
      this.isToken(TOKEN.OP_LT) ||
      this.isToken(TOKEN.OP_LTE) ||
      this.isToken(TOKEN.OP_GT) ||
      this.isToken(TOKEN.OP_GE) ||
      this.isToken(TOKEN.OP_EQ) ||
      this.isToken(TOKEN.OP_NE) ||
      this.isToken(TOKEN.KW_OR) ||
      this.isToken(TOKEN.KW_AND) ||
      this.isToken(TOKEN.CLS_RND_BRACKET) ||
      this.isToken(TOKEN.SEMI_COLON) ||
      this.isToken(TOKEN.COMMA)
    ) {
      node.setType(TYPE.void)
      return node
    }

    /* Skip: Panic mode */
    else {
      this.skip('+ | -')
      if (!this.isToken(TOKEN.EOF))
        return this.parseExp2Linha()
    }
  }

  /**
   * Exp3 -> Exp4 Exp3Linha
   */
  parseExp3() {
    const node = new TreeNode()

    /* FIRST(Exp4) */
    if (
      this.isToken(TOKEN.ID) ||
      this.isToken(TOKEN.CONST_INT) ||
      this.isToken(TOKEN.CONST_DBL) ||
      this.isToken(TOKEN.CONST_STR) ||
      this.isToken(TOKEN.KW_TRUE) ||
      this.isToken(TOKEN.KW_FALSE) ||
      this.isToken(TOKEN.OP_NGT) ||
      this.isToken(TOKEN.OP_NOT) ||
      this.isToken(TOKEN.OPN_RND_BRACKET)
    ) {
      const nodeExp4 = this.parseExp4()
      const nodeExp3Linha = this.parseExp3Linha()

      /* Semantic phase check */
      if (nodeExp3Linha.getType() === TYPE.void)
        node.setType(nodeExp4.getType())

      else if (
        nodeExp4.getType() === nodeExp3Linha.getType() &&
        nodeExp3Linha.getType() === TYPE.numerical
      ) {
        node.setType(TYPE.numerical)
      }

      else
        node.setType(TYPE.error)

      return node
    }

    else {
      /* Synch: Exp3 */
      /* FOLLOW(Exp3) */
      if (
        this.isToken(TOKEN.OP_SUM) ||
        this.isToken(TOKEN.OP_SUB) ||
        this.isToken(TOKEN.OP_LT) ||
        this.isToken(TOKEN.OP_LTE) ||
        this.isToken(TOKEN.OP_GT) ||
        this.isToken(TOKEN.OP_GE) ||
        this.isToken(TOKEN.OP_EQ) ||
        this.isToken(TOKEN.OP_NE) ||
        this.isToken(TOKEN.KW_OR) ||
        this.isToken(TOKEN.KW_AND) ||
        this.isToken(TOKEN.CLS_RND_BRACKET) ||
        this.isToken(TOKEN.SEMI_COLON) ||
        this.isToken(TOKEN.COMMA)
      ) {
        this.printError('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | (')
        return node
      }

      /* Skip: Panic mode */
      else {
        this.skip('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | (')
        if (!this.isToken(TOKEN.EOF))
          return this.parseExp3()
      }
    }
  }

  /**
   * Exp3Linha -> * Exp4 Exp3Linha | / Exp4 Exp3Linha | epsilon
   */
  parseExp3Linha() {
    const node = new TreeNode()

    /* Exp3Linha -> * Exp4 Exp3Linha | / Exp4 Exp3Linha */
    if (
      this.match(TOKEN.OP_MULT) ||
      this.match(TOKEN.OP_DIV)
    ) {
      const nodeExp4 = this.parseExp4()
      const nodeExp3Linha = this.parseExp3Linha()

      /* Semantic phase check */
      if (
        nodeExp3Linha.getType() === TYPE.void &&
        nodeExp4.getType() === TYPE.numerical
      ) {
        node.setType(TYPE.numerical)
      }

      else if (
        nodeExp3Linha.getType() === nodeExp4.getType() &&
        nodeExp4.getType() === TYPE.numerical
      ) {
        node.setType(TYPE.numerical)
      }

      else
        node.setType(TYPE.error)

      return node
    }

    /* Exp3Linha -> epsilon */
    /* FOLLOW(Exp3Linha) */
    else if (
      this.isToken(TOKEN.OP_SUM) ||
      this.isToken(TOKEN.OP_SUB) ||
      this.isToken(TOKEN.OP_LT) ||
      this.isToken(TOKEN.OP_LTE) ||
      this.isToken(TOKEN.OP_GT) ||
      this.isToken(TOKEN.OP_GE) ||
      this.isToken(TOKEN.OP_EQ) ||
      this.isToken(TOKEN.OP_NE) ||
      this.isToken(TOKEN.KW_OR) ||
      this.isToken(TOKEN.KW_AND) ||
      this.isToken(TOKEN.CLS_RND_BRACKET) ||
      this.isToken(TOKEN.SEMI_COLON) ||
      this.isToken(TOKEN.COMMA)
    ) {
      node.setType(TYPE.void)
      return node
    }

    /* Skip: Panic mode */
    else {
      this.skip('* | / ')
      if (!this.isToken(TOKEN.EOF))
        return this.parseExp3Linha()
    }
  }

  /**
   * Exp4 -> ID Exp4Linha | ConstInteger | ConstDouble | ConstString |
   * true | false | OpUnario Exp4 | ( Expressao )
   */
  parseExp4() {
    const currentTokenRef = this.getCurrentToken()
    const node = new TreeNode()

    /* ID Exp4Linha */
    if (this.match(TOKEN.ID)) {
      this.parseExp4Linha()

      /* Semantic phase check */
      const tokenFromSymbolTable = this.getSymbolTable().get(currentTokenRef.getValue())
      if (!tokenFromSymbolTable) {
        this.throwSemanticError(`Variable ${currentTokenRef.getValue()} not declared`)
        node.setType(TYPE.error)
      }

      else
        node.setType(tokenFromSymbolTable.getType())

      return node
    }

    /* ( Expressao ) */
    else if (this.match(TOKEN.OPN_RND_BRACKET)) {
      const nodeExpressao = this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

      /* Semantic phase check */
      node.setType(nodeExpressao.getType())

      return node
    }

    /* OpUnario Exp4 */
    /* FIRST(OpUnario) */
    else if (
      this.isToken(TOKEN.OP_NGT) ||
      this.isToken(TOKEN.OP_NE)
    ) {
      const nodeOpUnario = this.parseOpUnario()
      const nodeExp4 = this.parseExp4()

      /* Semantic phase check */
      if (
        nodeOpUnario.getType() === nodeExp4.getType() &&
        nodeOpUnario.getType() === TYPE.numerical
      ) {
        node.setType(TYPE.numerical)
      }

      else if (
        nodeOpUnario.getType() === nodeExp4.getType() &&
        nodeOpUnario.getType() === TYPE.bool
      ) {
        node.setType(TYPE.bool)
      }

      else
        node.setType(TYPE.error)

      return node
    }

    /* ConstInteger | ConstDouble */
    else if (
      this.match(TOKEN.CONST_INT) ||
      this.match(TOKEN.CONST_DBL)
    ) {
      node.setType(TYPE.numerical)
      return node
    }

    /* ConstString */
    else if (this.match(TOKEN.CONST_STR)) {
      node.setType(TYPE.string)
      return node
    }

    /* true | false */
    else if (
      this.match(TOKEN.KW_TRUE) ||
      this.match(TOKEN.KW_FALSE)
    ) {
      node.setType(TYPE.bool)
      return node
    }

    else {
      /* Synch: FOLLOW(Exp4) */
      if (
        this.isToken(TOKEN.OP_MULT) ||
        this.isToken(TOKEN.OP_DIV) ||
        this.isToken(TOKEN.OP_SUM) ||
        this.isToken(TOKEN.OP_SUB) ||
        this.isToken(TOKEN.OP_LT) ||
        this.isToken(TOKEN.OP_LTE) ||
        this.isToken(TOKEN.OP_GT) ||
        this.isToken(TOKEN.OP_GE) ||
        this.isToken(TOKEN.OP_EQ) ||
        this.isToken(TOKEN.OP_NE) ||
        this.isToken(TOKEN.KW_OR) ||
        this.isToken(TOKEN.KW_AND) ||
        this.isToken(TOKEN.CLS_RND_BRACKET) ||
        this.isToken(TOKEN.SEMI_COLON) ||
        this.isToken(TOKEN.COMMA)
      ) {
        this.printError('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | (')
        return node
      }

      /* Skip: Panic mode */
      else {
        this.skip('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | (')
        if (!this.isToken(TOKEN.EOF))
          return this.parseExp4()
      }
    }
  }

  /**
   * Exp4Linha -> ( RegexExp ) | epsilon
   */
  parseExp4Linha() {
    /* Exp4Linha -> ( RegexExp ) */
    if (this.match(TOKEN.OPN_RND_BRACKET)) {
      this.parseRegexExp()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')
    }

    /* Exp4Linha -> epsilon */
    /* FOLLOW(Exp4Linha) */
    else if (
      this.isToken(TOKEN.OP_MULT) ||
      this.isToken(TOKEN.OP_DIV) ||
      this.isToken(TOKEN.OP_SUM) ||
      this.isToken(TOKEN.OP_SUB) ||
      this.isToken(TOKEN.OP_LT) ||
      this.isToken(TOKEN.OP_LTE) ||
      this.isToken(TOKEN.OP_GT) ||
      this.isToken(TOKEN.OP_GE) ||
      this.isToken(TOKEN.OP_EQ) ||
      this.isToken(TOKEN.OP_NE) ||
      this.isToken(TOKEN.KW_OR) ||
      this.isToken(TOKEN.KW_AND) ||
      this.isToken(TOKEN.CLS_RND_BRACKET) ||
      this.isToken(TOKEN.SEMI_COLON) ||
      this.isToken(TOKEN.COMMA)
    ) {
      return
    }

    /* Skip: Panic mode */
    else {
      this.skip('( | * | / | + | - | < | <= | > | >= | != | or | and | ) | ; | ,')
      if (!this.isToken(TOKEN.EOF))
        this.parseExp4Linha()
    }
  }

  /**
   * OpUnario -> - | !
   */
  parseOpUnario() {
    const node = new TreeNode()

    if (this.match(TOKEN.OP_NGT)) {
      node.setType(TYPE.numerical)
      return node
    }

    else if (this.match(TOKEN.OP_NOT)) {
      node.setType(TYPE.bool)
      return node
    }

    else {
      /* Synch: FOLLOW(OpUnario) */
      if (
        this.match(TOKEN.ID) ||
        this.match(TOKEN.CONST_INT) ||
        this.match(TOKEN.CONST_DBL) ||
        this.match(TOKEN.CONST_STR) ||
        this.match(TOKEN.KW_TRUE) ||
        this.match(TOKEN.KW_FALSE) ||
        this.match(TOKEN.OP_NGT) ||
        this.match(TOKEN.OP_NOT) ||
        this.match(TOKEN.OPN_RND_BRACKET)
      ) {
        this.printError('- | !')
        return node
      }

      /* Skip: Panic mode */
      else {
        this.skip('- | !')
        if (!this.isToken(TOKEN.EOF))
          return this.parseOpUnario()
      }
    }
  }
}

