"use client"
import { CredentialsList } from "@/components/credential/CredentialsList"
import { ExecutionsList } from "@/components/execution"
import { NavUser } from "@/components/nav-user"
import { NodeTypesList } from "@/components/node/NodeTypesList"
import { Button } from "@/components/ui/button"
import { useConfirmDialog } from "@/components/ui/ConfirmDialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { VariablesList } from "@/components/variable/VariablesList"
import { WorkflowsList } from "@/components/workflow/WorkflowsList"
import { useSidebarContext } from "@/contexts"
import { useAuthStore, useWorkflowStore } from "@/stores"
import {
  Activity,
  ArrowLeft,
  Database,
  Home,
  Key,
  Plus,
  Settings,
  Variable,
  Workflow
} from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"

// This is sample data for the workflow editor
const data = {
  user: {
    name: "Workflow User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: false,
    },

    {
      title: "New Workflow",
      url: "/workflows/new", 
      icon: Plus,
      isActive: false,
    },
  ],
  workflowItems: [
    {
      title: "All Workflows",
      url: "#",
      icon: Workflow,
      isActive: false,
    },
    {
      title: "All Credentials",
      url: "#",
      icon: Key,
      isActive: false,
    },
    {
      title: "Variables",
      url: "#",
      icon: Variable,
      isActive: false,
    },
    {
      title: "Nodes",
      url: "#",
      icon: Database,
      isActive: true,
    },
    {
      title: "Executions",
      url: "#",
      icon: Activity,
      isActive: false,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      isActive: false,
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open, setOpen } = useSidebar()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { id: workflowId } = useParams<{ id: string }>()
  const { 
    activeWorkflowItem, 
    setActiveWorkflowItem,
    headerSlot,
    detailSidebar,
    setDetailSidebar
  } = useSidebarContext()

  // Get workflow state to check for unsaved changes
  const { isDirty, isTitleDirty } = useWorkflowStore()
  const { showConfirm, ConfirmDialog } = useConfirmDialog()

  const handleNavigation = async (url: string) => {
    // Check if navigating to "New Workflow" and there are unsaved changes
    if (url === "/workflows/new" && (isDirty || isTitleDirty)) {
      const confirmed = await showConfirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes in the current workflow. Creating a new workflow will discard these changes.',
        details: [
          'All unsaved changes will be lost',
          'Consider saving your current workflow first'
        ],
        confirmText: 'Create New Workflow',
        cancelText: 'Cancel',
        severity: 'warning'
      })

      if (!confirmed) return
    }

    navigate(url)
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden"
      {...props}
    >
      <div className="flex h-full">
        {/* This is the first sidebar */}
        {/* We disable collapsible and adjust width to icon. */}
        {/* This will make the sidebar appear as icons. */}
        <Sidebar
          collapsible="none"
          className="w-[calc(var(--sidebar-width-icon)+1px)] border-r"
        >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Workflow className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">n8n Clone</span>
                    <span className="truncate text-xs">Workflow</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Navigation Items */}
          <SidebarGroup>
         
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => handleNavigation(item.url)}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Workflow Items */}
          <SidebarGroup>
            
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.workflowItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        if (activeWorkflowItem?.title === item.title) {
                          // Toggle sidebar if same item is clicked
                          setOpen(!open)
                        } else {
                          // Set new item and open sidebar
                          setActiveWorkflowItem(item)
                          setOpen(true)
                        }
                      }}
                      isActive={activeWorkflowItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user || data.user} />
        </SidebarFooter>
      </Sidebar>
      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        {/* Show DetailSidebar header when detail sidebar is open, otherwise show normal header */}
        {detailSidebar ? (
          <SidebarHeader className="gap-3 border-b p-4 bg-sidebar/50">
            <div className="flex w-full items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailSidebar(null)}
                className="h-8 w-8 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-sidebar-foreground truncate">
                  {detailSidebar.title}
                </h2>
              </div>
            </div>
          </SidebarHeader>
        ) : (
          <SidebarHeader className="gap-3.5 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-foreground text-base font-medium">
                {activeWorkflowItem?.title}
              </div>
            </div>
            {/* Render header slot if available - each component provides its own header and search */}
            {headerSlot}
          </SidebarHeader>
        )}
        
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {/* Show DetailSidebar content when open, otherwise show normal content */}
              {detailSidebar ? (
                detailSidebar.content
              ) : (
                <>
                  {activeWorkflowItem?.title === "All Workflows" && (
                    <WorkflowsList />
                  )}
                  
                  {activeWorkflowItem?.title === "All Credentials" && (
                    <CredentialsList />
                  )}
                  
                  {activeWorkflowItem?.title === "Variables" && (
                    <VariablesList currentWorkflowId={workflowId && workflowId !== 'new' ? workflowId : undefined} />
                  )}
                  
                  {activeWorkflowItem?.title === "Nodes" && (
                    <NodeTypesList />
                  )}
                  
                  {activeWorkflowItem?.title === "Executions" && (
                    <ExecutionsList />
                  )}
                  
                  {activeWorkflowItem?.title === "Settings" && (
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Workflow Settings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Auto-save</span>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Show minimap</span>
                            <Switch />
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Grid snap</span>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      </div>
      <ConfirmDialog />
    </Sidebar>
  )
}