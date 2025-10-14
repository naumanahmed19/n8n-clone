# View Workflow Code Feature

## Overview
Added a new "View Code" feature that allows users to view, edit, copy, and export the JSON representation of their workflow in multiple formats.

## Implementation Details

### New Component: WorkflowCodeDialog
**Location:** `frontend/src/components/workflow/WorkflowCodeDialog.tsx`

A comprehensive dialog component that displays workflow data in JSON format with the following features:

#### Features
1. **Multiple View Modes** - Four tabs for different perspectives:
   - **Full Workflow**: Complete workflow structure including all metadata
   - **Nodes Only**: Just the node definitions with parameters and positions
   - **Connections**: Node connections defining the workflow flow
   - **Settings**: Workflow settings and configuration

2. **Edit Mode** ⭐ NEW:
   - Click "Edit" button on any tab to enter edit mode
   - Modify JSON directly in a full-height textarea
   - Live JSON validation on save
   - "Apply Changes" button updates the workflow
   - "Cancel" button discards changes
   - Works on all four tabs independently
   - Changes mark workflow as dirty (requires save)

3. **Copy to Clipboard**: Each tab has a copy button with visual feedback
   - Shows "Copied!" confirmation when successful
   - Toast notifications for user feedback

4. **Download Options**: Download any view as a JSON file
   - Automatic filename generation based on workflow name
   - Separate files for each view type

5. **Code Presentation**:
   - Formatted JSON with proper indentation (2 spaces)
   - Scrollable area for long content
   - Monospace font for code readability
   - Full-height display (85vh - header spacing)

### Integration in WorkflowToolbar
**Location:** `frontend/src/components/workflow/WorkflowToolbar.tsx`

#### Changes Made:
1. **Import Added**: Imported the new `WorkflowCodeDialog` component and `Code` icon
2. **State Added**: Added `showCodeDialog` state to control dialog visibility
3. **Menu Item Added**: Added "View Code" option in the "More Options" dropdown menu
   - Positioned between "Workflow Settings" and import/export options
   - Uses the Code icon from lucide-react
4. **Dialog Rendered**: Added the dialog component at the bottom of the component

### Export Update
**Location:** `frontend/src/components/workflow/index.ts`

Added export for the new `WorkflowCodeDialog` component.

## User Experience

### Access Points
Users can access the "View Code" feature from:
1. **Workflow Toolbar** → More Options Menu (⋯) → View Code

### Workflow
1. User clicks the "More Options" button (three dots) in the toolbar
2. Selects "View Code" from the dropdown menu
3. Dialog opens with four tabs showing different aspects of the workflow
4. User can:
   - Switch between tabs to view different parts
   - **Click "Edit" to modify the JSON directly** ⭐ NEW
   - **Edit the JSON and click "Apply Changes" to update the workflow** ⭐ NEW
   - **Click "Cancel" to discard changes** ⭐ NEW
   - Copy any view to clipboard
   - Download any view as a JSON file
5. Close the dialog when done

### Use Cases
- **Debugging**: View the raw workflow structure to debug issues
- **Documentation**: Copy workflow structure for documentation
- **Learning**: Understand how workflows are structured internally
- **Sharing**: Export specific parts of the workflow (nodes, connections, settings)
- **Development**: Use the JSON for programmatic workflow creation
- **Backup**: Quick way to save workflow structure
- **Advanced Editing**: Directly modify workflow JSON for bulk changes ⭐ NEW
- **Mass Updates**: Edit multiple nodes or connections at once ⭐ NEW
- **Quick Fixes**: Fix JSON structure issues directly ⭐ NEW

## Technical Details

### Dependencies Used
- `@/components/ui/dialog` - Dialog container
- `@/components/ui/button` - Action buttons
- `@/components/ui/scroll-area` - Scrollable content area
- `@/components/ui/tabs` - Tabbed interface
- `@/components/ui/textarea` - Editable text area for JSON editing ⭐ NEW
- `lucide-react` - Icons (Copy, Check, Download, Code, Edit, Save, X) ⭐ UPDATED
- `sonner` - Toast notifications
- `@/stores` - Zustand workflow store for updates ⭐ NEW

### Edit Mode Features ⭐ NEW
- **JSON Validation**: Validates JSON syntax before applying changes
- **Error Handling**: Shows user-friendly error messages for invalid JSON
- **Selective Updates**: Can edit full workflow, nodes only, connections only, or settings only
- **Dirty State**: Marks workflow as dirty when changes are applied
- **Cancel Safety**: Can discard changes without affecting the workflow
- **Toast Notifications**: Success/error feedback for all operations

### Props Interface
```typescript
interface WorkflowCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  workflow: Workflow | null
}
```

### Data Format
Each tab displays JSON.stringify with 2-space indentation:
- Full workflow: Complete `workflow` object
- Nodes: `workflow.nodes` array
- Connections: `workflow.connections` array
- Settings: `workflow.settings` object

## Future Enhancements

Possible improvements for the future:
1. **Syntax Highlighting**: Add proper JSON syntax highlighting with colors
2. **Search/Filter**: Add ability to search within the JSON
3. **Diff View**: Compare current workflow with saved version
4. **Schema Validation**: Show if the workflow follows the correct schema
5. ~~**Edit Mode**: Allow in-place editing of JSON (advanced users)~~ ✅ IMPLEMENTED
6. **Export Formats**: Support additional formats (YAML, XML, etc.)
7. **Share Link**: Generate shareable links to workflow code
8. **Code Snippets**: Extract reusable code snippets from workflows
9. **Undo/Redo in Edit Mode**: Add undo/redo for JSON editing ⭐ NEW
10. **Format/Beautify Button**: Auto-format JSON in edit mode ⭐ NEW
11. **Line Numbers**: Add line numbers in edit mode ⭐ NEW

## Testing Checklist

- [x] Component compiles without errors
- [x] Dialog opens when "View Code" is clicked
- [x] All four tabs display correct data
- [x] Copy to clipboard works for all tabs
- [x] Download works for all tabs with correct filenames
- [x] Toast notifications appear on copy/download
- [x] Dialog closes properly
- [x] Component handles null workflow gracefully
- [x] Responsive design works on different screen sizes

## Files Modified

1. **Created:**
   - `frontend/src/components/workflow/WorkflowCodeDialog.tsx`

2. **Modified:**
   - `frontend/src/components/workflow/WorkflowToolbar.tsx`
   - `frontend/src/components/workflow/index.ts`

## Related Features

This feature complements the existing:
- **Export Workflow**: Downloads complete workflow file for import
- **Workflow Settings**: Manages workflow metadata
- **Import Workflow**: Loads workflow from file

The key difference is that "View Code" is for quick inspection and partial exports, while "Export Workflow" is for complete backup/migration.
