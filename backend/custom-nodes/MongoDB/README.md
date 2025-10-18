# MongoDB Node

MongoDB database node for workflow automation platform. Execute queries, insert, update, and delete documents in MongoDB collections.

## Features

- **Find Documents**: Query documents with flexible filters
- **Insert**: Add new documents to collections
- **Update**: Modify existing documents
- **Delete**: Remove documents from collections
- **Aggregate**: Run aggregation pipelines
- **Dynamic Collection Loading**: Autocomplete collections from your database

## Installation

```bash
npm install
```

## Dependencies

- `mongodb`: ^6.3.0 - Official MongoDB driver for Node.js

## Usage

1. Configure MongoDB credentials with connection string
2. Select an operation (Find, Insert, Update, Delete, Aggregate)
3. Choose your collection
4. Configure operation-specific parameters
5. Execute the node

## Operations

### Find Documents

Query documents from a collection with optional filters, projection, sorting, and limits.

### Insert

Add one or more documents to a collection.

### Update

Modify documents matching a filter. Supports update operators and options.

### Delete

Remove documents matching a filter from a collection.

### Aggregate

Execute MongoDB aggregation pipelines for complex data transformations.

## Settings

- **Connection Timeout**: Configure connection timeout (default: 5000ms)
- **Read Preference**: Set read preference (primary, secondary, etc.)

## Example Workflows

### Find Users by Status

```json
{
  "operation": "find",
  "collection": "users",
  "query": "{\"status\": \"active\"}",
  "limit": 10
}
```

### Insert New Document

```json
{
  "operation": "insert",
  "collection": "users",
  "document": "{\"name\": \"John Doe\", \"email\": \"john@example.com\"}"
}
```

### Update Documents

```json
{
  "operation": "update",
  "collection": "users",
  "query": "{\"status\": \"pending\"}",
  "update": "{\"$set\": {\"status\": \"active\"}}"
}
```
