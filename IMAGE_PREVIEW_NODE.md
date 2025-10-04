# Image Preview Node - Complete Implementation

## Overview

The **Image Preview Node** is a revolutionary custom node that demonstrates advanced capabilities:
- ✅ **Live Image Preview in Config Dialog**: Real-time rendering as you type URLs
- ✅ **Image as Node Icon**: The image becomes the actual node icon on the canvas
- ✅ **Image Preview in Output**: Beautiful image display in the output column
- ✅ **Smart Image Handling**: Validation, error handling, and metadata extraction

## 🎯 Features

### 1. **Dynamic Node Icon**
The node icon changes to display the actual image from the URL parameter:
- Replaces the default icon with the image thumbnail
- Maintains rounded corners for visual consistency
- Shows loading state while image loads
- Falls back to default icon on error

### 2. **Live Configuration Preview**
In the node configuration dialog:
- Real-time image preview as you type the URL
- Image dimensions display
- Loading indicators
- Error messages for invalid URLs
- "Open in new tab" overlay on hover

### 3. **Rich Output Display**
In the output column:
- Large, high-quality image preview
- Image metadata (size, type, dimensions)
- Hover overlay with "Open full size" link
- Collapsible JSON output
- Alt text display

### 4. **Smart Validation**
- URL format validation
- HTTP/HTTPS protocol check
- Content-type verification
- Image loading error handling
- File size information

## 🏗️ Architecture

### Backend Structure

```
backend/src/nodes/ImagePreview/
├── index.ts                    # Export statement
└── ImagePreview.node.ts        # Node definition and execution
```

### Frontend Structure

```
frontend/src/components/
├── ui/
│   ├── alert.tsx                           # Alert component (new)
│   └── form-generator/
│       ├── custom-fields/
│       │   └── ImagePreview.tsx            # Custom preview component (new)
│       └── CustomComponentRegistry.tsx     # Registry with ImagePreview
└── workflow/
    ├── components/
    │   └── NodeContent.tsx                 # Updated with image icon support
    ├── node-config/
    │   └── OutputColumn.tsx                # Updated with image output renderer
    └── CustomNode.tsx                      # Updated to pass imageUrl
```

## 📝 Implementation Details

### Node Definition

```typescript
export const ImagePreviewNode: NodeDefinition = {
  type: "image-preview",
  displayName: "Image Preview",
  name: "imagePreview",
  group: ["transform"],
  version: 1,
  description: "Display and preview images from URL with real-time rendering",
  icon: "fa:image",
  color: "#FF6B6B",
  defaults: {
    imageUrl: "",
    altText: "",
    displayInOutput: true,
  },
  inputs: ["main"],
  outputs: ["main"],
  properties: [
    {
      displayName: "Image URL",
      name: "imageUrl",
      type: "string",
      required: true,
      placeholder: "https://example.com/image.jpg",
    },
    {
      displayName: "Image Preview",
      name: "imagePreview",
      type: "custom",              // Custom component type
      component: "ImagePreview",    // Component name
      componentProps: {
        urlField: "imageUrl",       // Which field contains the URL
      },
    },
    // ... other properties
  ],
  execute: async function (inputData) {
    // Validates URL and fetches metadata
    // Returns image data with metadata
  },
}
```

### Custom Component (Frontend)

```typescript
export function ImagePreview({ field, allValues }: CustomFieldProps) {
  const urlFieldName = field.componentProps?.urlField || 'imageUrl'
  const imageUrl = allValues?.[urlFieldName] as string
  
  // React state for loading/error handling
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageInfo, setImageInfo] = useState(null)

  // Load and validate image
  useEffect(() => {
    if (!imageUrl) return
    
    // Validate URL format
    // Load image using Image API
    // Update state based on result
  }, [imageUrl])

  // Render preview with loading/error states
  return <div>...</div>
}
```

## Node Configuration

### Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `imageUrl` | string | Yes | "" | The URL of the image to preview |
| `imagePreview` | custom | No | - | Live preview component (auto-rendered) |
| `altText` | string | No | "" | Alternative text for accessibility |
| `displayInOutput` | boolean | No | true | Include image data in output |

