# Annotation Markdown Support

Annotations in the workflow editor now support **Markdown syntax** for rich text formatting!

## Quick Test

Try adding an annotation with this content:

```markdown
## 🚀 Quick Test

**Bold text** and _italic text_

- Task 1
- Task 2

`inline code` and [a link](https://example.com)
```

## Features

- ✅ Full Markdown syntax support
- ✅ GitHub Flavored Markdown (GFM) support
- ✅ Headings, lists, links, code blocks, tables, and more
- ✅ Dark mode compatible
- ✅ Seamless editing experience (plain text in edit mode, rendered in view mode)

## Supported Markdown Syntax

### Headings

```markdown
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6
```

### Text Formatting

```markdown
**Bold text**
_Italic text_
~~Strikethrough~~ (GFM)
`Inline code`
```

### Lists

```markdown
- Unordered list item 1
- Unordered list item 2
  - Nested item

1. Ordered list item 1
2. Ordered list item 2
   1. Nested item
```

### Links

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title")
```

### Code Blocks

````markdown
```javascript
function hello() {
  console.log("Hello, world!");
}
```
````

### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
```

### Horizontal Rules

```markdown
---
```

### Tables (GFM)

```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

### Task Lists (GFM)

```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

## Usage

### Creating an Annotation

1. Click the **Annotation** button in the workflow controls (bottom left)
2. The annotation appears in the center of your viewport
3. Double-click the annotation to enter edit mode

### Editing an Annotation

1. **Double-click** the annotation to enter edit mode
2. Type your content using Markdown syntax
3. Press **Enter** (without Shift) or click outside to save
4. Press **Escape** to cancel changes

### Viewing Rendered Markdown

- When not in edit mode, your Markdown is automatically rendered with proper styling
- Hover over the annotation to highlight it
- All Markdown elements are styled to match the workflow theme

## Examples

### Example 1: Simple Task List

```markdown
## TODO

- [x] Create workflow
- [ ] Test workflow
- [ ] Deploy to production
```

### Example 2: Code Documentation

````markdown
### API Endpoint

**POST** `/api/users`

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

Returns: `201 Created`
````

### Example 3: Process Steps

```markdown
### Data Processing Steps

1. **Extract** data from source
2. **Transform** data format
3. **Load** into database

> Note: Ensure data validation is enabled
```

### Example 4: Reference Links

```markdown
### Resources

- [Documentation](https://example.com/docs)
- [API Reference](https://example.com/api)
- [Support](mailto:support@example.com)
```

## Styling

The Markdown rendering includes:

- **Headings**: Bold, size-appropriate
- **Links**: Purple color, underlined on hover
- **Code blocks**: Purple background, monospace font
- **Tables**: Bordered, header highlighted
- **Blockquotes**: Left border, italic text
- **Lists**: Proper indentation and bullets
- All elements are **dark mode compatible**

## Tips

1. **Keep it concise**: Annotations are meant for quick notes
2. **Use headings**: Structure your content with headings
3. **Code blocks**: Great for showing JSON, API endpoints, or code snippets
4. **Lists**: Perfect for TODOs, steps, or bullet points
5. **Links**: Add references to documentation or resources

## Implementation Details

- **Library**: Uses `react-markdown` with `remark-gfm` plugin
- **Rendering**: Markdown is rendered in display mode only
- **Editing**: Plain text editing for simplicity
- **Performance**: Memoized component for efficiency
- **Styling**: Custom Tailwind CSS classes for all elements

## Keyboard Shortcuts

- **Enter** (without Shift): Save and exit edit mode
- **Escape**: Cancel and discard changes
- **Shift + Enter**: New line in edit mode

## Context Menu Actions

Right-click on an annotation to:

- **Copy**: Copy the annotation
- **Cut**: Cut the annotation
- **Remove from Group**: Ungroup if in a group
- **Delete**: Remove the annotation

---

**Note**: The Markdown syntax is only visible in edit mode. In view mode, you'll see the beautifully rendered content!
