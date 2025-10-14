import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { JsonEditor } from '@/components/ui/json-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWorkflowStore } from '@/stores'
import { Workflow } from '@/types'
import { Check, Copy, Download, Edit, Save, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface WorkflowCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  workflow: Workflow | null
}

export function WorkflowCodeDialog({
  isOpen,
  onClose,
  workflow,
}: WorkflowCodeDialogProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [activeTab, setActiveTab] = useState('full')
  
  const updateWorkflow = useWorkflowStore(state => state.updateWorkflow)
  const setDirty = useWorkflowStore(state => state.setDirty)

  if (!workflow) return null

  // Prepare different views of the workflow
  const fullWorkflow = JSON.stringify(workflow, null, 2)
  const nodesOnly = JSON.stringify(workflow.nodes, null, 2)
  const connectionsOnly = JSON.stringify(workflow.connections, null, 2)
  const settingsOnly = JSON.stringify(workflow.settings, null, 2)

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDownload = (content: string, filename: string) => {
    try {
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Downloaded successfully')
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const handleEdit = (content: string) => {
    setEditedContent(content)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent('')
  }

  const handleSaveEdit = () => {
    try {
      const parsed = JSON.parse(editedContent)
      
      // Update based on active tab
      if (activeTab === 'full') {
        // Update entire workflow (be careful with this)
        if (parsed.nodes && parsed.connections) {
          updateWorkflow({
            nodes: parsed.nodes,
            connections: parsed.connections,
            settings: parsed.settings || workflow.settings,
            description: parsed.description,
            tags: parsed.tags,
            category: parsed.category,
          })
        }
      } else if (activeTab === 'nodes') {
        updateWorkflow({ nodes: parsed })
      } else if (activeTab === 'connections') {
        updateWorkflow({ connections: parsed })
      } else if (activeTab === 'settings') {
        updateWorkflow({ settings: parsed })
      }
      
      setDirty(true)
      setIsEditing(false)
      toast.success('Workflow updated! Remember to save.')
    } catch (error) {
      toast.error('Invalid JSON format. Please check your syntax.')
    }
  }

  const renderTabContent = (content: string) => (
    <>
      {isEditing ? (
        <JsonEditor
          value={editedContent}
          onValueChange={setEditedContent}
          className="flex-1 min-h-0 h-full"
          placeholder="Edit JSON..."
        />
      ) : (
        <div className="flex-1 min-h-0 border rounded-lg bg-muted/50 overflow-auto">
          <pre className="text-xs font-mono whitespace-pre p-4">
            {content}
          </pre>
        </div>
      )}
    </>
  )

  const renderButtons = (content: string, filename: string) => (
    <div className="flex gap-2">
      {!isEditing ? (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(content)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(content)}
          >
            {copied ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(content, filename)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelEdit}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleSaveEdit}
          >
            <Save className="h-4 w-4 mr-1" />
            Apply Changes
          </Button>
        </>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Workflow Code</DialogTitle>
          <DialogDescription>
            View, edit, and export the JSON representation of your workflow
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="full" 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value)
            setIsEditing(false)
            setEditedContent('')
          }} 
          className="flex-1 flex flex-col min-h-0 px-6 pb-6"
        >
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="full">Full Workflow</TabsTrigger>
            <TabsTrigger value="nodes">Nodes Only</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="full" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Complete workflow structure including metadata
              </p>
              {renderButtons(fullWorkflow, `workflow_${workflow.name.replace(/\s+/g, '_')}_full.json`)}
            </div>
            {renderTabContent(fullWorkflow)}
          </TabsContent>

          <TabsContent value="nodes" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Node definitions with parameters and positions
              </p>
              {renderButtons(nodesOnly, `workflow_${workflow.name.replace(/\s+/g, '_')}_nodes.json`)}
            </div>
            {renderTabContent(nodesOnly)}
          </TabsContent>

          <TabsContent value="connections" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Node connections defining the workflow flow
              </p>
              {renderButtons(connectionsOnly, `workflow_${workflow.name.replace(/\s+/g, '_')}_connections.json`)}
            </div>
            {renderTabContent(connectionsOnly)}
          </TabsContent>

          <TabsContent value="settings" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Workflow settings and configuration
              </p>
              {renderButtons(settingsOnly, `workflow_${workflow.name.replace(/\s+/g, '_')}_settings.json`)}
            </div>
            {renderTabContent(settingsOnly)}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
