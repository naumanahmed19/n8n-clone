# Dark Theme Implementation

## Overview
This document describes the implementation of dark theme support in the n8n-clone application with a theme switcher in the app sidebar settings.

## Features
- ✅ Light theme
- ✅ Dark theme
- ✅ System theme (follows OS preference)
- ✅ Persistent theme selection (saved to localStorage)
- ✅ Theme switcher in Settings sidebar
- ✅ Visual theme buttons with icons
- ✅ Automatic system theme detection
- ✅ Toast notifications follow theme

## Implementation Details

### 1. Theme Context (`frontend/src/contexts/ThemeContext.tsx`)
Created a new context to manage theme state across the application:
- **State**: `light`, `dark`, or `system`
- **Persistence**: Saves theme preference to localStorage
- **System Detection**: Automatically detects and follows OS theme preference when in 'system' mode
- **Effective Theme**: Provides the actual theme being displayed (resolved from system preference if needed)

### 2. App Integration (`frontend/src/App.tsx`)
- Wrapped the entire app with `ThemeProvider`
- Theme context is now available throughout the application

### 3. Theme Switcher UI (`frontend/src/components/app-sidebar.tsx`)
Added a theme switcher to the Settings section with:
- **Three theme options**: Light, Dark, and System
- **Visual buttons**: Each with an icon (Sun, Moon, Monitor)
- **Active state indication**: Selected theme is highlighted
- **Location**: Under Settings → Appearance section

### 4. Toast Notifications (`frontend/src/components/ui/sonner.tsx`)
Updated Sonner toast component to:
- Use the current effective theme
- Automatically switch between light/dark toast styles

### 5. CSS Variables (`frontend/src/index.css`)
- Already configured with comprehensive light and dark theme variables
- Includes colors for background, foreground, sidebar, and all UI elements
- Dark theme uses appropriate contrasts and colors

## Usage

### For Users
1. Click on **Settings** in the app sidebar
2. Navigate to the **Appearance** section
3. Choose your preferred theme:
   - **Light**: Always use light theme
   - **Dark**: Always use dark theme
   - **System**: Follow your operating system's theme preference

### For Developers

**Using the theme in components:**
```tsx
import { useTheme } from '@/contexts'

function MyComponent() {
  const { theme, setTheme, effectiveTheme } = useTheme()
  
  // Get current theme setting
  console.log(theme) // 'light' | 'dark' | 'system'
  
  // Get actual theme being displayed
  console.log(effectiveTheme) // 'light' | 'dark'
  
  // Change theme
  setTheme('dark')
}
```

**Using CSS variables:**
```tsx
// Components automatically use theme variables
<div className="bg-background text-foreground">
  <div className="bg-card text-card-foreground">
    Content
  </div>
</div>
```

## File Changes

### New Files
- `frontend/src/contexts/ThemeContext.tsx` - Theme context and provider

### Modified Files
- `frontend/src/contexts/index.ts` - Export ThemeContext
- `frontend/src/App.tsx` - Add ThemeProvider wrapper
- `frontend/src/components/app-sidebar.tsx` - Add theme switcher UI
- `frontend/src/components/ui/sonner.tsx` - Use theme for toasts
- `frontend/src/index.css` - Clean up CSS structure

## Theme Variables

All theme colors are defined as CSS variables using HSL color space:

### Light Theme
- Background: White (#FFFFFF)
- Foreground: Near black (#0A0A0A)
- Sidebar: Light gray (#F9FAFB)

### Dark Theme
- Background: Very dark gray (#0A0A0A)
- Foreground: Near white (#FAFAFA)
- Sidebar: Dark gray (#1A1A1A)

## Browser Compatibility
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ System theme detection via `prefers-color-scheme` media query
- ✅ Fallback for older browsers that don't support addEventListener on MediaQueryList

## Future Enhancements
- [ ] Custom theme colors
- [ ] Multiple dark theme variants (OLED, High Contrast)
- [ ] Theme animations/transitions
- [ ] Per-workspace theme preferences
- [ ] Export/import theme configurations
