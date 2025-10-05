import {
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { Copy, Play, Settings, Trash2 } from 'lucide-react'

interface NodeContextMenuProps {
  onOpenProperties: () => void
  onExecute: () => void
  onDuplicate: () => void
  onDelete: () => void
  readOnly?: boolean
}

export function NodeContextMenu({
  onOpenProperties,
  onExecute,
  onDuplicate,
  onDelete,
  readOnly = false
}: NodeContextMenuProps) {
  return (
    <ContextMenuContent className="w-48">
      <ContextMenuItem
        onClick={onOpenProperties}
        className="cursor-pointer"
      >
        <Settings className="mr-2 h-4 w-4" />
        Properties
      </ContextMenuItem>

      <ContextMenuItem
        onClick={onExecute}
        disabled={readOnly}
        className="cursor-pointer"
      >
        <Play className="mr-2 h-4 w-4" />
        Execute Node
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        onClick={onDuplicate}
        disabled={readOnly}
        className="cursor-pointer"
      >
        <Copy className="mr-2 h-4 w-4" />
        Duplicate
      </ContextMenuItem>

      <ContextMenuSeparator />
      
      <ContextMenuItem
        onClick={onDelete}
        disabled={readOnly}
        className="cursor-pointer text-red-600 focus:text-red-600"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
