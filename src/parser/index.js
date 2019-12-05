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
        this.parseRetorno()
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

      if (!this.match(TOKEN.ID))
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

    if (
      !this.match(TOKEN.KW_BOOL) &&
      !this.match(TOKEN.KW_INTEGER) &&
      !this.match(TOKEN.KW_STRING) &&
      !this.match(TOKEN.KW_DOUBLE) &&
      !this.match(TOKEN.KW_VOID)
    ) {
      /* Synch: TipoPrimitivo */
      /* FOLLOW(TipoPrimitivo) */
      if (this.isToken(TOKEN.ID)) {
        this.printError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseTipoPrimitivo()
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

    /* Cmd -> CmdIF */
    if (this.isToken(TOKEN.KW_IF))
      this.parseCmdIF()

    /* Cmd -> CmdWhile */
    else if (this.isToken(TOKEN.KW_WHILE))
      this.parseCmdWhile()

    /* Cmd -> ID CmdAtribFunc */
    else if (this.match(TOKEN.ID))
      this.parseCmdAtribFunc()

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

    /* CmdAtribFunc -> CmdAtribui */
    if (this.isToken(TOKEN.OP_EQ))
      this.parseCmdAtribui()

    /* CmdAtribFunc -> CmdFuncao */
    else if (this.isToken(TOKEN.OPN_RND_BRACKET))
      this.parseCmdFuncao()

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
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseCmdAtribFunc()
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

      this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

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

      this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

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

      this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
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

    /* CmdAtribui -> = Expressao ; */
    if (this.match(TOKEN.OP_EQ)) {
      this.parseExpressao()

      if (!this.match(TOKEN.SEMI_COLON))
        this.printError(';')
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
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseCmdAtribui()
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
      this.parseExp1()
      this.parseExpLinha()
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
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseExpressao()
      }
    }
  }

  /**
   * ExpLinha -> or Exp1 ExpLinha | and Exp1 ExpLinha | epsilon
   */
  parseExpLinha() {
    /* ExpLinha -> or Exp1 ExpLinha | and Exp1 ExpLinha */
    if (this.match(TOKEN.KW_OR) || this.match(TOKEN.KW_AND)) {
      this.parseExp1()
      this.parseExpLinha()
    }

    /* ExpLinha -> epsilon */
    /* FOLLOW(ExpLinha) */
    else if (
      this.isToken(TOKEN.CLS_RND_BRACKET) ||
      this.isToken(TOKEN.SEMI_COLON) ||
      this.isToken(TOKEN.COMMA)
    ) {
      return
    }

    /* Skip: Panic mode */
    else {
      this.skip('or | and | ) | ; | ,')
      if (!this.isToken(TOKEN.EOF))
        this.parseExpLinha()
    }
  }

  /**
   * Exp1 -> Exp2 Exp1Linha
   */
  parseExp1() {
    const expected = 'ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | ('

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
      this.parseExp2()
      this.parseExp1Linha()
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
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseExp1()
      }
    }
  }

  /**
   * Exp1Linha -> < Exp2 Exp1Linha | <= Exp2 Exp1Linha | > Exp2 Exp1Linha |
   * >= Exp2 Exp1Linha | == Exp2 Exp1Linha | != Exp2 Exp1Linha | epsilon
   */
  parseExp1Linha() {
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
      this.parseExp2()
      this.parseExp1Linha()
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
      return
    }

    /* Skip: Panic mode */
    else {
      this.skip('< | <= | > | >= | == | != | or | and | ) | ; | ,')
      if (!this.isToken(TOKEN.EOF))
        this.parseExp1Linha()
    }
  }

  /**
   * Exp2 -> Exp3 Exp2Linha
   */
  parseExp2() {
    const expected = 'ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | ('

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
      this.parseExp3()
      this.parseExp2Linha()
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
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseExp2()
      }
    }
  }

  /**
   * Exp2Linha -> + Exp3 Exp2Linha | - Exp3 Exp2Linha | epsilon
   */
  parseExp2Linha() {
    /* Exp2Linha -> + Exp3 Exp2Linha | - Exp3 Exp2Linha */
    if (this.match(TOKEN.OP_SUM) || this.match(TOKEN.OP_SUB)) {
      this.parseExp3()
      this.parseExp2Linha()
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
      return
    }

    /* Skip: Panic mode */
    else {
      this.skip('+ | -')
      if (!this.isToken(TOKEN.EOF))
        this.parseExp2Linha()
    }
  }

  /**
   * Exp3 -> Exp4 Exp3Linha
   */
  parseExp3() {
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
      this.parseExp4()
      this.parseExp3Linha()
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
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | (')
        if (!this.isToken(TOKEN.EOF))
          this.parseExp3()
      }
    }
  }

  /**
   * Exp3Linha -> * Exp4 Exp3Linha | / Exp4 Exp3Linha | epsilon
   */
  parseExp3Linha() {
    /* Exp3Linha -> * Exp4 Exp3Linha | / Exp4 Exp3Linha */
    if (
      this.match(TOKEN.OP_MULT) ||
      this.match(TOKEN.OP_DIV)
    ) {
      this.parseExp4()
      this.parseExp3Linha()
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
      return
    }

    /* Skip: Panic mode */
    else {
      this.skip('* | / ')
      if (!this.isToken(TOKEN.EOF))
        this.parseExp3Linha()
    }
  }

  /**
   * Exp4 -> ID Exp4Linha | ConstInteger | ConstDouble | ConstString |
   * true | false | OpUnario Exp4 | ( Expressao )
   */
  parseExp4() {

    /* ID Exp4Linha */
    if (this.match(TOKEN.ID))
      this.parseExp4Linha()

    /* ( Expressao ) */
    else if (this.match(TOKEN.OPN_RND_BRACKET)) {
      this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.printError(')')
    }

    /* OpUnario Exp4 */
    /* FIRST(OpUnario) */
    else if (
      this.__nextReadToken.getName() === TOKEN.OP_NGT ||
      this.__nextReadToken.getName() === TOKEN.OP_NE
    ) {
      this.parseOpUnario()
      this.parseExp4()
    }

    /* ConstInteger | ConstDouble | ConstString | true | false */
    else if (
      this.match(TOKEN.CONST_INT) ||
      this.match(TOKEN.CONST_DBL) ||
      this.match(TOKEN.CONST_STR) ||
      this.match(TOKEN.KW_TRUE)   ||
      this.match(TOKEN.KW_FALSE)
    ) {
      return
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
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | (')
        if (!this.isToken(TOKEN.EOF))
          this.parseExp4()
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
    if (!this.match(TOKEN.OP_NGT) && !this.match(TOKEN.OP_NOT)) {
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
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip('- | !')
        if (!this.isToken(TOKEN.EOF))
          this.parseOpUnario()
      }
    }
  }
}

