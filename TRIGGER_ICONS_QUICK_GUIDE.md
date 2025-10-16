# Trigger Node Icons - Quick Guide

## ✅ What Was Changed

Trigger nodes now use **Lucide icons** (same as control bar) instead of emojis.

## 🎨 Before vs After

### Before

```
  ⚡ Manual        🪝 Webhook       ⏰ Schedule
(Emoji icons - inconsistent style)
```

### After

```
  ▶️ Manual        🔗 Webhook       📅 Schedule
(Lucide icons - matches control bar)
```

## 🔧 Icon Mappings

| Node Type        | Icon Component  | Visual |
| ---------------- | --------------- | ------ |
| Manual Trigger   | `Play`          | ▶️     |
| Webhook Trigger  | `Webhook`       | 🔗     |
| Schedule Trigger | `Calendar`      | 📅     |
| Chat Trigger     | `MessageCircle` | 💬     |
| Workflow Trigger | `ExternalLink`  | ↗️     |
| Default/Other    | `Zap`           | ⚡     |

## 🎯 Key Features

1. **Consistent Styling**

   - Same `w-8 h-8` container as control buttons
   - Same `w-4 h-4` icon size
   - Rounded-full shape for triggers
   - Shadow and hover effects

2. **Smart Detection**

   - Checks `icon` property for `fa:*` patterns
   - Falls back to node type detection
   - Uses `Zap` as default trigger icon

3. **Loading States**
   - Spinner overlay when executing
   - Maintains icon visibility with opacity

## 📁 Files Modified

```
frontend/src/components/workflow/components/NodeContent.tsx
frontend/src/components/node/NodeTypesList.tsx
```

### What Each File Does

1. **NodeContent.tsx** - Renders trigger node icons on the canvas
2. **NodeTypesList.tsx** - Renders trigger node icons in the Add Node Dialog

## 🚀 Usage

Icons are automatically applied based on:

1. Node's `icon` property (e.g., `fa:play-circle`)
2. Node's `type` property (e.g., `manual-trigger`)
3. Default to `Zap` for unknown triggers

### Example Node Definition

```typescript
{
  type: 'my-trigger',
  icon: 'fa:play-circle',  // Maps to Play icon
  color: '#4CAF50',        // Green background
  executionCapability: 'trigger'  // Required!
}
```

## 📊 Visual Consistency

All trigger nodes now match the control bar style:

**Control Bar**

```tsx
<button className="h-8 w-8 rounded-md ...">
  <Plus className="h-4 w-4" />
</button>
```

**Trigger Node**

```tsx
<div className="w-8 h-8 rounded-full ...">
  <Play className="w-4 h-4 text-white" />
</div>
```

## ✨ Benefits

- ✅ Professional appearance
- ✅ Consistent with control bar
- ✅ Better accessibility
- ✅ Easier to maintain
- ✅ Type-safe icon selection

## 📚 See Also

- Full documentation: `TRIGGER_NODE_ICON_UPGRADE.md`
- Control bar reference: `frontend/src/components/workflow/WorkflowControls.tsx`
- Icon library: [Lucide Icons](https://lucide.dev/)
