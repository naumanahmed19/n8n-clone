# Counter Node

A custom nodeDrop node that maintains state and increments a counter each time it's executed.

## Features

- Maintains persistent state across executions
- Configurable increment step
- Optional reset functionality
- Returns current counter value and metadata

## Operations

- **Increment**: Adds the specified step value to the counter
- **Get Current**: Returns the current counter value without incrementing
- **Reset**: Resets the counter to the initial value

## Configuration

- **Step**: The amount to increment the counter by (default: 1)
- **Initial Value**: The starting value for the counter (default: 0)

## Output

The node returns:
- `count`: Current counter value
- `previousCount`: Previous counter value
- `step`: Increment step used
- `operation`: Operation performed
- `timestamp`: When the operation was executed