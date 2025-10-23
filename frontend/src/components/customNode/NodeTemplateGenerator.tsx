import React, { useState } from 'react';
import { useCustomNodeStore } from '../../stores/customNode';

export const NodeTemplateGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const generatePackageZip = useCustomNodeStore((state) => state.generatePackageZip);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'action' as 'action' | 'trigger' | 'transform',
    author: '',
    version: '1.0.0',
    group: [] as string[],
    typescript: true,
    includeCredentials: false,
    includeTests: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      await generatePackageZip(formData);
    } catch (error) {
      console.error('Failed to generate package:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field === 'group') {
      // Convert comma-separated string to array
      const groupArray = value ? value.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];
      setFormData(prev => ({ ...prev, [field]: groupArray }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Generate Custom Node Package</h2>
          <p className="text-gray-600 mt-2">
            Create a complete nodeDrop custom node package with all necessary files. The package will be generated as a zip file for download.
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Node Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="my-custom-node"
                  className="w-full p-3 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  placeholder="My Custom Node"
                  className="w-full p-3 border rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what your custom node does..."
                rows={3}
                className="w-full p-3 border rounded-md resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Node Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full p-3 border rounded-md"
                >
                  <option value="action">Action</option>
                  <option value="trigger">Trigger</option>
                  <option value="transform">Transform</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  placeholder="Your Name"
                  className="w-full p-3 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Version</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => handleChange('version', e.target.value)}
                  placeholder="1.0.0"
                  className="w-full p-3 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Groups</label>
              <input
                type="text"
                value={formData.group.join(', ')}
                onChange={(e) => handleChange('group', e.target.value)}
                placeholder="utilities, helpers, integrations"
                className="w-full p-3 border rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">Category groups for organizing nodes (comma-separated, optional)</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Additional Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.typescript}
                    onChange={(e) => handleChange('typescript', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">TypeScript</div>
                    <div className="text-sm text-gray-500">Generate TypeScript files</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.includeCredentials}
                    onChange={(e) => handleChange('includeCredentials', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Include Credentials</div>
                    <div className="text-sm text-gray-500">Add credential handling</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.includeTests}
                    onChange={(e) => handleChange('includeTests', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Include Tests</div>
                    <div className="text-sm text-gray-500">Generate test files</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Package
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({
                  name: '',
                  displayName: '',
                  description: '',
                  type: 'action',
                  author: '',
                  version: '1.0.0',
                  group: [],
                  typescript: true,
                  includeCredentials: false,
                  includeTests: true,
                })}
                disabled={isGenerating}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
