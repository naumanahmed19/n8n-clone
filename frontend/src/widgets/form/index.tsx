import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicFormWidget } from './PublicFormWidget'

interface WidgetConfig {
  formId: string
  apiUrl?: string
  container?: string | HTMLElement
  theme?: 'light' | 'dark' | 'auto'
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

class N8nFormWidget {
  private root: ReactDOM.Root | null = null
  private container: HTMLElement | null = null

  /**
   * Initialize and render the form widget
   */
  public init(config: WidgetConfig): void {
    const {
      formId,
      apiUrl,
      container,
      theme = 'auto',
      onSuccess,
      onError
    } = config

    if (!formId) {
      console.error('N8nFormWidget: formId is required')
      return
    }

    // Get or create container
    if (typeof container === 'string') {
      this.container = document.querySelector(container)
    } else if (container instanceof HTMLElement) {
      this.container = container
    } else {
      this.container = document.getElementById('n8n-form-widget')
    }

    if (!this.container) {
      console.error('N8nFormWidget: Container element not found')
      return
    }

    // Add widget class for scoped styling
    this.container.classList.add('n8n-form-widget')
    this.container.setAttribute('data-theme', theme)

    // Render React app
    this.root = ReactDOM.createRoot(this.container)
    this.root.render(
      <React.StrictMode>
        <PublicFormWidget
          formId={formId}
          apiUrl={apiUrl}
          theme={theme}
          onSuccess={onSuccess}
          onError={onError}
        />
      </React.StrictMode>
    )
  }

  /**
   * Destroy the widget instance
   */
  public destroy(): void {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }
    if (this.container) {
      this.container.innerHTML = ''
      this.container.classList.remove('n8n-form-widget')
    }
  }

  /**
   * Update widget configuration
   */
  public update(config: Partial<WidgetConfig>): void {
    this.destroy()
    this.init(config as WidgetConfig)
  }
}

// Global widget instance
declare global {
  interface Window {
    N8nFormWidget: typeof N8nFormWidget
    n8nFormWidget?: N8nFormWidget
  }
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.N8nFormWidget = N8nFormWidget
  
  // Auto-initialize if data attributes are present
  const initWidgets = () => {
    const autoInitElements = document.querySelectorAll('[data-n8n-form]')
    
    autoInitElements.forEach((element) => {
      const formId = element.getAttribute('data-n8n-form')
      const apiUrl = element.getAttribute('data-api-url') || undefined
      const theme = element.getAttribute('data-theme') as 'light' | 'dark' | 'auto' || 'auto'
      
      if (formId) {
        const widget = new N8nFormWidget()
        widget.init({
          formId,
          apiUrl,
          container: element as HTMLElement,
          theme
        })
      }
    })
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets)
  } else {
    initWidgets()
  }
}

export { N8nFormWidget }
export type { WidgetConfig }
