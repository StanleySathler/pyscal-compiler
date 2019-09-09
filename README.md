# Pyscal Compiler

Pyscal is a basic programming language, built for learning purposes. Its main goal is to serve as a target language for building a compiler.

## Running the compiler

Currently the compiler is not accepting source files through the command line. It always reads from a static file path (`test/mocks/code-sample-01.pys`). In case you want to change it to read a different file, you can change it [here](https://github.com/StanleySathler/pyscal-compiler/blob/master/src/index.js#L6).

It was built for [NodeJS](https://nodejs.org/en/).

To run it, all you have to do is type the following commands:

```sh
$ cd path/to/pyscal-compiler
$ node src/index.js
```
