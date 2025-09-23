# DateTime Node

A comprehensive DateTime operations node for n8n workflows that provides extensive date and time manipulation capabilities.

## Features

### Operations Available

1. **Get Current DateTime** - Retrieve the current date and time in various formats
2. **Format DateTime** - Convert datetime strings to different formats
3. **Parse DateTime** - Parse datetime strings into individual components
4. **Add Time** - Add time periods to a datetime
5. **Subtract Time** - Subtract time periods from a datetime
6. **Convert Timezone** - Convert datetime between different timezones
7. **Calculate Difference** - Calculate the difference between two datetimes
8. **Start/End of Period** - Get start or end of day/week/month/year
9. **Validate DateTime** - Validate if a string is a valid datetime
10. **Compare DateTime** - Compare two datetime values

### Supported Formats

- **ISO 8601** (2023-12-25T10:30:00.000Z)
- **Local Date** (12/25/2023)
- **Local Time** (10:30:00 AM)
- **Local DateTime** (12/25/2023, 10:30:00 AM)
- **Unix Timestamp** (1703505000)
- **Unix Milliseconds** (1703505000000)
- **Custom Format** (User-defined patterns like YYYY-MM-DD HH:mm:ss)

### Time Units Supported

- Years, Months, Weeks, Days
- Hours, Minutes, Seconds, Milliseconds

### Timezone Support

- UTC and major world timezones
- America: New York, Los Angeles, Chicago
- Europe: London, Paris, Berlin
- Asia: Tokyo, Shanghai, Kolkata
- Australia: Sydney
- Custom timezone support

## Installation

```bash
npm install datetime-node
```

## Usage

This is an action node that can be used in n8n workflows for comprehensive datetime operations.

### Node Properties

- **Type**: action
- **Version**: 1.0.0
- **Group**: transform
- **Icon**: Clock (fa:clock)

### Example Use Cases

1. **Format Current Time**

   - Operation: Get Current DateTime
   - Output Format: Custom
   - Custom Pattern: "YYYY-MM-DD HH:mm:ss"

2. **Add Business Days**

   - Operation: Add Time
   - Time Unit: Days
   - Amount: 5

3. **Convert to Different Timezone**

   - Operation: Convert Timezone
   - Target Timezone: America/New_York

4. **Calculate Age**

   - Operation: Calculate Difference
   - Time Unit: Years
   - Second DateTime: Current date

5. **Get Start of Month**
   - Operation: Start/End of Period
   - Period: Month
   - Position: Start

### Input/Output

- **Input**: Accepts datetime strings, can use data from previous nodes
- **Output**: Returns processed datetime data with original input preserved
- **Error Handling**: Invalid datetimes return error information

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Test the node
node test-datetime.js
```

## API Reference

### Parameters

- `operation`: The datetime operation to perform
- `inputDateTime`: Source datetime string (optional for current time operations)
- `outputFormat`: Desired output format
- `customFormat`: Custom format pattern for advanced formatting
- `timeUnit`: Unit for time arithmetic operations
- `amount`: Quantity for add/subtract operations
- `targetTimezone`: Target timezone for conversions
- `secondDateTime`: Second datetime for comparisons/differences
- `period`: Time period for start/end operations
- `position`: Start or end position for period operations
- `comparison`: Comparison operator for datetime comparisons

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-datetime-feature`)
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Submit a pull request

## License

MIT
