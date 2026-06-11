import { type ReadonlySignal, Signal } from "@prodbysolivan/signal";
import type { Interpreter } from "./interpreter.ts";

/** Definition for a positional argument expected by a command. */
export interface CommandArgument {
  /** The name of the argument. */
  name: string;
  /** Description of what the argument represents. */
  description: string;
}

/** Definition for a boolean flag (e.g., --verbose or -v). */
export interface CommandFlag {
  /** The flag name (e.g., "verbose"). */
  name: string;
  /** A short single-letter alias (e.g., "v"). */
  alias?: string;
  /** Description of the flag's purpose. */
  description: string;
}

/** Definition for an option that accepts a value (e.g., --port 8080). */
export interface CommandOption {
  /** The option name. */
  name: string;
  /** A short alias. */
  alias?: string;
  /** Description of the option. */
  description: string;
  /** Whether the option is mandatory. */
  required?: boolean;
  /** Expected amount of values */
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
export interface CommandContext<
  Options = Record<string, string | number | (string | number)[]>,
> {
  /** Mapped positional arguments. */
  args: Record<string, string>;
  /** Mapped boolean flags. */
  flags: Record<string, boolean>;
  /** Mapped options and their values. */
  options: Options;
}

/** Configuration settings required to initialize a new command instance. */
export interface CommandSettings {
  /** The parent interpreter instance. */
  parent: Interpreter;
  /** The command's trigger name. */
  name: string;
  /** A description for the command */
  description?: string;
  /** The schema defining valid inputs. */
  schema?: CommandSchema;
}

/**
 * Abstract base class for creating command-line commands.
 * @template Options The interface defining the structure of the command options.
 */
export class Command<
  Options = Record<string, string | number | (string | number)[]>,
> {
  // #region Metadata
  public readonly name: string;
  public readonly description: string;
  public readonly schema: CommandSchema;
  // #endregion

  // #region Lifecycle
  private _parent: Interpreter;
  private _onRun: Signal<[CommandContext<Options>]> = new Signal();
  // #endregion

  /**
   * Initializes a new command.
   * @param settings Configuration object for the command.
   */
  constructor(settings: CommandSettings) {
    this._parent = settings.parent;
    this.name = settings.name;
    this.description = settings.description ?? "No description provided.";
    this.schema = settings.schema ?? {
      arguments: [],
      flags: [],
      options: [],
    };
  }

  // #region Getters
  /** Returns the parent interpreter instance. */
  public get parent(): Interpreter {
    return this._parent;
  }

  /** * A read-only signal that triggers when the command is executed.
   * Connect to this signal to define the command's logic.
   */
  public get onRun(): ReadonlySignal<[CommandContext<Options>]> {
    return this._onRun.asReadonly();
  }
  // #endregion

  // #region Methods
  /** * Executes the command logic.
   * @param context The parsed arguments, flags, and options.
   */
  public run(context: CommandContext<Options>) {
    this._onRun.fire(context);
  }
  // #endregion
}
