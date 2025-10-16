# Custom SVG Icon Support

## Overview

The icon system now supports custom SVG icons in addition to Lucide icons, FontAwesome mappings, emoji, and text characters. This allows nodes to use branded or custom icons that aren't available in the standard icon libraries.

## Implementation Date

October 15, 2025

## Icon Format Support

### 1. **Custom SVG Icons** (NEW! ✨)

```typescript
icon: "svg:openai";
```

- Prefix: `svg:`
- Stored in: `frontend/src/assets/icons/`
- Automatically styled to match node background color
- Rendered as white icons on colored backgrounds

### 2. **Lucide Icons**

```typescript
icon: "lucide:play";
icon: "lucide:webhook";
```

- Prefix: `lucide:`
- 40+ professional icons available
- Used for triggers, actions, and transforms

### 3. **FontAwesome Icons**

```typescript
icon: "fa:database";
icon: "fa:code-branch";
```

- Prefix: `fa:`
- Auto-mapped to Lucide equivalents
- Maintained for backwards compatibility

### 4. **Emoji & Text**

```typescript
icon: "🤖"; // Emoji
icon: "H"; // Single letter
```

- Rendered as text
- Fallback for quick prototyping

## Example: OpenAI Node

### Backend Configuration

**File:** `backend/src/nodes/OpenAI/OpenAI.node.ts`

```typescript
export const OpenAINode: NodeDefinition = {
  type: "openai",
  displayName: "OpenAI",
  name: "openai",
  group: ["ai", "transform"],
  version: 1,
  description: "Interact with OpenAI models (GPT-4, GPT-3.5, etc.)",
  icon: "svg:openai", // ✅ Using custom SVG
  color: "#10A37F",
  // ... rest of configuration
};
```

### SVG File Location

**File:** `frontend/src/assets/icons/openai.svg`

```xml
<?xml version="1.0" encoding="utf-8"?>
<svg fill="#000000" width="800px" height="800px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>OpenAI icon</title>
  <path d="M22.2819 9.8211a5.9847..."/>
</svg>
```

### Icon Mapper Registration

**File:** `frontend/src/utils/iconMapper.ts`

```typescript
const SVG_ICON_REGISTRY: Record<string, string> = {
  openai: "/src/assets/icons/openai.svg",
};
```

## How It Works

### 1. Icon Resolution Flow

```
Node Icon String
    ↓
getIconComponent()
    ↓
Check prefix (svg:, lucide:, fa:)
    ↓
Return: LucideIcon | SVG Path String | null
    ↓
Rendering Components
```

### 2. Rendering Logic

**NodeContent.tsx** (Canvas nodes):

```typescript
const IconComponent = getIconComponent(icon, nodeType, nodeGroup);
const isSvgPath = typeof IconComponent === "string";

if (isSvgPath) {
  // Render custom SVG
  <img
    src={IconComponent}
    alt={nodeType}
    className="w-4 h-4"
    style={{ filter: "brightness(0) invert(1)" }} // Make SVG white
  />;
} else if (IconComponent) {
  // Render Lucide icon
  <IconComponent className="w-4 h-4 text-white" />;
} else {
  // Fallback to text
  <span>{icon || nodeType.charAt(0)}</span>;
}
```

**NodeTypesList.tsx** (Sidebar):

```typescript
{
  IconComponent && typeof IconComponent !== "string" ? (
    <IconComponent className="h-4 w-4 text-white" />
  ) : typeof IconComponent === "string" ? (
    <img
      src={IconComponent}
      alt={nodeType.displayName}
      className="h-4 w-4"
      style={{ filter: "brightness(0) invert(1)" }}
    />
  ) : (
    <span className="text-white text-xs font-bold">
      {nodeType.icon || nodeType.displayName.charAt(0)}
    </span>
  );
}
```

**AddNodeCommandDialog.tsx** (Command palette):

```typescript
const isSvgPath = typeof IconComponent === "string";

{
  isSvgPath ? (
    <img
      src={IconComponent as string}
      alt={node.displayName}
      className="w-4 h-4"
      style={{ filter: "brightness(0) invert(1)" }}
    />
  ) : IconComponent ? (
    <IconComponent className="w-4 h-4 text-white" />
  ) : useTextIcon ? (
    <span className="text-xs font-bold">{node.icon}</span>
  ) : (
    <span className="text-xs font-bold">{node.displayName.charAt(0)}</span>
  );
}
```

## Adding New Custom SVG Icons

### Step 1: Add SVG File

Place your SVG file in:

```
frontend/src/assets/icons/your-icon.svg
```

### Step 2: Register Icon

Edit `frontend/src/utils/iconMapper.ts`:

```typescript
const SVG_ICON_REGISTRY: Record<string, string> = {
  openai: "/src/assets/icons/openai.svg",
  "your-icon": "/src/assets/icons/your-icon.svg", // Add here
};
```

### Step 3: Use in Node

In your node definition:

```typescript
export const YourNode: NodeDefinition = {
  type: "your-node",
  displayName: "Your Node",
  icon: "svg:your-icon", // Use svg: prefix
  color: "#FF5733",
  // ... rest of configuration
};
```

## SVG Styling

### Automatic Color Inversion

All SVG icons are automatically styled to appear white on colored backgrounds:

```css
filter: brightness(0) invert(1);
```

This ensures consistent appearance with Lucide icons.

### SVG Requirements

- **Format:** Standard SVG files
- **Color:** Can be any color (will be inverted to white)
- **Size:** Rendered at 16x16px (w-4 h-4)
- **ViewBox:** Should be properly defined for scaling

## Type Safety

