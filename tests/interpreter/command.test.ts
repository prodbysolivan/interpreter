import { assertEquals } from "@std/assert";
import { Command, Interpreter } from "../../source/index.ts";

Deno.test("Command: Lifecycle and Signal", async () => {
  const interpreter = new Interpreter();

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

  testCommand.run({ arguments: {}, flags: {}, options: {} });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assertEquals(runCount, 1);
});
