# AutoComplete Infinite Loop Fix

## Problem

The AutoComplete component was causing a "Maximum update depth exceeded" error due to an infinite loop in the `useEffect` hook.

### Root Cause

```tsx
// ❌ PROBLEM: Circular dependency
const fetchData = useCallback(async () => {
  // ... fetch logic
  if (!selectedOption) {
    setIsOpen(true); // This was checking selectedOption
  }
  // ...
}, [onFetch, value, selectedOption]); // selectedOption in dependencies

useEffect(() => {
  if (preloadOnMount && onFetch) {
    fetchData(); // Calls fetchData
  }
}, [preloadOnMount, onFetch, fetchData]); // fetchData in dependencies
```

**The Loop:**

1. `useEffect` runs and calls `fetchData()`
2. `fetchData` may update `selectedOption`
3. `selectedOption` changes → `fetchData` is recreated (new reference)
4. `fetchData` changes → `useEffect` runs again
5. Go to step 1 → **Infinite loop!**

## Solution

### Fix 1: Remove `selectedOption` from `fetchData` dependencies

Instead of checking `selectedOption` directly, use the functional setState form:

```tsx
// ✅ FIXED: Use functional setState
const fetchData = useCallback(async () => {
  // ...
  setIsOpen((prev) => {
    // Check current state, not dependency
    if (!prev) return true;
    return prev;
  });
  // ...
}, [onFetch, value]); // No selectedOption dependency
```

### Fix 2: Inline the preload logic in `useEffect`

Instead of depending on `fetchData`, duplicate the logic directly in the effect:

```tsx
// ✅ FIXED: Inline logic, no fetchData dependency
useEffect(() => {
  if (preloadOnMount && onFetch) {
    const loadData = async () => {
      setLoading(true);
      // ... inline fetch logic
    };
    loadData();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [preloadOnMount]); // Only runs on mount
```

### Fix 3: Remove `useCallback` from `handleSearch`

The `handleSearch` function had `fetchData` in its dependencies, causing another circular reference:

```tsx
// ❌ PROBLEM
const handleSearch = useCallback(
  async (query: string) => {
    if (!query && onFetch) {
      fetchData(); // Circular dependency
    }
  },
  [onSearch, fetchData]
); // fetchData causes circular dep

// ✅ FIXED: Regular function, inline fetch logic
const handleSearch = async (query: string) => {
  if (!query && onFetch) {
    // Inline the fetch logic instead of calling fetchData
    setLoading(true);
    const result = await onFetch();
    setOptions(result);
    setLoading(false);
  }
};
```

## Changes Made

### 1. Updated `fetchData` callback

- Removed `selectedOption` from dependencies
- Used functional `setState` form to check open state
- Dependencies: `[onFetch, value]` only

### 2. Updated preload `useEffect`

- Inlined the fetch logic instead of calling `fetchData`
- Only depends on `[preloadOnMount]`
- Runs once on mount (or when preloadOnMount changes)

### 3. Updated `handleSearch` function

- Removed `useCallback` wrapper
- Inlined fetch logic for clearing search
- No circular dependencies

## Testing

After these fixes, the component should:

1. ✅ Load data on mount without infinite loop
2. ✅ Open dropdown after data loads
3. ✅ Not cause "Maximum update depth exceeded" warning
4. ✅ Refresh work correctly
5. ✅ Search work correctly
6. ✅ Selection work correctly

## Key Learnings

### 1. Be Careful with `useCallback` Dependencies

If a callback is used in a `useEffect` dependency array, and that callback updates state that it also depends on, you create a circular dependency.

### 2. Use Functional setState When Checking Previous State

Instead of:

```tsx
if (!selectedOption) setIsOpen(true); // Needs selectedOption in deps
```

Use:

```tsx
setIsOpen((prev) => (!prev ? true : prev)); // No extra dependency needed
```

### 3. Sometimes Inlining is Better

If a function is only used once and causes dependency issues, inline it:

```tsx
// Instead of
const fetchData = useCallback(() => { ... }, [deps]);
useEffect(() => { fetchData() }, [fetchData]);

// Do this
useEffect(() => {
  const loadData = () => { ... };
  loadData();
}, [minimal deps]);
```

### 4. Disable ESLint Carefully

When you're certain a dependency is not needed:

```tsx
useEffect(() => {
  // onFetch is stable, doesn't need to be in deps
}, [someValue]);
// eslint-disable-next-line react-hooks/exhaustive-deps
```

But add a comment explaining why!

## Files Modified

- `frontend/src/components/ui/autocomplete.tsx`

## Related Issues

This fixes the warning:

```
Warning: Maximum update depth exceeded. This can happen when a component
calls setState inside useEffect, but useEffect either doesn't have a
dependency array, or one of the dependencies changes on every render.
```
