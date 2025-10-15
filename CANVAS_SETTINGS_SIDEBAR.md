# Canvas Settings in Sidebar

## Overview

Added comprehensive canvas control settings to the sidebar Settings panel, allowing users to customize their workflow canvas experience without using the context menu.

## Changes Made

### 1. Store Updates (`reactFlowUI.ts`)

Added new state for canvas boundaries:

- `canvasBoundaryX`: Horizontal boundary limit (default: 2000px)
- `canvasBoundaryY`: Vertical boundary limit (default: 500px)
- `setCanvasBoundaryX()`: Update horizontal boundary
- `setCanvasBoundaryY()`: Update vertical boundary

### 2. WorkflowCanvas Component

- Removed static `fitView` prop to prevent auto-fit on refresh
- Disabled `useReactFlowAutoLayout` hook (enabled: false) to prevent auto-fit on resize
- Uses dynamic boundary values from store for `translateExtent` and `nodeExtent`
- Boundaries are now user-configurable in real-time

### 3. Sidebar Settings (`app-sidebar.tsx`)

Added three new setting sections:

#### **Canvas View Settings**

Toggle switches for:

- ✅ Show Minimap
- ✅ Show Grid Background
- ✅ Show Controls
- ✅ Pan on Drag
- ✅ Zoom on Scroll

Plus background pattern selector (when grid is enabled):

- Dots Pattern
- Lines Pattern
- Cross Pattern
- None

#### **Zoom Controls**

Quick action buttons:

- 🔍 Zoom In
- 🔍 Zoom Out
- 📐 Fit View

#### **Canvas Boundaries**

Sliders to adjust pan/node placement limits:

- **Horizontal (X)**: 500px - 10,000px (left/right)
- **Vertical (Y)**: 500px - 10,000px (top/bottom)
- Shows current values in real-time
- Helps prevent nodes/canvas from being lost in infinite space

## Features

### ✅ No Auto-Fit on Refresh

- Canvas maintains zoom level and position after save/refresh
- Users stay exactly where they left off

### ✅ Configurable Boundaries

- Users can set their own comfortable workspace size
- Prevents accidental infinite panning
- Keeps nodes within a manageable area

### ✅ All Context Menu Options

All canvas options from the context menu are now easily accessible in the sidebar:

- View toggles (minimap, background, controls)
- Interaction settings (pan, zoom)
- Background patterns
- Zoom controls
- Boundary limits

## User Benefits

1. **Consistency**: Viewport doesn't change unexpectedly
2. **Control**: Full customization of canvas behavior
3. **Accessibility**: Settings in one place instead of context menu
4. **Safety**: Boundaries prevent losing nodes in infinite canvas
5. **Flexibility**: Easy to adjust settings on the fly

## Technical Details

### State Management

- All settings stored in Zustand `useReactFlowUIStore`
- Reactive updates (changes apply immediately)
- Settings persist during session

### Canvas Boundaries

```typescript
translateExtent={[[-canvasBoundaryX, -canvasBoundaryY], [canvasBoundaryX, canvasBoundaryY]]}
nodeExtent={[[-canvasBoundaryX, -canvasBoundaryY], [canvasBoundaryX, canvasBoundaryY]]}
```

### Default Values

- Horizontal boundary: 2000px (4000px total width)
- Vertical boundary: 500px (1000px total height)
- Provides asymmetric workspace (wider than tall) suitable for workflows

## Usage

1. Open sidebar in workflow editor
2. Navigate to **Settings** section
3. Scroll to canvas settings:
   - Toggle view options as needed
   - Use zoom buttons for quick adjustments
   - Adjust boundary sliders to set workspace size
4. Changes apply instantly to the canvas

## Files Modified

- `frontend/src/stores/reactFlowUI.ts`
- `frontend/src/components/workflow/WorkflowCanvas.tsx`
- `frontend/src/components/app-sidebar.tsx`
