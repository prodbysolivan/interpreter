import { Command } from "../../command.ts";
import type { Interpreter } from "../../interpreter.ts";

/**
 * Built-in command that provides help information for the interpreter
 * and registered commands.
 */
export class Help extends Command {
  /**
   * Initializes the help command.
   * @param parent The parent interpreter instance.
   */
  constructor(parent: Interpreter) {
    super({
      parent,
      name: "help",
      description: "Display help information",
      schema: {
        arguments: [
          {
            name: "commandName",
            description: "Name of the command to inspect",
            required: false,
          },
        ],
        flags: [],
        options: [],
      },
    });

    this.onRun.connect((context) => {
      const commandName = context.args.commandName;
      const interpreter = this.parent;

      if (!commandName) {
        console.log(`\nUsage: ${interpreter.name} <command> [arguments]\n`);
        console.log("Available commands:");
        for (const [name, command] of interpreter.commands) {
          console.log(` - ${name}: ${command.description}`);
        }
        console.log(
          "\nType 'help <command>' to see detailed information about a specific command.\n",
        );
      } else {
        const command = interpreter.getFromCommands(commandName);
        if (!command) {
          console.log(`Error: Command '${commandName}' not found.`);
        } else {
          console.log(`\nCommand: ${command.name}`);
          console.log(`Description: ${command.description}`);

          if (command.schema.arguments.length > 0) {
            console.log("\nArguments:");
            command.schema.arguments.forEach((arg) =>
              console.log(
                ` - ${arg.name} (${
                  arg.required ? "required" : "optional"
                }): ${arg.description}`,
              ),
            );
          }

          if (command.schema.flags.length > 0) {
            console.log("\nFlags:");
            command.schema.flags.forEach((flag) =>
              console.log(
                ` - --${flag.name} ${
                  flag.alias ? `(-${flag.alias}) ` : ""
                }: ${flag.description}`,
              ),
            );
          }

          if (command.schema.options.length > 0) {
            console.log("\nOptions:");
            command.schema.options.forEach((opt) => {
              const range =
                opt.type === "number" &&
                (opt.minimum !== undefined || opt.maximum !== undefined)
                  ? ` [Range: ${opt.minimum ?? "-inf"} to ${opt.maximum ?? "inf"}]`
                  : "";

              console.log(
                ` - --${opt.name} ${
                  opt.alias ? `(-${opt.alias}) ` : ""
                }[${opt.type}] (${
                  opt.required ? "required" : "optional"
                })${range}: ${opt.description}${
                  opt.default !== undefined ? ` (Default: ${opt.default})` : ""
                }`,
              );
            });
          }
          console.log("");
        }
      }
    });
  }
}
