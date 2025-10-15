import { memo, useCallback, useRef, useState, useEffect } from 'react'
import { NodeProps, NodeResizer } from '@xyflow/react'
import { useWorkflowStore } from '@/stores'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import { Copy, Scissors, Trash2, Ungroup } from 'lucide-react'
import { useCopyPasteStore } from '@/stores'
import { useReactFlow } from '@xyflow/react'
import { useDetachNodes } from '@/hooks/workflow'

function AnnotationNode({ id, data, selected, parentId }: NodeProps) {
  const { updateNode, workflow, updateWorkflow, saveToHistory } = useWorkflowStore()
  const { copy, cut } = useCopyPasteStore()
  const { setNodes } = useReactFlow()
  const detachNodes = useDetachNodes()
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Get label from parameters or data
  const dataAny = data as any
  const currentLabel = (dataAny.parameters?.label || dataAny.label || 'Add your note here...') as string
  const [localText, setLocalText] = useState(currentLabel)
  
  // Check if node is in a group (parentId comes from React Flow props)
  const isInGroup = !!parentId

  // Sync local text with prop changes
  useEffect(() => {
    if (!isEditing) {
      setLocalText(currentLabel)
    }
  }, [currentLabel, isEditing])

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = useCallback(() => {
    // Don't stop propagation - let React Flow handle selection
    setIsEditing(true)
  }, [])

  const handleSave = useCallback(() => {
    const trimmedText = localText.trim()
    
    if (trimmedText && trimmedText !== currentLabel) {
      updateNode(id, { 
        parameters: { 
          ...(typeof data.parameters === 'object' && data.parameters !== null ? data.parameters : {}),
          label: trimmedText
        } 
      })
    } else if (!trimmedText) {
      // Reset to previous value if empty
      setLocalText(currentLabel)
    }
    
    setIsEditing(false)
  }, [localText, currentLabel, id, updateNode, data.parameters])

  const handleCancel = useCallback(() => {
    setLocalText(currentLabel)
    setIsEditing(false)
  }, [currentLabel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Only stop propagation for keys we're handling
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      handleCancel()
    }
    // Let other keys (including Delete, Backspace while typing) propagate normally
  }, [handleSave, handleCancel])

  const handleBlur = useCallback(() => {
    // Small delay to allow click events to fire
    setTimeout(() => {
      handleSave()
    }, 100)
  }, [handleSave])

  // Delete handler
  const handleDelete = useCallback(() => {
    if (!workflow) return
    
    saveToHistory('Delete annotation')
    
    // Remove from React Flow
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
    
    // Remove from workflow store
    updateWorkflow({
      nodes: workflow.nodes.filter((node) => node.id !== id),
    })
  }, [id, workflow, updateWorkflow, saveToHistory, setNodes])

  // Copy handler
  const handleCopy = useCallback(() => {
    // Select this node first
    setNodes((nodes) => 
      nodes.map((node) => ({
        ...node,
        selected: node.id === id
      }))
    )
    // Then call copy
    setTimeout(() => copy?.(), 50)
  }, [id, copy, setNodes])

  // Cut handler
  const handleCut = useCallback(() => {
    // Select this node first
    setNodes((nodes) => 
      nodes.map((node) => ({
        ...node,
        selected: node.id === id
      }))
    )
    // Then call cut
    setTimeout(() => cut?.(), 50)
  }, [id, cut, setNodes])

  // Ungroup handler
  const handleUngroup = useCallback(() => {
    detachNodes([id], undefined)
  }, [id, detachNodes])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div onContextMenu={(e) => e.stopPropagation()}>
          <NodeResizer 
            isVisible={selected}
            minWidth={100}
            minHeight={30}
          />
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className='annotation-textarea'
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              spellCheck={false}
              placeholder="Add your note here..."
            />
          ) : (
            <div 
              className='annotation-display'
              onDoubleClick={handleDoubleClick}
            >
              {currentLabel}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={handleCopy}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </ContextMenuItem>

        <ContextMenuItem
          onClick={handleCut}
          className="cursor-pointer"
        >
          <Scissors className="mr-2 h-4 w-4" />
          Cut
        </ContextMenuItem>

        {isInGroup && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={handleUngroup}
              className="cursor-pointer"
            >
              <Ungroup className="mr-2 h-4 w-4" />
              Remove from Group
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={handleDelete}
          className="cursor-pointer text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default memo(AnnotationNode)
