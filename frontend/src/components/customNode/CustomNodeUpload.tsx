import { AlertCircle, CheckCircle, FileArchive, RefreshCw, Upload, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { nodeTypeService } from '../../services/nodeType';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

interface UploadState {
  uploading: boolean;
  dragActive: boolean;
  result: any | null;
  error: string | null;
}

export const CustomNodeUpload: React.FC<{ onUploadSuccess?: () => void }> = ({ onUploadSuccess }) => {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    dragActive: false,
    result: null,
    error: null,
  });

  const resetState = () => {
    setState(prev => ({
      ...prev,
      result: null,
      error: null,
    }));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setState(prev => ({ ...prev, dragActive: true }));
    } else if (e.type === 'dragleave') {
      setState(prev => ({ ...prev, dragActive: false }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.zip')) {
      setState(prev => ({
        ...prev,
        error: 'Please upload a ZIP file containing your custom nodes.',
        result: null,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      uploading: true,
      error: null,
      result: null,
    }));

    try {
      const result = await nodeTypeService.uploadCustomNodes(file);
      
      setState(prev => ({
        ...prev,
        uploading: false,
        result,
        error: result.success ? null : result.errors?.[0] || 'Upload failed',
      }));

      if (result.success && onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: 'Failed to upload file. Please try again.',
        result: null,
      }));
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload Custom Nodes
          </CardTitle>
          <CardDescription>
            Upload a ZIP file containing your custom node package. The ZIP should include node definitions, package.json, and any required dependencies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              state.dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {state.uploading ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                <p className="text-sm text-gray-500">Processing your custom node package</p>
              </div>
            ) : (
              <>
                <FileArchive className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your ZIP file here, or{' '}
                  <label className="text-blue-600 hover:text-blue-500 cursor-pointer underline">
                    browse
                    <Input
                      type="file"
                      accept=".zip"
                      onChange={handleFileInput}
                      className="hidden"
                      disabled={state.uploading}
                    />
                  </label>
                </h3>
                <p className="text-sm text-gray-500">
                  Supported format: ZIP files containing custom node packages
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Maximum file size: 50MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {state.error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
                <p className="text-sm text-red-700 mt-1">{state.error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="ml-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Display */}
      {state.result && state.result.success && (
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">Upload Successful</h3>
                <p className="text-sm text-green-700 mt-1">{state.result.message}</p>
                
                {state.result.nodes && state.result.nodes.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      Added Nodes ({state.result.nodes.length}):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {state.result.nodes.map((node: any, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {node.displayName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="ml-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">ZIP Structure Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <code>package.json</code> - Package metadata and dependencies</li>
              <li>• <code>nodes/</code> - Directory containing node implementation files</li>
              <li>• <code>credentials/</code> - (Optional) Custom credential types</li>
              <li>• <code>dist/</code> - (Optional) Compiled JavaScript files</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Node File Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Each node should have a <code>.node.ts</code> or <code>.node.js</code> file</li>
              <li>• Node description file <code>.node.json</code> (optional but recommended)</li>
              <li>• Proper export of the node class extending INode interface</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Best Practices:</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Include proper TypeScript definitions</li>
              <li>• Add comprehensive documentation</li>
              <li>• Test your nodes before uploading</li>
              <li>• Follow n8n naming conventions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};