import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Globe, RefreshCw, TestTube } from "lucide-react";
import { useEffect, useState } from "react";

interface WebhookUrlGeneratorProps {
  value?: string; // webhookId, formId, or chatId
  onChange?: (value: string) => void;
  disabled?: boolean;
  path?: string;
  mode?: "test" | "production";
  urlType?: "webhook" | "form" | "chat"; // NEW: Type of URL to generate
}

export function WebhookUrlGenerator({
  value,
  onChange,
  disabled = false,
  path = "",
  mode = "test",
  urlType = "webhook",
}: WebhookUrlGeneratorProps) {
  const [webhookId, setWebhookId] = useState<string>(value || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTest, setCopiedTest] = useState(false);
  const [copiedProd, setCopiedProd] = useState(false);

  // Get base URLs from environment or use defaults
  const getBaseUrl = (environment: "test" | "production") => {
    if (urlType === "form") {
      // For forms, use frontend URL
      if (environment === "test") {
        return import.meta.env.VITE_APP_URL || "http://localhost:3000";
      } else {
        return import.meta.env.VITE_APP_PROD_URL || "https://your-domain.com";
      }
    } else if (urlType === "chat") {
      // For chats, use API URL (add /api if not present)
      if (environment === "test") {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
        return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
      } else {
        const apiUrl = import.meta.env.VITE_API_PROD_URL || "https://your-domain.com";
        return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
      }
    } else {
      // For webhooks, use webhook URL
      if (environment === "test") {
        return import.meta.env.VITE_WEBHOOK_TEST_URL || 
               import.meta.env.VITE_API_URL?.replace('/api', '/webhook') || 
               "http://localhost:4000/webhook";
      } else {
        return import.meta.env.VITE_WEBHOOK_PROD_URL || 
               import.meta.env.VITE_WEBHOOK_BASE_URL || 
               "https://your-domain.com/webhook";
      }
    }
  };

  // Get widget script URLs
  /* const getWidgetScriptUrl = (environment: "test" | "production") => {
    const baseUrl = environment === "test" 
      ? (import.meta.env.VITE_APP_URL || "http://localhost:3000")
      : (import.meta.env.VITE_APP_PROD_URL || "https://your-domain.com");
    
    if (urlType === "chat") {
      return `${baseUrl}/widgets/chat/nd-chat-widget.umd.js`;
    } else if (urlType === "form") {
      return `${baseUrl}/widgets/form/nd-form-widget.umd.js`;
    } else {
      return `${baseUrl}/widgets/webhook/nd-webhook-widget.umd.js`;
    }
  }; */

  // Generate webhook ID if not exists
  useEffect(() => {
    if (!webhookId) {
      generateWebhookId();
    }
  }, []);

  const generateWebhookId = async () => {
    setIsGenerating(true);
    try {
      // Generate a unique webhook ID (UUID v4)
      const newWebhookId = crypto.randomUUID();
      setWebhookId(newWebhookId);
      
      // Notify parent component
      if (onChange) {
        onChange(newWebhookId);
      }
    } catch (error) {
      console.error("Error generating webhook ID:", error);
      // Fallback to simple ID generation
      const fallbackId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setWebhookId(fallbackId);
      if (onChange) {
        onChange(fallbackId);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Construct full webhook/form/chat URLs
  const constructWebhookUrl = (environment: "test" | "production") => {
    const baseUrl = getBaseUrl(environment);
    
    if (urlType === "form") {
      // Form URLs: http://localhost:3000/form/{formId}
      return `${baseUrl}/form/${webhookId}`;
    } else if (urlType === "chat") {
      // Chat URLs: http://localhost:4000/api/public/chats/{chatId}
      return `${baseUrl}/public/chats/${webhookId}`;
    } else {
      // Webhook URLs: http://localhost:4000/webhook/{webhookId}[/path]
      const cleanPath = path?.trim().replace(/^\/+/, "") || "";
      return `${baseUrl}/${webhookId}${cleanPath ? "/" + cleanPath : ""}`;
    }
  };

  const testWebhookUrl = constructWebhookUrl("test");
  const productionWebhookUrl = constructWebhookUrl("production");

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: "test" | "production") => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === "test") {
        setCopiedTest(true);
        setTimeout(() => setCopiedTest(false), 2000);
      } else {
        setCopiedProd(true);
        setTimeout(() => setCopiedProd(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      
      if (type === "test") {
        setCopiedTest(true);
        setTimeout(() => setCopiedTest(false), 2000);
      } else {
        setCopiedProd(true);
        setTimeout(() => setCopiedProd(false), 2000);
      }
    }
  };

  return (
    <Tabs defaultValue={mode} className="w-full">
      <div className="space-y-3">
        {/* Label and Tabs in one row */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {urlType === "form" ? "Public Form URL" : urlType === "chat" ? "Public Chat URL" : "Webhook URL"}
          </Label>
          <TabsList className="inline-flex h-9">
            <TabsTrigger value="test" className="text-xs" disabled={disabled}>
              <TestTube className="w-3 h-3 mr-1" />
              Test
            </TabsTrigger>
            <TabsTrigger value="production" className="text-xs" disabled={disabled}>
              <Globe className="w-3 h-3 mr-1" />
              Production
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Test URL Content */}
        <TabsContent value="test" className="mt-0">
          <div className="flex gap-2">
            <Input
              value={testWebhookUrl}
              readOnly
              disabled={disabled}
              className="font-mono text-xs h-9 bg-blue-50 border-blue-200"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(testWebhookUrl, "test")}
              disabled={disabled || !webhookId}
              className="shrink-0 h-9 w-9 p-0"
            >
              {copiedTest ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Production URL Content */}
        <TabsContent value="production" className="mt-0">
          <div className="flex gap-2">
            <Input
              value={productionWebhookUrl}
              readOnly
              disabled={disabled}
              className="font-mono text-xs h-9 bg-green-50 border-green-200"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(productionWebhookUrl, "production")}
              disabled={disabled || !webhookId}
              className="shrink-0 h-9 w-9 p-0"
            >
              {copiedProd ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Webhook/Form ID Display */}
        <div className="flex gap-1.5 items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1">
              {urlType === "form" ? "Form ID" : urlType === "chat" ? "Chat ID" : "Webhook ID"}
            </Label>
            <Input
              value={webhookId}
              readOnly
              disabled={disabled}
              className="font-mono text-xs h-8 text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateWebhookId}
            disabled={disabled || isGenerating}
            className="shrink-0 h-8 w-8 p-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </Tabs>
  );
}
