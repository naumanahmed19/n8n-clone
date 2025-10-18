import { FormGenerator } from '@/components/ui/form-generator/FormGenerator'
import { FormFieldConfig, FormGeneratorRef } from '@/components/ui/form-generator/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

interface FormConfig {
  formTitle: string
  formDescription: string
  formFields: FormFieldConfig[]
  submitButtonText: string
  workflowName?: string
  isActive?: boolean
}

interface FormResponse {
  success: boolean
  form?: FormConfig
  formId?: string
  workflowId?: string
  error?: string
}

export function PublicFormPage() {
  const { formId } = useParams<{ formId: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null)
  const [workflowId, setWorkflowId] = useState<string>('')
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  
  const formGeneratorRef = useRef<FormGeneratorRef>(null)

  // Fetch form configuration on mount
  useEffect(() => {
    const fetchFormConfig = async () => {
      if (!formId) {
        setLoading(false)
        return
      }

      try {
        const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
        const apiUrl = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`
        const response = await axios.get<FormResponse>(`${apiUrl}/public/forms/${formId}`)
        
        if (response.data.success && response.data.form) {
          setFormConfig(response.data.form)
          setWorkflowId(response.data.workflowId || '')
        } else {
          setSubmitStatus('error')
          setSubmitMessage(response.data.error || 'Form not found')
        }
      } catch (error: any) {
        console.error('Error fetching form:', error)
        setSubmitStatus('error')
        const errorMessage = typeof error.response?.data?.error === 'string' 
          ? error.response.data.error 
          : error.message || 'Failed to load form. Please check the URL and try again.'
        setSubmitMessage(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchFormConfig()
  }, [formId])

  // Handle field value changes
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear field error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formId || !formConfig || submitting) return

    // Validate form
    const validationErrors = formGeneratorRef.current?.validate()
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    setSubmitStatus('idle')
    setErrors({})

    try {
      const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const apiUrl = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`
      const response = await axios.post(`${apiUrl}/public/forms/${formId}/submit`, {
        formData: formValues,
        workflowId: workflowId
      })

      if (response.data.success) {
        setSubmitStatus('success')
        setSubmitMessage(response.data.message || 'Form submitted successfully!')
        
        // Reset form after successful submission
        setFormValues({})
        
        // Scroll to success message
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setSubmitStatus('error')
        setSubmitMessage(response.data.error || 'Failed to submit form')
      }
    } catch (error: any) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
      const errorMessage = typeof error.response?.data?.error === 'string'
        ? error.response.data.error
        : error.message || 'An error occurred while submitting the form. Please try again.'
      setSubmitMessage(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading form...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state (form not found)
  if (!formConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className="w-16 h-16 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">Form Not Found</h2>
              <p className="text-muted-foreground text-center">
                {submitMessage || 'The form you are looking for does not exist or is no longer available.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main form view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success/Error Alert */}
        {submitStatus === 'success' && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {submitMessage}
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {submitMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold">
              {formConfig.formTitle}
            </CardTitle>
            {formConfig.formDescription && (
              <CardDescription className="text-base">
                {formConfig.formDescription}
              </CardDescription>
            )}
            {formConfig.workflowName && (
              <p className="text-xs text-muted-foreground pt-2">
                Powered by {formConfig.workflowName}
              </p>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Fields */}
              <FormGenerator
                ref={formGeneratorRef}
                fields={formConfig.formFields}
                values={formValues}
                errors={errors}
                onChange={handleFieldChange}
                disabled={submitting}
                disableAutoValidation={true}
                showRequiredIndicator={true}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting || formConfig.formFields.length === 0}
                  className="w-full h-11 text-base"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    formConfig.submitButtonText || 'Submit'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span>Powered by n8n-clone</span>
            <ExternalLink className="w-3 h-3" />
          </p>
        </div>
      </div>
    </div>
  )
}
