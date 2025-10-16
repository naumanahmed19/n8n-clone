import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ErrorPageProps {
  title?: string
  message?: string
  showRefresh?: boolean
  showBackButton?: boolean
  backButtonText?: string
  backButtonPath?: string
}

export function ErrorPage({
  title = 'Error Loading Workflow',
  message = 'Failed to load node types. Please refresh the page.',
  showRefresh = true,
  showBackButton = true,
  backButtonText = 'Back to Workflows',
  backButtonPath = '/workflows'
}: ErrorPageProps) {
  const navigate = useNavigate()

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleBack = () => {
    navigate(backButtonPath)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-base font-semibold">{title}</AlertTitle>
            <AlertDescription className="mt-2">
              {message}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {showRefresh && (
            <Button 
              onClick={handleRefresh}
              className="w-full sm:w-auto"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          )}
          {showBackButton && (
            <Button
              onClick={handleBack}
              className="w-full sm:w-auto"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backButtonText}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
