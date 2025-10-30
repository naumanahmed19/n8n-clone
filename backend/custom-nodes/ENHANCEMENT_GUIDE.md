# Custom Node Frontend Enhancement Guide

This guide explains how to add custom frontend UI enhancements to your custom nodes.

## Overview

Custom nodes can include an optional `.enhancement.js` file that defines how the node should be visually enhanced in the frontend. This allows you to add:

- **Badges and overlays** (like countdown timers, status indicators)
- **Custom visualizations** (progress bars, charts)
- **Real-time status displays** (connection status, queue position)

## File Structure

```
custom-nodes/
  your-node/
    nodes/
      YourNode.node.js          # Backend node definition (required)
      YourNode.enhancement.js   # Frontend enhancement (optional)
    package.json
```

## Enhancement File Format

Your `.enhancement.js` file should export a default object matching this interface:

```javascript
module.exports = {
  default: {
    // Which node types this enhancement applies to
    nodeTypes: ['your-node-type'],
    
    // Render additional UI for the node
    renderOverlay: (context) => {
      // Return a React element or null
      return React.createElement('div', { ... }, ...)
    },
  }
};
```

### Context Object

The `renderOverlay` function receives a context object with:

```typescript
{
  nodeId: string                    // Unique node ID
  nodeType: string                  // Node type (e.g., 'delay')
  parameters: Record<string, any>   // Node parameters
  isExecuting: boolean              // Whether node is currently executing
  executionResult?: any             // Result from last execution
}
```

## Example: Countdown Timer

See `delay/nodes/Delay.enhancement.js` for a complete example:

```javascript
const DelayCountdown = ({ totalMs, startTime, isRunning, timeUnit }) => {
  const [remainingMs, setRemainingMs] = React.useState(totalMs);

  React.useEffect(() => {
    if (!isRunning) {
      setRemainingMs(totalMs);
      return;
    }

    const startTimestamp = startTime || Date.now();
    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = now - startTimestamp;
      const remaining = Math.max(0, totalMs - elapsed);
      setRemainingMs(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);
    return () => clearInterval(interval);
  }, [isRunning, startTime, totalMs]);

  return React.createElement('div', { ... }, ...);
};

module.exports = {
  default: {
    nodeTypes: ['delay'],
    renderOverlay: (context) => {
      return React.createElement('div', 
        { className: 'absolute bottom-1 right-1 z-10' },
        React.createElement(DelayCountdown, { ... })
      );
    }
  }
};
```

## Available Globals

Your enhancement file has access to:

- **React** - React library (hooks, createElement, etc.)
- **context** - Node execution context

## Styling

Use Tailwind CSS classes for styling. Common patterns:

```javascript
// Badge in bottom-right corner
{ className: 'absolute bottom-1 right-1 z-10' }

// Small badge with icon
{ className: 'flex items-center gap-0.5 bg-muted/70 text-[9px] px-1 py-0.5 rounded-sm' }

// Animated badge (when executing)
{ className: 'animate-pulse bg-orange-500/90 text-white' }

// Fixed size (prevents layout shift)
{ className: 'min-w-[36px] h-4' }
```

## Best Practices

1. **Keep it lightweight** - Enhancements load dynamically, so minimize code size
2. **Handle missing data** - Always check if parameters exist before using them
3. **Use React hooks** - useState, useEffect, useMemo are available
4. **Fixed dimensions** - Use fixed widths/heights to prevent layout shifts
5. **Cleanup effects** - Always return cleanup functions from useEffect
6. **Error handling** - Return null if enhancement can't render

## Testing Your Enhancement

1. Create your `.enhancement.js` file in `custom-nodes/your-node/nodes/`
2. Restart the backend server
3. Refresh the frontend
4. Add your node to a workflow
5. The enhancement should appear automatically

## Debugging

Check browser console for:
- `✅ Loaded enhancement for your-node-type` - Enhancement loaded successfully
- Errors during enhancement loading or rendering

## Limitations

- No external dependencies (use vanilla JS + React only)
- No TypeScript (use plain JavaScript)
- No JSX (use React.createElement)
- Keep file size small (<50KB recommended)

## Advanced Example: Progress Bar

```javascript
const ProgressBar = ({ progress }) => {
  return React.createElement(
    'div',
    { className: 'absolute bottom-1 left-1 right-1 h-1 bg-muted rounded-full overflow-hidden' },
    React.createElement('div', {
      className: 'h-full bg-primary transition-all duration-300',
      style: { width: `${progress}%` }
    })
  );
};

module.exports = {
  default: {
    nodeTypes: ['my-processing-node'],
    renderOverlay: (context) => {
      const progress = context.executionResult?.progress || 0;
      return React.createElement(ProgressBar, { progress });
    }
  }
};
```

## Need Help?

- Check the `delay/nodes/Delay.enhancement.js` example
- Review the NodeEnhancement interface in the frontend code
- Test with simple enhancements first (static badges)
- Gradually add interactivity (animations, timers)
