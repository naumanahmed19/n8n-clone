import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowToolbar } from '@/components/workflow/WorkflowToolbar'

const mockProps = {
  canUndo: true,
  canRedo: true,
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onSave: vi.fn(),
  onValidate: vi.fn(),
  onExecute: vi.fn(),
  onStop: vi.fn(),
  onExport: vi.fn(),
  onImport: vi.fn(),
  isExecuting: false,
  isSaving: false
}

describe('WorkflowToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all toolbar buttons', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument()
    expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Execute')).toBeInTheDocument()
    expect(screen.getByText('Validate')).toBeInTheDocument()
    expect(screen.getByTitle('Import workflow')).toBeInTheDocument()
    expect(screen.getByTitle('Export workflow')).toBeInTheDocument()
    expect(screen.getByTitle('Workflow settings')).toBeInTheDocument()
  })

  it('should call onUndo when undo button is clicked', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    fireEvent.click(screen.getByTitle('Undo (Ctrl+Z)'))
    expect(mockProps.onUndo).toHaveBeenCalledTimes(1)
  })

  it('should call onRedo when redo button is clicked', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    fireEvent.click(screen.getByTitle('Redo (Ctrl+Y)'))
    expect(mockProps.onRedo).toHaveBeenCalledTimes(1)
  })

  it('should call onSave when save button is clicked', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    fireEvent.click(screen.getByText('Save'))
    expect(mockProps.onSave).toHaveBeenCalledTimes(1)
  })

  it('should call onExecute when execute button is clicked', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    fireEvent.click(screen.getByText('Execute'))
    expect(mockProps.onExecute).toHaveBeenCalledTimes(1)
  })

  it('should call onValidate when validate button is clicked', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    fireEvent.click(screen.getByText('Validate'))
    expect(mockProps.onValidate).toHaveBeenCalledTimes(1)
  })

  it('should disable undo button when canUndo is false', () => {
    render(<WorkflowToolbar {...mockProps} canUndo={false} />)
    
    const undoButton = screen.getByTitle('Undo (Ctrl+Z)')
    expect(undoButton).toBeDisabled()
    expect(undoButton).toHaveClass('cursor-not-allowed')
  })

  it('should disable redo button when canRedo is false', () => {
    render(<WorkflowToolbar {...mockProps} canRedo={false} />)
    
    const redoButton = screen.getByTitle('Redo (Ctrl+Y)')
    expect(redoButton).toBeDisabled()
    expect(redoButton).toHaveClass('cursor-not-allowed')
  })

  it('should show saving state when isSaving is true', () => {
    render(<WorkflowToolbar {...mockProps} isSaving={true} />)
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    const saveButton = screen.getByText('Saving...').closest('button')
    expect(saveButton).toBeDisabled()
  })

  it('should show stop button when isExecuting is true', () => {
    render(<WorkflowToolbar {...mockProps} isExecuting={true} />)
    
    expect(screen.getByText('Stop')).toBeInTheDocument()
    expect(screen.queryByText('Execute')).not.toBeInTheDocument()
  })

  it('should call onStop when stop button is clicked', () => {
    render(<WorkflowToolbar {...mockProps} isExecuting={true} />)
    
    fireEvent.click(screen.getByText('Stop'))
    expect(mockProps.onStop).toHaveBeenCalledTimes(1)
  })

  it('should call onImport when import button is clicked', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    fireEvent.click(screen.getByTitle('Import workflow'))
    expect(mockProps.onImport).toHaveBeenCalledTimes(1)
  })

  it('should call onExport when export button is clicked', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    fireEvent.click(screen.getByTitle('Export workflow'))
    expect(mockProps.onExport).toHaveBeenCalledTimes(1)
  })

  it('should handle optional props gracefully', () => {
    const minimalProps = {
      canUndo: false,
      canRedo: false,
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onSave: vi.fn(),
      onValidate: vi.fn()
    }
    
    render(<WorkflowToolbar {...minimalProps} />)
    
    // Should render without optional props
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Validate')).toBeInTheDocument()
  })

  it('should apply correct styling for enabled/disabled states', () => {
    render(<WorkflowToolbar {...mockProps} canUndo={true} canRedo={false} />)
    
    const undoButton = screen.getByTitle('Undo (Ctrl+Z)')
    const redoButton = screen.getByTitle('Redo (Ctrl+Y)')
    
    expect(undoButton).toHaveClass('text-gray-700', 'hover:bg-gray-100')
    expect(redoButton).toHaveClass('text-gray-400', 'cursor-not-allowed')
  })

  it('should show correct button colors', () => {
    render(<WorkflowToolbar {...mockProps} />)
    
    const saveButton = screen.getByText('Save').closest('button')
    const executeButton = screen.getByText('Execute').closest('button')
    const validateButton = screen.getByText('Validate').closest('button')
    
    expect(saveButton).toHaveClass('bg-blue-600', 'text-white')
    expect(executeButton).toHaveClass('bg-green-600', 'text-white')
    expect(validateButton).toHaveClass('border-gray-300', 'text-gray-700')
  })

  it('should show stop button with correct styling when executing', () => {
    render(<WorkflowToolbar {...mockProps} isExecuting={true} />)
    
    const stopButton = screen.getByText('Stop').closest('button')
    expect(stopButton).toHaveClass('bg-red-600', 'text-white')
  })
})