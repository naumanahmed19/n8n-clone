# Delay Node

A custom node for adding execution delays to your workflows.

## Features

- Pause workflow execution for a specified duration
- Support for multiple time units (milliseconds, seconds, minutes, hours)
- Pass-through data with delay metadata
- Accurate timing information in output

## Usage

1. Add the Delay node to your workflow
2. Select the time unit (milliseconds, seconds, minutes, or hours)
3. Enter the amount of time to delay
4. The node will pause execution and then pass all input data through with additional delay information

## Parameters

- **Time Unit**: The unit of time for the delay (milliseconds, seconds, minutes, hours)
- **Amount**: The amount of time to delay (0-3600)
- **Resume On**: When to resume workflow execution (currently only "After Delay" is supported)

## Output

The node passes through all input data and adds a `delayInfo` object containing:
- Requested delay information (amount, unit, milliseconds)
- Actual delay duration
- Start and end timestamps

## Example

To delay execution for 5 seconds:
1. Set Time Unit to "Seconds"
2. Set Amount to 5
3. The workflow will pause for 5 seconds before continuing

## Use Cases

- Rate limiting API calls
- Waiting for external processes to complete
- Adding delays between workflow steps
- Testing time-dependent workflows
- Throttling workflow execution
