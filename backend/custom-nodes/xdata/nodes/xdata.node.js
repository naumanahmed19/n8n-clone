const DateTimeNode = {
  type: "dateTime",
  displayName: "DateTime",
  name: "dateTime",
  group: ["transform"],
  version: 1,
  description:
    "Comprehensive DateTime operations including formatting, parsing, arithmetic, and timezone conversions",
  icon: "fa:clock",
  color: "#FF6B35",
  defaults: {
    name: "DateTime",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      required: true,
      default: "getCurrentDateTime",
      options: [
        {
          name: "Get Current DateTime",
          value: "getCurrentDateTime",
          description: "Get the current date and time",
        },
        {
          name: "Format DateTime",
          value: "formatDateTime",
          description: "Format a datetime string",
        },
        {
          name: "Parse DateTime",
          value: "parseDateTime",
          description: "Parse a datetime string into components",
        },
        {
          name: "Add Time",
          value: "addTime",
          description: "Add time to a datetime",
        },
        {
          name: "Subtract Time",
          value: "subtractTime",
          description: "Subtract time from a datetime",
        },
        {
          name: "Convert Timezone",
          value: "convertTimezone",
          description: "Convert datetime to different timezone",
        },
        {
          name: "Calculate Difference",
          value: "calculateDifference",
          description: "Calculate difference between two datetimes",
        },
        {
          name: "Start/End of Period",
          value: "startEndOfPeriod",
          description: "Get start or end of day/week/month/year",
        },
        {
          name: "Validate DateTime",
          value: "validateDateTime",
          description: "Validate if a string is a valid datetime",
        },
        {
          name: "Compare DateTime",
          value: "compareDateTime",
          description: "Compare two datetime values",
        },
      ],
    },
    // Input DateTime field
    {
      displayName: "Input DateTime",
      name: "inputDateTime",
      type: "string",
      default: "",
      placeholder: "2023-12-25T10:30:00Z or use field from previous node",
      description:
        "The datetime to process (leave empty to use current time for applicable operations)",
      displayOptions: {
        hide: {
          operation: ["getCurrentDateTime"],
        },
      },
    },
    // Format options
    {
      displayName: "Output Format",
      name: "outputFormat",
      type: "options",
      default: "iso",
      options: [
        {
          name: "ISO 8601 (2023-12-25T10:30:00.000Z)",
          value: "iso",
        },
        {
          name: "Local Date String (12/25/2023)",
          value: "localDate",
        },
        {
          name: "Local Time String (10:30:00 AM)",
          value: "localTime",
        },
        {
          name: "Local DateTime String (12/25/2023, 10:30:00 AM)",
          value: "localDateTime",
        },
        {
          name: "Unix Timestamp (1703505000)",
          value: "unix",
        },
        {
          name: "Unix Milliseconds (1703505000000)",
          value: "unixMs",
        },
        {
          name: "Custom Format",
          value: "custom",
        },
      ],
      displayOptions: {
        show: {
          operation: [
            "getCurrentDateTime",
            "formatDateTime",
            "addTime",
            "subtractTime",
            "convertTimezone",
            "startEndOfPeriod",
          ],
        },
      },
    },
    // Custom format pattern
    {
      displayName: "Custom Format Pattern",
      name: "customFormat",
      type: "string",
      default: "YYYY-MM-DD HH:mm:ss",
      placeholder: "YYYY-MM-DD HH:mm:ss",
      description:
        "Custom format pattern (e.g., YYYY-MM-DD HH:mm:ss, DD/MM/YYYY, etc.)",
      displayOptions: {
        show: {
          operation: [
            "getCurrentDateTime",
            "formatDateTime",
            "addTime",
            "subtractTime",
            "convertTimezone",
            "startEndOfPeriod",
          ],
          outputFormat: ["custom"],
        },
      },
    },
    // Time addition/subtraction
    {
      displayName: "Time Unit",
      name: "timeUnit",
      type: "options",
      default: "days",
      options: [
        { name: "Years", value: "years" },
        { name: "Months", value: "months" },
        { name: "Weeks", value: "weeks" },
        { name: "Days", value: "days" },
        { name: "Hours", value: "hours" },
        { name: "Minutes", value: "minutes" },
        { name: "Seconds", value: "seconds" },
        { name: "Milliseconds", value: "milliseconds" },
      ],
      displayOptions: {
        show: {
          operation: ["addTime", "subtractTime", "calculateDifference"],
        },
      },
    },
    {
      displayName: "Amount",
      name: "amount",
      type: "number",
      default: 1,
      description: "Amount of time units to add/subtract",
      displayOptions: {
        show: {
          operation: ["addTime", "subtractTime"],
        },
      },
    },
    // Timezone conversion
    {
      displayName: "Target Timezone",
      name: "targetTimezone",
      type: "options",
      default: "UTC",
      options: [
        { name: "UTC", value: "UTC" },
        { name: "America/New_York (EST/EDT)", value: "America/New_York" },
        { name: "America/Los_Angeles (PST/PDT)", value: "America/Los_Angeles" },
        { name: "America/Chicago (CST/CDT)", value: "America/Chicago" },
        { name: "Europe/London (GMT/BST)", value: "Europe/London" },
        { name: "Europe/Paris (CET/CEST)", value: "Europe/Paris" },
        { name: "Europe/Berlin (CET/CEST)", value: "Europe/Berlin" },
        { name: "Asia/Tokyo (JST)", value: "Asia/Tokyo" },
        { name: "Asia/Shanghai (CST)", value: "Asia/Shanghai" },
        { name: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
        { name: "Australia/Sydney (AEST/AEDT)", value: "Australia/Sydney" },
        { name: "Custom Timezone", value: "custom" },
      ],
      displayOptions: {
        show: {
          operation: ["convertTimezone"],
        },
      },
    },
    {
      displayName: "Custom Timezone",
      name: "customTimezone",
      type: "string",
      default: "",
      placeholder: "Europe/Rome",
      description: "Enter a custom timezone (e.g., Europe/Rome, Asia/Dubai)",
      displayOptions: {
        show: {
          operation: ["convertTimezone"],
          targetTimezone: ["custom"],
        },
      },
    },
    // Second datetime for comparison/difference
    {
      displayName: "Second DateTime",
      name: "secondDateTime",
      type: "string",
      default: "",
      placeholder: "2023-12-31T23:59:59Z",
      description:
        "The second datetime for comparison or difference calculation",
      displayOptions: {
        show: {
          operation: ["calculateDifference", "compareDateTime"],
        },
      },
    },
    // Period selection for start/end operations
    {
      displayName: "Period",
      name: "period",
      type: "options",
      default: "day",
      options: [
        { name: "Day", value: "day" },
        { name: "Week", value: "week" },
        { name: "Month", value: "month" },
        { name: "Year", value: "year" },
      ],
      displayOptions: {
        show: {
          operation: ["startEndOfPeriod"],
        },
      },
    },
    {
      displayName: "Position",
      name: "position",
      type: "options",
      default: "start",
      options: [
        { name: "Start", value: "start" },
        { name: "End", value: "end" },
      ],
      displayOptions: {
        show: {
          operation: ["startEndOfPeriod"],
        },
      },
    },
    // Comparison operator
    {
      displayName: "Comparison",
      name: "comparison",
      type: "options",
      default: "equals",
      options: [
        { name: "Equals", value: "equals" },
        { name: "Before", value: "before" },
        { name: "After", value: "after" },
        { name: "Before or Equal", value: "beforeOrEqual" },
        { name: "After or Equal", value: "afterOrEqual" },
      ],
      displayOptions: {
        show: {
          operation: ["compareDateTime"],
        },
      },
    },
  ],
  execute: async function (inputData) {
    const operation = this.getNodeParameter("operation");
    const items = inputData.main?.[0] || [];

    // Helper function to parse datetime
    const parseDateTime = (dateStr) => {
      if (!dateStr) return new Date();
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid datetime: ${dateStr}`);
      }
      return date;
    };

    // Helper function to format datetime
    const formatDateTime = (date, format, customPattern) => {
      switch (format) {
        case "iso":
          return date.toISOString();
        case "localDate":
          return date.toLocaleDateString();
        case "localTime":
          return date.toLocaleTimeString();
        case "localDateTime":
          return date.toLocaleString();
        case "unix":
          return Math.floor(date.getTime() / 1000);
        case "unixMs":
          return date.getTime();
        case "custom":
          return customFormatDateTime(date, customPattern);
        default:
          return date.toISOString();
      }
    };

    // Simple custom formatter (basic implementation)
    const customFormatDateTime = (date, pattern) => {
      const map = {
        YYYY: date.getFullYear(),
        YY: String(date.getFullYear()).slice(-2),
        MM: String(date.getMonth() + 1).padStart(2, "0"),
        M: date.getMonth() + 1,
        DD: String(date.getDate()).padStart(2, "0"),
        D: date.getDate(),
        HH: String(date.getHours()).padStart(2, "0"),
        H: date.getHours(),
        mm: String(date.getMinutes()).padStart(2, "0"),
        ss: String(date.getSeconds()).padStart(2, "0"),
        SSS: String(date.getMilliseconds()).padStart(3, "0"),
      };

      let result = pattern;
      Object.keys(map).forEach((key) => {
        result = result.replace(new RegExp(key, "g"), map[key]);
      });
      return result;
    };

    const results = [];

    // If no input items, create a dummy item for operations that don't need input data
    const itemsToProcess = items.length > 0 ? items : [{ json: {} }];

    for (const item of itemsToProcess) {
      try {
        let result = { ...item.json };

        switch (operation) {
          case "getCurrentDateTime": {
            const now = new Date();
            const outputFormat = this.getNodeParameter("outputFormat");
            const customFormat = this.getNodeParameter("customFormat", "");

            result.currentDateTime = formatDateTime(
              now,
              outputFormat,
              customFormat
            );
            result.timestamp = now.getTime();
            result.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            break;
          }

          case "formatDateTime": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;
            const outputFormat = this.getNodeParameter("outputFormat");
            const customFormat = this.getNodeParameter("customFormat", "");

            const date = parseDateTime(inputDateTime);
            result.formattedDateTime = formatDateTime(
              date,
              outputFormat,
              customFormat
            );
            result.originalDateTime = inputDateTime;
            break;
          }

          case "parseDateTime": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;
            const date = parseDateTime(inputDateTime);

            result.parsedDateTime = {
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              day: date.getDate(),
              hour: date.getHours(),
              minute: date.getMinutes(),
              second: date.getSeconds(),
              millisecond: date.getMilliseconds(),
              dayOfWeek: date.getDay(),
              dayOfYear: Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) /
                  (1000 * 60 * 60 * 24)
              ),
              weekOfYear: Math.ceil(
                ((date - new Date(date.getFullYear(), 0, 1)) / 86400000 + 1) / 7
              ),
              isLeapYear: new Date(date.getFullYear(), 1, 29).getDate() === 29,
              timezone: date.getTimezoneOffset(),
              iso: date.toISOString(),
              unix: Math.floor(date.getTime() / 1000),
            };
            break;
          }

          case "addTime": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;
            const timeUnit = this.getNodeParameter("timeUnit");
            const amount = this.getNodeParameter("amount");
            const outputFormat = this.getNodeParameter("outputFormat");
            const customFormat = this.getNodeParameter("customFormat", "");

            const date = parseDateTime(inputDateTime);

            switch (timeUnit) {
              case "years":
                date.setFullYear(date.getFullYear() + amount);
                break;
              case "months":
                date.setMonth(date.getMonth() + amount);
                break;
              case "weeks":
                date.setDate(date.getDate() + amount * 7);
                break;
              case "days":
                date.setDate(date.getDate() + amount);
                break;
              case "hours":
                date.setHours(date.getHours() + amount);
                break;
              case "minutes":
                date.setMinutes(date.getMinutes() + amount);
                break;
              case "seconds":
                date.setSeconds(date.getSeconds() + amount);
                break;
              case "milliseconds":
                date.setMilliseconds(date.getMilliseconds() + amount);
                break;
            }

            result.newDateTime = formatDateTime(
              date,
              outputFormat,
              customFormat
            );
            result.originalDateTime = inputDateTime;
            result.operation = `Added ${amount} ${timeUnit}`;
            break;
          }

          case "subtractTime": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;
            const timeUnit = this.getNodeParameter("timeUnit");
            const amount = this.getNodeParameter("amount");
            const outputFormat = this.getNodeParameter("outputFormat");
            const customFormat = this.getNodeParameter("customFormat", "");

            const date = parseDateTime(inputDateTime);

            switch (timeUnit) {
              case "years":
                date.setFullYear(date.getFullYear() - amount);
                break;
              case "months":
                date.setMonth(date.getMonth() - amount);
                break;
              case "weeks":
                date.setDate(date.getDate() - amount * 7);
                break;
              case "days":
                date.setDate(date.getDate() - amount);
                break;
              case "hours":
                date.setHours(date.getHours() - amount);
                break;
              case "minutes":
                date.setMinutes(date.getMinutes() - amount);
                break;
              case "seconds":
                date.setSeconds(date.getSeconds() - amount);
                break;
              case "milliseconds":
                date.setMilliseconds(date.getMilliseconds() - amount);
                break;
            }

            result.newDateTime = formatDateTime(
              date,
              outputFormat,
              customFormat
            );
            result.originalDateTime = inputDateTime;
            result.operation = `Subtracted ${amount} ${timeUnit}`;
            break;
          }

          case "convertTimezone": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;
            let targetTimezone = this.getNodeParameter("targetTimezone");
            const outputFormat = this.getNodeParameter("outputFormat");
            const customFormat = this.getNodeParameter("customFormat", "");

            if (targetTimezone === "custom") {
              targetTimezone = this.getNodeParameter("customTimezone");
            }

            const date = parseDateTime(inputDateTime);

            // Convert to target timezone using Intl.DateTimeFormat
            const convertedDate = new Date(
              date.toLocaleString("en-US", { timeZone: targetTimezone })
            );

            result.convertedDateTime = formatDateTime(
              convertedDate,
              outputFormat,
              customFormat
            );
            result.originalDateTime = inputDateTime;
            result.targetTimezone = targetTimezone;
            result.offsetDifference =
              (date.getTimezoneOffset() - convertedDate.getTimezoneOffset()) /
              60;
            break;
          }

          case "calculateDifference": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;
            const secondDateTime = this.getNodeParameter("secondDateTime");
            const timeUnit = this.getNodeParameter("timeUnit");

            const date1 = parseDateTime(inputDateTime);
            const date2 = parseDateTime(secondDateTime);

            const diffMs = Math.abs(date2.getTime() - date1.getTime());

            let difference;
            switch (timeUnit) {
              case "years":
                difference = diffMs / (1000 * 60 * 60 * 24 * 365.25);
                break;
              case "months":
                difference = diffMs / (1000 * 60 * 60 * 24 * 30.44);
                break;
              case "weeks":
                difference = diffMs / (1000 * 60 * 60 * 24 * 7);
                break;
              case "days":
                difference = diffMs / (1000 * 60 * 60 * 24);
                break;
              case "hours":
                difference = diffMs / (1000 * 60 * 60);
                break;
              case "minutes":
                difference = diffMs / (1000 * 60);
                break;
              case "seconds":
                difference = diffMs / 1000;
                break;
              case "milliseconds":
                difference = diffMs;
                break;
            }

            result.difference = Math.round(difference * 100) / 100;
            result.unit = timeUnit;
            result.firstDateTime = inputDateTime;
            result.secondDateTime = secondDateTime;
            result.isFirstEarlier = date1 < date2;
            break;
          }

          case "startEndOfPeriod": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;
            const period = this.getNodeParameter("period");
            const position = this.getNodeParameter("position");
            const outputFormat = this.getNodeParameter("outputFormat");
            const customFormat = this.getNodeParameter("customFormat", "");

            const date = parseDateTime(inputDateTime);
            let resultDate = new Date(date);

            if (position === "start") {
              switch (period) {
                case "day":
                  resultDate.setHours(0, 0, 0, 0);
                  break;
                case "week":
                  const dayOfWeek = resultDate.getDay();
                  resultDate.setDate(resultDate.getDate() - dayOfWeek);
                  resultDate.setHours(0, 0, 0, 0);
                  break;
                case "month":
                  resultDate.setDate(1);
                  resultDate.setHours(0, 0, 0, 0);
                  break;
                case "year":
                  resultDate.setMonth(0, 1);
                  resultDate.setHours(0, 0, 0, 0);
                  break;
              }
            } else {
              switch (period) {
                case "day":
                  resultDate.setHours(23, 59, 59, 999);
                  break;
                case "week":
                  const dayOfWeek = resultDate.getDay();
                  resultDate.setDate(resultDate.getDate() + (6 - dayOfWeek));
                  resultDate.setHours(23, 59, 59, 999);
                  break;
                case "month":
                  resultDate.setMonth(resultDate.getMonth() + 1, 0);
                  resultDate.setHours(23, 59, 59, 999);
                  break;
                case "year":
                  resultDate.setMonth(11, 31);
                  resultDate.setHours(23, 59, 59, 999);
                  break;
              }
            }

            result.resultDateTime = formatDateTime(
              resultDate,
              outputFormat,
              customFormat
            );
            result.originalDateTime = inputDateTime;
            result.period = period;
            result.position = position;
            break;
          }

          case "validateDateTime": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;

            try {
              const date = new Date(inputDateTime);
              const isValid = !isNaN(date.getTime()) && inputDateTime !== "";

              result.isValid = isValid;
              result.inputDateTime = inputDateTime;
              if (isValid) {
                result.parsedDate = date.toISOString();
                result.timestamp = date.getTime();
              } else {
                result.error = "Invalid datetime format";
              }
            } catch (error) {
              result.isValid = false;
              result.inputDateTime = inputDateTime;
              result.error = error.message;
            }
            break;
          }

          case "compareDateTime": {
            const inputDateTime =
              this.getNodeParameter("inputDateTime") || item.json.dateTime;
            const secondDateTime = this.getNodeParameter("secondDateTime");
            const comparison = this.getNodeParameter("comparison");

            const date1 = parseDateTime(inputDateTime);
            const date2 = parseDateTime(secondDateTime);

            let comparisonResult;
            switch (comparison) {
              case "equals":
                comparisonResult = date1.getTime() === date2.getTime();
                break;
              case "before":
                comparisonResult = date1 < date2;
                break;
              case "after":
                comparisonResult = date1 > date2;
                break;
              case "beforeOrEqual":
                comparisonResult = date1 <= date2;
                break;
              case "afterOrEqual":
                comparisonResult = date1 >= date2;
                break;
            }

            result.comparisonResult = comparisonResult;
            result.firstDateTime = inputDateTime;
            result.secondDateTime = secondDateTime;
            result.comparison = comparison;
            result.timeDifferenceMs = Math.abs(
              date2.getTime() - date1.getTime()
            );
            break;
          }

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push({ json: result });
      } catch (error) {
        results.push({
          json: {
            ...item.json,
            error: error.message,
            operation: operation,
          },
        });
      }
    }

    return [results];
  },
};

module.exports = DateTimeNode;
