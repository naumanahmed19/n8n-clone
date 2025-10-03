import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  VisuallyHidden,
} from '@/components/ui/dialog'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useCredentialStore, useNodeConfigDialogStore, useWorkflowStore } from '@/stores'
import { NodeType, WorkflowNode } from '@/types'
import { NodeValidator } from '@/utils/nodeValidation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { InputsColumn } from './node-config/InputsColumn'
import { MiddleColumn } from './node-config/MiddleColumn'
import { OutputColumn } from './node-config/OutputColumn'

interface NodeConfigDialogProps {
  node: WorkflowNode
  nodeType: NodeType
  isOpen: boolean
  onClose: () => void
}

export function NodeConfigDialog({ node, nodeType, isOpen, onClose }: NodeConfigDialogProps) {
  const { 
    updateNode, 
    removeNode, 
    executeNode,
    executionState
  } = useWorkflowStore()
  const { fetchCredentials, fetchCredentialTypes } = useCredentialStore()
  const {
    openDialog,
    closeDialog,
    parameters,
    nodeName,
    isDisabled,
    credentials,
    mockData,
    mockDataPinned,
    hasUnsavedChanges,
    setValidationErrors,
    setIsExecuting,
    setHasUnsavedChanges
  } = useNodeConfigDialogStore()

  // Initialize dialog when it opens
  useEffect(() => {
    if (isOpen) {
      openDialog(node, nodeType)
    }
  }, [isOpen, node.id, openDialog, node, nodeType])

  useEffect(() => {
    fetchCredentials()
    fetchCredentialTypes()
  }, [fetchCredentials, fetchCredentialTypes])

  // Validation effect
  useEffect(() => {
    if (isOpen) {
      const validation = NodeValidator.validateNode(
        { ...node, name: nodeName, parameters, credentials: Object.values(credentials) },
        nodeType.properties
      )
      setValidationErrors(validation.errors)
    }
  }, [node.id, nodeName, parameters, credentials, nodeType.properties, isOpen, setValidationErrors])

  // Save changes to store (called on blur, dialog close, or explicit save)
  const saveChangesToStore = () => {
    if (hasUnsavedChanges) {
      updateNode(node.id, { 
        parameters, 
        name: nodeName, 
        disabled: isDisabled,
        credentials: Object.values(credentials).filter(Boolean) as string[],
        mockData,
        mockDataPinned
      })
      setHasUnsavedChanges(false)
    }
  }

  // Handle dialog close - save changes before closing
  const handleClose = () => {
    saveChangesToStore()
    closeDialog()
    onClose()
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      removeNode(node.id)
      handleClose()
    }
  }

  const handleExecuteFromHere = async () => {
    // Prevent execution during workflow execution
    if (executionState.status === 'running') {
      console.warn('Cannot execute individual node while workflow is running')
      return
    }

    // Save current changes before executing
    saveChangesToStore()

    setIsExecuting(true)
    try {
      // Use the same execution method as the context menu
      await executeNode(node.id, undefined, 'single')
    } catch (error) {
      console.error('Failed to execute node:', error)
      toast.error('Failed to execute node')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[85vh] p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>{nodeName || node.type} Configuration</DialogTitle>
          <DialogDescription>
            Configure the properties, inputs, and outputs for this node
          </DialogDescription>
        </VisuallyHidden>
        <div className="flex-1 flex overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Column - Inputs */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
              <InputsColumn node={node} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Middle Column - Node Configuration */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <MiddleColumn 
                node={node} 
                nodeType={nodeType} 
                onDelete={handleDelete}
                onExecute={handleExecuteFromHere}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Column - Outputs */}
            <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
              <OutputColumn node={node} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  )
}