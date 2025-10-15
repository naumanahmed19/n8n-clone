/**
 * Node styling utilities for consistent status-based styling across all node types
 */

export interface NodeStyleConfig {
  status?: string;
  selected?: boolean;
  disabled?: boolean;
}

/**
 * Get border classes based on node status
 */
export function getNodeBorderClasses(config: NodeStyleConfig): string {
  const { status, selected, disabled } = config;

  if (disabled) return "border-border/50 opacity-60";
  if (selected)
    return "border-primary ring-1 ring-primary/20";

  switch (status) {
    case "running":
      return "border-blue-400/60 dark:border-blue-500/60";
    case "success":
      return "border-green-400/60 dark:border-green-500/60";
    case "error":
      return "border-red-400/60 dark:border-red-500/60";
    case "skipped":
      return "border-border/50";
    default:
      return "border-border";
  }
}

/**
 * Get animation classes based on node status
 */
export function getNodeAnimationClasses(status?: string): string {
  switch (status) {
    case "running":
      return "node-running node-glow-running";
    case "success":
      return "node-success node-glow-success";
    case "error":
      return "node-error node-glow-error";
    default:
      return "";
  }
}

/**
 * Get complete node status classes (border + animation)
 * This is a convenience function that combines border and animation classes
 */
export function getNodeStatusClasses(
  status?: string,
  selected?: boolean,
  disabled?: boolean
): string {
  const config: NodeStyleConfig = { status, selected, disabled };
  const borderClasses = getNodeBorderClasses(config);
  const animationClasses = getNodeAnimationClasses(status);

  return `${borderClasses} ${animationClasses}`.trim();
}
