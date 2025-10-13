import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Globe, RefreshCw, TestTube } from "lucide-react";
import { useEffect, useState } from "react";

interface WebhookUrlGeneratorProps {
  value?: string; // webhookId
  onChange?: (value: string) => void;
  disabled?: boolean;
  path?: string;
  mode?: "test" | "production";
}

export function WebhookUrlGenerator({
  value,
  onChange,
  disabled = false,
  path = "",
  mode = "test",
}: WebhookUrlGeneratorProps) {
  const [webhookId, setWebhookId] = useState<string>(value || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTest, setCopiedTest] = useState(false);
  const [copiedProd, setCopiedProd] = useState(false);

  // Get base URLs from environment or use defaults
  const getBaseUrl = (environment: "test" | "production") => {
    if (environment === "test") {
      return import.meta.env.VITE_WEBHOOK_TEST_URL || 
             import.meta.env.VITE_API_URL?.replace('/api', '/webhook') || 
             "http://localhost:4000/webhook";
    } else {
      return import.meta.env.VITE_WEBHOOK_PROD_URL || 
             import.meta.env.VITE_WEBHOOK_BASE_URL || 
             "https://your-domain.com/webhook";
    }
  };

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

  // Construct full webhook URLs
  const constructWebhookUrl = (environment: "test" | "production") => {
    const baseUrl = getBaseUrl(environment);
    const cleanPath = path?.trim().replace(/^\/+/, "") || "";
    const url = `${baseUrl}/${webhookId}${cleanPath ? "/" + cleanPath : ""}`;
    return url;
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
          <Label className="text-sm font-medium">Webhook URL</Label>
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

        {/* Webhook ID Display */}
        <div className="flex gap-1.5 items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1">Webhook ID</Label>
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
