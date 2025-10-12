# Environment Save Behavior

## Problem

When a user selects and views a development environment workflow, clicking the "Save" button could accidentally update the main workflow instead of the environment they're viewing. This creates confusion and potential data loss.

## Solution

**Disable Save when viewing an environment** - The cleanest and safest approach.

### Behavior

#### Normal Workflow (No Environment Selected)

- ✅ Save button is **enabled**
- ✅ Clicking Save updates the main workflow
- ✅ Tooltip: "Save Workflow (Ctrl+S)"
- ✅ Works as expected

#### Viewing an Environment (e.g., Development)

- ❌ Save button is **disabled**
- ❌ Cannot save to main workflow
- ℹ️ Tooltip: "Cannot save - viewing Development. Use 'Update Development' instead."
- ✅ Forces user to use the correct action

### How to Update an Environment

When viewing an environment, users have clear options:

1. **Update Current Environment**

   - Click the dropdown arrow next to Save button
   - Select "Update Development" (or whichever environment is selected)
   - Opens UpdateEnvironmentDialog with version options

2. **Exit Environment View**

   - Click the environment selector
   - Select "Exit [Environment Name]" at the top
   - Returns to main workflow
   - Save button becomes enabled again

3. **Manual Deployment**
   - Use "Manual Deployment" from workflow settings dropdown
   - Choose source and target environments
   - Full control over deployment options

## Implementation Details

### Files Modified

1. **WorkflowToolbar.tsx**

   - Added `|| selectedEnvironment !== null` to Save button disabled condition
   - Updated tooltip to show helpful message when viewing environment
   - Disabled dropdown trigger when viewing environment

2. **useWorkflowOperations.ts**
   - Reverted smart save logic (kept simple)
   - Save only updates main workflow
   - No environment-specific save logic

### Code Changes

```typescript
// Save button disabled when viewing environment
disabled={isSaving || (!isDirty && !mainTitleDirty) || selectedEnvironment !== null}

// Tooltip shows context-aware message
{selectedEnvironment
  ? `Cannot save - viewing ${getEnvironmentLabel(selectedEnvironment)}. Use "Update ${getEnvironmentLabel(selectedEnvironment)}" instead.`
  : `Save Workflow (Ctrl+S)${(isDirty || mainTitleDirty) ? ' - Unsaved changes' : ' - No changes'}`}
```

## User Experience Flow

### Scenario 1: User wants to test changes in Development

```
1. User makes changes to main workflow
2. User clicks Save → Main workflow updated ✅
3. User selects "Development" from environment selector
4. Development workflow loads automatically
5. User makes more changes
6. Save button is DISABLED (greyed out)
7. User opens Save dropdown → clicks "Update Development"
8. UpdateEnvironmentDialog opens
9. User updates Development environment ✅
```

### Scenario 2: User is confused about what Save does

```
1. User selects "Staging" to view
2. User makes changes
3. User hovers over disabled Save button
4. Tooltip: "Cannot save - viewing Staging. Use 'Update Staging' instead."
5. User understands: Need to use Update button ✅
6. Clear guidance prevents mistakes
```

### Scenario 3: User wants to switch back to main workflow

```
1. User is viewing "Development"
2. Save button is disabled
3. User clicks environment selector
4. User clicks "Exit Development" at top of dropdown
5. Main workflow loads
6. Save button becomes enabled ✅
7. User can now save to main workflow
```

## Why This Approach?

### ✅ Advantages

1. **Clear Intent** - User knows exactly what will be saved
2. **No Accidents** - Can't accidentally overwrite wrong version
3. **Guided UX** - Tooltip tells user what to do instead
4. **Simple Logic** - No complex conditional save behavior
5. **Safe** - Prevents data loss scenarios

### ❌ Alternative Rejected: "Smart Save"

We considered making Save automatically update the selected environment, but this has issues:

- Unexpected behavior (users expect Save to save main workflow)
- No clear indication of what's being saved
- Could still cause confusion
- Harder to understand

### ❌ Alternative Rejected: "Ask Every Time"

We could show a dialog asking "Do you want to update Development or Main Workflow?", but:

- Annoying for users
- Extra click every time
- Still confusing

## Edge Cases Handled

1. **New Workflow (id="new")**

   - No environments exist yet
   - Save creates the workflow first
   - Then environments can be created

2. **Keyboard Shortcut (Ctrl+S)**

   - Same disabled behavior
   - Shortcut won't work when viewing environment
   - User must use Update dialog

3. **Title Changes**

   - Title changes still mark workflow as dirty
   - But Save is disabled when viewing environment
   - Exit environment first to save title changes

4. **Active/Inactive Toggle**
   - Works independently of Save button
   - Can still toggle active state when viewing environment
   - Changes are immediate (no save needed)

## Testing Checklist

- [ ] Main workflow: Save button enabled
- [ ] Main workflow with changes: Save shows unsaved indicator
- [ ] Select Development: Save button becomes disabled
- [ ] Hover disabled Save: Tooltip shows helpful message
- [ ] Update Development: Dialog opens and works
- [ ] Exit Development: Save button becomes enabled
- [ ] Make changes in environment view: Save stays disabled
- [ ] Ctrl+S in environment view: No action (disabled)
- [ ] Switch between environments: Save stays disabled
- [ ] Clear environment selection: Save becomes enabled

## Future Enhancements

1. **Visual Indicator**

   - Add badge/icon to Save button showing it's disabled due to environment view
   - Different color scheme for disabled state

2. **Quick Update Button**

   - Add a prominent "Update [Environment]" button when viewing environment
   - Make it easier to find update action

3. **Confirmation Dialog**

   - When exiting environment with unsaved changes
   - Ask "You have unsaved changes. Exit anyway?"

4. **Auto-save to Environment**
   - Optional setting to auto-update environment on changes
   - Would need careful UX design

## Related Documentation

- [ENVIRONMENT_UI_IMPROVEMENTS.md](./ENVIRONMENT_UI_IMPROVEMENTS.md) - Environment selector behavior
- [ENVIRONMENTS_USER_GUIDE.md](./ENVIRONMENTS_USER_GUIDE.md) - User-facing guide
- [WORKFLOW_ENVIRONMENTS.md](./WORKFLOW_ENVIRONMENTS.md) - Technical architecture
