# Hello World Node

A simple custom node for n8n that demonstrates greeting functionality.

## Description

This node creates personalized greeting messages by combining a configurable greeting with names from input data. It's designed as a simple example to demonstrate custom node development in n8n.

## Features

- **Configurable Greeting**: Set any greeting message (default: "Hello")
- **Dynamic Name Field**: Specify which field contains the name to greet
- **Fallback to "World"**: Uses "World" when no name is found
- **Metadata Addition**: Adds timestamp and processed flag to output
- **Input Validation**: Validates required parameters and provides helpful error messages

## Node Properties

### Greeting

- **Type**: String
- **Required**: Yes
- **Default**: "Hello"
- **Description**: The greeting message to use (e.g., "Hello", "Hi", "Welcome")

### Name Field

- **Type**: String
- **Required**: No
- **Default**: "name"
- **Description**: The field in input data containing the name to greet

## Input/Output

### Input

The node expects input data with items containing a field for the name (configurable).

Example input:

```json
[
  { "name": "Alice", "age": 30 },
  { "name": "Bob", "department": "Engineering" },
  { "email": "charlie@example.com" }
]
```

### Output

The node outputs the original data plus greeting information.

Example output:

```json
[
  {
    "name": "Alice",
    "age": 30,
    "message": "Hello, Alice!",
    "timestamp": "2025-09-22T21:58:23.199Z",
    "processed": true
  },
  {
    "name": "Bob",
    "department": "Engineering",
    "message": "Hello, Bob!",
    "timestamp": "2025-09-22T21:58:23.199Z",
    "processed": true
  },
  {
    "email": "charlie@example.com",
    "message": "Hello, World!",
    "timestamp": "2025-09-22T21:58:23.199Z",
    "processed": true
  }
]
```

## Error Handling

- **Missing Greeting**: Throws an error if the greeting parameter is empty
- **Missing Name Field**: Uses "World" as fallback and logs a warning
- **Empty Input**: Returns empty array without errors

## Usage Examples

### Basic Greeting

- **Greeting**: "Hello"
- **Name Field**: "name"
- **Input**: `{"name": "Alice"}`
- **Output**: `{"name": "Alice", "message": "Hello, Alice!", ...}`

### Custom Greeting

- **Greeting**: "Welcome"
- **Name Field**: "username"
- **Input**: `{"username": "John", "role": "admin"}`
- **Output**: `{"username": "John", "role": "admin", "message": "Welcome, John!", ...}`

### Different Name Field

- **Greeting**: "Hi"
- **Name Field**: "fullName"
- **Input**: `{"fullName": "Jane Doe", "id": 123}`
- **Output**: `{"fullName": "Jane Doe", "id": 123, "message": "Hi, Jane Doe!", ...}`

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## Installation

1. Build the package:

   ```bash
   npm install
   npm run build
   ```

2. Install in n8n:
   ```bash
   npm run node-cli install /path/to/hello-world
   ```

## File Structure

```
hello-world/
├── src/
│   ├── nodes/
│   │   └── hello-world.node.ts    # Main node implementation
│   ├── types/
│   │   └── node.types.ts          # Type definitions
│   └── index.ts                   # Package entry point
├── __tests__/
│   └── hello-world.test.ts        # Unit tests
├── package.json                   # Package configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

## Technical Details

- **Node Type**: `hello-world`
- **Display Name**: `Hello World`
- **Group**: `transform`
- **Version**: `1.0.0`
- **Language**: TypeScript
- **Dependencies**: Minimal (only @types/node)

## License

This is a sample node for educational purposes.

## Installation

```bash
npm install hello-world
```

## Usage

This is a action node that can be used in n8n workflows.

### Node Properties

- **Type**: action
- **Version**: 1.0.0
- **Group**: transform

### Configuration

[Add configuration details here]

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### TypeScript

This project is written in TypeScript. Run `npm run build` to compile to JavaScript.

```bash
# Watch mode for development
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Submit a pull request

## License

MIT

## Author

n8n User
