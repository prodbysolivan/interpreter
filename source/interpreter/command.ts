import { type ReadonlySignal, Signal } from "@prodbysolivan/signal";
import type { Interpreter } from "./interpreter.ts";
import { failure, type Result, success } from "@prodbysolivan/result";
import { match } from "@prodbysolivan/match";

/** Definition for a positional argument expected by a command. */
export interface CommandArgument {
  /** Name of the argument. */
  name: string;
  /** Description of the argument's purpose. */
  description?: string;
}

/** Definition for a boolean flag */
export interface CommandFlag {
  /** Name of the flag. */
  name: string;
  /** A short alias. */
  alias?: string;
  /** Description of the flag's purpose. */
  description?: string;
}

/** Definition for an option that accepts a value. */
export interface CommandOption {
  /** Option name. */
  name: string;
  /** A short alias. */
  alias?: string;
  /** Description of the option's purpose. */
  description?: string;
  /** Whether the option is obligatory. */
  required?: boolean;
  /** Expected maximum amount of values */
  limit?: number;
  /** Expected data type of the option. */
  type: "string" | "number";
  /** Minimum value if type is number. */
  minimum?: number;
  /** Maximum value if type is number. */
  maximum?: number;
  /** A fallback value if the option is missing. */
  default?: string | number | (string | number)[];
}

/** Schema defining the structure of arguments, flags, and options for a command. */
export interface CommandSchema {
  /** List of positional arguments. */
  arguments: CommandArgument[];
  /** List of boolean flags. */
  flags: CommandFlag[];
  /** List of valued options. */
  options: CommandOption[];
}

/** The context object containing parsed inputs passed to commands during execution. */
export interface CommandContext {
  /** Mapped positional arguments. */
  arguments: Record<string, string>;
  /** Mapped boolean flags. */
  flags: Record<string, boolean>;
  /** Mapped options and their values. */
  options: Record<string, string | number | (string | number)[]>;
}

/** Configuration settings required to initialize a new command instance. */
export interface CommandSettings {
  /** Parent interpreter instance. */
  parent: Interpreter;
  /** Command's trigger name. */
  name: string;
  /** Description for the command. */
  description?: string;
  /** Schema defining valid inputs. */
  schema?: CommandSchema;
}

/**
 * Class for creating interpreter commands.
 * @template Options The interface defining the structure of the command options.
 */
export class Command {
  // #region Metadata
  /** Command's trigger name. */
  public readonly name: string;
  /** Description for the command. */
  public readonly description: string;
  /** Schema defining valid inputs. */
  public readonly schema: CommandSchema;
  // #endregion

  // #region Lifecycle
  /** Parent interpreter instance. */
  private _parent: Interpreter;
  // #endregion

  // #region Signals
  /** Signal for execution command lifecycle. */
  private _onRun: Signal<[CommandContext]> = new Signal();
  // #endregion

  /**
   * Initializes a new command.
   * @param settings Configuration object for the command.
   */
  constructor(settings: CommandSettings) {
    this._parent = settings.parent;
    this.name = settings.name;
    this.description = settings.description ?? "No description provided.";

    if (settings.schema) {
      match(this.validateSchema(settings.schema))
        .with("Failure", (failure) => {
          throw failure.error;
        })
        .with("Success", () => {})
        .run();
    }

    this.schema = settings.schema ?? {
      arguments: [],
      flags: [],
      options: [],
    };
  }

  // #region Getters
  /** Returns parent interpreter instance. */
  public get parent(): Interpreter {
    return this._parent;
  }

  /** Returns a Readonly Signal for _onRun internal signal. */
  public get onRun(): ReadonlySignal<[CommandContext]> {
    return this._onRun.asReadonly();
  }
  // #endregion

  // #region Methods
  /** * Executes the command logic.
   * @param context The parsed arguments, flags, and options.
   */
  public run(context: CommandContext): void {
    this._onRun.fire(context);
  }

  /**
   * Validates that the schema has no duplicate identifiers or aliases.
   * @param schema Schema defining valid inputs.
   * @returns A Result indicating success or failure containing a validation Error.
   */
  private validateSchema(schema: CommandSchema): Result<void, Error> {
    const names = new Set<string>();
    const aliases = new Set<string>();

    const allItems = [...schema.arguments, ...schema.flags, ...schema.options];

    for (const item of allItems) {
      if (names.has(item.name)) {
        return failure(
          new Error(`Duplicated identifier found in schema: "${item.name}"`),
        );
      }
      names.add(item.name);
    }

    for (const item of [...schema.flags, ...schema.options]) {
      if (item.alias) {
        if (aliases.has(item.alias)) {
          return failure(new Error(`Duplicated alias found: "${item.alias}"`));
        }
        aliases.add(item.alias);
      }
    }

    return success(void 0);
  }
  // #endregion
}
