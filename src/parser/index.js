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
    /* ListaCmdLinha -> Cmd ListaCmdLinha */
    if (
      this.__nextReadToken.getName() === TOKEN_NAMES.KW_IF ||
      this.__nextReadToken.getName() === TOKEN_NAMES.KW_WHILE ||
      this.__nextReadToken.getName() === TOKEN_NAMES.ID ||
      this.__nextReadToken.getName() === TOKEN_NAMES.KW_WRITE
    ) {
      this.parseCmd()
      this.parseListaCmdLinha()
    }

    /* ListaCmdLinha -> epsilon */
    else if (
      this.__nextReadToken.getName() === TOKEN_NAMES.KW_RETURN ||
      this.__nextReadToken.getName() === TOKEN_NAMES.KW_END ||
      this.__nextReadToken.getName() === TOKEN_NAMES.KW_ELSE
    ) return

    else
      this.addError('parseListaCmdLinha')
  }

  /**
   * Cmd -> CmdIF | CmdWhile | ID CmdAtribFunc | CmdWrite
   */
  parseCmd() {}

  /**
   * CmdAtribFunc -> CmdAtribui | CmdFuncao
   */
  parseCmdAtribFunc() {}

  /**
   * CmdIF -> if ( Expressao ) : ListaCmd CmdIFLinha
   */
  parseCmdIF() {
    if (!this.eat(TOKEN_NAMES.KW_IF))
      this.addError('parseCmdIF')

    if (!this.eat(TOKEN_NAMES.OPN_RND_BRACKET))
      this.addError('parseCmdIF')

    this.parseExpressao()

    if (!this.eat(TOKEN_NAMES.CLS_RND_BRACKET))
      this.addError('parseCmdIF')

    if (!this.eat(TOKEN_NAMES.COLON))
      this.addError('parseCmdIF')

    this.parseListaCmd()

    this.parseCmdIFLinha()
  }

  /**
   * CmdIFLinha -> end ; | else : ListaCmd end ;
   */
  parseCmdIFLinha() {
    if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_END) {
      this.eat(TOKEN_NAMES.KW_END)

      if (!this.eat(TOKEN_NAMES.SEMI_COLON))
        this.addError('parseCmdIFLinha')
    }

    else if (this.__nextReadToken.getName() === TOKEN_NAMES.KW_ELSE) {
      this.eat(TOKEN_NAMES.KW_ELSE)

      if (!this.eat(TOKEN_NAMES.COLON))
        this.addError('parseCmdIFLinha')

      this.parseListaCmd()

      if (!this.eat(TOKEN_NAMES.KW_END))
        this.addError('parseCmdIFLinha')

      if (!this.eat(TOKEN_NAMES.SEMI_COLON))
        this.addError('parseCmdIFLinha')
    }
  }

  /**
   * CmdWhile -> while ( Expressao ) : ListaCmd end ;
   */
  parseCmdWhile() {
    if (!this.eat(TOKEN_NAMES.KW_WHILE))
      this.addError('parseCmdWhile')

    if (!this.eat(TOKEN_NAMES.OPN_RND_BRACKET))
      this.addError('parseCmdWhile')

    this.parseExpressao()

    if (!this.eat(TOKEN_NAMES.CLS_RND_BRACKET))
      this.addError('parseCmdWhile')

    if (!this.eat(TOKEN_NAMES.COLON))
      this.addError('parseCmdWhile')

    this.parseListaCmd()

    if (!this.eat(TOKEN_NAMES.KW_END))
      this.addError('parseCmdWhile')

    if (!this.eat(TOKEN_NAMES.SEMI_COLON))
      this.addError('parseCmdWhile')
  }

  /**
   * CmdWrite -> write ( Expressao ) ;
   */
  parseCmdWrite() {
    if (!this.eat(TOKEN_NAMES.KW_WRITE))
      this.addError('parseCmdWrite')

    if (!this.eat(TOKEN_NAMES.OPN_RND_BRACKET))
      this.addError('parseCmdWrite')

    this.parseExpressao()

    if (!this.eat(TOKEN_NAMES.CLS_RND_BRACKET))
      this.addError('parseCmdWrite')

    if (!this.eat(TOKEN_NAMES.SEMI_COLON))
      this.addError('parseCmdWrite')
  }

  /**
   * CmdAtribui -> = Expressao ;
   */
  parseCmdAtribui() {
    if (!this.eat(TOKEN_NAMES.OP_EQ))
      this.addError('parseCmdAtribui')

    this.parseExpressao()

    if (!this.eat(TOKEN_NAMES.SEMI_COLON))
      this.addError('parseCmdAtribui')
  }

  /**
   * CmdFuncao -> ( RegexExp ) ;
   */
  parseCmdFuncao() {
    if (!this.eat(TOKEN_NAMES.OPN_RND_BRACKET))
      this.addError('parseCmdFuncao')

    this.parseRegexExp()

    if (!this.eat(TOKEN_NAMES.CLS_RND_BRACKET))
      this.addError('parseCmdFuncao')

    if (!this.eat(TOKEN_NAMES.SEMI_COLON))
      this.addError('parseCmdFuncao')
  }

  /**
   * RegexExp -> Expressao RegexExpLinha | epsilon
   */
  parseRegexExp() {}

  /**
   * RegexExpLinha -> , Expressao RegexExpLinha | epsilon
   */
  parseRegexExpLinha() {
    if (this.__nextReadToken.getName() === TOKEN_NAMES.COMMA) {
      this.eat(TOKEN_NAMES.COMMA)

      this.parseExpressao()

      this.parseRegexExpLinha()
    }

    else if (this.__nextReadToken.getName() === TOKEN_NAMES.CLS_RND_BRACKET)
      return

    else
      this.addError('parseRegexExpLinha')
  }

  /**
   * Expressao -> Exp1 ExpLinha
   */
  parseExpressao() {
    this.parseExp1()
    this.parseExpLinha()
  }

  /**
   * ExpLinha -> or Exp1 ExpLinha | and Exp1 ExpLinha | epsilon
   */
  parseExpLinha() {}

  /**
   * Exp1 -> Exp2 Exp1Linha
   */
  parseExp1() {
    this.parseExp2()
    this.parseExp1Linha()
  }

  /**
   * Exp1Linha -> < Exp2 Exp1Linha | <= Exp2 Exp1Linha | > Exp2 Exp1Linha |
   * >= Exp2 Exp1Linha | == Exp2 Exp1Linha | != Exp2 Exp1Linha | epsilon
   */
  parseExp1Linha() {}

  /**
   * Exp2 -> Exp3 Exp2Linha
   */
  parseExp2() {
    this.parseExp3()
    this.parseExp2Linha()
  }

  /**
   * Exp2Linha -> + Exp3 Exp2Linha | - Exp3 Exp2Linha | epsilon
   */
  parseExp2Linha() {}

  /**
   * Exp4 Exp3Linha
   */
  parseExp3() {
    this.parseExp4()
    this.parseExp3Linha()
  }

  /**
   * Exp3Linha -> * Exp4 Exp3Linha | / Exp4 Exp3Linha | epsilon
   */
  parseExp3Linha() {}

  /**
   * Exp4 -> ID Exp4Linha | ConstInteger | ConstDouble | ConstString |
   * true | false | OpUnario Exp4 | ( Expressao )
   */
  parseExp4() {}

  /**
   * Exp4Linha -> ( RegexExp ) | epsilon
   */
  parseExp4Linha() {}

  /**
   * OpUnario -> - | !
   */
  parseOpUnario() {
    if (this.__nextReadToken.getName() === TOKEN_NAMES.OP_NGT)
      this.eat(TOKEN_NAMES.OP_NGT)

    else if (this.__nextReadToken.getName() === TOKEN_NAMES.OP_NOT)
      this.eat(TOKEN_NAMES.OP_NOT)

    else
      this.addError('parseOpUnario')
  }

  addError(expected) {
    /* @todo: implement */
  }
}

