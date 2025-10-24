import { Layout, ProtectedRoute, WorkflowEditorLayout } from '@/components'
import { GlobalToastProvider } from '@/components/providers/GlobalToastProvider'
import { Toaster } from '@/components/ui/sonner'

import { SidebarContextProvider, ThemeProvider } from '@/contexts'
import {
    CredentialsPage,
    CustomNodesPage,
    ExecutionsPage,
    LoginPage,
    ProfilePage,
    PublicFormPage,
    RegisterPage,
    WorkflowEditorPage
} from '@/pages'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

function App() {
  return (
    <>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider>
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
          
          {/* Public form route - no authentication required */}
          <Route path="/form/:formId" element={<PublicFormPage />} />

          {/* OAuth callback route - requires auth */}
          <Route
            path="/oauth/callback"
            element={
              <ProtectedRoute>
                <OAuthCallback />
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
            <Route path="executions" element={<ExecutionsPage />} />
            <Route path="credentials" element={<CredentialsPage />} />
            <Route path="custom-nodes" element={<CustomNodesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
          <GlobalToastProvider />
        </SidebarContextProvider>
        </ThemeProvider>
      </Router>
    </>
  )
}

export default App