### IconType Union

```typescript
export type IconType = LucideIcon | string;
```

The icon mapper now returns either:

- **LucideIcon**: React component for Lucide icons
- **string**: SVG file path for custom SVGs
- **null**: For text/emoji icons

### Type Guards

```typescript
// Check if icon is custom SVG
isSvgIcon(iconString?: string): boolean

// Get SVG file path
getSvgPath(iconString?: string): string | null

// Check if icon is Lucide
hasLucideIcon(iconString?: string): boolean

// Check if icon is text/emoji
isTextIcon(iconString?: string): boolean
```

## Updated Utility Functions

### getIconComponent()

```typescript
export function getIconComponent(
  iconString?: string,
  nodeType?: string,
  nodeGroup?: string[]
): IconType | null;
```

**Returns:**

- `LucideIcon` component for Lucide icons
- `string` (SVG path) for custom SVGs
- `null` for text/emoji (use isTextIcon() to check)

### isSvgIcon()

```typescript
export function isSvgIcon(iconString?: string): boolean;
```

**Returns:** `true` if icon string is a registered custom SVG

### getSvgPath()

```typescript
export function getSvgPath(iconString?: string): string | null;
```

**Returns:** SVG file path if icon is custom SVG, otherwise `null`

### registerSvgIcon()

```typescript
export function registerSvgIcon(name: string, svgPath: string): void;
```

**Usage:** Dynamically register new SVG icons at runtime

## Components Updated

### ✅ NodeContent.tsx

- Canvas node rendering
- Handles custom SVG icons
- Maintains loading states and animations
- Works with trigger nodes (circular) and regular nodes (rounded)

### ✅ NodeTypesList.tsx

- Sidebar node list
- Drag-and-drop preview
- Custom SVG support with type checking

### ✅ AddNodeCommandDialog.tsx

- Command palette rendering
- Search and filtering
- Custom SVG icons in results

### ✅ iconMapper.ts

- Central icon registry
- SVG icon registration
- Type guards and utilities

## Benefits

### 1. **Brand Consistency**

Use official brand icons (OpenAI, Anthropic, Google, etc.) instead of generic emojis or letters.

### 2. **Professional Appearance**

Custom SVGs look polished and match the Lucide icon style throughout the app.

### 3. **Flexibility**

Easy to add new custom icons without modifying multiple components.

### 4. **Type Safety**

TypeScript ensures proper handling of different icon types.

### 5. **Performance**

SVG files are lightweight and cache well in browsers.

## Testing

### Visual Test

1. Restart the application
2. Look for the OpenAI node in:
   - **Sidebar**: Should show OpenAI logo in green circle
   - **Command Dialog**: Cmd/Ctrl+K → Search "openai"
   - **Canvas**: Drag OpenAI node → Should display logo

### Expected Result

- ✅ OpenAI logo appears as white icon on green background (#10A37F)
- ✅ Icon matches visual style of other Lucide icons
- ✅ Icon appears consistently in all three locations
- ✅ No console errors or warnings

## Future Enhancements

### 1. Dynamic SVG Loading

Support for loading SVGs from URLs:

```typescript
icon: "url:https://example.com/icon.svg";
```

### 2. SVG Color Customization

Allow custom SVG colors per node:

```typescript
icon: "svg:openai",
iconColor: "#FFFFFF",  // Override default inversion
```

### 3. Icon Size Variants

Support different icon sizes:

```typescript
iconSize: "sm" | "md" | "lg";
```

### 4. Animated SVGs

Support for animated SVG icons with SMIL or CSS animations.

## Migration Guide

### Before (Using Emoji)

```typescript
export const OpenAINode: NodeDefinition = {
  icon: "🤖", // Generic robot emoji
  color: "#10A37F",
};
```

### After (Using Custom SVG)

```typescript
export const OpenAINode: NodeDefinition = {
  icon: "svg:openai", // Professional OpenAI logo
  color: "#10A37F",
};
```

No changes needed in frontend components - icon mapper handles everything automatically!

## Troubleshooting

### Icon Not Showing

1. **Check registration:** Verify icon is in `SVG_ICON_REGISTRY`
2. **Check file path:** Ensure SVG file exists at registered path
3. **Check prefix:** Use `svg:` prefix in node definition
4. **Check console:** Look for 404 errors for missing SVG files

### Icon Wrong Color

- SVG icons are automatically inverted to white
- Check node `color` property for background color
- Verify `filter: brightness(0) invert(1)` is applied

### TypeScript Errors

- Ensure `IconType` is imported from iconMapper
- Use type guards to narrow icon type before rendering
- Add `@ts-ignore` for Lucide icon rendering if needed

## Files Modified

### Backend

- ✅ `backend/src/nodes/OpenAI/OpenAI.node.ts` - Changed icon from 🤖 to svg:openai

### Frontend

- ✅ `frontend/src/utils/iconMapper.ts` - Added SVG registry and support functions
- ✅ `frontend/src/components/workflow/components/NodeContent.tsx` - Added SVG rendering
- ✅ `frontend/src/components/node/NodeTypesList.tsx` - Added SVG support
- ✅ `frontend/src/components/workflow/AddNodeCommandDialog.tsx` - Added SVG rendering

### Assets

- ✅ `frontend/src/assets/icons/openai.svg` - New OpenAI icon file

## Summary

Custom SVG icon support provides a professional, flexible way to use branded icons in nodes while maintaining consistency with the existing Lucide icon system. The implementation is type-safe, performant, and easy to extend with new icons.

**Key Achievement:** Nodes can now use official brand logos instead of generic emoji, making the application look more professional and polished! ✨
