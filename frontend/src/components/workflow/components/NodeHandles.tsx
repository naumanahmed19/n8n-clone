import { clsx } from 'clsx'
import { Handle, Position } from 'reactflow'

interface NodeHandlesProps {
  inputs?: string[]
  outputs?: string[]
  disabled: boolean
  isTrigger: boolean
  hoveredOutput: string | null
  onOutputMouseEnter: (output: string) => void
  onOutputMouseLeave: () => void
  onOutputClick: (event: React.MouseEvent<HTMLDivElement>, output: string) => void
}

export function NodeHandles({
  inputs,
  outputs,
  disabled,
  isTrigger,
  hoveredOutput,
  onOutputMouseEnter,
  onOutputMouseLeave,
  onOutputClick
}: NodeHandlesProps) {
  return (
    <>
      {/* Input Handles */}
      {inputs && inputs.length > 0 && (
        <>
          {inputs.map((input, index) => {
            const totalInputs = inputs.length
            const isSingleInput = totalInputs === 1
            const top = isSingleInput 
              ? '50%' 
              : `${((index + 1) / (totalInputs + 1)) * 100}%`
            
            return (
              <Handle
                key={`input-${input}-${index}`}
                id={input}
                type="target"
                position={Position.Left}
                style={{
                  top,
                  transform: 'translateY(-50%)',
                  left: '-6px'
                }}
                className={clsx(
                  "w-3 h-3 border-2 border-white",
                  disabled ? "!bg-gray-300" : "!bg-gray-400"
                )}
              />
            )
          })}
        </>
      )}

      {/* Output Handles */}
      {outputs && outputs.length > 0 && (
        <>
          {outputs.map((output, index) => {
            const totalOutputs = outputs.length
            const isSingleOutput = totalOutputs === 1
            const top = isSingleOutput 
              ? '50%' 
              : `${((index + 1) / (totalOutputs + 1)) * 100}%`
            
            const isHovered = hoveredOutput === output
            
            return (
              <OutputHandle
                key={`output-${output}-${index}`}
                output={output}
                top={top}
                isHovered={isHovered}
                disabled={disabled}
                isTrigger={isTrigger}
                onMouseEnter={() => onOutputMouseEnter(output)}
                onMouseLeave={onOutputMouseLeave}
                onClick={(e) => onOutputClick(e, output)}
              />
            )
          })}
        </>
      )}
    </>
  )
}

interface OutputHandleProps {
  output: string
  top: string
  isHovered: boolean
  disabled: boolean
  isTrigger: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
}

function OutputHandle({
  output,
  top,
  isHovered,
  disabled,
  isTrigger,
  onMouseEnter,
  onMouseLeave,
  onClick
}: OutputHandleProps) {
  return (
    <div
      className="absolute"
      style={{
        top,
        right: '-6px',
        transform: 'translateY(-50%)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Handle
        id={output}
        type="source"
        position={Position.Right}
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          right: 'auto',
          transform: 'none',
        }}
        className={clsx(
          "w-3 h-3 border-2 border-white cursor-pointer transition-all duration-200",
          isTrigger ? "rounded-full" : "",
          disabled ? "!bg-gray-300" : "!bg-gray-400 hover:!bg-primary hover:scale-125"
        )}
        onClick={onClick}
      />
      
      {/* Plus icon on hover */}
      {isHovered && !disabled && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <div className="bg-primary rounded-full p-0.5 shadow-lg animate-in fade-in zoom-in duration-150">
            <Plus className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
          </div>
        </div>
      )}
    </div>
  )
}

import { Plus } from 'lucide-react'

