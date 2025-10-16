const { Pool } = require("pg");

const PostgresNode = {
  type: "postgres",
  displayName: "PostgreSQL",
  name: "postgres",
  group: ["database"],
  version: 1,
  description:
    "Execute PostgreSQL queries - SELECT, INSERT, UPDATE, DELETE operations",
  icon: "file:postgres.svg",
  color: "#336791",
  defaults: {
    name: "PostgreSQL",
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Authentication",
      name: "authentication",
      type: "credential",
      required: true,
      default: "",
      description:
        "Select PostgreSQL credentials to connect to the database",
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
      typeOptions: {
        rows: 5,
      },
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
      type: "autocomplete",
      typeOptions: {
        loadOptionsMethod: "getTables",
      },
      displayOptions: {
        show: {
          operation: ["select", "insert", "update", "delete"],
        },
      },
      default: "",
      required: true,
      description: "Select a table from the database",
      placeholder: "Search and select table...",
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

  execute: async function (inputData) {
    const items = inputData.main?.[0] || [];
    const results = [];

    // If no input items, create a default item to ensure query executes at least once
    const itemsToProcess = items.length > 0 ? items : [{ json: {} }];

    // Get connection parameters from credentials
    let host, port, database, user, password, ssl;

    try {
      const credentials = await this.getCredentials("postgresDb");
      
      if (!credentials || !credentials.host) {
        throw new Error("PostgreSQL credentials are required. Please select credentials in the Authentication field.");
      }

      host = credentials.host;
      port = credentials.port || 5432;
      database = credentials.database;
      user = credentials.user;
      password = credentials.password;
      ssl = credentials.ssl || false;
      
      this.logger.info("Using PostgreSQL credentials from authentication");
    } catch (error) {
      // If credentials are not available, throw an error
      throw new Error(`Failed to get credentials: ${error.message}`);
    }

    const operation = await this.getNodeParameter("operation");

    // Create connection pool
    const pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    try {
      for (const item of itemsToProcess) {
        try {
          let queryText = "";
          let queryParams = [];
          let result;

          switch (operation) {
            case "executeQuery": {
              queryText = await this.getNodeParameter("query");
              const paramsStr = await this.getNodeParameter("queryParams");

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
                  fields: result.fields?.map((f) => ({
                    name: f.name,
                    dataType: f.dataTypeID,
                  })),
                },
              });
              break;
            }

            case "select": {
              const table = await this.getNodeParameter("table");
              const columns = await this.getNodeParameter("columns") || "*";
              const where = await this.getNodeParameter("where");
              const whereParamsStr = await this.getNodeParameter("whereParams");
              const returnAll = await this.getNodeParameter("returnAll");
              const limit = returnAll ? null : await this.getNodeParameter("limit");
              const orderBy = await this.getNodeParameter("orderBy");

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
              const table = await this.getNodeParameter("table");
              const dataStr = await this.getNodeParameter("data");
              const returnFields = await this.getNodeParameter("returnFields") || "*";

              let data;
              try {
                data =
                  typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
              } catch (e) {
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
              const table = await this.getNodeParameter("table");
              const dataStr = await this.getNodeParameter("data");
              const where = await this.getNodeParameter("where");
              const whereParamsStr = await this.getNodeParameter("whereParams");
              const returnFields = await this.getNodeParameter("returnFields") || "*";

              if (!where) {
                throw new Error(
                  "WHERE clause is required for UPDATE operation to prevent accidental updates"
                );
              }

              let data;
              try {
                data =
                  typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
              } catch (e) {
                throw new Error(`Invalid JSON data: ${e.message}`);
              }

              const columns = Object.keys(data);
              const values = Object.values(data);
              const setClause = columns
                .map((col, i) => `${col} = $${i + 1}`)
                .join(", ");

              queryParams = [...values];

              if (whereParamsStr) {
                const whereParams = whereParamsStr
                  .split(",")
                  .map((p) => p.trim());
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
              const table = await this.getNodeParameter("table");
              const where = await this.getNodeParameter("where");
              const whereParamsStr = await this.getNodeParameter("whereParams");

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
        } catch (error) {
          // Handle errors for individual items
          results.push({
            json: {
              ...item.json,
              error: true,
              errorMessage: error.message,
              errorDetails: error.toString(),
            },
          });
        }
      }
    } finally {
      // Always close the pool
      await pool.end();
    }

    return [{ main: results }];
  },

  /**
   * Load options methods - dynamically load dropdown options
   */
  loadOptions: {
    /**
     * Get list of tables from the database
     */
    async getTables() {
      // Get connection parameters from credentials
      let host, port, database, user, password, ssl;

      try {
        const credentials = await this.getCredentials("postgresDb");
        
        if (!credentials || !credentials.host) {
          return [
            {
              name: "No credentials selected",
              value: "",
              description: "Please select PostgreSQL credentials first",
            },
          ];
        }

        host = credentials.host;
        port = credentials.port || 5432;
        database = credentials.database;
        user = credentials.user;
        password = credentials.password;
        ssl = credentials.ssl || false;
      } catch (error) {
        return [
          {
            name: "Error: Credentials required",
            value: "",
            description: error.message,
          },
        ];
      }

      // Create connection pool
      const pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false,
        max: 1,
        connectionTimeoutMillis: 5000,
      });

      try {
        // Query to get all tables from public schema
        const result = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `);

        await pool.end();

        // Format results for dropdown
        return result.rows.map((row) => ({
          name: row.table_name,
          value: row.table_name,
          description: `Table: ${row.table_name}`,
        }));
      } catch (error) {
        await pool.end();
        this.logger.error("Failed to load tables", { error });

        // Return error message as option
        return [
          {
            name: "Error loading tables - check credentials",
            value: "",
            description: error.message,
          },
        ];
      }
    },
  },
};

module.exports = PostgresNode;
