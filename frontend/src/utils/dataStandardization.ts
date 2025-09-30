/**
 * Universal data standardization utilities
 * Handles all data format conversions to ensure consistent input/output across nodes
 */

export interface StandardizedItem {
  json: any;
}

/**
 * Universal helper to extract items from any standardized output format
 * Returns consistent [{json: item}, ...] format regardless of input structure
 */
export function extractItemsFromStandardizedOutput(
  data: any
): StandardizedItem[] {
  const items: StandardizedItem[] = [];

  // Handle standardized format: {main: [...], metadata: {...}}
  if (data?.main && Array.isArray(data.main)) {
    for (const item of data.main) {
      items.push(...normalizeToItemArray(item));
    }
  }
  // Fallback for legacy format: [{main: [...]}]
  else if (Array.isArray(data) && data[0]?.main) {
    for (const item of data[0].main) {
      items.push(...normalizeToItemArray(item));
    }
  }
  // Direct array fallback
  else if (Array.isArray(data)) {
    for (const item of data) {
      items.push(...normalizeToItemArray(item));
    }
  }

  return items;
}

/**
 * Universal helper to normalize any data structure to [{json: item}, ...] format
 * Handles all possible input formats and converts them consistently
 */
export function normalizeToItemArray(item: any): StandardizedItem[] {
  // Already in correct format: {json: data}
  if (item && typeof item === "object" && "json" in item) {
    // If json contains an array, expand it
    if (Array.isArray(item.json)) {
      return item.json.map((arrayItem: any) => ({ json: arrayItem }));
    }
    // If json.data contains an array, expand it (HTTP responses)
    else if (item.json?.data && Array.isArray(item.json.data)) {
      return item.json.data.map((arrayItem: any) => ({ json: arrayItem }));
    }
    // Single item with data field
    else if (item.json?.data !== undefined) {
      return [{ json: item.json.data }];
    }
    // Single item
    else {
      return [{ json: item.json }];
    }
  }
  // Direct object - wrap it
  else if (item && typeof item === "object") {
    return [{ json: item }];
  }
  // Invalid item
  else {
    return [];
  }
}

/**
 * Helper to gather input data from connected nodes with full standardization
 */
export function gatherStandardizedInputData(
  nodeId: string,
  connections: any[],
  getNodeExecutionResult: (nodeId: string) => any
): { main: StandardizedItem[] } {
  const inputData: { main: StandardizedItem[] } = { main: [] };

  // Find all connections where this node is the target
  const inputConnections = connections.filter(
    (conn) => conn.targetNodeId === nodeId
  );

  if (inputConnections.length === 0) {
    console.log("No input connections found for node", nodeId);
    return inputData;
  }

  console.log("Found input connections for", nodeId, inputConnections);

  for (const connection of inputConnections) {
    const sourceNodeId = connection.sourceNodeId;
    const sourceNodeResult = getNodeExecutionResult(sourceNodeId);

    console.log("=== STANDARDIZED: Source node result ===", {
      sourceNodeId,
      hasResult: !!sourceNodeResult,
      status: sourceNodeResult?.status,
      hasData: !!sourceNodeResult?.data,
    });

    if (
      sourceNodeResult &&
      sourceNodeResult.data &&
      sourceNodeResult.status === "success"
    ) {
      // Universal data extraction using standardized helper
      const sourceItems = extractItemsFromStandardizedOutput(
        sourceNodeResult.data
      );

      console.log("=== STANDARDIZED: Extracted items ===", {
        sourceNodeId,
        itemCount: sourceItems.length,
        items: sourceItems,
      });

      // Add all extracted items to input data
      inputData.main.push(...sourceItems);
    } else {
      console.log("No execution data found for source node", sourceNodeId);
    }
  }

  console.log("=== STANDARDIZED: Final input data ===", inputData);
  return inputData;
}
