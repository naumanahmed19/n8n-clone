# Group Node Customization - Quick Reference

## What You Can Customize

### 1. **Group Name**
- Display label for the group
- Shows at top-left corner
- Default: "Group {id}"

### 2. **Background Color**
- 10 predefined colors to choose from
- Custom color support (hex, rgb, or picker)
- Light shades for better readability

### 3. **Border Color**
- 10 predefined colors to choose from
- Custom color support (hex, rgb, or picker)
- Main color values for prominent borders

### 4. **Size** (existing feature)
- Width and height via resize handles
- Now properly persists after save

## How to Edit a Group

1. **Right-click** on the group node
2. Select **"Edit Group"** from context menu
3. Customize:
   - **Name**: Type a new name
   - **Background Color**: Click a color swatch or use custom input
   - **Border Color**: Click a border color swatch or use custom input
4. Click **"Save Changes"**

## Color Palettes

### Background Colors (Light shades)

| Color   | Use Case                          |
|---------|-----------------------------------|
| Blue    | General grouping                  |
| Green   | Success/completed workflows       |
| Purple  | AI/ML operations                  |
| Pink    | Data processing                   |
| Orange  | Notifications/alerts              |
| Red     | Error handling                    |
| Yellow  | Warnings/pending actions          |
| Teal    | Database operations               |
| Indigo  | API integrations                  |
| Gray    | Utility/helper nodes              |

## Context Menu Options

1. **Edit Group** - Customize name and color
2. **Ungroup** - Remove grouping (keep nodes)
3. **Delete Group** - Remove group and detach nodes

## Tips

- **Organize visually**: Use colors to distinguish workflow sections
- **Name meaningfully**: Clear names help team collaboration
- **Use custom colors**: Match your brand or project colors
- **Clear to default**: Remove color to use system theme

## Keyboard Workflow

1. Right-click group → `E` (or click Edit)
2. `Tab` through fields
3. `Enter` to save or `Esc` to cancel

## What Gets Saved

✅ Group name  
✅ Background color  
✅ Size (width/height)  
✅ Position  
✅ Child nodes  
✅ All changes tracked for undo/redo  

## Technical Details

**Storage Location**: `WorkflowNode.style.backgroundColor` and `WorkflowNode.name`  
**Undo/Redo**: ✅ Supported  
**Persistence**: ✅ Saved to database  
**Dark Mode**: ✅ Compatible  
