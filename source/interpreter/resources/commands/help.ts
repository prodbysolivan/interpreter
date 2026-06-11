import { Command } from "../../command.ts";
import type { Interpreter } from "../../interpreter.ts";
import { match } from "@prodbysolivan/match";

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
          },
        ],
        flags: [],
        options: [],
      },
    });

    this.onRun.connect((context) => {
      const commandName = context.args.commandName as string | undefined;
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
        match(interpreter.getFromCommands(commandName))
          .with("None", () => {
            console.log(`Error: Command '${commandName}' not found.`);
          })
          .with("Some", (opt) => {
            const command = opt.value;
            console.log(`\nCommand: ${command.name}`);
            console.log(`Description: ${command.description}`);

            if (command.schema.arguments.length > 0) {
              console.log("\nArguments:");
              command.schema.arguments.forEach((arg) =>
                console.log(` - ${arg.name}: ${arg.description}`)
              );
            }

            if (command.schema.flags.length > 0) {
              console.log("\nFlags:");
              command.schema.flags.forEach((flag) =>
                console.log(
                  ` - --${flag.name} ${
                    flag.alias ? `(-${flag.alias}) ` : ""
                  }: ${flag.description}`,
                )
              );
            }

            if (command.schema.options.length > 0) {
              console.log("\nOptions:");
              command.schema.options.forEach((opt) => {
                const range = opt.type === "number" &&
                    (opt.minimum !== undefined || opt.maximum !== undefined)
                  ? ` [Range: ${opt.minimum ?? "-inf"} to ${
                    opt.maximum ?? "inf"
                  }]`
                  : "";

                console.log(
                  ` - --${opt.name} ${
                    opt.alias ? `(-${opt.alias}) ` : ""
                  }[${opt.type}] (${
                    opt.required ? "required" : "optional"
                  })${range}: ${opt.description}${
                    opt.default !== undefined
                      ? ` (Default: ${opt.default})`
                      : ""
                  }`,
                );
              });
            }
            console.log("");
          })
          .run();
      }
    });
  }
}
