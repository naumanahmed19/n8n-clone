import { Layout, ProtectedRoute, WorkflowEditorLayout } from '@/components'
import { Toaster } from '@/components/ui/sonner'

import { SidebarContextProvider } from '@/contexts'
import { 
  CredentialsPage, 
  CustomNodesPage, 
  ExecutionsPage, 
  LoginPage, 
  RegisterPage, 
  WorkspacePage,
  WorkflowEditorPage
} from '@/pages'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

function App() {
  return (
    <>
      <Router>
        <SidebarContextProvider>
          <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <RegisterPage />
              </ProtectedRoute>
            }
          />

          {/* Workflow editor routes with persistent layout - must come before main routes */}
          <Route
            path="/workflows/:id/executions/:executionId"
            element={
              <ProtectedRoute>
                <WorkflowEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:id/*"
            element={
              <ProtectedRoute>
                <WorkflowEditorPage />
              </ProtectedRoute>
            }
          />
          
          {/* Workflow landing page route - without ID shows landing page */}
          <Route
            path="/workflows"
            element={
              <ProtectedRoute>
                <WorkflowEditorLayout />
              </ProtectedRoute>
            }
          />

          {/* Main application routes with layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/workflows" replace />} />
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="executions" element={<ExecutionsPage />} />
            <Route path="credentials" element={<CredentialsPage />} />
            <Route path="custom-nodes" element={<CustomNodesPage />} />
          
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SidebarContextProvider>
      </Router>
      <Toaster />
    </>
  )
}

export default App