### Custom Component

The node uses a custom `ImagePreview` component that:
- Automatically detects URL changes
- Shows loading states
- Validates image format
- Displays error messages
- Provides image dimensions

## Usage Example

### Basic Usage

```typescript
{
  type: "image-preview",
  parameters: {
    imageUrl: "https://example.com/image.jpg",
    altText: "Sample image",
    displayInOutput: true
  }
}
```

### Expected Output

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "altText": "Sample image",
  "metadata": {
    "contentType": "image/jpeg",
    "size": 123456,
    "sizeFormatted": "120.56 KB",
    "lastModified": "Wed, 01 Jan 2025 00:00:00 GMT",
    "valid": true
  },
  "timestamp": "2025-10-04T12:00:00.000Z"
}
```

## Creating Custom Preview Components

The Image Preview Node demonstrates how to create custom preview components for any node. Here's how:

### Backend (Node Definition)

```typescript
properties: [
  {
    displayName: "Image URL",
    name: "imageUrl",
    type: "string",
    required: true,
    default: "",
  },
  {
    displayName: "Image Preview",
    name: "imagePreview",
    type: "custom",
    component: "ImagePreview",  // Component name
    componentProps: {
      urlField: "imageUrl",  // Which field contains the data
    },
  },
]
```

### Frontend (Custom Component)

```typescript
import { CustomFieldProps } from '@/components/ui/form-generator/types'

export function ImagePreview({ field, allValues }: CustomFieldProps) {
  const urlFieldName = field.componentProps?.urlField || 'imageUrl'
  const imageUrl = allValues?.[urlFieldName] as string
  
  // Component logic here
  return <div>Preview content</div>
}
```

### Registration

```typescript
// In CustomComponentRegistry.tsx
import { ImagePreview } from './custom-fields/ImagePreview'

const componentRegistry = {
  ImagePreview,
  // ... other components
}
```

## Architecture

### Backend Flow

1. **URL Input**: User enters image URL in the string field
2. **Validation**: Execute function validates URL format and protocol
3. **Metadata Fetch**: HEAD request retrieves image info without downloading
4. **Output**: Returns image data with metadata

### Frontend Flow

1. **URL Detection**: Custom component watches the URL field
2. **Image Loading**: Browser Image API loads and validates the image
3. **State Management**: React state handles loading/error/success states
4. **Preview Rendering**: Image displayed with overlay and metadata

## Custom Component Types

The system supports various custom components:

### Input-based Components
- Text editors
- Code editors
- Rich text fields

### Preview Components
- Image preview (this node)
- Video preview
- Audio preview
- PDF preview

### Interactive Components
- Color pickers
- Date/time pickers
- File uploaders
- Map selectors

## Benefits

1. **Better UX**: Users see immediate feedback
2. **Validation**: Real-time error detection
3. **Flexibility**: Easy to add new custom components
4. **Reusability**: Components work across all nodes
5. **Type Safety**: Full TypeScript support

## Extending the System

To create your own custom preview component:

1. **Create the Component**:
   ```typescript
   // frontend/src/components/ui/form-generator/custom-fields/MyPreview.tsx
   export function MyPreview({ field, allValues }: CustomFieldProps) {
     // Your preview logic
   }
   ```

2. **Register It**:
   ```typescript
   // CustomComponentRegistry.tsx
   import { MyPreview } from './custom-fields/MyPreview'
   
   const componentRegistry = {
     MyPreview,
     // ...
   }
   ```

3. **Use in Node**:
   ```typescript
   properties: [{
     type: "custom",
     component: "MyPreview",
     componentProps: { /* your props */ }
   }]
   ```

## Testing

The node can be tested using:
- Valid image URLs (HTTPS)
- Invalid URLs (should show error)
- Non-image URLs (should show warning)
- Large images (tests performance)
- Broken links (tests error handling)

## Future Enhancements

Potential improvements:
- Image transformation options (resize, crop)
- Multiple image support
- Drag & drop upload
- Image gallery mode
- Caching for performance
- Image optimization suggestions
