import {
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { Copy, Scissors, Clipboard, Lock, Play, Settings, Trash2, Unlock } from 'lucide-react'

interface NodeContextMenuProps {
  onOpenProperties: () => void
  onExecute: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleLock: () => void
  onCopy?: () => void
  onCut?: () => void
  onPaste?: () => void
  isLocked: boolean
  readOnly?: boolean
  canCopy?: boolean
  canPaste?: boolean
}

export function NodeContextMenu({
  onOpenProperties,
  onExecute,
  onDuplicate,
  onDelete,
  onToggleLock,
  onCopy,
  onCut,
  onPaste,
  isLocked,
  readOnly = false,
  canCopy = false,
  canPaste = false,
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
        onClick={onToggleLock}
        disabled={readOnly}
        className="cursor-pointer"
      >
        {isLocked ? (
          <>
            <Unlock className="mr-2 h-4 w-4" />
            Unlock Node
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Lock Node
          </>
        )}
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

      {/* Copy/Cut/Paste Options */}
      {onCopy && (
        <ContextMenuItem
          onClick={onCopy}
          disabled={!canCopy || readOnly}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </ContextMenuItem>
      )}

      {onCut && (
        <ContextMenuItem
          onClick={onCut}
          disabled={!canCopy || readOnly}
          className="cursor-pointer"
        >
          <Scissors className="mr-2 h-4 w-4" />
          Cut
        </ContextMenuItem>
      )}

      {onPaste && (
        <ContextMenuItem
          onClick={onPaste}
          disabled={!canPaste || readOnly}
          className="cursor-pointer"
        >
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
        </ContextMenuItem>
      )}

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
