import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../../types/node.types";

export const ScheduleTriggerNode: NodeDefinition = {
  type: "schedule-trigger",
  displayName: "Schedule Trigger",
  name: "scheduleTrigger",
  group: ["trigger"],
  version: 1,
  description:
    "Triggers workflow execution on a schedule using cron expressions",
  icon: "",
  color: "#9C27B0",
  defaults: {
    cronExpression: "0 0 * * *",
    timezone: "UTC",
  },
  inputs: [],
  outputs: ["main"],
  properties: [
    {
      displayName: "Cron Expression",
      name: "cronExpression",
      type: "string",
      required: true,
      default: "0 0 * * *",
      description:
        'Cron expression defining when to trigger (e.g., "0 0 * * *" for daily at midnight)',
    },
    {
      displayName: "Timezone",
      name: "timezone",
      type: "options",
      required: true,
      default: "UTC",
      description: "Timezone for the schedule",
      options: [
        { name: "UTC", value: "UTC" },
        { name: "America/New_York", value: "America/New_York" },
        { name: "America/Chicago", value: "America/Chicago" },
        { name: "America/Denver", value: "America/Denver" },
        { name: "America/Los_Angeles", value: "America/Los_Angeles" },
        { name: "Europe/London", value: "Europe/London" },
        { name: "Europe/Paris", value: "Europe/Paris" },
        { name: "Europe/Berlin", value: "Europe/Berlin" },
        { name: "Asia/Tokyo", value: "Asia/Tokyo" },
        { name: "Asia/Shanghai", value: "Asia/Shanghai" },
        { name: "Asia/Kolkata", value: "Asia/Kolkata" },
        { name: "Australia/Sydney", value: "Australia/Sydney" },
      ],
    },
    {
      displayName: "Description",
      name: "description",
      type: "string",
      required: false,
      default: "",
      description: "Optional description for this schedule",
    },
  ],
  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    // Schedule triggers don't execute in the traditional sense
    // They are activated by the TriggerService based on cron schedule
    // This function is called when the scheduled time is reached

    const cronExpression = this.getNodeParameter("cronExpression") as string;
    const timezone = this.getNodeParameter("timezone") as string;
    const description = this.getNodeParameter("description") as string;

    return [
      {
        main: [
          {
            json: {
              scheduledAt: new Date().toISOString(),
              cronExpression,
              timezone,
              description,
              triggerType: "schedule",
            },
          },
        ],
      },
    ];
  },
};
