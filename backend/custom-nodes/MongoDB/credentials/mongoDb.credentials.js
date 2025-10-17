const MongoDbCredentials = {
  name: "mongoDb",
  displayName: "MongoDB Database",
  documentationUrl: "https://docs.mongodb.com/",
  icon: "🍃",
  color: "#13AA52",
  testable: true,
  properties: [
    {
      displayName: "Configuration Type",
      name: "configurationType",
      type: "options",
      options: [
        {
          name: "Connection String",
          value: "connectionString",
          description: "Use MongoDB connection string (recommended)",
        },
        {
          name: "Values",
          value: "values",
          description: "Enter connection details separately",
        },
      ],
      default: "connectionString",
      description: "How to configure the MongoDB connection",
    },
    {
      displayName: "Connection String",
      name: "connectionString",
      type: "text",
      displayOptions: {
        show: {
          configurationType: ["connectionString"],
        },
      },
      required: true,
      default: "",
      description:
        "MongoDB connection string (e.g., mongodb://localhost:27017/mydb or mongodb+srv://...)",
      placeholder: "mongodb://localhost:27017/mydb",
    },
    {
      displayName: "Host",
      name: "host",
      type: "text",
      displayOptions: {
        show: {
          configurationType: ["values"],
        },
      },
      required: true,
      default: "localhost",
      description: "MongoDB server host",
      placeholder: "localhost or IP address",
    },
    {
      displayName: "Port",
      name: "port",
      type: "number",
      displayOptions: {
        show: {
          configurationType: ["values"],
        },
      },
      required: true,
      default: 27017,
      description: "MongoDB server port",
    },
    {
      displayName: "Database",
      name: "database",
      type: "text",
      displayOptions: {
        show: {
          configurationType: ["values"],
        },
      },
      required: true,
      default: "",
      description: "Database name",
      placeholder: "my_database",
    },
    {
      displayName: "User",
      name: "user",
      type: "text",
      displayOptions: {
        show: {
          configurationType: ["values"],
        },
      },
      required: false,
      default: "",
      description: "Database user (optional for local MongoDB)",
      placeholder: "mongodb_user",
    },
    {
      displayName: "Password",
      name: "password",
      type: "password",
      typeOptions: {
        password: true,
      },
      displayOptions: {
        show: {
          configurationType: ["values"],
        },
      },
      required: false,
      default: "",
      description: "Database password (optional for local MongoDB)",
    },
    {
      displayName: "Use SSL/TLS",
      name: "ssl",
      type: "boolean",
      displayOptions: {
        show: {
          configurationType: ["values"],
        },
      },
      default: false,
      description: "Use SSL/TLS connection",
    },
  ],

  /**
   * Test the MongoDB connection
   */
  async test(data) {
    let connectionString = "";

    // Build connection string based on configuration type
    if (data.configurationType === "connectionString") {
      if (!data.connectionString) {
        return {
          success: false,
          message: "Connection string is required",
        };
      }
      connectionString = data.connectionString;
    } else {
      // Build connection string from individual values
      if (!data.host || !data.database) {
        return {
          success: false,
          message: "Host and database are required",
        };
      }

      const auth =
        data.user && data.password
          ? `${encodeURIComponent(data.user)}:${encodeURIComponent(
              data.password
            )}@`
          : "";
      const port = data.port || 27017;
      const sslParam = data.ssl ? "?ssl=true" : "";

      connectionString = `mongodb://${auth}${data.host}:${port}/${data.database}${sslParam}`;
    }

    // Try to connect to MongoDB
    try {
      const { MongoClient } = require("mongodb");

      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 5000,
      });

      try {
        // Connect to the MongoDB server
        await client.connect();

        // Ping the database to verify connection
        const adminDb = client.db().admin();
        const serverInfo = await adminDb.serverInfo();

        await client.close();

        return {
          success: true,
          message: `Connected successfully to MongoDB ${serverInfo.version}`,
        };
      } catch (queryError) {
        await client.close();
        throw queryError;
      }
    } catch (error) {
      // Handle specific MongoDB error codes
      if (error.code === "ECONNREFUSED") {
        return {
          success: false,
          message: `Cannot connect to database server. Connection refused.`,
        };
      } else if (error.code === "ENOTFOUND") {
        return {
          success: false,
          message: `Cannot resolve host. Please check the hostname.`,
        };
      } else if (
        error.code === "ETIMEDOUT" ||
        error.name === "MongoServerSelectionError"
      ) {
        return {
          success: false,
          message: `Connection timeout. Please check firewall and network settings.`,
        };
      } else if (
        error.code === 18 ||
        error.message.includes("Authentication failed")
      ) {
        return {
          success: false,
          message: "Authentication failed. Invalid username or password.",
        };
      } else if (error.message.includes("bad auth")) {
        return {
          success: false,
          message: "Authentication failed. Invalid credentials.",
        };
      } else if (error.message.includes("Invalid connection string")) {
        return {
          success: false,
          message: `Invalid connection string format: ${error.message}`,
        };
      } else {
        return {
          success: false,
          message: `Connection failed: ${error.message || "Unknown error"}`,
        };
      }
    }
  },
};

module.exports = MongoDbCredentials;
