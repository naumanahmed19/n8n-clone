# Node Grouping Persistence Fix

## Problem

Nodes were not staying inside groups after saving and reloading the workflow. The group properties (`parentId`, `extent`, `style`) were being stripped by the backend.

## Root Cause

The Zod validation schema in `backend/src/types/api.ts` did not include the group node properties. When validating the workflow data during save, Zod was stripping these properties because they weren't defined in the schema.

## Solution

Added the missing properties to the node schema in the Zod validation:

### File: `backend/src/types/api.ts`

```typescript
nodes: z
  .array(
    z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      parameters: z.record(z.any()),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      credentials: z.array(z.string()).optional(),
      disabled: z.boolean().default(false),
      mockData: z.any().optional(),
      // Group node properties (NEW)
      parentId: z.string().optional(),
      extent: z
        .union([
          z.literal("parent"),
          z.tuple([z.number(), z.number(), z.number(), z.number()]),
        ])
        .optional(),
      style: z
        .object({
          width: z.number().optional(),
          height: z.number().optional(),
          backgroundColor: z.string().optional(),
        })
        .passthrough() // Allow additional style properties
        .optional(),
    })
  )
  .default([]),
```

## What Changed

1. **`parentId`**: Optional string that references the parent group node ID
2. **`extent`**: Optional union type that can be either:
   - The literal string `"parent"` (most common - child stays within parent bounds)
   - A tuple of 4 numbers `[minX, minY, maxX, maxY]` (custom bounds)
3. **`style`**: Optional object for group styling:
   - `width`: Width of the group node
   - `height`: Height of the group node
   - `backgroundColor`: Background color of the group
   - `.passthrough()` allows any additional style properties

## Impact

- ✅ Group properties are now preserved when saving workflows
- ✅ Nodes stay inside their parent groups after page reload
- ✅ Backend properly validates and stores all group-related data
- ✅ No frontend workarounds needed - backend now handles properties correctly

## Testing

1. Create a workflow with multiple nodes
2. Select nodes and click "Group" to create a group
3. Save the workflow (Ctrl+S or Cmd+S)
4. Refresh the page
5. ✅ Nodes should remain inside the group

## Related Files

- **Backend**: `backend/src/types/api.ts` (Zod schema)
- **Backend**: `backend/src/types/database.ts` (TypeScript interface - already had properties)
- **Frontend**: All grouping components already had correct implementation
