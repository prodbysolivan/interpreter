import { Command } from "../../command.ts";
import type { Interpreter } from "../../interpreter.ts";

export class Help extends Command {
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
            command.schema.options.forEach((opt) =>
              console.log(
                ` - --${opt.name} ${
                  opt.alias ? `(-${opt.alias}) ` : ""
                }[${opt.type}] (${
                  opt.required ? "required" : "optional"
                }): ${opt.description}${
                  opt.default !== undefined ? ` (Default: ${opt.default})` : ""
                }`,
              ),
            );
          }
          console.log("");
        }
      }
    });
  }
}
