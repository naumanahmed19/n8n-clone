import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    CheckCircle,
    Download,
    Eye,
    EyeOff,
    FileText,
    Grid,
    Grid3X3,
    Hash,
    History,
    Map,
    Maximize,
    Palette,
    Play,
    Plus,
    Power,
    PowerOff,
    Redo,
    Save,
    Settings,
    Undo,
    Upload,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import React from 'react';

interface WorkflowCanvasContextMenuProps {
  children: React.ReactNode
  // Save and undo/redo
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
  
  // Workflow execution
  isWorkflowActive: boolean
  onToggleWorkflowActive: () => void
  
  // Panels
  showExecutionPanel: boolean
  onToggleExecutionPanel: () => void
  showExecutionsPanel: boolean
  onToggleExecutionsPanel: () => void
  showNodePalette: boolean
  onToggleNodePalette: () => void
  
  // Import/Export
  onExport: () => void
  onImport: (file: File) => void
  isExporting: boolean
  isImporting: boolean
  
  // Validation
  onValidate: () => void
  
  // ReactFlow specific
  showMinimap: boolean
  onToggleMinimap: () => void
  showBackground: boolean
  onToggleBackground: () => void
  showControls: boolean
  onToggleControls: () => void
  onFitView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomToFit: () => void
  onChangeBackgroundVariant: (variant: 'dots' | 'lines' | 'cross' | 'none') => void
}

export function WorkflowCanvasContextMenu({
  children,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  isSaving,
  isDirty,
  isWorkflowActive,
  onToggleWorkflowActive,
  showExecutionPanel,
  onToggleExecutionPanel,
  showExecutionsPanel,
  onToggleExecutionsPanel,
  showNodePalette,
  onToggleNodePalette,
  onExport,
  onImport,
  isExporting,
  isImporting,
  onValidate,
  showMinimap,
  onToggleMinimap,
  showBackground,
  onToggleBackground,
  showControls,
  onToggleControls,
  onFitView,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onChangeBackgroundVariant
}: WorkflowCanvasContextMenuProps) {
  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onImport(file)
      }
    }
    input.click()
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* File Operations */}
        <ContextMenuItem
          onClick={onSave}
          disabled={isSaving || (!isDirty)}
          className="cursor-pointer"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Workflow'}
        </ContextMenuItem>
        
        {/* Import/Export */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            Import/Export
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem
              onClick={onExport}
              disabled={isExporting}
              className="cursor-pointer"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Workflow'}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={handleImportClick}
              disabled={isImporting}
              className="cursor-pointer"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? 'Importing...' : 'Import Workflow'}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Edit Operations */}
        <ContextMenuItem
          onClick={onUndo}
          disabled={!canUndo}
          className="cursor-pointer"
        >
          <Undo className="mr-2 h-4 w-4" />
          Undo
        </ContextMenuItem>
        <ContextMenuItem
          onClick={onRedo}
          disabled={!canRedo}
          className="cursor-pointer"
        >
          <Redo className="mr-2 h-4 w-4" />
          Redo
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Workflow Control */}
        <ContextMenuItem
          onClick={onToggleWorkflowActive}
          className="cursor-pointer"
        >
          {isWorkflowActive ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Deactivate Workflow
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Activate Workflow
            </>
          )}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={onValidate}
          className="cursor-pointer"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Validate Workflow
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* View Panels */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            View Panels
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem
              onClick={onToggleExecutionPanel}
              className="cursor-pointer"
            >
              <Play className="mr-2 h-4 w-4" />
              {showExecutionPanel ? 'Hide' : 'Show'} Execution Panel
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onToggleExecutionsPanel}
              className="cursor-pointer"
            >
              <History className="mr-2 h-4 w-4" />
              {showExecutionsPanel ? 'Hide' : 'Show'} Executions History
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onToggleNodePalette}
              className="cursor-pointer"
            >
              <Palette className="mr-2 h-4 w-4" />
              {showNodePalette ? 'Hide' : 'Show'} Node Palette
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* ReactFlow View Options */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            Canvas View
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52">
            <ContextMenuItem
              onClick={onToggleMinimap}
              className="cursor-pointer"
            >
              {showMinimap ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showMinimap ? 'Hide' : 'Show'} Minimap
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onToggleBackground}
              className="cursor-pointer"
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              {showBackground ? 'Hide' : 'Show'} Grid Background
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onToggleControls}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              {showControls ? 'Hide' : 'Show'} Controls
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={onZoomIn}
              className="cursor-pointer"
            >
              <ZoomIn className="mr-2 h-4 w-4" />
              Zoom In
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onZoomOut}
              className="cursor-pointer"
            >
              <ZoomOut className="mr-2 h-4 w-4" />
              Zoom Out
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onFitView}
              className="cursor-pointer"
            >
              <Maximize className="mr-2 h-4 w-4" />
              Fit to View
            </ContextMenuItem>
            <ContextMenuItem
              onClick={onZoomToFit}
              className="cursor-pointer"
            >
              <Map className="mr-2 h-4 w-4" />
              Zoom to Fit All
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger className="cursor-pointer">
                <Grid className="mr-2 h-4 w-4" />
                Background Pattern
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => onChangeBackgroundVariant?.('dots')}>
                  <Grid className="mr-2 h-4 w-4" />
                  Dots Pattern
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onChangeBackgroundVariant?.('lines')}>
                  <Hash className="mr-2 h-4 w-4" />
                  Lines Pattern
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onChangeBackgroundVariant?.('cross')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cross Pattern
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onChangeBackgroundVariant?.('none')}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  No Pattern
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}