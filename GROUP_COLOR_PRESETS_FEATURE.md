# Group Color Presets Feature

## Overview

This feature adds a settings dialog for group nodes that allows users to customize their appearance with predefined color presets and custom color options.

## Problem Statement

> "instead of background and borders list create a preset with background border, and at bottom we can have option to select custom colors"

## Solution

A comprehensive group settings dialog that provides:
1. **8 Predefined Color Presets** - Professional background + border color combinations
2. **Custom Color Pickers** - Advanced color customization at the bottom
3. **Live Preview** - See changes before applying
4. **Optional Group Name** - Add labels to organize workflows

## Usage

### Accessing Group Settings

1. Right-click on any group node in the workflow
2. Select "Settings" from the context menu (marked with a Palette 🎨 icon)
3. The Group Settings dialog will open

### Using Color Presets

The dialog displays 8 color presets in a 4x2 grid:
- **Purple** (Default) - General purpose
- **Blue** - Logic and data processing
- **Green** - Success states and validation
- **Yellow** - Warnings and attention
- **Red** - Error handling
- **Orange** - Notifications
- **Pink** - User interface elements
- **Teal** - Database and storage

Simply click any preset button to apply that color combination. The selected preset is marked with a checkmark (✓).

### Custom Colors

For advanced customization, scroll to the bottom of the dialog to find:

**Background Color**
- Color picker for visual selection
- Text input for precise values (supports rgba, hex, named colors)

**Border Color**
- Color picker for visual selection  
- Text input for precise values

### Preview & Save

- The preview section shows exactly how your group will look with the selected colors
- Add an optional group name in the text field at the top
- Click "Save" to apply changes or "Cancel" to discard

## Features

✅ **8 Professional Color Presets**
- Carefully selected color combinations
- Maintain visual harmony
- Semi-transparent backgrounds for layering

✅ **Custom Color Options** (As Requested)
- Placed at the bottom for advanced users
- Both visual color pickers and text inputs
- Supports all CSS color formats

✅ **Live Preview**
- Real-time visualization
- Shows group name and colors together
- No surprises after saving

✅ **Full Integration**
- Works with undo/redo system
- Saves with workflow state
- Backwards compatible

## Technical Details

### Files Modified

1. **GroupSettingsDialog.tsx** (NEW)
   - Main dialog component
   - Color preset definitions
   - Custom color picker logic

2. **GroupNode.tsx** (MODIFIED)
   - Added Settings menu option
   - Dialog integration
   - Save handler implementation

3. **workflow.ts** (MODIFIED)
   - Added `borderColor` to style interface

4. **reactflow-theme.css** (MODIFIED)
   - Dynamic color support
   - Inline style overrides

### Color Presets

```typescript
const COLOR_PRESETS = [
  { name: 'Purple', background: 'rgba(207, 182, 255, 0.4)', border: '#9e86ed' },
  { name: 'Blue', background: 'rgba(147, 197, 253, 0.4)', border: '#3b82f6' },
  { name: 'Green', background: 'rgba(167, 243, 208, 0.4)', border: '#10b981' },
  { name: 'Yellow', background: 'rgba(253, 224, 71, 0.4)', border: '#eab308' },
  { name: 'Red', background: 'rgba(252, 165, 165, 0.4)', border: '#ef4444' },
  { name: 'Orange', background: 'rgba(253, 186, 116, 0.4)', border: '#f97316' },
  { name: 'Pink', background: 'rgba(249, 168, 212, 0.4)', border: '#ec4899' },
  { name: 'Teal', background: 'rgba(153, 246, 228, 0.4)', border: '#14b8a6' },
]
```

### Data Flow

```
User Action → Dialog → handleSettingsSave()
                         ↓
                      setNodes() → ReactFlow Update
                         ↓
                  saveToHistory() → Undo/Redo Stack
                         ↓
                    setDirty(true) → Workflow State
```

## Design Philosophy

**Preset-First Approach:**
- Presets are displayed prominently for quick access
- Reduces decision fatigue
- Ensures visual consistency

**Custom Options at Bottom:**
- Doesn't overwhelm beginners
- Available for power users
- Maintains flexibility

**Live Preview:**
- Builds confidence
- Reduces trial and error
- Shows exactly what you'll get

## Benefits

1. **User-Friendly** - Visual presets make styling quick and easy
2. **Flexible** - Custom colors available for specific needs
3. **Consistent** - Predefined presets ensure visual harmony
4. **Intuitive** - Live preview prevents surprises
5. **Integrated** - Works seamlessly with existing features

## Future Enhancements

Potential improvements for future versions:
- Custom preset saving
- Preset import/export
- Border width customization
- Border radius controls
- Opacity sliders
- Organization-specific themes

## Notes

- Groups without custom colors use default styling
- Existing workflows remain unchanged
- All changes are undoable
- Colors persist when workflow is saved
- Works in both light and dark modes

## Examples

**Default Group:**
```
Background: rgba(207, 182, 255, 0.4)
Border: #9e86ed
```

**Error Handling Group:**
```
Background: rgba(252, 165, 165, 0.4)
Border: #ef4444
```

**Custom Group:**
```
Background: rgba(100, 200, 150, 0.5)
Border: #00ff00
```
