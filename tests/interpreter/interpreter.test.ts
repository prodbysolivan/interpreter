import { assertEquals } from "@std/assert";
import { Command, Interpreter } from "../../source/index.ts";
import { match } from "@prodbysolivan/match";

console.log = () => {};

Deno.test("Interpreter: Registration Management", async (test) => {
  const interpreter = new Interpreter();

  await test.step("Add and remove commands", () => {
    const command = new (class extends Command {
      constructor(parent: Interpreter) {
        super({ parent, name: "ping" });
      }
    })(interpreter);

    interpreter.addToCommands(command);

    const getResult = interpreter.getFromCommands("ping");
    match(getResult)
      .with("Some", (option) => assertEquals(option.value, command))
      .with("None", () => {
        throw new Error("Command not found");
      })
      .run();

    interpreter.removeFromCommands(command);
    const removedResult = interpreter.getFromCommands("ping");
    match(removedResult)
      .with("Some", () => {
        throw new Error("Command should be removed");
      })
      .with("None", () => {})
      .run();
  });
});

Deno.test("Interpreter: Input Parsing", async (test) => {
  const interpreter = new Interpreter();

  await test.step("Parse valid arguments, flags, and options", () => {
    const command = new (class extends Command {
      constructor(parent: Interpreter) {
        super({
          parent,
          name: "operation",
          schema: {
            arguments: [{ name: "target", description: "target argument" }],
            flags: [
              { name: "verbose", alias: "v", description: "verbose flag" },
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

    const result = interpreter.parse(
      ["localhost", "-v", "--port", "3000"],
      command.schema,
    );

    match(result)
      .with("Success", (success) => {
        const context = success.value;
        assertEquals(context.arguments.target, "localhost");
        assertEquals(context.flags.verbose, true);
        assertEquals(context.options.port, 3000);
      })
      .run();

    const defaultResult = interpreter.parse([], command.schema);
    match(defaultResult)
      .with("Success", (success) => {
        assertEquals(success.value.options.port, 80);
      })
      .run();
  });

  await test.step("Parse unexpected inputs", () => {
    const schema = { arguments: [], flags: [], options: [] };
    const result = interpreter.parse(["-unknown", "extra-argument"], schema);
    match(result)
      .with("Failure", () => {})
      .with("Success", (success) => {
        assertEquals(Object.keys(success.value.arguments).length, 0);
      })
      .run();
  });
});

Deno.test("Interpreter: Schema Validation", async (test) => {
  const interpreter = new Interpreter();

  await test.step("Lint required fields", () => {
    const schema = {
      arguments: [
        { name: "requiredArgument", description: "required argument" },
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

    const lintResult = interpreter.lint(
      { arguments: {}, flags: {}, options: {} },
      schema,
    );

    match(lintResult)
      .with("Failure", (failure) => {
        assertEquals(failure.error.message.length > 0, true);
      })
      .with("Success", () => {
        throw new Error("Should have failed validation");
      })
      .run();
  });
});

Deno.test("Interpreter: Execution Edge Cases", async (test) => {
  const interpreter = new Interpreter();

  await test.step("Handle execution errors and empty inputs", () => {
    interpreter.run([]);

    const deployCommand = new (class extends Command {
      constructor(parent: Interpreter) {
        super({ parent, name: "deploy" });
      }
    })(interpreter);
    interpreter.addToCommands(deployCommand);
    interpreter.run(["deploy"]);

    const failCommand = new (class extends Command {
      constructor(parent: Interpreter) {
        super({
          parent,
          name: "fail",
          schema: {
            arguments: [{ name: "argument", description: "arg" }],
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
