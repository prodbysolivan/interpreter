import { assertEquals } from "@std/assert";
import { Interpreter } from "../../source/interpreter/interpreter.ts";
import { Command } from "../../source/interpreter/command.ts";

Deno.test("Command: Lifecycle and Signal", () => {
  const interpreter = new Interpreter({ name: "CLI" });

  const testCommand = new (class extends Command {
    constructor(parent: Interpreter) {
      super({
        parent,
        name: "test",
        description: "Test command",
        schema: { arguments: [], flags: [], options: [] },
      });
    }
  })(interpreter);

  assertEquals(testCommand.name, "test");
  assertEquals(testCommand.description, "Test command");
  assertEquals(testCommand.parent, interpreter);

  let runCount = 0;
  testCommand.onRun.connect(() => runCount++);

  testCommand.run({ args: {}, flags: {}, options: {} });
  assertEquals(runCount, 1);
});
