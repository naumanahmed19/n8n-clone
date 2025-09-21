import { Layout, ProtectedRoute } from '@/components'
import { Toaster } from '@/components/ui/sonner'
import { CredentialsPage, CustomNodesPage, ExecutionsPage, LoginPage, RegisterPage, WorkflowEditorPage, WorkspacePage } from '@/pages'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

function App() {
  return (
    <>
      <Router>
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
            <Route path="workflows" element={<WorkspacePage />} />
            <Route path="executions" element={<ExecutionsPage />} />
            <Route path="credentials" element={<CredentialsPage />} />
            <Route path="custom-nodes" element={<CustomNodesPage />} />
          </Route>

          {/* Workflow editor routes without layout */}
          <Route
            path="/workflows/:id/edit"
            element={
              <ProtectedRoute>
                <WorkflowEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/new"
            element={
              <ProtectedRoute>
                <WorkflowEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  )
}

export default App