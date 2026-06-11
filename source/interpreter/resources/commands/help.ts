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
        arguments: [],
        flags: [],
        options: [
          {
            name: "command",
            alias: "c",
            description: "Name of the command to inspect",
            type: "string",
            limit: 1,
            required: false,
          },
        ],
      },
    });

    this.onRun.connect((context) => {
      const commandName = context.options.command as string | undefined;
      const interpreter = this.parent;

      if (!commandName) {
        console.log("Available commands:");
        for (const [name, command] of interpreter.commands) {
          console.log(` - ${name}: ${command.description}`);
        }
        console.log(
          "\nType 'help --command <command>' or 'help -c <command>' to see detailed information.\n",
        );
      } else {
        match(interpreter.getFromCommands(commandName))
          .with("None", () => {
            console.log(`Error: Command '${commandName}' not found.`);
          })
          .with("Some", (option) => {
            const command = option.value;
            console.log(`\nCommand: ${command.name}`);
            console.log(`Description: ${command.description}`);

            if (command.schema.arguments.length > 0) {
              console.log("\nArguments:");
              command.schema.arguments.forEach((arg) =>
                console.log(` - ${arg.name}: ${arg.description}`),
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
              command.schema.options.forEach((option) => {
                const range =
                  option.type === "number" &&
                  (option.minimum !== undefined || option.maximum !== undefined)
                    ? ` [Range: ${option.minimum ?? "-infinite"} to ${
                        option.maximum ?? "infinite"
                      }]`
                    : "";

                console.log(
                  ` - --${option.name} ${
                    option.alias ? `(-${option.alias}) ` : ""
                  }[${option.type}] (${
                    option.required ? "required" : "optional"
                  })${range}: ${option.description}${
                    option.default !== undefined
                      ? ` (Default: ${option.default})`
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
