/**
 * This parser implementation is based on a Non-Recursive Predictive Parser,
 * a Top-Down implementation for LL(1) grammars.
 */

const TOKEN = require('../token/names')

module.exports = class Parser {
  constructor(lexer) {
    this.__lexer = lexer
    this.__nextReadToken = undefined
  }

  /**
   *
   */
  addError(expected) {
    /* @todo: implement */
  }

  /**
   * Check if current token is equal to the given one.
   */
  isToken(token) {
    return this.__nextReadToken.getName() === token
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
    this.addError(`Expected [${expected}], got ${this.__nextReadToken.getName()}`)
    this.advance()
  }

  /**
   * Starts the parsing process. It parses the initial rule:
   * Programa -> Classe EOF
   */
  parse() {
    this.advance()

    this.parseClasse()

    if (!this.match(TOKEN.EOF))
      this.addError(TOKEN.EOF)
  }

  /**
   * Classe -> class ID : ListaFuncao Main end .
   */
  parseClasse() {
    if (!this.match(TOKEN.KW_CLASS))
      this.addError(TOKEN.KW_CLASS)

    if (!this.match(TOKEN.ID))
      this.addError(TOKEN.ID)

    if (!this.match(TOKEN.COLON))
      this.addError(TOKEN.COLON)

    this.parseListaFuncao()

    this.parseMain()

    if (!this.match(TOKEN.KW_END))
      this.addError(TOKEN.COLON)

    if (!this.match(TOKEN.DOT))
      this.addError(TOKEN.DOT)
  }

  /**
   * DeclaraID -> TipoPrimitivo ID ;
   */
  parseDeclaraID() {
    this.parseTipoPrimitivo()

    if (!this.match(TOKEN.ID))
      this.addError(TOKEN.ID)

    if (!this.match(TOKEN.SEMI_COLON))
      this.addError(TOKEN.SEMI_COLON)
  }

  /**
   * ListaFuncao -> ListaFuncao2
   */
  parseListaFuncao() {
    this.parseListaFuncao2()
  }

  /**
   * ListaFuncao2 -> Funcao ListaFuncao2 | epsilon
   * @todo: fix this logic
   */
  parseListaFuncao2() {

    /* ListaFuncao2 -> epsilon */
    if (this.__nextReadToken.getName() === TOKEN.KW_DEFSTATIC)
      return

    /* ListaFuncao2 -> Funcao ListaFuncao2 */
    else {
      this.parseFuncao()
      this.parseListaFuncao2()
    }
  }

  /**
   * Funcao -> def TipoPrimitivo ID ( ListaArg ) : RegexDeclaraId ListaCmd Retorno end ;
   */
  parseFuncao() {
    if (!this.match(TOKEN.KW_DEF))
      this.addError(TOKEN.KW_DEF)

    this.parseTipoPrimitivo()

    if (!this.match(TOKEN.ID))
      this.addError(TOKEN.ID)

    if (!this.match(TOKEN.OPN_RND_BRACKET))
      this.addError(TOKEN.OPN_RND_BRACKET)

    this.parseListaArg()

    if (!this.match(TOKEN.CLS_RND_BRACKET))
      this.addError(TOKEN.CLS_RND_BRACKET)

    if (!this.match(TOKEN.COLON))
      this.addError(TOKEN.COLON)

    this.parseRegexDeclaraId()

    this.parseListaCmd()

    this.parseRetorno()

    if (!this.match(TOKEN.KW_END))
      this.addError(TOKEN.KW_END)

    if (!this.match(TOKEN.SEMI_COLON))
      this.addError(TOKEN.SEMI_COLON)
  }

  /**
   * RegexDeclaraId -> DeclaraID RegexDeclaraId | epsilon
   */
  parseRegexDeclaraId() {
    this.parseDeclaraID()

    this.parseRegexDeclaraId()

    /* @todo: implement cases for "RegexDeclaraId -> epsilon" */
  }

  /**
   * ListaArg -> Arg ListaArg2
   */
  parseListaArg() {
    this.parseArg()
    this.parseListaArg2()
  }

  /**
   * ListaArg2 -> , ListaArg | epsilon
   */
  parseListaArg2() {
    /* ListaArg2 -> , ListaArg */
    if (this.__nextReadToken.getName() === TOKEN.COMMA) {
      this.match(TOKEN.COMMA)
      this.parseListaArg()
    }

    /* ListaArg2 -> epsilon */
    else if (this.__nextReadToken.getName() === TOKEN.CLS_RND_BRACKET)
      return

    else
      this.addError("',' or ')'")
  }

  /**
   * Arg -> ListaPrimitivo ID
   */
  parseArg() {
    this.parseTipoPrimitivo()

    if (!this.match(TOKEN.ID))
      this.addError(TOKEN.ID)
  }

  /**
   * Retorno -> return Expressao ; | epsilon
   */
  parseRetorno() {
    if (this.__nextReadToken.getName() === TOKEN.KW_RETURN) {
      this.match(TOKEN.KW_RETURN)
      this.parseExpressao()

      if (!this.match(TOKEN.SEMI_COLON))
        this.addError(TOKEN.SEMI_COLON)
    }

    else if (this.__nextReadToken.getName() === TOKEN.KW_END)
      return

    else
      this.addError("'return' or 'end'")
  }

  /**
   * Main -> defstatic void main (String[] ID) : RegexDeclaraId ListaCmd end ;
   */
  parseMain() {
    if (!this.match(TOKEN.KW_DEFSTATIC))
      this.addError(TOKEN.KW_DEFSTATIC)

    if (!this.match(TOKEN.KW_VOID))
      this.addError(TOKEN.KW_VOID)

    if (!this.match(TOKEN.KW_MAIN))
      this.addError(TOKEN.KW_MAIN)

    if (!this.match(TOKEN.OPN_RND_BRACKET))
      this.addError(TOKEN.OPN_RND_BRACKET)

    if (!this.match(TOKEN.KW_STRING))
      this.addError(TOKEN.KW_STRING)

    if (!this.match(TOKEN.OPN_BRACKET))
      this.addError(TOKEN.OPN_BRACKET)

    if (!this.match(TOKEN.CLS_BRACKET))
      this.addError(TOKEN.CLS_BRACKET)

    if (!this.match(TOKEN.ID))
      this.addError(TOKEN.ID)

    if (!this.match(TOKEN.CLS_RND_BRACKET))
      this.addError(TOKEN.CLS_RND_BRACKET)

    if (!this.match(TOKEN.COLON))
      this.addError(TOKEN.COLON)

    this.parseRegexDeclaraId()

    this.parseListaCmd()

    if (!this.match(TOKEN.KW_END))
      this.addError(TOKEN.KW_END)

    if (!this.match(TOKEN.SEMI_COLON))
      this.addError(TOKEN.SEMI_COLON)
  }

  /**
   * TipoPrimitivo -> bool | integer | String | double | void
   */
  parseTipoPrimitivo() {
    if (this.__nextReadToken.getName() === TOKEN.KW_BOOL)
      this.match(TOKEN.KW_BOOL)

    else if (this.__nextReadToken.getName() === TOKEN.KW_INTEGER)
      this.match(TOKEN.KW_INTEGER)

    else if (this.__nextReadToken.getName() === TOKEN.KW_STRING)
      this.match(TOKEN.KW_STRING)

    else if (this.__nextReadToken.getName() === TOKEN.KW_DOUBLE)
      this.match(TOKEN.KW_DOUBLE)

    else if (this.__nextReadToken.getName() === TOKEN.KW_VOID)
      this.match(TOKEN.KW_VOID)
  }

  /**
   * ListaCmd -> ListaCmdLinha
   */
  parseListaCmd() {
    this.parseListaCmdLinha()
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
        this.addError(expected)
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
        this.addError(expected)
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
        this.addError('(')

      this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.addError(')')

      if (!this.match(TOKEN.COLON))
        this.addError(':')

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
        this.addError(expected)
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
        this.addError(';')
    }

    /* CmdIFLinha -> else : ListaCmd end ; */
    else if (this.match(TOKEN.KW_ELSE)) {
      if (!this.match(TOKEN.COLON))
        this.addError(':')

      this.parseListaCmd()

      if (!this.match(TOKEN.KW_END))
        this.addError('end')

      if (!this.match(TOKEN.SEMI_COLON))
        this.addError(';')
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
        this.addError(expected)
        return
      }

      /* Skip: Panic mode */
      else {
        this.skip(expected)
        if (!this.isToken(TOKEN.EOF))
          this.parseCmdIFLinha()
      }
    }

    // if (this.__nextReadToken.getName() === TOKEN.KW_END) {
    //   this.match(TOKEN.KW_END)

    //   if (!this.match(TOKEN.SEMI_COLON))
    //     this.addError('parseCmdIFLinha')
    // }

    // else if (this.__nextReadToken.getName() === TOKEN.KW_ELSE) {
    //   this.match(TOKEN.KW_ELSE)

    //   if (!this.match(TOKEN.COLON))
    //     this.addError('parseCmdIFLinha')

    //   this.parseListaCmd()

    //   if (!this.match(TOKEN.KW_END))
    //     this.addError('parseCmdIFLinha')

    //   if (!this.match(TOKEN.SEMI_COLON))
    //     this.addError('parseCmdIFLinha')
    // }
  }

  /**
   * CmdWhile -> while ( Expressao ) : ListaCmd end ;
   */
  parseCmdWhile() {
    expected = 'while'

    /* CmdWhile -> while ( Expressao ) : ListaCmd end ; */
    if (this.match(TOKEN.KW_WHILE)) {
      if (!this.match(TOKEN.OPN_RND_BRACKET))
        this.addError('(')

      this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.addError(')')

      if (!this.match(TOKEN.COLON))
        this.addError(':')

      this.parseListaCmd()

      if (!this.match(TOKEN.KW_END))
        this.addError('end')

      if (!this.match(TOKEN.SEMI_COLON))
        this.addError(';')
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
        this.addError(expected)
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
        this.addError('(')

      this.parseExpressao()

      if (!this.match(TOKEN.CLS_RND_BRACKET))
        this.addError(')')

      if (!this.match(TOKEN.SEMI_COLON))
        this.addError(';')
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
        this.addError(expected)
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
        this.addError(';')
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
        this.addError(expected)
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
        this.addError(')')

      if (!this.match(TOKEN.SEMI_COLON))
        this.addError(';')
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
        this.addError('(')
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
        this.addError(expected)
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
    const expected = '< | <= | > | >= | == | !='

    /* FIRST(Exp2) */
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

    else {
      /* Synch: Exp1 */
      /* FOLLOW(Exp1) */
      if (
        this.match(TOKEN.KW_OR) ||
        this.match(TOKEN.KW_AND) ||
        this.match(TOKEN.CLS_RND_BRACKET) ||
        this.match(TOKEN.SEMI_COLON) ||
        this.match(TOKEN.COMMA)
      ) {
        this.addError(expected)
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
        this.addError(expected)
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
        this.addError('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | (')
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
    if (this.isToken(TOKEN.OP_MULT) || this.isToken(TOKEN.OP_DIV)) {
      this.parseExp4()
      this.parseExp3Linha()
    }

    /* Exp3Linha -> epsilon */
    /* FOLLOW(Exp3Linha) */
    else if (
      this.__nextReadToken.getName() === TOKEN.OP_SUM ||
      this.__nextReadToken.getName() === TOKEN.OP_SUB ||
      this.__nextReadToken.getName() === TOKEN.OP_LT ||
      this.__nextReadToken.getName() === TOKEN.OP_LTE ||
      this.__nextReadToken.getName() === TOKEN.OP_GT ||
      this.__nextReadToken.getName() === TOKEN.OP_GE ||
      this.__nextReadToken.getName() === TOKEN.OP_EQ ||
      this.__nextReadToken.getName() === TOKEN.OP_NE ||
      this.__nextReadToken.getName() === TOKEN.KW_OR ||
      this.__nextReadToken.getName() === TOKEN.KW_AND ||
      this.__nextReadToken.getName() === TOKEN.CLS_RND_BRACKET ||
      this.__nextReadToken.getName() === TOKEN.SEMI_COLON ||
      this.__nextReadToken.getName() === TOKEN.COMMA
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
        this.addError(')')
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
        this.__nextReadToken.getName() === TOKEN.OP_MULT ||
        this.__nextReadToken.getName() === TOKEN.OP_DIV ||
        this.__nextReadToken.getName() === TOKEN.OP_SUM ||
        this.__nextReadToken.getName() === TOKEN.OP_SUB ||
        this.__nextReadToken.getName() === TOKEN.OP_LT ||
        this.__nextReadToken.getName() === TOKEN.OP_LTE ||
        this.__nextReadToken.getName() === TOKEN.OP_GT ||
        this.__nextReadToken.getName() === TOKEN.OP_GE ||
        this.__nextReadToken.getName() === TOKEN.OP_EQ ||
        this.__nextReadToken.getName() === TOKEN.OP_NE ||
        this.__nextReadToken.getName() === TOKEN.KW_OR ||
        this.__nextReadToken.getName() === TOKEN.KW_AND ||
        this.__nextReadToken.getName() === TOKEN.CLS_RND_BRACKET ||
        this.__nextReadToken.getName() === TOKEN.SEMI_COLON ||
        this.__nextReadToken.getName() === TOKEN.COMMA
      ) {
        this.addError('ID | ConstInteger | ConstDouble | ConstString | true | false | - | ! | (')
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
        this.addError(')')
    }

    /* Exp4Linha -> epsilon */
    else if (
      this.__nextReadToken.getName() === TOKEN.OP_MULT ||
      this.__nextReadToken.getName() === TOKEN.OP_DIV ||
      this.__nextReadToken.getName() === TOKEN.OP_SUM ||
      this.__nextReadToken.getName() === TOKEN.OP_SUB ||
      this.__nextReadToken.getName() === TOKEN.OP_LT ||
      this.__nextReadToken.getName() === TOKEN.OP_LTE ||
      this.__nextReadToken.getName() === TOKEN.OP_GT ||
      this.__nextReadToken.getName() === TOKEN.OP_GE ||
      this.__nextReadToken.getName() === TOKEN.OP_EQ ||
      this.__nextReadToken.getName() === TOKEN.OP_NE ||
      this.__nextReadToken.getName() === TOKEN.KW_OR ||
      this.__nextReadToken.getName() === TOKEN.KW_AND ||
      this.__nextReadToken.getName() === TOKEN.CLS_RND_BRACKET ||
      this.__nextReadToken.getName() === TOKEN.SEMI_COLON ||
      this.__nextReadToken.getName() === TOKEN.COMMA
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
        this.addError('- | !')
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

