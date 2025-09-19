import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, ProtectedRoute } from '@/components'
import { LoginPage, WorkflowsPage, WorkflowEditorPage, ExecutionsPage } from '@/pages'

function App() {
  return (
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

        {/* Main application routes - allow guest access */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/workflows" replace />} />
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="workflows/:id/edit" element={<WorkflowEditorPage />} />
          <Route path="workflows/new" element={<WorkflowEditorPage />} />
          <Route path="executions" element={<ExecutionsPage />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/workflows" replace />} />
      </Routes>
    </Router>
  )
}

export default App