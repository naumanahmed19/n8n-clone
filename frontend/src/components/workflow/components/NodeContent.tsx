import { clsx } from 'clsx'
import { ImageIcon, Pause } from 'lucide-react'
import { useState } from 'react'

interface NodeContentProps {
  icon?: string
  color?: string
  nodeType: string
  disabled: boolean
  isTrigger: boolean
  statusIcon: React.ReactNode
  imageUrl?: string // For image preview nodes
}

export function NodeContent({
  icon,
  color,
  nodeType,
  disabled,
  isTrigger,
  statusIcon,
  imageUrl
}: NodeContentProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Check if this is an image preview with a valid URL
  const hasImageUrl = imageUrl && imageUrl.trim() !== ''

  return (
    <>
      {/* Node content - centered icon and status */}
      <div className="flex items-center justify-center h-full relative">
        {/* Node icon - Show image if available, otherwise show default icon */}
        {hasImageUrl && !imageError ? (
          <div 
            className={clsx(
              "w-8 h-8 flex items-center justify-center overflow-hidden",
              isTrigger ? 'rounded-full' : 'rounded',
              !imageLoaded && 'bg-gray-100'
            )}
          >
            {!imageLoaded && (
              <ImageIcon className="w-4 h-4 text-gray-400 animate-pulse" />
            )}
            <img
              src={imageUrl}
              alt="Node preview"
              className={clsx(
                "w-full h-full object-cover",
                !imageLoaded && 'hidden'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true)
                setImageLoaded(false)
              }}
            />
          </div>
        ) : (
          <div 
            className={clsx(
              "w-8 h-8 flex items-center justify-center text-white text-sm font-bold",
              isTrigger ? 'rounded-full' : 'rounded'
            )}
            style={{ backgroundColor: color || '#666' }}
          >
            {icon || nodeType.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Status icon - positioned in top right corner */}
        {statusIcon && (
          <div className="absolute -top-1 -right-1">
            {statusIcon}
          </div>
        )}
      </div>

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute top-1 right-1" data-testid="disabled-overlay">
          <Pause className="w-3 h-3 text-gray-400" />
        </div>
      )}
    </>
  )
}
