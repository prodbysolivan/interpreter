import { assertEquals } from "@std/assert";
import { Interpreter } from "../../source/interpreter/interpreter.ts";
import { Command } from "../../source/interpreter/command.ts";

console.log = () => {};

Deno.test("Interpreter: Registration Management", async (test) => {
  const interpreter = new Interpreter({ name: "CLI" });

  await test.step("Add and remove commands", () => {
    const command = new (class extends Command {
      constructor(parent: Interpreter) {
        super({ parent, name: "ping" });
      }
    })(interpreter);

    interpreter.addToCommands(command);
    assertEquals(interpreter.getFromCommands("ping"), command);

    interpreter.addToCommands(command);

    interpreter.removeFromCommands(command);
    assertEquals(interpreter.getFromCommands("ping"), undefined);

    interpreter.removeFromCommands(command);
  });
});

Deno.test("Interpreter: Input Parsing", async (test) => {
  const interpreter = new Interpreter({ name: "CLI" });

  await test.step("Parse valid arguments, flags, and options", () => {
    const command = new (class extends Command {
      constructor(parent: Interpreter) {
        super({
          parent,
          name: "operation",
          schema: {
            arguments: [
              {
                name: "target",
                description: "target argument",
                required: true,
              },
            ],
            flags: [
              {
                name: "verbose",
                alias: "v",
                description: "verbose flag",
                required: false,
              },
            ],
            options: [
              {
                name: "port",
                description: "port option",
                required: false,
                type: "number" as const,
                default: 80,
              },
            ],
          },
        });
      }
    })(interpreter);

    const context = interpreter.parse(
      ["localhost", "-v", "--port", "3000"],
      command.schema,
    );
    assertEquals(context.args.target, "localhost");
    assertEquals(context.flags.verbose, true);
    assertEquals(context.options.port, 3000);

    const contextWithDefault = interpreter.parse([], command.schema);
    assertEquals(contextWithDefault.options.port, 80);
  });

  await test.step("Parse unexpected inputs", () => {
    const schema = { arguments: [], flags: [], options: [] };
    const context = interpreter.parse(["-unknown", "extra-argument"], schema);
    assertEquals(Object.keys(context.args).length, 0);
  });
});

Deno.test("Interpreter: Schema Validation", async (test) => {
  const interpreter = new Interpreter({ name: "CLI" });

  await test.step("Lint required fields", () => {
    const schema = {
      arguments: [
        { name: "requiredArgument", description: "req", required: true },
      ],
      flags: [],
      options: [
        {
          name: "requiredOption",
          description: "opt",
          required: true,
          type: "string" as const,
        },
      ],
    };

    const issues = interpreter.lint(
      { args: {}, flags: {}, options: {} },
      schema,
    );
    assertEquals(issues.length, 2);
  });
});

Deno.test("Interpreter: Execution Edge Cases", async (test) => {
  const interpreter = new Interpreter({ name: "CLI" });

  await test.step("Handle execution errors and empty inputs", () => {
    interpreter.run([]);

    const deployCommand = new (class extends Command {
      constructor(parent: Interpreter) {
        super({ parent, name: "deploy" });
      }
    })(interpreter);
    interpreter.addToCommands(deployCommand);
    interpreter.run(["deplo"]);

    const failCommand = new (class extends Command {
      constructor(parent: Interpreter) {
        super({
          parent,
          name: "fail",
          schema: {
            arguments: [
              { name: "argument", description: "arg", required: true },
            ],
            flags: [],
            options: [],
          },
        });
      }
    })(interpreter);
    interpreter.addToCommands(failCommand);
    interpreter.run(["fail"]);
  });
});
