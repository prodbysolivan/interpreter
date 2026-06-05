import { Interpreter } from "../../../source/interpreter/interpreter.ts";
import { Command } from "../../../source/interpreter/command.ts";
import { Help } from "../../../source/interpreter/resources/commands/help.ts";

console.log = () => {};

Deno.test("Help: Display information", async (test) => {
  const interpreter = new Interpreter({ name: "CLI" });
  const helpCommand = new Help(interpreter);
  interpreter.addToCommands(helpCommand);

  await test.step("Display general help menu", () => {
    // Registramos un comando extra para que aparezca en la lista
    const pingCommand = new (class extends Command {
      constructor(parent: Interpreter) {
        super({ parent, name: "ping", description: "Test connectivity" });
      }
    })(interpreter);
    interpreter.addToCommands(pingCommand);

    // Ejecutamos el comando help sin argumentos
    helpCommand.run({ args: {}, flags: {}, options: {} });
  });

  await test.step("Display detailed command help", () => {
    // Ejecutamos help solicitando el comando 'ping'
    helpCommand.run({
      args: { commandName: "ping" },
      flags: {},
      options: {},
    });
  });

  await test.step("Handle non-existent command in help", () => {
    // Ejecutamos help para un comando que no existe
    helpCommand.run({
      args: { commandName: "invalid" },
      flags: {},
      options: {},
    });
  });
});
