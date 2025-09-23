# DateTime Node - Comprehensive Examples

This document provides detailed examples of how to use the DateTime node in your n8n workflows.

## Quick Reference

| Operation           | Purpose              | Key Parameters                            |
| ------------------- | -------------------- | ----------------------------------------- |
| getCurrentDateTime  | Get current time     | outputFormat, customFormat                |
| formatDateTime      | Convert format       | inputDateTime, outputFormat               |
| parseDateTime       | Extract components   | inputDateTime                             |
| addTime             | Add time period      | inputDateTime, timeUnit, amount           |
| subtractTime        | Subtract time period | inputDateTime, timeUnit, amount           |
| convertTimezone     | Change timezone      | inputDateTime, targetTimezone             |
| calculateDifference | Time between dates   | inputDateTime, secondDateTime, timeUnit   |
| startEndOfPeriod    | Period boundaries    | inputDateTime, period, position           |
| validateDateTime    | Check validity       | inputDateTime                             |
| compareDateTime     | Compare dates        | inputDateTime, secondDateTime, comparison |

## Detailed Examples

### 1. Get Current DateTime

**Use Case**: Timestamp your data with current time in a specific format

```javascript
// Configuration
Operation: getCurrentDateTime
Output Format: custom
Custom Format: "YYYY-MM-DD HH:mm:ss"

// Result
{
  "currentDateTime": "2025-09-23 11:27:28",
  "timestamp": 1758619648057,
  "timezone": "Europe/Amsterdam"
}
```

### 2. Format DateTime

**Use Case**: Convert ISO date to human-readable format

```javascript
// Configuration
Operation: formatDateTime
Input DateTime: "2023-12-25T10:30:00Z"
Output Format: localDateTime

// Result
{
  "formattedDateTime": "12/25/2023, 11:30:00 AM",
  "originalDateTime": "2023-12-25T10:30:00Z"
}
```

### 3. Parse DateTime

**Use Case**: Extract individual components from a datetime

```javascript
// Configuration
Operation: parseDateTime
Input DateTime: "2023-12-25T10:30:00Z"

// Result
{
  "parsedDateTime": {
    "year": 2023,
    "month": 12,
    "day": 25,
    "hour": 11,
    "minute": 30,
    "second": 0,
    "millisecond": 0,
    "dayOfWeek": 1,        // Monday = 1
    "dayOfYear": 359,      // 359th day of year
    "weekOfYear": 52,      // 52nd week of year
    "isLeapYear": false,
    "timezone": -60,       // Minutes from UTC
    "iso": "2023-12-25T10:30:00.000Z",
    "unix": 1703500200
  }
}
```

### 4. Add Time

**Use Case**: Calculate due dates, schedule future events

```javascript
// Configuration
Operation: addTime
Input DateTime: "2023-12-25T10:30:00Z"
Time Unit: days
Amount: 7
Output Format: iso

// Result
{
  "newDateTime": "2024-01-01T10:30:00.000Z",
  "originalDateTime": "2023-12-25T10:30:00Z",
  "operation": "Added 7 days"
}
```

### 5. Calculate Difference

**Use Case**: Calculate age, time until deadline, elapsed time

```javascript
// Configuration
Operation: calculateDifference
Input DateTime: "2023-12-25T10:30:00Z"
Second DateTime: "2023-12-31T23:59:59Z"
Time Unit: hours

// Result
{
  "difference": 157.5,
  "unit": "hours",
  "firstDateTime": "2023-12-25T10:30:00Z",
  "secondDateTime": "2023-12-31T23:59:59Z",
  "isFirstEarlier": true
}
```

### 6. Start/End of Period

**Use Case**: Generate reports for specific periods, find billing cycles

```javascript
// Configuration
Operation: startEndOfPeriod
Input DateTime: "2023-12-25T10:30:00Z"
Period: month
Position: start
Output Format: iso

// Result
{
  "resultDateTime": "2023-12-01T00:00:00.000Z",
  "originalDateTime": "2023-12-25T10:30:00Z",
  "period": "month",
  "position": "start"
}
```

### 7. Convert Timezone

**Use Case**: Show times in user's local timezone, coordinate global events

```javascript
// Configuration
Operation: convertTimezone
Input DateTime: "2023-12-25T10:30:00Z"
Target Timezone: America/New_York
Output Format: iso

// Result
{
  "convertedDateTime": "2023-12-25T05:30:00.000Z",
  "originalDateTime": "2023-12-25T10:30:00Z",
  "targetTimezone": "America/New_York",
  "offsetDifference": -5
}
```

