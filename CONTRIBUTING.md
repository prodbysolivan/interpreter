# Contributing

Thank you for your interest in contributing to this project! We value any
improvement, whether it is in the form of bug reports, suggestions for new
features, or improvements to the documentation.

To ensure an efficient collaborative environment, please follow the guidelines
described in this document.

## How to Contribute

### Reporting Issues

If you encounter a bug or unexpected behavior, please open an **Issue** in the
repository. To help us resolve it as quickly as possible, please include:

- A clear description of the problem.
- Steps to reproduce the issue.
- The version of Deno you are using (`deno --version`).
- (Optional) Screenshots or code snippets and output if is needed.

### Feature Requests

Suggestions are welcome. Please open an **Issue** describing:

- The problem the feature aims to solve.
- How you envision it working.
- Examples of usage if applicable.

### Sending Changes (Pull Requests)

1. Fork the repository.
2. Create a new branch for your changes:
   `git checkout -b feature/your-feature-name`.
3. Implement your changes, ensuring the code is clear and efficient.
4. **Run Tests**: Execute `deno task test` in your terminal to confirm that
   everything works correctly before submitting your PR.
5. Submit a **Pull Request** to the `main` branch.

## Development Standards

- **Consistency**: Maintain a uniform codebase. File naming should follow the
  project’s established convention (e.g., `kebab-case`). Consistency across the
  project is paramount.
- **Naming Conventions**: Use clear, descriptive names. Avoid overly forced or
  cryptic abbreviations (e.g., use `identifier` as `id` if widely accepted, but
  prefer `userIndex` over `u`). Always favor clarity over brevity.
- **Quality**: Keep the code clean and follow Deno's conventions by running
  `deno fmt` before each commit.
- **Consistency**: Ensure that any new functionality includes its corresponding
  tests in the `/tests` folder.
- **Typing**: This project prioritizes TypeScript. Please maintain type safety
  at all times.

## Local Environment Setup

To work on this project, ensure you have [Deno](https://deno.land/) installed.
Once you have cloned the repository, you can use the tasks defined in
`deno.json`:

- `deno test`: Runs the entire test suite.
- `deno check`: Performs type checking the project.
- `deno fmt`: Automatically formats the code.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and
professional attitude toward all contributors, regardless of their experience
level or background.