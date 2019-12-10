**Author: Stanley Sathler Pinto**

----

# Pyscal Compiler

Pyscal is a basic programming language, built for learning purposes. Its main goal is to serve as a target language for building a compiler.

## Running the compiler

It was built for [NodeJS v10.16.0](https://nodejs.org/en/download/) or higher. Once you install NodeJS, [npm 6.10.1](https://www.npmjs.com/) should be automatically installed as well.

To run any command below, make sure you are under the project's root directory:

```sh
$ cd path/to/pyscal-compiler
```

### Installing the dependencies

For a better printing on the terminal, the compiler uses a few 3rd-party packages. You need to install them.

```sh
$ npm install
```

This command installs any dependencies required by the compiler.

### Running the program

Once all dependencies are installed, all you have to do is type the following commands:

```sh
$ npm start path/to/your/source/file.pys

#### OR (if you prefer)

$ node index.js path/to/your/source/file.pys
```
