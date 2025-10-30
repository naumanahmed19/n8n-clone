/**
 * Frontend Enhancement for Delay Node
 * 
 * This file defines how the Delay node should be enhanced in the frontend UI.
 * Custom nodes can include an optional .enhancement.js file to add:
 * - Badges and overlays
 * - Custom visualizations
 * - Real-time status indicators
 * 
 * IMPORTANT: This file is loaded dynamically in the browser, so:
 * - Use vanilla JavaScript (ES6+)
 * - React is available as a global
 * - Keep dependencies minimal
 * - Export a default object matching the NodeEnhancement interface
 */

// Helper component for countdown display
const DelayCountdown = ({ totalMs, startTime, isRunning, timeUnit }) => {
  const [remainingMs, setRemainingMs] = React.useState(totalMs);
  const [localStartTime, setLocalStartTime] = React.useState(null);

  React.useEffect(() => {
    // When execution starts, capture the start time ONCE
    if (isRunning && localStartTime === null) {
      setLocalStartTime(Date.now());
    }
    
    // When execution stops, reset everything
    if (!isRunning) {
      setRemainingMs(totalMs);
      setLocalStartTime(null);
    }
  }, [isRunning, totalMs, localStartTime]);

  React.useEffect(() => {
    // Only run countdown when we're running AND have a start time
    if (!isRunning || localStartTime === null) {
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = now - localStartTime;
      const remaining = Math.max(0, totalMs - elapsed);
      setRemainingMs(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);

    return () => clearInterval(interval);
  }, [isRunning, localStartTime, totalMs]);

  const formatTime = (ms) => {
    if (timeUnit === 'seconds') {
      return `${(ms / 1000).toFixed(1)}s`;
    } else if (timeUnit === 'minutes') {
      return `${(ms / 60000).toFixed(1)}m`;
    } else {
      return `${(ms / 3600000).toFixed(1)}h`;
    }
  };

  const badgeClass = isRunning
    ? "flex items-center gap-0.5 bg-orange-500/90 backdrop-blur-sm text-white text-[9px] font-semibold px-1 py-0.5 rounded-sm shadow-md border border-orange-400/40 animate-pulse min-w-[36px] h-4"
    : "flex items-center gap-0.5 bg-muted/70 backdrop-blur-sm text-muted-foreground text-[9px] font-medium px-1 py-0.5 rounded-sm shadow-sm border border-border/40 min-w-[36px] h-4";

  const iconClass = isRunning
    ? "w-2 h-2 flex-shrink-0 animate-spin"
    : "w-2 h-2 flex-shrink-0";

  return React.createElement(
    'div',
    { className: badgeClass },
    React.createElement(
      'svg',
      { className: iconClass, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      React.createElement('path', {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 2.5,
        d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ),
    React.createElement('span', { className: 'tabular-nums leading-none' }, formatTime(remainingMs))
  );
};

// Export the enhancement definition
module.exports = {
  default: {
    nodeTypes: ['delay'],
    
    renderOverlay: (context) => {
      const { parameters, isExecuting, executionResult } = context;
      
      // Check if delay parameters are configured
      if (!parameters?.amount || !parameters?.timeUnit) {
        return null;
      }

      // Calculate total milliseconds
      const totalMs = parameters.amount * (
        parameters.timeUnit === 'seconds' ? 1000 :
        parameters.timeUnit === 'minutes' ? 60000 :
        parameters.timeUnit === 'hours' ? 3600000 : 1000
      );

      return React.createElement(
        'div',
        { className: 'absolute bottom-1 right-1 z-10' },
        React.createElement(DelayCountdown, {
          totalMs,
          startTime: executionResult?.startTime,
          isRunning: isExecuting,
          timeUnit: parameters.timeUnit
        })
      );
    }
  }
};
