import { clsx } from 'clsx'
import { ImageIcon, Loader2, Pause } from 'lucide-react'
import { useState } from 'react'

interface NodeContentProps {
  icon?: string
  color?: string
  nodeType: string
  disabled: boolean
  isTrigger: boolean
  statusIcon: React.ReactNode
  imageUrl?: string // For image preview nodes
  isRunning?: boolean // Add running state
}

export function NodeContent({
  icon,
  color,
  nodeType,
  disabled,
  isTrigger,
  statusIcon,
  imageUrl,
  isRunning = false
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
              "w-8 h-8 flex items-center justify-center overflow-hidden relative",
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
                !imageLoaded && 'hidden',
                isRunning && 'opacity-30'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true)
                setImageLoaded(false)
              }}
            />
            {/* Loading spinner overlay on image */}
            {isRunning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div 
            className={clsx(
              "w-8 h-8 flex items-center justify-center text-white text-sm font-bold relative",
              isTrigger ? 'rounded-full' : 'rounded'
            )}
            style={{ backgroundColor: color || '#666' }}
          >
            <span className={clsx(isRunning && 'opacity-30')}>
              {icon || nodeType.charAt(0).toUpperCase()}
            </span>
            {/* Loading spinner overlay on icon */}
            {isRunning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
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
