/**
 * This parser implementation is based on a Non-Recursive Predictive Parser,
 * a Top-Down implementation for LL(1) grammars.
 */

const TOKEN_NAMES = require('../token/names')

module.exports = class Parser {
  constructor(lexer) {
    this.__lexer = lexer
    this.__nextReadToken = undefined
  }

  /**
   * Reads the next token available in the input.
   */
  advance() {
    this.__nextReadToken = this.__lexer.nextToken()
  }

  /**
   * Starts the parsing process. It parses the initial rule:
   * Programa -> Classe EOF
   */
  parse() {
    this.advance()

    this.parseClasse()

    if (!this.eat(TOKEN_NAMES.EOF))
      this.addError(TOKEN_NAMES.EOF)
  }

  /**
   * Classe -> class ID : ListaFuncao Main end .
   */
  parseClasse() {
    if (!this.eat(TOKEN_NAMES.KW_CLASS))
      this.addError(TOKEN_NAMES.KW_CLASS)

    if (!this.eat(TOKEN_NAMES.ID))
      this.addError(TOKEN_NAMES.ID)

    if (!this.eat(TOKEN_NAMES.COLON))
      this.addError(TOKEN_NAMES.COLON)

    this.parseListaFuncao()

    this.parseMain()

    if (!this.eat(TOKEN_NAMES.KW_END))
      this.addError(TOKEN_NAMES.COLON)

    if (!this.eat(TOKEN_NAMES.DOT))
      this.addError(TOKEN_NAMES.DOT)
  }

  /**
   * DeclaraID -> TipoPrimitivo ID ;
   */
  parseDeclaraID() {
    this.parseTipoPrimitivo()

    if (!this.eat(TOKEN_NAMES.ID))
      this.addError(TOKEN_NAMES.ID)

    if (!this.eat(TOKEN_NAMES.SEMI_COLON))
      this.addError(TOKEN_NAMES.SEMI_COLON)
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
    if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_DEFSTATIC)
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
    if (!this.eat(TOKEN_NAMES.KW_DEF))
      this.addError(TOKEN_NAMES.KW_DEF)

    this.parseTipoPrimitivo()

    if (!this.eat(TOKEN_NAMES.ID))
      this.addError(TOKEN_NAMES.ID)

    if (!this.eat(TOKEN_NAMES.OPN_RND_BRACKET))
      this.addError(TOKEN_NAMES.OPN_RND_BRACKET)

    this.parseListaArg()

    if (!this.eat(TOKEN_NAMES.CLS_RND_BRACKET))
      this.addError(TOKEN_NAMES.CLS_RND_BRACKET)

    if (!this.eat(TOKEN_NAMES.COLON))
      this.addError(TOKEN_NAMES.COLON)

    this.parseRegexDeclaraId()

    this.parseListaCmd()

    this.parseRetorno()

    if (!this.eat(TOKEN_NAMES.KW_END))
      this.addError(TOKEN_NAMES.KW_END)

    if (!this.eat(TOKEN_NAMES.SEMI_COLON))
      this.addError(TOKEN_NAMES.SEMI_COLON)
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
    if (this.__nextReadToken.getName() === TOKEN_NAMES.COMMA) {
      this.eat(TOKEN_NAMES.COMMA)
      this.parseListaArg()
    }

    /* ListaArg2 -> epsilon */
    else if (this.__nextReadToken.getName() === TOKEN_NAMES.CLS_RND_BRACKET)
      return

    else
      this.addError("',' or ')'")
  }

  /**
   * Arg -> ListaPrimitivo ID
   */
  parseArg() {
    this.parseTipoPrimitivo()

    if (!this.eat(TOKEN_NAMES.ID))
      this.addError(TOKEN_NAMES.ID)
  }

  /**
   * Retorno -> return Expressao ; | epsilon
   */
  parseRetorno() {
    if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_RETURN) {
      this.eat(TOKEN_NAMES.KW_RETURN)
      this.parseExpressao()

      if (!this.eat(TOKEN_NAMES.SEMI_COLON))
        this.addError(TOKEN_NAMES.SEMI_COLON)
    }

    else if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_END)
      return

    else
      this.addError("'return' or 'end'")
  }

  /**
   * Main -> defstatic void main (String[] ID) : RegexDeclaraId ListaCmd end ;
   */
  parseMain() {
    if (!this.eat(TOKEN_NAMES.KW_DEFSTATIC))
      this.addError(TOKEN_NAMES.KW_DEFSTATIC)

    if (!this.eat(TOKEN_NAMES.KW_VOID))
      this.addError(TOKEN_NAMES.KW_VOID)

    if (!this.eat(TOKEN_NAMES.KW_MAIN))
      this.addError(TOKEN_NAMES.KW_MAIN)

    if (!this.eat(TOKEN_NAMES.OPN_RND_BRACKET))
      this.addError(TOKEN_NAMES.OPN_RND_BRACKET)

    if (!this.eat(TOKEN_NAMES.KW_STRING))
      this.addError(TOKEN_NAMES.KW_STRING)

    if (!this.eat(TOKEN_NAMES.OPN_BRACKET))
      this.addError(TOKEN_NAMES.OPN_BRACKET)

    if (!this.eat(TOKEN_NAMES.CLS_BRACKET))
      this.addError(TOKEN_NAMES.CLS_BRACKET)

    if (!this.eat(TOKEN_NAMES.ID))
      this.addError(TOKEN_NAMES.ID)

    if (!this.eat(TOKEN_NAMES.CLS_RND_BRACKET))
      this.addError(TOKEN_NAMES.CLS_RND_BRACKET)

    if (!this.eat(TOKEN_NAMES.COLON))
      this.addError(TOKEN_NAMES.COLON)

    this.parseRegexDeclaraId()

    this.parseListaCmd()

    if (!this.eat(TOKEN_NAMES.KW_END))
      this.addError(TOKEN_NAMES.KW_END)

    if (!this.eat(TOKEN_NAMES.SEMI_COLON))
      this.addError(TOKEN_NAMES.SEMI_COLON)
  }

  /**
   * TipoPrimitivo -> bool | integer | String | double | void
   */
  parseTipoPrimitivo() {
    if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_BOOL)
      this.eat(TOKEN_NAMES.KW_BOOL)

    else if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_INTEGER)
      this.eat(TOKEN_NAMES.KW_INTEGER)

    else if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_STRING)
      this.eat(TOKEN_NAMES.KW_STRING)

    else if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_DOUBLE)
      this.eat(TOKEN_NAMES.KW_DOUBLE)

    else if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_VOID)
      this.eat(TOKEN_NAMES.KW_VOID)
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

  }

  /**
   *
   */
  parseCmd() {}

  /**
   *
   */
  parseCmdAtribFunc() {}

  /**
   *
   */
  parseCmdIF() {}

  /**
   *
   */
  parseCmdIF2() {}

  /**
   *
   */
  parseCmdWhile() {}

  /**
   *
   */
  parseCmdWrite() {}

  /**
   *
   */
  parseCmdAtribui() {}

  /**
   *
   */
  parseCmdFuncao() {}

  /**
   *
   */
  parseRegexExp() {}

  /**
   *
   */
  parseRegexExp2() {}

  /**
   *
   */
  parseExpressao() {}

  /**
   *
   */
  parseExpLinha() {}

  /**
   *
   */
  parseExp1() {}

  /**
   *
   */
  parseExp1Linha() {}

  /**
   *
   */
  parseExp2() {}

  /**
   *
   */
  parseExp2Linha() {}

  /**
   *
   */
  parseExp3() {}

  /**
   *
   */
  parseExp3Linha() {}

  /**
   *
   */
  parseExp4() {}

  /**
   *
   */
  parseExp4Linha() {}

  addError(expected) {
    /* @todo: implement */
  }
}