### 8. Validate DateTime

**Use Case**: Validate user input, check data quality

```javascript
// Configuration
Operation: validateDateTime
Input DateTime: "2023-12-25T10:30:00Z"

// Result
{
  "isValid": true,
  "inputDateTime": "2023-12-25T10:30:00Z",
  "parsedDate": "2023-12-25T10:30:00.000Z",
  "timestamp": 1703500200000
}

// Invalid Example
Input DateTime: "invalid-date"
// Result
{
  "isValid": false,
  "inputDateTime": "invalid-date",
  "error": "Invalid datetime format"
}
```

### 9. Compare DateTime

**Use Case**: Sort events, check deadlines, filter by date ranges

```javascript
// Configuration
Operation: compareDateTime
Input DateTime: "2023-12-25T10:30:00Z"
Second DateTime: "2023-12-31T23:59:59Z"
Comparison: before

// Result
{
  "comparisonResult": true,
  "firstDateTime": "2023-12-25T10:30:00Z",
  "secondDateTime": "2023-12-31T23:59:59Z",
  "comparison": "before",
  "timeDifferenceMs": 566999000
}
```

## Common Workflow Patterns

### Pattern 1: Current Time with Custom Formatting

```
Trigger → DateTime (getCurrentDateTime) → Save to Database
```

Perfect for timestamping records with a specific format.

### Pattern 2: Age Calculation

```
HTTP Request (get user birthdate) → DateTime (calculateDifference) → Send Email
```

Calculate user age in years for birthday campaigns.

### Pattern 3: Business Day Calculation

```
Webhook → DateTime (addTime, 5 days) → Check if Weekend → Adjust → Send Response
```

Add business days while skipping weekends.

### Pattern 4: Multi-Timezone Event Scheduling

```
Form Data → DateTime (convertTimezone to UTC) → DateTime (convertTimezone to user timezone) → Calendar API
```

Handle global event scheduling across timezones.

### Pattern 5: Report Period Generation

```
Cron Trigger → DateTime (startEndOfPeriod, month, start) → DateTime (startEndOfPeriod, month, end) → Generate Report
```

Generate monthly reports with exact period boundaries.

## Tips & Best Practices

1. **Always validate datetime input** before processing in production workflows
2. **Use ISO 8601 format** for data storage and API communication
3. **Be explicit about timezones** when working with global data
4. **Use Unix timestamps** for precise time calculations
5. **Handle edge cases** like leap years, daylight saving time transitions
6. **Cache timezone conversions** for better performance in high-volume workflows

## Error Handling

The DateTime node provides detailed error information:

```javascript
// Error Result
{
  "error": "Invalid datetime: not-a-date",
  "operation": "formatDateTime",
  "inputDateTime": "not-a-date"
}
```

Always check for the `error` property in production workflows and handle accordingly.

## Custom Format Patterns

| Pattern | Description         | Example |
| ------- | ------------------- | ------- |
| YYYY    | 4-digit year        | 2023    |
| YY      | 2-digit year        | 23      |
| MM      | 2-digit month       | 12      |
| M       | Month               | 12      |
| DD      | 2-digit day         | 25      |
| D       | Day                 | 25      |
| HH      | 2-digit hour (24h)  | 14      |
| H       | Hour (24h)          | 14      |
| mm      | 2-digit minute      | 30      |
| ss      | 2-digit second      | 45      |
| SSS     | 3-digit millisecond | 123     |

### Example Custom Formats

- `YYYY-MM-DD HH:mm:ss` → `2023-12-25 14:30:45`
- `DD/MM/YYYY` → `25/12/2023`
- `M/D/YY H:mm` → `12/25/23 14:30`
- `YYYY-MM-DD` → `2023-12-25`

## Supported Timezones

### Americas

- `America/New_York` (Eastern Time)
- `America/Los_Angeles` (Pacific Time)
- `America/Chicago` (Central Time)
- `America/Denver` (Mountain Time)

### Europe

- `Europe/London` (GMT/BST)
- `Europe/Paris` (CET/CEST)
- `Europe/Berlin` (CET/CEST)
- `Europe/Rome` (CET/CEST)

### Asia

- `Asia/Tokyo` (JST)
- `Asia/Shanghai` (CST)
- `Asia/Kolkata` (IST)
- `Asia/Dubai` (GST)

### Others

- `UTC` (Coordinated Universal Time)
- `Australia/Sydney` (AEST/AEDT)

For custom timezones, use the IANA timezone database format (e.g., `Europe/Amsterdam`, `America/Sao_Paulo`).
