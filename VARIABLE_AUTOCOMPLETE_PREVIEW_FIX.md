# Variable Autocomplete & Preview Fix

## Issue
Variables (`$vars.*` and `$local.*`) were not appearing in the autocomplete dropdown, and their values were not shown in the preview panel when used in expression fields.

## Solution Implemented

### 1. **ExpressionInput.tsx** - Added Variable Autocomplete

#### Changes:
- **Imported** `variableService` and `Variable` type
- **Added state** to store fetched variables:
  ```typescript
  const [variables, setVariables] = useState<Variable[]>([])
  ```
- **Fetch variables on mount**:
  ```typescript
  useEffect(() => {
    const fetchVariables = async () => {
      try {
        const fetchedVariables = await variableService.getVariables()
        setVariables(fetchedVariables)
      } catch (error) {
        console.error('Error fetching variables:', error)
      }
    }
    fetchVariables()
  }, [])
  ```
- **Created `getVariableAutocompleteItems()` function** that:
  - Adds base items: `$vars` and `$local` with descriptions
  - Separates variables by scope (GLOBAL vs LOCAL)
  - Creates autocomplete items for each variable:
    - Label: Variable key
    - Value: `$vars.key` or `$local.key`
    - Description: Variable description or value preview (first 50 chars)
    - Category: "Variables (Global)" or "Variables (Local)"

- **Updated `dynamicAutocompleteItems`** to include variables:
  ```typescript
  const dynamicAutocompleteItems = useMemo(() => {
    const inputFields = extractFieldsFromData(nodeId)
    const variableItems = getVariableAutocompleteItems()
    
    // Variables first for better visibility
    return [...variableItems, ...inputFields, ...defaultAutocompleteItems]
  }, [nodeId, workflowStore, variables])
  ```

### 2. **ExpressionAutocomplete.tsx** - Updated Category Order

#### Changes:
- Added "Variables", "Variables (Global)", and "Variables (Local)" to the `standardCategories` array
- Variables now appear at the **top** of the autocomplete dropdown (after input node categories)

### 3. **ExpressionPreview.tsx** - Added Variable Resolution

#### Changes:
- **Imported** `variableService` and `Variable` type, added `useState` and `useEffect`
- **Added state** to store variables:
  ```typescript
  const [variables, setVariables] = useState<Variable[]>([])
  ```
- **Fetch variables on mount** (same as ExpressionInput)

- **Updated `resolveExpression()` function** to handle variables:
  ```typescript
  // Check for $vars.* variables
  const varsMatch = expression.match(/^\$vars\.(.+)$/)
  if (varsMatch) {
    const varKey = varsMatch[1]
    const variable = variables.find(v => v.key === varKey && v.scope === 'GLOBAL')
    if (variable) {
      return variable.value
    }
    return `[Variable not found: $vars.${varKey}]`
  }
  
  // Check for $local.* variables
  const localMatch = expression.match(/^\$local\.(.+)$/)
  if (localMatch) {
    const varKey = localMatch[1]
    const variable = variables.find(v => v.key === varKey && v.scope === 'LOCAL')
    if (variable) {
      return variable.value
    }
    return `[Variable not found: $local.${varKey}]`
  }
  ```

- **Updated `getPreviewText()` function** to handle complex expressions:
  - Detects complex expressions (contains operators: `+`, `-`, `*`, `/`, `()`, etc.)
  - Replaces variables within complex expressions using regex
  - Evaluates the expression using `eval()` (safely within try-catch)
  - Example: `{{$local.apiUrl + "/endpoint"}}` → resolves `$local.apiUrl` then evaluates the concatenation

## How It Works Now

### Autocomplete:
1. Type in an expression field
2. Click the Code icon to enable expression mode
3. Type `{{$` - autocomplete shows:
   - **Variables** category with `$vars` and `$local`
   - **Variables (Global)** with all global variables (e.g., `$vars.apiUrl`)
   - **Variables (Local)** with all workflow-local variables (e.g., `$local.apiUrl`)
4. Press Enter or click to insert the variable

### Preview:
1. Simple variable: `{{$local.apiUrl}}` → Shows the actual value (e.g., `https://api.example.com`)
2. Complex expression: `{{$local.apiUrl + "/users"}}` → Shows evaluated result (e.g., `https://api.example.com/users`)
3. Missing variable: `{{$local.missing}}` → Shows `[Variable not found: $local.missing]`

## Correct Variable Syntax

### ✅ Correct:
```
$local.apiUrl
$vars.secretKey
{{$local.apiUrl + "/endpoint"}}
{{$vars.baseUrl}}
```

### ❌ Incorrect:
```
{{$local.apiUrl}}  // Don't wrap variables in {{}} unless in a complex expression
$local.api-url     // No hyphens (use camelCase or underscores)
```

**Note:** Variables are already expressions, so they don't need `{{...}}` wrapping unless you're using them in a complex expression with operators or functions.

## Files Modified

1. `frontend/src/components/ui/form-generator/ExpressionInput.tsx`
   - Added variable fetching
   - Added `getVariableAutocompleteItems()` function
   - Updated `dynamicAutocompleteItems` to include variables

2. `frontend/src/components/ui/form-generator/ExpressionAutocomplete.tsx`
   - Added variable categories to `standardCategories`

3. `frontend/src/components/ui/form-generator/ExpressionPreview.tsx`
   - Added variable fetching
   - Updated `resolveExpression()` to handle `$vars.*` and `$local.*`
   - Updated `getPreviewText()` to handle complex expressions with variables

## Testing

### Test Case 1: Simple Variable Preview
1. Create a variable: key=`apiUrl`, value=`https://api.example.com`, scope=LOCAL
2. In an HTTP Request node, click the URL field's expression mode
3. Type `{{$local.apiUrl}}`
4. **Expected:** Preview shows `https://api.example.com`

### Test Case 2: Complex Expression Preview
1. Same variable as above
2. Type `{{$local.apiUrl + "/users"}}`
3. **Expected:** Preview shows `https://api.example.com/users`

### Test Case 3: Autocomplete
1. Type `{{$`
2. **Expected:** Autocomplete shows:
   - Variables (with `$vars` and `$local`)
   - Variables (Global) - if any global variables exist
   - Variables (Local) - shows the `apiUrl` variable
3. Select `apiUrl` from Variables (Local)
4. **Expected:** Inserts `$local.apiUrl` (without the outer `{{}}`)

### Test Case 4: Variable Resolution During Execution
1. Create a workflow with a variable
2. Use the variable in a node parameter (e.g., HTTP Request URL)
3. Execute the workflow
4. **Expected:** The variable is resolved by `getNodeParameter()` (from previous fix)

## Related Documentation

- **VARIABLE_RESOLUTION_FIX.md** - Backend fix for `getNodeParameter()` to resolve variables during execution
- **ENVIRONMENTS_USER_GUIDE.md** - User guide for environments and variables
- **ENVIRONMENT_FEATURES_FINAL_ORGANIZATION.md** - Complete environment feature documentation
