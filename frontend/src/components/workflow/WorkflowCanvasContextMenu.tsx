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
import { useWorkflowOperations } from '@/hooks/workflow';
import { useReactFlowUIStore, useWorkflowStore, useWorkflowToolbarStore } from '@/stores';
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
  readOnly?: boolean
}

export function WorkflowCanvasContextMenu({
  children,
  readOnly = false
}: WorkflowCanvasContextMenuProps) {
  // Use stores directly instead of hooks with local state
  const {
    workflow,
    undo,
    redo,
    canUndo,
    canRedo,
    toggleWorkflowActive,
  } = useWorkflowStore()

  const {
    saveWorkflow,
    validateAndShowResult,
    handleExport,
    handleImport,
    isExporting,
    isImporting,
    hasUnsavedChanges,
  } = useWorkflowOperations()

  // ReactFlow UI state from store
  const {
    showMinimap,
    showBackground,
    showControls,
    showExecutionPanel,
    toggleMinimap,
    toggleBackground,
    toggleControls,
    changeBackgroundVariant,
    toggleExecutionPanel,
    zoomIn,
    zoomOut,
    fitView,
    zoomToFit,
  } = useReactFlowUIStore()

  // Toolbar state from store
  const {
    showNodePalette,
    showExecutionsPanel,
    toggleNodePalette,
    toggleExecutionsPanel,
  } = useWorkflowToolbarStore()

  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImport(file)
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
          onClick={saveWorkflow}
          disabled={!hasUnsavedChanges || readOnly}
          className="cursor-pointer"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Workflow
        </ContextMenuItem>
        
        {/* Import/Export */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            Import/Export
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem
              onClick={handleExport}
              disabled={isExporting}
              className="cursor-pointer"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Workflow'}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={handleImportClick}
              disabled={isImporting || readOnly}
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
          onClick={undo}
          disabled={!canUndo() || readOnly}
          className="cursor-pointer"
        >
          <Undo className="mr-2 h-4 w-4" />
          Undo
        </ContextMenuItem>
        <ContextMenuItem
          onClick={redo}
          disabled={!canRedo() || readOnly}
          className="cursor-pointer"
        >
          <Redo className="mr-2 h-4 w-4" />
          Redo
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Workflow Control */}
        <ContextMenuItem
          onClick={toggleWorkflowActive}
          disabled={readOnly}
          className="cursor-pointer"
        >
          {workflow?.active ? (
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
          onClick={validateAndShowResult}
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
              onClick={toggleExecutionPanel}
              className="cursor-pointer"
            >
              <Play className="mr-2 h-4 w-4" />
              {showExecutionPanel ? 'Hide' : 'Show'} Execution Panel
            </ContextMenuItem>
            <ContextMenuItem
              onClick={toggleExecutionsPanel}
              className="cursor-pointer"
            >
              <History className="mr-2 h-4 w-4" />
              {showExecutionsPanel ? 'Hide' : 'Show'} Executions History
            </ContextMenuItem>
            <ContextMenuItem
              onClick={toggleNodePalette}
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
              onClick={toggleMinimap}
              className="cursor-pointer"
            >
              {showMinimap ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showMinimap ? 'Hide' : 'Show'} Minimap
            </ContextMenuItem>
            <ContextMenuItem
              onClick={toggleBackground}
              className="cursor-pointer"
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              {showBackground ? 'Hide' : 'Show'} Grid Background
            </ContextMenuItem>
            <ContextMenuItem
              onClick={toggleControls}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              {showControls ? 'Hide' : 'Show'} Controls
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={zoomIn}
              className="cursor-pointer"
            >
              <ZoomIn className="mr-2 h-4 w-4" />
              Zoom In
            </ContextMenuItem>
            <ContextMenuItem
              onClick={zoomOut}
              className="cursor-pointer"
            >
              <ZoomOut className="mr-2 h-4 w-4" />
              Zoom Out
            </ContextMenuItem>
            <ContextMenuItem
              onClick={fitView}
              className="cursor-pointer"
            >
              <Maximize className="mr-2 h-4 w-4" />
              Fit to View
            </ContextMenuItem>
            <ContextMenuItem
              onClick={zoomToFit}
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
                <ContextMenuItem onClick={() => changeBackgroundVariant('dots')}>
                  <Grid className="mr-2 h-4 w-4" />
                  Dots Pattern
                </ContextMenuItem>
                <ContextMenuItem onClick={() => changeBackgroundVariant('lines')}>
                  <Hash className="mr-2 h-4 w-4" />
                  Lines Pattern
                </ContextMenuItem>
                <ContextMenuItem onClick={() => changeBackgroundVariant('cross')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cross Pattern
                </ContextMenuItem>
                <ContextMenuItem onClick={() => changeBackgroundVariant('none')}>
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