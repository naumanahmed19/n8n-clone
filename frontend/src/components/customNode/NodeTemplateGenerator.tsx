import React, { useState } from 'react';
import { useCustomNodeStore } from '../../stores/customNode';
import { NodeTemplateOptions } from '../../types/customNode';

export const NodeTemplateGenerator: React.FC = () => {
  const { generatePackage } = useCustomNodeStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState<NodeTemplateOptions>({
    name: '',
    displayName: '',
    description: '',
    type: 'action',
    author: '',
    version: '1.0.0',
    group: ['transform'],
    includeCredentials: false,
    includeTests: true,
    typescript: true
  });

  const handleInputChange = (field: keyof NodeTemplateOptions, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const result = await generatePackage(formData);
      setResult(result);
    } catch (error) {
      console.error('Failed to generate package:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      type: 'action',
      author: '',
      version: '1.0.0',
      group: ['transform'],
      includeCredentials: false,
      includeTests: true,
      typescript: true
    });
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Generate Custom Node Package
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Create a new custom node package from a template with all the necessary files and structure.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Node Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="my-custom-node"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase, hyphen-separated name for the node
                </p>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name *
                </label>
                <input
                  type="text"
                  id="displayName"
                  required
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="My Custom Node"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="A custom node that does something useful..."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Node Type *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as 'action' | 'trigger' | 'transform')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="action">Action</option>
                  <option value="trigger">Trigger</option>
                  <option value="transform">Transform</option>
                </select>
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700">
                  Version
                </label>
                <input
                  type="text"
                  id="version"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-700">
                Node Groups
              </label>
              <input
                type="text"
                id="group"
                value={formData.group?.join(', ') || ''}
                onChange={(e) => handleInputChange('group', e.target.value.split(',').map(g => g.trim()).filter(g => g))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="transform, integration"
              />
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated list of groups this node belongs to
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Options</h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="typescript"
                    type="checkbox"
                    checked={formData.typescript}
                    onChange={(e) => handleInputChange('typescript', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="typescript" className="ml-2 block text-sm text-gray-900">
                    Use TypeScript
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="includeCredentials"
                    type="checkbox"
                    checked={formData.includeCredentials}
                    onChange={(e) => handleInputChange('includeCredentials', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeCredentials" className="ml-2 block text-sm text-gray-900">
                    Include credentials template
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="includeTests"
                    type="checkbox"
                    checked={formData.includeTests}
                    onChange={(e) => handleInputChange('includeTests', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeTests" className="ml-2 block text-sm text-gray-900">
                    Include test files
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Package'
                )}
              </button>
            </div>
          </form>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              {result.success ? (
                <div className="text-green-800">
                  <h4 className="font-medium">✅ Package generated successfully!</h4>
                  <p className="mt-1 text-sm">
                    Package created at: <code className="bg-white px-1 rounded">{result.packagePath}</code>
                  </p>
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Warnings:</p>
                      <ul className="mt-1 text-sm list-disc list-inside">
                        {result.warnings.map((warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-800">
                  <h4 className="font-medium">❌ Failed to generate package</h4>
                  {result.errors && result.errors.length > 0 && (
                    <ul className="mt-1 text-sm list-disc list-inside">
                      {result.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};