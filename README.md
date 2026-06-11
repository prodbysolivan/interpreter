# Interpreter

Type-safe library for building robust command-line applications.

## Description

A modular command-line library built for TypeScript. It provides a structured
architecture to define commands, manage subcommands, and handle arguments with
strict typing, enabling developers to build scalable command-line interfaces.

### Dependencies

- Deno 1.40 or higher
- [@prodbysolivan/signal](https://jsr.io/@prodbysolivan/signal)
- [@prodbysolivan/match](https://jsr.io/@prodbysolivan/match)
- [@prodbysolivan/result](https://jsr.io/@prodbysolivan/result)
- [@prodbysolivan/option](https://jsr.io/@prodbysolivan/option)

### Installing

Add the package to your project directly via JSR:

```bash
deno add @prodbysolivan/interpreter
```

### Quick Usage

Import the `Interpreter` or base `Command` classes into your project:

```typescript
import { Command, Interpreter } from "@prodbysolivan/interpreter";

// Define a new command by extending the base Command class
class GreetCommand extends Command {
  constructor(parent: Interpreter) {
    // Register the command name and description with the parent interpreter
    super({ parent, name: "greet", description: "Say hello to someone" });

    // Define the logic to execute when the command is triggered
    this.onRun.connect((context) => {
      console.log(`Hello, ${context.arguments.name}!`);
    });
  }
}

// Initialize the application interpreter
const myInterpreter = new Interpreter();

// Register the command and execute the interpreter with CLI arguments
myInterpreter.addToCommands(new GreetCommand(myApp));
myInterpreter.run(Deno.args);
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

- [Deno Documentation](https://docs.deno.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
