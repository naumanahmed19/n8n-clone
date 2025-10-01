# Dynamic Properties Example Node

This is an example node that demonstrates the use of **dynamic properties** in n8n custom nodes.

## Overview

Instead of defining properties as a static array, this node defines properties as a **function** that returns an array of `NodeProperty[]`. This allows for dynamic property generation based on runtime conditions.

## Features

### Three Operation Types

1. **Transform** - Transform text data (uppercase, lowercase, capitalize, reverse)
2. **Filter** - Filter data based on conditions (contains, equals, startsWith, endsWith)
3. **Aggregate** - Aggregate numeric data (sum, average, count, min, max)

### Dynamic Properties

The properties are generated dynamically based on the selected operation type:
- Base properties are always shown
- Transform-specific properties only appear when "Transform" is selected
- Filter-specific properties only appear when "Filter" is selected
- Aggregate-specific properties only appear when "Aggregate" is selected

## Technical Details

### Properties Function

```typescript
properties: function(): NodeProperty[] {
  // Generate base properties
  const baseProperties = [...];
  
  // Generate conditional properties
  const transformProperties = [...];
  const filterProperties = [...];
  const aggregateProperties = [...];
  
  // Combine and return
  return [
    ...baseProperties,
    ...transformProperties,
    ...filterProperties,
    ...aggregateProperties,
  ];
}
```

### Benefits

1. **Cleaner Code**: Property generation logic is centralized
2. **Maintainability**: Easy to add/remove properties
3. **Flexibility**: Can include conditional logic
4. **Reusability**: Common property patterns can be extracted

## Usage Examples

### Transform Example

```json
{
  "operationType": "transform",
  "fieldName": "name",
  "transformAction": "uppercase"
}
```

Input:
```json
[
  { "name": "john", "age": 30 },
  { "name": "jane", "age": 25 }
]
```

Output:
```json
[
  { "name": "JOHN", "age": 30 },
  { "name": "JANE", "age": 25 }
]
```

### Filter Example

```json
{
  "operationType": "filter",
  "filterField": "age",
  "filterCondition": "equals",
  "filterValue": "30"
}
```

Input:
```json
[
  { "name": "john", "age": 30 },
  { "name": "jane", "age": 25 }
]
```

Output:
```json
[
  { "name": "john", "age": 30 }
]
```

### Aggregate Example

```json
{
  "operationType": "aggregate",
  "aggregateField": "price",
  "aggregateMethod": "sum"
}
```

Input:
```json
[
  { "item": "A", "price": 10 },
  { "item": "B", "price": 20 },
  { "item": "C", "price": 30 }
]
```

Output:
```json
[
  {
    "field": "price",
    "method": "sum",
    "result": 60,
    "count": 3
  }
]
```

## Testing

Run the tests with:

```bash
npm test -- DynamicProperties.node.test.ts
```

## Learn More

See [DYNAMIC_PROPERTIES.md](../../../docs/DYNAMIC_PROPERTIES.md) for comprehensive documentation on dynamic properties in custom nodes.
