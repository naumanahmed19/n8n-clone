import { WorkflowTriggerComponents } from '@/components/workflow/nodes/WorkflowTrigger/WorkflowTriggerComponents'
import { CustomFieldProps } from '@/components/ui/form-generator/types'

// Global component registry for custom node components
const componentRegistry: Record<string, (props: CustomFieldProps) => React.ReactNode> = {
  ...WorkflowTriggerComponents,
}

// Function to get a custom component by name
export function getCustomComponent(componentName: string) {
  return componentRegistry[componentName]
}

// Function to register a custom component
export function registerCustomComponent(name: string, component: (props: CustomFieldProps) => React.ReactNode) {
  componentRegistry[name] = component
}

// Function to register multiple components
export function registerCustomComponents(components: Record<string, (props: CustomFieldProps) => React.ReactNode>) {
  Object.assign(componentRegistry, components)
}