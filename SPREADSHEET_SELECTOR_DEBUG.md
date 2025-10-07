# Debugging SpreadsheetSelector Loading Issues

## Fixed Issues

The following issues have been resolved:

### 1. ✅ Dropdown Not Opening

**Problem**: The dropdown wasn't opening when data was loaded on mount.

**Solution**:

- Added `setIsOpen(true)` after successful data fetch
- Added `onClick={handleFocus}` to the input to ensure click opens dropdown
- Dropdown now opens automatically after `preloadOnMount` completes

### 2. ✅ Click Outside Closes Dropdown

**Problem**: Clicking anywhere was closing the dropdown.

**Solution**:

- Added click outside handler that properly detects external clicks
- Added `stopPropagation` on container to prevent internal clicks from closing

### 3. ✅ Refresh Button Opens Dropdown

**Problem**: Clicking refresh didn't show the loaded data.

**Solution**:

- Refresh now automatically opens dropdown after fetching data
- Even errors open the dropdown to show error messages

## How to Test

### Test 1: Basic Loading

1. Open the node config with SpreadsheetSelector
2. Select a credential (if not already selected)
3. **Expected**: Dropdown should open automatically and show loading indicator
4. **Expected**: After loading, spreadsheets should be displayed

### Test 2: Manual Refresh

1. Click the refresh button (circular arrow icon)
2. **Expected**: Dropdown opens and shows loading
3. **Expected**: Updated list of spreadsheets appears

### Test 3: Search

1. Click in the input field
2. **Expected**: Dropdown opens
3. Type a search term
4. **Expected**: List filters in real-time

### Test 4: Selection

1. Click on a spreadsheet
2. **Expected**: Dropdown closes
3. **Expected**: Selected spreadsheet shows in a card
4. **Expected**: "Change" button appears

### Test 5: Clear Selection

1. With a spreadsheet selected, click "Change"
2. **Expected**: Selection clears
3. **Expected**: Input field appears again
4. **Expected**: Dropdown opens with previous results

## Common Issues and Solutions

### Issue: "Please select credentials first"

**Cause**: No `credentialId` prop passed to SpreadsheetSelector

**Solution**:

```tsx
<SpreadsheetSelector
  credentialId={selectedCredential?.id} // Make sure this is set
  value={value}
  onChange={onChange}
/>
```

### Issue: Empty list but no error

**Cause**: API returns empty array

**Check**:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click refresh button
4. Look for request to `/api/google/spreadsheets?credentialId=...`
5. Check the response

**Solution**: Verify the API is returning data in correct format:

```json
{
  "data": {
    "spreadsheets": [
      {
        "id": "sheet-id",
        "name": "Sheet Name",
        "modifiedTime": "2025-10-07T00:00:00Z"
      }
    ]
  }
}
```

### Issue: Error message displayed

**Cause**: API request failed

**Common errors**:

1. **"Google Drive API is not enabled"**

   - Go to Google Cloud Console
   - Enable Google Drive API and Google Sheets API
   - Wait 2-3 minutes

2. **"Your Google credentials have expired"**

   - Update the credential in the credentials manager
   - Re-authenticate with Google

3. **Network error**
   - Check if backend is running
   - Check if credential ID is valid
   - Check browser console for CORS issues

### Issue: Dropdown doesn't open

**Cause**: Component might be disabled

**Check**:

```tsx
// Make sure disabled prop is not true
<SpreadsheetSelector
  disabled={false} // Should be false
  credentialId={credentialId} // Should be set
/>
```

### Issue: Infinite loading

**Cause**: API request is hanging or failing silently

**Debug**:

1. Open browser console
2. Look for errors
3. Check Network tab for failed/pending requests
4. Add console.log in fetchSpreadsheets:

