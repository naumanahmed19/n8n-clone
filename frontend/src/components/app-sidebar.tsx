"use client"
import { CredentialsList } from "@/components/credential/CredentialsList"
import { NavUser } from "@/components/nav-user"
import { NodeTypesList } from "@/components/node/NodeTypesList"
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
import { WorkflowsList } from "@/components/workflow/WorkflowsList"
import { useSidebarContext } from "@/contexts"
import { useAuthStore } from "@/stores"
import {
  Activity,
  Database,
  Home,
  Key,
  Plus,
  Settings,
  Workflow
} from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router-dom"

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
      isActive: true,
    },
    {
      title: "All Credentials",
      url: "#",
      icon: Key,
      isActive: false,
    },
    {
      title: "Nodes",
      url: "#",
      icon: Database,
      isActive: false,
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
  const { setOpen } = useSidebar()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { 
    activeWorkflowItem, 
    setActiveWorkflowItem,
    headerSlot
  } = useSidebarContext()

  // Initialize activeWorkflowItem if it's not set
  React.useEffect(() => {
    if (!activeWorkflowItem.title && data.workflowItems[0]) {
      setActiveWorkflowItem(data.workflowItems[0])
    }
  }, [activeWorkflowItem.title, setActiveWorkflowItem])



  const handleNavigation = (url: string) => {
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
                        setActiveWorkflowItem(item)
                        setOpen(true)
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
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeWorkflowItem?.title}
            </div>
          </div>
          {/* Render header slot if available - each component provides its own header and search */}
          {headerSlot}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {activeWorkflowItem?.title === "All Workflows" && (
                <WorkflowsList />
              )}
              
              {activeWorkflowItem?.title === "All Credentials" && (
                <CredentialsList />
              )}
              
              {activeWorkflowItem?.title === "Nodes" && (
                <NodeTypesList />
              )}
              
              {activeWorkflowItem?.title === "Executions" && (
                <div className="p-4">
                  <div className="text-center text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p>No executions yet</p>
                    <p className="text-xs mt-1">Run your workflow to see execution history</p>
                  </div>
                </div>
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
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      </div>
    </Sidebar>
  )
}