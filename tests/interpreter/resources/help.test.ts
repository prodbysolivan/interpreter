import { Command, Help, Interpreter } from "../../../source/index.ts";

console.log = () => {};

Deno.test("Help: Display information", async (test) => {
  const interpreter = new Interpreter();
  const helpCommand = new Help(interpreter);
  interpreter.addToCommands(helpCommand);

  await test.step("Display general help menu", () => {
    const pingCommand = new (class extends Command {
      constructor(parent: Interpreter) {
        super({ parent, name: "ping", description: "Test connectivity" });
      }
    })(interpreter);
    interpreter.addToCommands(pingCommand);

    helpCommand.run({ arguments: {}, flags: {}, options: {} });
  });

  await test.step("Display detailed command help with range validation", () => {
    const rangeCommand = new (class extends Command {
      constructor(parent: Interpreter) {
        super({
          parent,
          name: "range-cmd",
          description: "Cmd with range",
          schema: {
            arguments: [],
            flags: [],
            options: [
              {
                name: "port",
                description: "Server port",
                required: false,
                type: "number",
                minimum: 80,
                maximum: 8080,
              },
            ],
          },
        });
      }
    })(interpreter);
    interpreter.addToCommands(rangeCommand);

    helpCommand.run({
      arguments: { commandName: "range-cmd" },
      flags: {},
      options: {},
    });
  });

  await test.step("Handle non-existent command in help", () => {
    helpCommand.run({
      arguments: { commandName: "invalid" },
      flags: {},
      options: {},
    });
  });
});
