import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface NodeContextMenuProps {
  nodeId: string
  position: { x: number; y: number }
  isVisible: boolean
  onClose: () => void
  onOpenProperties: (nodeId: string) => void
  onExecuteNode?: (nodeId: string) => void
  onDuplicate?: (nodeId: string) => void
  onDelete?: (nodeId: string) => void
}

export function NodeContextMenu({
  nodeId,
  position,
  isVisible,
  onClose,
  onOpenProperties,
  onExecuteNode,
  onDuplicate,
  onDelete
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      onClose()
    }
  }, [onClose])

  // Handle escape key to close
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Set up event listeners
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isVisible, handleClickOutside, handleKeyDown])

  // Calculate position to avoid screen edges
  const getAdjustedPosition = useCallback(() => {
    if (!menuRef.current) return position

    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let adjustedX = position.x
    let adjustedY = position.y

    // Adjust horizontal position if menu would go off-screen
    if (position.x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10
    }

    // Adjust vertical position if menu would go off-screen
    if (position.y + menuRect.height > viewportHeight) {
      adjustedY = viewportHeight - menuRect.height - 10
    }

    // Ensure menu doesn't go off the left or top edge
    adjustedX = Math.max(10, adjustedX)
    adjustedY = Math.max(10, adjustedY)

    return { x: adjustedX, y: adjustedY }
  }, [position])

  const handleMenuAction = useCallback((action: () => void) => {
    action()
    onClose()
  }, [onClose])

  if (!isVisible) return null

  const adjustedPosition = getAdjustedPosition()

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      role="menu"
      aria-orientation="vertical"
    >
      {/* Properties option */}
      <button
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
        onClick={() => handleMenuAction(() => onOpenProperties(nodeId))}
        role="menuitem"
      >
        <span className="mr-3">⚙️</span>
        Properties
      </button>

      {/* Execute Node option (if provided) */}
      {onExecuteNode && (
        <button
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
          onClick={() => handleMenuAction(() => onExecuteNode(nodeId))}
          role="menuitem"
        >
          <span className="mr-3">▶️</span>
          Execute Node
        </button>
      )}

      {/* Separator */}
      <div className="border-t border-gray-100 my-1" />

      {/* Duplicate option (if provided) */}
      {onDuplicate && (
        <button
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
          onClick={() => handleMenuAction(() => onDuplicate(nodeId))}
          role="menuitem"
        >
          <span className="mr-3">📋</span>
          Duplicate
        </button>
      )}

      {/* Delete option (if provided) */}
      {onDelete && (
        <>
          {onDuplicate && <div className="border-t border-gray-100 my-1" />}
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none flex items-center"
            onClick={() => handleMenuAction(() => onDelete(nodeId))}
            role="menuitem"
          >
            <span className="mr-3">🗑️</span>
            Delete
          </button>
        </>
      )}
    </div>
  )

  // Render the menu as a portal to avoid z-index issues
  return createPortal(menuContent, document.body)
}