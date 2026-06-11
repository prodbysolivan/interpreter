import { type ReadonlySignal, Signal } from "@prodbysolivan/signal";
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
 */
export class Interpreter {
  // #region Metadata
  public readonly name: string = "Unnamed Interpreter";
  public readonly description: string = "No description provided.";
  public readonly version: string = "Unknown";
  // #endregion

  // #region Lifecycle
  /** @internal */
  private _commands: Map<string, Command> = new Map();
  /** @internal */
  private _onRun: Signal<[CommandContext]> = new Signal();
  // #endregion

  /**
   * Initializes a new Interpreter instance.
   */
  public constructor(settings: InterpreterSettings) {
    this.name = settings.name ?? this.name;
    this.description = settings.description ?? this.description;
    this.version = settings.version ?? this.version;
  }

  // #region Getters
  public get commands(): ReadonlyMap<string, Command> {
    return this._commands;
  }

  public get onRun(): ReadonlySignal<[CommandContext]> {
    return this._onRun.asReadonly();
  }
  // #endregion

  // #region Methods
  /**
   * Parses and executes a command based on the provided input array.
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
      if (suggestion) console.log(`Did you mean "${suggestion}"?`);
      return;
    }

    try {
      const context = this.parse(argumentsList, command.schema);
      const issues = this.lint(context, command.schema);

      if (issues.length > 0) {
        console.log(`To use "${commandName}", please provide the following:`);
        issues.forEach((issue) => console.log(` - ${issue}`));
        return;
      }
      command.run(context);
    } catch (error) {
      if (error instanceof Error) console.log(`Error: ${error.message}`);
    }
  }

  /**
   * Parses raw input into a structured CommandContext.
   */
  public parse(input: string[], schema: CommandSchema): CommandContext {
    const context: CommandContext = { args: {}, flags: {}, options: {} };
    let argumentIndex = 0;

    for (let i = 0; i < input.length; i++) {
      const token = input[i];

      if (token.startsWith("-")) {
        const name = token.replace(/^-+/, "");
        const foundFlag = schema.flags.find(
          (f) => f.name === name || f.alias === name,
        );
        const foundOption = schema.options.find(
          (o) => o.name === name || o.alias === name,
        );

        if (foundFlag) {
          context.flags[foundFlag.name] = true;
        } else if (foundOption) {
          const rawValue = input[++i];
          if (rawValue === undefined) {
            throw new Error(`Option "${foundOption.name}" requires a value.`);
          }

          const cleanValue = rawValue.startsWith('"') && rawValue.endsWith('"')
            ? rawValue.slice(1, -1)
            : rawValue;
          const parts = cleanValue.split(",");

          if (
            foundOption.limit &&
            foundOption.limit > 0 &&
            parts.length > foundOption.limit
          ) {
            throw new Error(
              `Option "${foundOption.name}" allows a maximum of ${foundOption.limit} values.`,
            );
          }

          const processedValues = parts.map((part) => {
            if (foundOption.type === "number") {
              const num = Number(part);
              if (isNaN(num)) {
                throw new Error(
                  `Option "${foundOption.name}" expected a number, got "${part}"`,
                );
              }
              if (
                foundOption.minimum !== undefined &&
                num < foundOption.minimum
              ) {
                throw new Error(
                  `Option "${foundOption.name}" must be at least ${foundOption.minimum}`,
                );
              }
              if (
                foundOption.maximum !== undefined &&
                num > foundOption.maximum
              ) {
                throw new Error(
                  `Option "${foundOption.name}" must be no more than ${foundOption.maximum}`,
                );
              }
              return num;
            }
            return part;
          });

          const limit = foundOption.limit ?? 1;
          context.options[foundOption.name] = limit === 1
            ? processedValues[0]
            : processedValues;
        }
      } else if (argumentIndex < schema.arguments.length) {
        context.args[schema.arguments[argumentIndex].name] = token;
        argumentIndex++;
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

  /** Validates context against schema constraints. */
  public lint(context: CommandContext, schema: CommandSchema): string[] {
    const issues: string[] = [];
    for (const argument of schema.arguments) {
      if (context.args[argument.name] === undefined) {
        issues.push(`Missing required argument: ${argument.name}`);
      }
    }
    for (const option of schema.options) {
      const value = context.options[option.name];
      if (option.required && value === undefined) {
        issues.push(`Missing required option: --${option.name}`);
        continue;
      }
      if (value !== undefined) {
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
          if (option.type === "number") {
            if (
              option.minimum !== undefined &&
              (v as number) < option.minimum
            ) {
              issues.push(
                `Option --${option.name} must be >= ${option.minimum}`,
              );
            }
            if (
              option.maximum !== undefined &&
              (v as number) > option.maximum
            ) {
              issues.push(
                `Option --${option.name} must be <= ${option.maximum}`,
              );
            }
          }
        }
      }
    }
    return issues;
  }

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

  public addToCommands(command: Command) {
    if (!this._commands.has(command.name)) {
      this._commands.set(command.name, command);
    }
  }

  public removeFromCommands(command: Command) {
    this._commands.delete(command.name);
  }

  public getFromCommands(name: string): Command | undefined {
    return this._commands.get(name);
  }
}
