import { Signal, type ReadonlySignal } from "@prodbysolivan/signal";
import type { Command } from "./command.ts";
import type { CommandContext, CommandSchema } from "./command.ts";

/** Settings for initializing the Interpreter. */
export interface InterpreterSettings {
  /** The name of your application. */
  name?: string;
  /** A brief description of the application. */
  description?: string;
  /** The version of the application. */
  version?: string;
}

/**
 * The core engine that processes command-line input and delegates execution
 * to registered commands.
 * @example
 * ```ts
 * const interpreter = new Interpreter({ name: "MyApp", version: "1.0.0" });
 * interpreter.addToCommands(myCommand);
 * interpreter.run(Deno.args);
 * ```
 */
export class Interpreter {
  // #region Metadata
  /** The name of the interpreter. */
  public readonly name: string = "Unnamed Interpreter";
  /** A description of the interpreter. */
  public readonly description: string = "No description provided.";
  /** The version string of the interpreter. */
  public readonly version: string = "Unknown";
  // #endregion

  // #region Lifecycle
  private _commands: Map<string, Command> = new Map();
  private _onRun: Signal<[CommandContext]> = new Signal();
  // #endregion

  /**
   * Initializes a new Interpreter instance.
   * @param settings Configuration settings for the interpreter.
   */
  constructor(settings: InterpreterSettings) {
    this.name = settings.name ?? this.name;
    this.description = settings.description ?? this.description;
    this.version = settings.version ?? this.version;
  }

  // #region Getters
  /** Returns the Map containing all registered commands. */
  public get commands(): ReadonlyMap<string, Command> {
    return this._commands;
  }

  /** * Signal emitted when the interpreter is run without any command arguments.
   * Useful for showing a welcome message or default help.
   */
  public get onRun(): ReadonlySignal<[CommandContext]> {
    return this._onRun.asReadonly();
  }
  // #endregion

  // #region Methods
  /**
   * Parses and executes a command based on the provided input array.
   * @param input An array of strings representing command-line arguments (e.g., `Deno.args`).
   */
  public run(input: string[]): void {
    if (input.length === 0) {
      this._onRun.fire({ args: {}, flags: {}, options: {} });
      return;
    }

    const [commandName, ...argumentsList] = input;
    const command = this.getFromCommands(commandName);

    if (!command) {
      console.log(`Command "${commandName}" is not recognized.`);
      const suggestion = this.findClosestCommand(commandName);
      if (suggestion) {
        console.log(`Did you mean "${suggestion}"?`);
      }
      return;
    }

    const context = this.parse(argumentsList, command.schema);
    const issues = this.lint(context, command.schema);

    if (issues.length > 0) {
      console.log(`To use "${commandName}", please provide the following:`);
      issues.forEach((issue) => console.log(` - ${issue}`));
      return;
    }

    command.run(context);
  }

  /** * Parses the raw input string array into a structured {@link CommandContext}
   * based on the provided {@link CommandSchema}.
   */
  public parse(input: string[], schema: CommandSchema): CommandContext {
    const context: CommandContext = { args: {}, flags: {}, options: {} };
    let argumentIndex = 0;

    for (let i = 0; i < input.length; i++) {
      const token = input[i];

      if (token.startsWith("-")) {
        const name = token.replace(/^-+/, "");
        const foundFlag = schema.flags.find(
          (flag) => flag.name === name || flag.alias === name,
        );
        const foundOption = schema.options.find(
          (option) => option.name === name || option.alias === name,
        );

        if (foundFlag) {
          context.flags[foundFlag.name] = true;
        } else if (foundOption) {
          const value = input[++i];
          context.options[foundOption.name] =
            foundOption.type === "number" ? Number(value) : value;
        } else {
          console.log(`Unexpected option or flag: "${token}".`);
        }
      } else if (argumentIndex < schema.arguments.length) {
        context.args[schema.arguments[argumentIndex].name] = token;
        argumentIndex++;
      } else {
        console.log(`Unexpected argument: "${token}".`);
      }
    }

    for (const option of schema.options) {
      if (
        context.options[option.name] === undefined &&
        option.default !== undefined
      ) {
        context.options[option.name] = option.default;
      }
    }

    return context;
  }

  /** Validates the current context against the command's schema constraints. */
  public lint(context: CommandContext, schema: CommandSchema): string[] {
    const issues: string[] = [];

    for (const argument of schema.arguments) {
      if (argument.required && !context.args[argument.name]) {
        issues.push(`${argument.name}: ${argument.description}`);
      }
    }

    for (const option of schema.options) {
      if (option.required && context.options[option.name] === undefined) {
        issues.push(`${option.name}: ${option.description}`);
      }
    }

    return issues;
  }

  /** Finds the closest registered command name using Levenshtein distance. */
  private findClosestCommand(input: string): string | null {
    let closest = null;
    let minDistance = 3;

    for (const name of this._commands.keys()) {
      const distance = this.levenshtein(input, name);
      if (distance < minDistance) {
        minDistance = distance;
        closest = name;
      }
    }
    return closest;
  }

  /** Calculates the Levenshtein distance between two strings. */
  private levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }
    return matrix[a.length][b.length];
  }

  /** Registers a new command to the interpreter. */
  public addToCommands(command: Command) {
    if (this._commands.has(command.name)) {
      console.log(`Command "${command.name}" is already registered.`);
      return;
    }
    this._commands.set(command.name, command);
  }

  /** Removes a command from the interpreter registry. */
  public removeFromCommands(command: Command) {
    if (!this._commands.has(command.name)) {
      console.log(`Command "${command.name}" is not registered.`);
      return;
    }
    this._commands.delete(command.name);
  }

  /** Retrieves a registered command instance by its name. */
  public getFromCommands(name: string): Command | undefined {
    return this._commands.get(name);
  }
  // #endregion
}
