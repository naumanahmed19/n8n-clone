import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from "../../types/node.types";

export const PostgreSQLNode: NodeDefinition = {
  type: "postgres",
  displayName: "PostgreSQL",
  name: "postgres",
  group: ["database"],
  version: 1,
  description:
    "Execute PostgreSQL queries - SELECT, INSERT, UPDATE, DELETE operations",
  icon: "🐘",
  color: "#336791",
  defaults: {
    name: "PostgreSQL",
    operation: "executeQuery",
    query: "",
    returnAll: true,
    limit: 50,
  },
  inputs: ["main"],
  outputs: ["main"],
  credentials: [
    {
      name: "postgresDb",
      displayName: "PostgreSQL Database",
      properties: [],
    },
  ],
  properties: [
    {
      displayName: "Authentication",
      name: "authentication",
      type: "credential",
      required: true,
      default: "",
      description: "Select PostgreSQL credentials to connect to the database",
      placeholder: "Select credentials...",
      allowedTypes: ["postgresDb"],
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      default: "executeQuery",
      required: true,
      options: [
        {
          name: "Execute Query",
          value: "executeQuery",
          description: "Execute a custom SQL query",
        },
        {
          name: "Insert",
          value: "insert",
          description: "Insert rows into a table",
        },
        {
          name: "Update",
          value: "update",
          description: "Update rows in a table",
        },
        {
          name: "Delete",
          value: "delete",
          description: "Delete rows from a table",
        },
        {
          name: "Select",
          value: "select",
          description: "Select rows from a table",
        },
      ],
      description: "The operation to perform on the database",
    },
    // Execute Query fields
    {
      displayName: "Query",
      name: "query",
      type: "string",
      displayOptions: {
        show: {
          operation: ["executeQuery"],
        },
      },
      default: "",
      required: true,
      description: "SQL query to execute",
      placeholder: "SELECT * FROM users WHERE status = $1",
    },
    {
      displayName: "Query Parameters",
      name: "queryParams",
      type: "string",
      displayOptions: {
        show: {
          operation: ["executeQuery"],
        },
      },
      default: "",
      description:
        "Query parameters as comma-separated values (e.g., active,123,john)",
      placeholder: "param1,param2,param3",
    },
    // Select fields
    {
      displayName: "Table",
      name: "table",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select", "insert", "update", "delete"],
        },
      },
      default: "",
      required: true,
      description: "Table name",
      placeholder: "users",
    },
    {
      displayName: "Return All",
      name: "returnAll",
      type: "boolean",
      displayOptions: {
        show: {
          operation: ["select"],
        },
      },
      default: true,
      description: "Return all results or limit the number of rows",
    },
    {
      displayName: "Limit",
      name: "limit",
      type: "number",
      displayOptions: {
        show: {
          operation: ["select"],
          returnAll: [false],
        },
      },
      default: 50,
      description: "Maximum number of rows to return",
    },
    {
      displayName: "Where Clause",
      name: "where",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select", "update", "delete"],
        },
      },
      default: "",
      description:
        "WHERE clause without the WHERE keyword (e.g., id = $1 AND status = $2)",
      placeholder: "id = $1 AND status = $2",
    },
    {
      displayName: "Where Parameters",
      name: "whereParams",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select", "update", "delete"],
        },
      },
      default: "",
      description: "Parameters for WHERE clause as comma-separated values",
      placeholder: "123,active",
    },
    {
      displayName: "Columns",
      name: "columns",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select"],
        },
      },
      default: "*",
      description: "Columns to select (comma-separated or *)",
      placeholder: "id,name,email",
    },
    {
      displayName: "Order By",
      name: "orderBy",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select"],
        },
      },
      default: "",
      description: "ORDER BY clause (e.g., created_at DESC, name ASC)",
      placeholder: "created_at DESC",
    },
    // Insert fields
    {
      displayName: "Data",
      name: "data",
      type: "json",
      displayOptions: {
        show: {
          operation: ["insert", "update"],
        },
      },
      default: "{}",
      required: true,
      description: "Data to insert/update as JSON object",
      placeholder: '{"name": "John", "email": "john@example.com"}',
    },
    {
      displayName: "Return Fields",
      name: "returnFields",
      type: "string",
      displayOptions: {
        show: {
          operation: ["insert", "update"],
        },
      },
      default: "*",
      description: "Fields to return after insert/update (e.g., id,name or *)",
      placeholder: "*",
    },
  ],

  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    const { Pool } = require("pg");
    
    const items = inputData.main?.[0] || [];
    const results = [];

    // If no input items, create a default item to ensure query executes at least once
    const itemsToProcess = items.length > 0 ? items : [{ json: {} }];

    // Get connection parameters from credentials
    const credentials = await this.getCredentials("postgresDb");

    if (!credentials || !credentials.host) {
      throw new Error(
        "PostgreSQL credentials are required. Please select credentials in the Authentication field."
      );
    }

    const operation = this.getNodeParameter("operation") as string;

    // Create connection pool
    const pool = new Pool({
      host: credentials.host,
      port: credentials.port || 5432,
      database: credentials.database,
      user: credentials.user,
      password: credentials.password,
      ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    try {
      for (const item of itemsToProcess) {
        let queryText = "";
        let queryParams: any[] = [];
        let result;

        switch (operation) {
          case "executeQuery": {
            queryText = this.getNodeParameter("query") as string;
            const paramsStr = this.getNodeParameter("queryParams") as string;

            if (paramsStr) {
              queryParams = paramsStr.split(",").map((p) => p.trim());
            }

            result = await pool.query(queryText, queryParams);

            results.push({
              json: {
                ...item.json,
                rows: result.rows,
                rowCount: result.rowCount,
                command: result.command,
                fields: result.fields?.map((f: any) => ({
                  name: f.name,
                  dataType: f.dataTypeID,
                })),
              },
            });
            break;
          }

          case "select": {
            const table = this.getNodeParameter("table") as string;
            const columns = (this.getNodeParameter("columns") as string) || "*";
            const where = this.getNodeParameter("where") as string;
            const whereParamsStr = this.getNodeParameter("whereParams") as string;
            const returnAll = this.getNodeParameter("returnAll") as boolean;
            const limit = returnAll ? null : (this.getNodeParameter("limit") as number);
            const orderBy = this.getNodeParameter("orderBy") as string;

            queryText = `SELECT ${columns} FROM ${table}`;

            if (where) {
              queryText += ` WHERE ${where}`;
              if (whereParamsStr) {
                queryParams = whereParamsStr.split(",").map((p) => p.trim());
              }
            }

            if (orderBy) {
              queryText += ` ORDER BY ${orderBy}`;
            }

            if (limit) {
              queryText += ` LIMIT ${limit}`;
            }

            result = await pool.query(queryText, queryParams);

            results.push({
              json: {
                ...item.json,
                rows: result.rows,
                rowCount: result.rowCount,
              },
            });
            break;
          }

          case "insert": {
            const table = this.getNodeParameter("table") as string;
            const dataStr = this.getNodeParameter("data") as string;
            const returnFields = (this.getNodeParameter("returnFields") as string) || "*";

            let data;
            try {
              data = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
            } catch (e: any) {
              throw new Error(`Invalid JSON data: ${e.message}`);
            }

            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

            queryText = `INSERT INTO ${table} (${columns.join(
              ", "
            )}) VALUES (${placeholders}) RETURNING ${returnFields}`;
            queryParams = values;

            result = await pool.query(queryText, queryParams);

            results.push({
              json: {
                ...item.json,
                inserted: result.rows[0],
                rowCount: result.rowCount,
              },
            });
            break;
          }

          case "update": {
            const table = this.getNodeParameter("table") as string;
            const dataStr = this.getNodeParameter("data") as string;
            const where = this.getNodeParameter("where") as string;
            const whereParamsStr = this.getNodeParameter("whereParams") as string;
            const returnFields = (this.getNodeParameter("returnFields") as string) || "*";

            if (!where) {
              throw new Error(
                "WHERE clause is required for UPDATE operation to prevent accidental updates"
              );
            }

            let data;
            try {
              data = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
            } catch (e: any) {
              throw new Error(`Invalid JSON data: ${e.message}`);
            }

            const columns = Object.keys(data);
            const values = Object.values(data);
            const setClause = columns
              .map((col, i) => `${col} = $${i + 1}`)
              .join(", ");

            queryParams = [...values];

            if (whereParamsStr) {
              const whereParams = whereParamsStr.split(",").map((p) => p.trim());
              queryParams.push(...whereParams);
            }

            queryText = `UPDATE ${table} SET ${setClause} WHERE ${where} RETURNING ${returnFields}`;

            result = await pool.query(queryText, queryParams);

            results.push({
              json: {
                ...item.json,
                updated: result.rows,
                rowCount: result.rowCount,
              },
            });
            break;
          }

          case "delete": {
            const table = this.getNodeParameter("table") as string;
            const where = this.getNodeParameter("where") as string;
            const whereParamsStr = this.getNodeParameter("whereParams") as string;

            if (!where) {
              throw new Error(
                "WHERE clause is required for DELETE operation to prevent accidental deletion"
              );
            }

            queryText = `DELETE FROM ${table} WHERE ${where}`;

            if (whereParamsStr) {
              queryParams = whereParamsStr.split(",").map((p) => p.trim());
            }

            result = await pool.query(queryText, queryParams);

            results.push({
              json: {
                ...item.json,
                deleted: true,
                rowCount: result.rowCount,
              },
            });
            break;
          }

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      }
    } finally {
      // Always close the pool
      await pool.end();
    }

    return [{ main: results }];
  },
};