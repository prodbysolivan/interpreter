import { type ReadonlySignal, Signal } from "@prodbysolivan/signal";
import { failure, type Result, success } from "@prodbysolivan/result";
import { none, type Option, some } from "@prodbysolivan/option";
import { match } from "@prodbysolivan/match";
import type { Command } from "./command.ts";
import type { CommandContext, CommandSchema } from "./command.ts";

/** Core class for managing the lifecycle of command-line applications. */
export class Interpreter {
  // #region Lifecycle
  /** Container of intepreter commands */
  private _commands: Map<string, Command> = new Map();
  // #endregion

  // #region Signals
  /** Signal for execution interpreter lifecycle */
  private _onRun: Signal<[CommandContext]> = new Signal();
  // #endregion

  // #region Getters
  /** Returns a Readonly map of the container of intepreter commands */
  public get commands(): ReadonlyMap<string, Command> {
    return this._commands;
  }

  /** Returns a Readonly Signal for _onRun internal signal */
  public get onRun(): ReadonlySignal<[CommandContext]> {
    return this._onRun.asReadonly();
  }
  // #endregion

  // #endregion
  /**
   * Parses the raw input, validates the schema, and executes the corresponding command.
   * If the command is not found, suggests the closest match.
   * @param input An array of strings representing the raw command-line arguments.
   */
  public run(input: string[]): void {
    if (input.length === 0) {
      this._onRun.fire({ arguments: {}, flags: {}, options: {} });
      return;
    }

    const [commandName, ...argumentsList] = input;
    const commandOption = this.getFromCommands(commandName);

    match(commandOption)
      .with("Some", (option) => {
        const command = option.value;

        match(this.parse(argumentsList, command.schema))
          .with("Failure", (failure) => {
            console.log(`Parsing error: ${failure.error.message}`);
          })
          .with("Success", (success) => {
            const context = success.value;
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
          .run();
      })
      .with("None", () => {
        console.log(`Command "${commandName}" is not recognized.`);
        match(this.findClosestCommand(commandName))
          .with("Some", (option) =>
            console.log(`Did you mean "${option.value}"?`),
          )
          .with("None", () => {})
          .run();
      })
      .run();
  }

  /**
   * Transforms raw command-line input strings into a structured CommandContext based on a schema.
   * Processes flags, positional arguments, and options, while handling validation and default values.
   * * @param input - The array of raw strings from the CLI.
   * @param schema - The rules and structure defining valid flags, options, and arguments.
   * @returns A Result containing the parsed CommandContext on success, or an Error if validation fails.
   */
  public parse(
    input: string[],
    schema: CommandSchema,
  ): Result<CommandContext, Error> {
    const context: CommandContext = { arguments: {}, flags: {}, options: {} };
    let argumentIndex = 0;

    for (let i = 0; i < input.length; i++) {
      const token = input[i];
      if (token.startsWith("-")) {
        const isLong = token.startsWith("--");
        const nameOrAlias = token.replace(/^-+/, "");

        let foundOption = undefined;
        let foundFlag = undefined;

        if (isLong) {
          foundOption = schema.options.find((o) => o.name === nameOrAlias);
          foundFlag = schema.flags.find((f) => f.name === nameOrAlias);
        } else {
          foundOption = schema.options.find((o) => o.alias === nameOrAlias);
          foundFlag = schema.flags.find((f) => f.alias === nameOrAlias);
        }

        if (foundFlag) {
          context.flags[foundFlag.name] = true;
        } else if (foundOption) {
          const rawValue = input[++i];
          if (rawValue === undefined) {
            return failure(new Error(`Option ${token} requires a value.`));
          }

          const parts = rawValue.split(",");
          const processed: (string | number)[] =
            foundOption.type === "number" ? parts.map(Number) : parts;

          if (foundOption.type === "number") {
            if ((processed as number[]).some(isNaN)) {
              return failure(
                new Error(`Option ${token} requires numeric values.`),
              );
            }
          }

          const limit = foundOption.limit ?? 1;
          context.options[foundOption.name] =
            limit === 1 ? processed[0] : processed;
        } else {
          return failure(new Error(`Unknown flag or option: ${token}`));
        }
      } else {
        if (argumentIndex < schema.arguments.length) {
          const argumentSchema = schema.arguments[argumentIndex];
          context.arguments[argumentSchema.name] = token;
          argumentIndex++;
        } else {
          return failure(new Error(`Unexpected extra argument: ${token}`));
        }
      }
    }

    schema.options.forEach((option) => {
      if (
        context.options[option.name] === undefined &&
        option.default !== undefined
      ) {
        const def = option.default;
        const limit = option.limit ?? 1;
        context.options[option.name] =
          limit === 1 && Array.isArray(def) ? def[0] : def;
      }
    });

    return success(context);
  }

  /**
   * Validates the parsed command context against the command schema.
   * Checks for missing required arguments/options, limit violations, and range constraints.
   * * @param context - The parsed context containing arguments, flags, and options.
   * * @param schema - The schema defining the requirements and constraints for the command.
   * * @returns A Result indicating success, or a failure containing a combined string of all validation errors.
   */
  public lint(
    context: CommandContext,
    schema: CommandSchema,
  ): Result<void, Error> {
    const issues: string[] = [];

    const missingArguments = schema.arguments.filter(
      (argument) => context.arguments[argument.name] === undefined,
    );

    if (missingArguments.length > 0) {
      const names = missingArguments
        .map((argument) => `"${argument.name}"`)
        .join(", ");
      issues.push(`Missing required arguments: ${names}`);
    }

    schema.options.forEach((option) => {
      const value = context.options[option.name];

      if (option.required && value === undefined) {
        issues.push(`Missing required option: --${option.name}`);
        return;
      }

      if (value !== undefined) {
        const values = Array.isArray(value) ? value : [value];
        if (option.limit !== undefined && values.length > option.limit) {
          issues.push(
            `Option --${option.name} has too many values (received ${values.length}, max allowed is ${option.limit})`,
          );
        }
        values.forEach((valueItem) => {
          if (typeof valueItem === "number") {
            if (option.minimum !== undefined && valueItem < option.minimum) {
              issues.push(
                `--${option.name} value ${valueItem} is less than the minimum of ${option.minimum}`,
              );
            }
            if (option.maximum !== undefined && valueItem > option.maximum) {
              issues.push(
                `--${option.name} value ${valueItem} is more than the maximum of ${option.maximum}`,
              );
            }
          }
        });
      }
    });

    return issues.length > 0
      ? failure(new Error(issues.join(" | ")))
      : success(void 0);
  }

  /**
   * Searches for the command name most similar to the provided input.
   * Uses the Levenshtein distance algorithm to find matches within a defined tolerance.
   * * @param input - The command name to search for.
   * * @returns A Some containing the closest match if found within the distance threshold, or None otherwise.
   */
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

  /**
   * Calculates the Levenshtein distance between two strings.
   * Represents the minimum number of single-character edits (insertions, deletions, or substitutions)
   * required to change one string into the other.
   * * @param source - The first string to compare.
   * * @param target - The second string to compare.
   * * @returns The integer distance representing the similarity between the two strings.
   */
  private levenshtein(source: string, target: string): number {
    const matrix: number[][] = Array.from(
      { length: source.length + 1 },
      (_, rowIndex) => [rowIndex],
    );
    for (let columnIndex = 0; columnIndex <= target.length; columnIndex++) {
      matrix[0][columnIndex] = columnIndex;
    }
    for (let rowIndex = 1; rowIndex <= source.length; rowIndex++) {
      for (let columnIndex = 1; columnIndex <= target.length; columnIndex++) {
        const cost = source[rowIndex - 1] === target[columnIndex - 1] ? 0 : 1;

        matrix[rowIndex][columnIndex] = Math.min(
          matrix[rowIndex - 1][columnIndex] + 1,
          matrix[rowIndex][columnIndex - 1] + 1,
          matrix[rowIndex - 1][columnIndex - 1] + cost,
        );
      }
    }
    return matrix[source.length][target.length];
  }

  /**
   * Registers a new command in the interpreter.
   * Validates the command schema for identifier or alias collisions before registration.
   * * @param command - The Command instance to register.
   * * @returns A Result indicating success, or a failure if the command name or schema items already exist.
   */
  public addToCommands(command: Command): Result<void, Error> {
    if (this._commands.has(command.name)) {
      return failure(new Error(`Command ${command.name} already exists.`));
    }

    const schema = command.schema;
    const names = new Set<string>();
    const aliases = new Set<string>();

    const allItems = [...schema.arguments, ...schema.flags, ...schema.options];

    for (const item of allItems) {
      if (names.has(item.name)) {
        return failure(
          new Error(`Duplicate identifier found in schema: "${item.name}"`),
        );
      }
      names.add(item.name);
    }

    for (const item of [...schema.flags, ...schema.options]) {
      if (item.alias) {
        if (aliases.has(item.alias)) {
          return failure(
            new Error(`Duplicate alias found in schema: "${item.alias}"`),
          );
        }
        aliases.add(item.alias);
      }
    }

    this._commands.set(command.name, command);
    return success(void 0);
  }

  /**
   * Removes an existing command from the interpreter.
   * * @param command - The Command instance to remove.
   * * @returns A Result indicating success, or a failure if the command was not found.
   */
  public removeFromCommands(command: Command): Result<void, Error> {
    if (!this._commands.has(command.name)) {
      return failure(new Error(`Command ${command.name} not found.`));
    }
    this._commands.delete(command.name);
    return success(void 0);
  }

  /**
   * Retrieves a registered command by its name.
   * * @param name - The name of the command to find.
   * * @returns A Some containing the Command if found, or None otherwise.
   */
  public getFromCommands(name: string): Option<Command> {
    return this._commands.has(name) ? some(this._commands.get(name)!) : none();
  }
}
