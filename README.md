# Interpreter

> Type-safe, modular, and object-oriented framework for building robust command-line applications.

## Description

A powerful CLI framework built with TypeScript, designed to scale with your project's complexity. It provides a structured architecture to define commands, manage nested subcommands, and handle arguments with strict typing. By utilizing a signal-driven lifecycle and the Result pattern, it ensures your CLI tools remain predictable, maintainable, and highly resilient to malformed user input.

## Features

* **Object-Oriented Architecture**: Clean separation of concerns using a modular command-based structure.
* **Strict Type Safety**: Deep type inference for options and arguments using TypeScript generics.
* **Resilient Error Handling**: Built-in support for the `Result` pattern to eliminate risky `try/catch` blocks.
* **Signal-Driven Lifecycle**: Reactive task execution powered by `@prodbysolivan/signal`.
* **Proactive Validation**: Automatic detection of alias/identifier collisions at startup.

## Getting Started

### Prerequisites

* [Deno 1.40 or higher](https://deno.land/)

### Installation

```bash
deno add @prodbysolivan/interpreter
```

## Quick Usage

```typescript
import { Command, Interpreter } from "@prodbysolivan/interpreter";

class GreetCommand extends Command {
  constructor(parent: Interpreter) {
    super({ parent, name: "greet", description: "Say hello to someone" });
    this.onRun.connect((context) => {
      console.log(`Hello, ${context.arguments.name}!`);
    });
  }
}

const myApp = new Interpreter();
myApp.addToCommands(new GreetCommand(myApp));
myApp.run(Deno.args);
```

## Documentation & Help

### Ecosystem Dependencies

* [@prodbysolivan/signal](https://jsr.io/@prodbysolivan/signal)
* [@prodbysolivan/match](https://jsr.io/@prodbysolivan/match)
* [@prodbysolivan/result](https://jsr.io/@prodbysolivan/result)
* [@prodbysolivan/option](https://jsr.io/@prodbysolivan/option)

### Troubleshooting

* **Type Errors**: Ensure your `deno.json` has `strict` mode enabled.
* **Execution Issues**: Verify that command aliases (`-`) and full flags (`--`) are correctly distinguished, as the interpreter enforces strict industry conventions.

---

## Authors

* **Solivan** ([@solivan](https://github.com/prodbysolivan))

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Acknowledgments

* [Deno Documentation](https://docs.deno.com/)
* [TypeScript Handbook](https://www.typescriptlang.org/docs/)