```tsx
const fetchSpreadsheets = async () => {
  console.log("Fetching spreadsheets with credentialId:", credentialId);

  if (!credentialId) {
    console.log("No credential ID");
    throw new Error("Please select credentials first");
  }

  try {
    const response = await fetch(/* ... */);
    console.log("Response status:", response.status);

    const result = await response.json();
    console.log("Result:", result);

    return /* ... */;
  } catch (err) {
    console.error("Fetch error:", err);
    throw err;
  }
};
```

## Manual Debug Steps

If spreadsheets still aren't loading, follow these steps:

### Step 1: Check Props

Open React DevTools and check SpreadsheetSelector props:

- `credentialId` should have a value (not undefined/null)
- `disabled` should be false
- `value` can be empty initially

### Step 2: Check Network Request

1. Open DevTools Network tab
2. Filter by "Fetch/XHR"
3. Click refresh button or load component
4. Should see: `GET /api/google/spreadsheets?credentialId=xxx`
5. Check response:
   - Status should be 200
   - Response should have `data.spreadsheets` array

### Step 3: Check Console

Look for these logs:

- ✅ "Fetching options..." (from AutoComplete)
- ✅ No errors
- ❌ Any error messages

### Step 4: Check AutoComplete State

Add temporary debugging:

```tsx
// In SpreadsheetSelector.tsx, add useEffect
import { useEffect } from "react";

export function SpreadsheetSelector({ credentialId, value, onChange }) {
  useEffect(() => {
    console.log("SpreadsheetSelector - credentialId changed:", credentialId);
  }, [credentialId]);

  // ... rest of component
}
```

### Step 5: Test with Mock Data

Temporarily bypass API to test UI:

```tsx
const fetchSpreadsheets = async (): Promise<
  AutoCompleteOption<Spreadsheet>[]
> => {
  // Comment out real API call
  // return real fetch...

  // Add mock data
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

  return [
    {
      id: "test-1",
      label: "Test Spreadsheet 1",
      value: { id: "test-1", name: "Test Spreadsheet 1" },
      metadata: { subtitle: "Modified: Today" },
    },
    {
      id: "test-2",
      label: "Test Spreadsheet 2",
      value: { id: "test-2", name: "Test Spreadsheet 2" },
      metadata: { subtitle: "Modified: Yesterday" },
    },
  ];
};
```

If mock data works but real API doesn't, the issue is with the API/backend.

## Expected Behavior Summary

✅ **On Mount** (with credentialId):

1. Shows input field with "Search spreadsheets..." placeholder
2. Refresh button appears
3. Component auto-fetches data
4. Dropdown opens automatically
5. Shows loading spinner
6. After load, displays spreadsheets

✅ **On Click Input**:

1. Dropdown opens
2. Shows cached results (if any)
3. Can search/filter

✅ **On Refresh Click**:

1. Shows loading in refresh button
2. Dropdown opens
3. Fetches fresh data
4. Updates list

✅ **On Select**:

1. Dropdown closes
2. Shows selected spreadsheet in card
3. Shows "Change" button

## Still Having Issues?

Check the following files for your setup:

1. **SpreadsheetSelector** parent component - is it passing credentialId?
2. **Backend API** - is `/api/google/spreadsheets` endpoint working?
3. **Google Credentials** - are they valid and not expired?

Add this temporary component to test AutoComplete independently:

```tsx
// TestAutoComplete.tsx
import { AutoComplete } from "@/components/ui/autocomplete";
import { useState } from "react";

export function TestAutoComplete() {
  const [value, setValue] = useState("");

  const mockFetch = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    return [
      { id: "1", label: "Option 1", value: "opt1" },
      { id: "2", label: "Option 2", value: "opt2" },
      { id: "3", label: "Option 3", value: "opt3" },
    ];
  };

  return (
    <div className="p-4">
      <h2>Test AutoComplete</h2>
      <AutoComplete
        value={value}
        onChange={setValue}
        onFetch={mockFetch}
        preloadOnMount
        placeholder="Test..."
      />
      <p className="mt-2">Selected: {value || "none"}</p>
    </div>
  );
}
```

If this test component works, the issue is in SpreadsheetSelector integration.
