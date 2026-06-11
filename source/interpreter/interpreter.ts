import { type ReadonlySignal, Signal } from "@prodbysolivan/signal";
import { failure, type Result, success } from "@prodbysolivan/result";
import { none, type Option, some } from "@prodbysolivan/option";
import { match } from "@prodbysolivan/match";
import type { Command } from "./command.ts";
import type { CommandContext, CommandSchema } from "./command.ts";
import console from "node:console";

export interface InterpreterSettings {
  name?: string;
  description?: string;
  version?: string;
}

export class Interpreter {
  public readonly name: string = "Unnamed Interpreter";
  public readonly description: string = "No description provided.";
  public readonly version: string = "Unknown";

  private _commands: Map<string, Command> = new Map();
  private _onRun: Signal<[CommandContext]> = new Signal();

  public constructor(settings: InterpreterSettings) {
    this.name = settings.name ?? this.name;
    this.description = settings.description ?? this.description;
    this.version = settings.version ?? this.version;
  }

  public get commands(): ReadonlyMap<string, Command> {
    return this._commands;
  }

  public get onRun(): ReadonlySignal<[CommandContext]> {
    return this._onRun.asReadonly();
  }

  public run(input: string[]): void {
    if (input.length === 0) {
      this._onRun.fire({ args: {}, flags: {}, options: {} });
      return;
    }

    const [commandName, ...argumentsList] = input;
    const commandOption = this.getFromCommands(commandName);

    match(commandOption)
      .with("Some", (option) => {
        const command = option.value;
        const context = this.parse(argumentsList, command.schema);

        match(this.lint(context, command.schema))
          .with("Failure", (failure) => {
            console.log(
              `To use "${command.name}", please provide the following:`,
            );
            console.log(` - ${failure.error.message}`);
          })
          .with("Success", () => {
            command.run(context);
          })
          .run();
      })
      .with("None", () => {
        console.log(`Command "${commandName}" is not recognized.`);
        match(this.findClosestCommand(commandName))
          .with("Some", (opt) => console.log(`Did you mean "${opt.value}"?`))
          .with("None", () => {})
          .run();
      })
      .run();
  }

  public parse(input: string[], schema: CommandSchema): CommandContext {
    const context: CommandContext = { args: {}, flags: {}, options: {} };
    let argumentIndex = 0;

    for (let i = 0; i < input.length; i++) {
      const token = input[i];

      if (token.startsWith("-")) {
        const name = token.replace(/^-+/, "");
        const foundOption = schema.options.find(
          (o) => o.name === name || o.alias === name,
        );
        const foundFlag = schema.flags.find(
          (f) => f.name === name || f.alias === name,
        );

        if (foundFlag) {
          context.flags[foundFlag.name] = true;
        } else if (foundOption) {
          const rawValue = input[++i];
          context.options[foundOption.name] = rawValue;
        }
      } else if (argumentIndex < schema.arguments.length) {
        context.args[schema.arguments[argumentIndex].name] = token;
        argumentIndex++;
      }
    }

    schema.options.forEach((o) => {
      if (context.options[o.name] === undefined && o.default !== undefined) {
        context.options[o.name] = o.default;
      }
    });

    return context;
  }

  public lint(
    context: CommandContext,
    schema: CommandSchema,
  ): Result<void, Error> {
    const issues: string[] = [];

    schema.options.forEach((opt) => {
      const val = context.options[opt.name];

      if (opt.required && val === undefined) {
        issues.push(`Option --${opt.name} is required.`);
        return;
      }

      if (val !== undefined) {
        const isNumeric = /^-?\d+(\.\d+)?(,-?\d+(\.\d+)?)*$/.test(
          val as string,
        );

        // Si el esquema pide numero, validamos que sea numerico
        if (opt.type === "number" && !isNumeric) {
          issues.push(
            `Option --${opt.name} expected number, but received string.`,
          );
          return;
        }

        // Si el esquema pide string, aceptamos TODO (incluyendo numeros)
        const parts = (val as string).split(",");

        if (opt.limit && parts.length > opt.limit) {
          issues.push(
            `Option --${opt.name} exceeds max limit of ${opt.limit}.`,
          );
          return;
        }

        if (opt.type === "number" && isNumeric) {
          const numbers = parts.map(Number);
          numbers.forEach((v) => {
            if (opt.minimum !== undefined && v < opt.minimum) {
              issues.push(`--${opt.name} ${v} < min ${opt.minimum}`);
            }
            if (opt.maximum !== undefined && v > opt.maximum) {
              issues.push(`--${opt.name} ${v} > max ${opt.maximum}`);
            }
          });
        }
      }
    });

    return issues.length > 0
      ? failure(new Error(issues.join(" | ")))
      : success(void 0);
  }

  private findClosestCommand(input: string): Option<string> {
    let closest: string | null = null;
    let minDistance = 3;
    for (const name of this._commands.keys()) {
      const distance = this.levenshtein(input, name);
      if (distance < minDistance) {
        minDistance = distance;
        closest = name;
      }
    }
    return closest ? some(closest) : none();
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

  public addToCommands(command: Command): Result<void, Error> {
    if (this._commands.has(command.name)) {
      return failure(new Error(`Command ${command.name} already exists.`));
    }
    this._commands.set(command.name, command);
    return success(void 0);
  }

  public removeFromCommands(command: Command): Result<void, Error> {
    if (!this._commands.has(command.name)) {
      return failure(new Error(`Command ${command.name} not found.`));
    }
    this._commands.delete(command.name);
    return success(void 0);
  }

  public getFromCommands(name: string): Option<Command> {
    return this._commands.has(name) ? some(this._commands.get(name)!) : none();
  }
}
