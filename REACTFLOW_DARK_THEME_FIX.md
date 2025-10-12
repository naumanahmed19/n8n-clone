# ReactFlow Dark Theme Fix

## Problem
The ReactFlow minimap and control buttons were not properly styled for dark mode, appearing with light backgrounds and colors even when the dark theme was active.

## Solution
Implemented a comprehensive dark theme solution for all ReactFlow components.

### Changes Made

#### 1. Created `reactflow-theme.css`
Location: `frontend/src/components/workflow/reactflow-theme.css`

This CSS file contains dark mode overrides for:
- **Controls buttons**: Dark background with proper hover states
- **MiniMap**: Dark background with adjusted node and mask colors
- **Attribution**: Themed footer text
- **Edge elements**: Proper text and background colors

The CSS uses CSS variables from the main theme system (`hsl(var(--card))`, etc.) to ensure consistency with the overall application theme.

#### 2. Updated `WorkflowCanvas.tsx`
Location: `frontend/src/components/workflow/WorkflowCanvas.tsx`

Changes:
- **Imported the new CSS file**: Added `import './reactflow-theme.css'`
- **Added dark mode detection**: Implemented a React state hook that listens for theme changes using MutationObserver
- **Enhanced MiniMap component**: Added props for dynamic styling based on dark mode:
  - `nodeColor`: Different colors for light/dark mode
  - `maskColor`: Adjusted mask opacity and color
  - `style`: Dynamic background color

The dark mode detection is reactive and will update the MiniMap styling when the theme is toggled.

#### 3. Updated `ChatInterfaceNodeVisualTest.tsx`
Location: `frontend/src/components/workflow/nodes/ChatInterfaceNodeVisualTest.tsx`

Changes:
- **Imported the theme CSS**: Added `import '../reactflow-theme.css'` to ensure the test page also has proper dark mode styling

### Technical Details

#### Dark Mode Detection
```tsx
const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
)

useEffect(() => {
    const observer = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
}, [])
```

This approach:
1. Checks the initial dark mode state on mount
2. Sets up a MutationObserver to watch for class changes on the `html` element
3. Updates the state when the dark mode class is toggled
4. Cleans up the observer on unmount

#### MiniMap Styling
```tsx
<MiniMap
    nodeColor={isDarkMode ? '#334155' : '#e2e8f0'}
    maskColor={isDarkMode ? 'rgba(28, 37, 51, 0.6)' : 'rgba(0, 0, 0, 0.1)'}
    style={{
        backgroundColor: isDarkMode ? 'hsl(var(--card))' : '#fff',
    }}
/>
```

The MiniMap receives:
- Dark slate color for nodes in dark mode
- Adjusted mask opacity for better visibility
- Background color that matches the theme's card color

### CSS Variables Used

The implementation uses the following CSS variables from the theme system:
- `--card`: Card background color
- `--foreground`: Text color
- `--border`: Border color
- `--accent`: Accent/hover color
- `--background`: Main background color
- `--muted`: Muted/subtle color
- `--muted-foreground`: Muted text color
- `--primary`: Primary brand color

### Testing
To test the implementation:
1. Open the workflow editor
2. Toggle between light and dark modes
3. Verify that:
   - MiniMap background changes color
   - MiniMap nodes are visible in both modes
   - Control buttons have proper dark styling
   - All elements are clearly visible and themed correctly

### Files Modified
1. `frontend/src/components/workflow/reactflow-theme.css` (new file)
2. `frontend/src/components/workflow/WorkflowCanvas.tsx`
3. `frontend/src/components/workflow/nodes/ChatInterfaceNodeVisualTest.tsx`

### Benefits
- ✅ Consistent dark theme across all ReactFlow components
- ✅ Reactive theme switching without page refresh
- ✅ Uses existing theme CSS variables for consistency
- ✅ Proper hover and interaction states
- ✅ Better visibility and reduced eye strain in dark mode
