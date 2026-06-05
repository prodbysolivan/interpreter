# Interpreter

Object-oriented framework for building robust and type-safe CLI applications.

## Description

A modular, full OOP framework built with TypeScript. It provides a structured
architecture to define commands, manage subcommands, and handle CLI arguments
with strict typing, enabling developers to build scalable command-line
interfaces.

### Dependencies

- Deno 1.40 or higher

### Installing

Add the package to your project directly via JSR or by importing the source
files:

```bash
deno add @prodbysolivan/interpreter
```

### Quick Usage

Import the `Interpreter` or base `Command` classes into your project:

```typescript
import { Command, Interpreter } from "@prodbysolivan/interpreter";

class GreetCommand extends Command {
  execute(args: string[]) {
    console.log(`Hello, ${args[0]}!`);
  }
}

const cli = new Interpreter();
cli.register("greet", new GreetCommand());
cli.run(Deno.args);
```

## Help

For common issues regarding type definitions, ensure your `deno.json` is
configured correctly and your project is using strict mode.

## Authors

Solivan (prodbysolivan)

[@solivan](https://github.com/prodbysolivan)

## License

This project is licensed under the MIT License - see the LICENSE file for
details.

## Acknowledgments

- [Deno Documentation](https://www.google.com/search?q=https%3A%2F%2Fdocs.deno.com%2F)
- [TypeScript Handbook](https://www.google.com/search?q=https%3A%2F%2Fwww.typescriptlang.org%2Fdocs%2F)
