import React, { useState } from 'react';
import { useCustomNodeStore } from '../../stores/customNode';
import { NodePackageValidationResult } from '../../types/customNode';

export const PackageValidator: React.FC = () => {
  const { validatePackage, compilePackage, loadPackage } = useCustomNodeStore();
  const [packagePath, setPackagePath] = useState('');
  const [validationResult, setValidationResult] = useState<NodePackageValidationResult | null>(null);
  const [compilationResult, setCompilationResult] = useState<any>(null);
  const [loadResult, setLoadResult] = useState<any>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleValidate = async () => {
    if (!packagePath.trim()) return;

    setLoading(prev => ({ ...prev, validate: true }));
    setValidationResult(null);
    
    try {
      const result = await validatePackage(packagePath.trim());
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, validate: false }));
    }
  };

  const handleCompile = async () => {
    if (!packagePath.trim()) return;

    setLoading(prev => ({ ...prev, compile: true }));
    setCompilationResult(null);
    
    try {
      const result = await compilePackage(packagePath.trim());
      setCompilationResult(result);
    } catch (error) {
      console.error('Compilation failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, compile: false }));
    }
  };

  const handleLoad = async () => {
    if (!packagePath.trim()) return;

    setLoading(prev => ({ ...prev, load: true }));
    setLoadResult(null);
    
    try {
      const result = await loadPackage(packagePath.trim());
      setLoadResult(result);
    } catch (error) {
      console.error('Loading failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, load: false }));
    }
  };

  const renderValidationResult = () => {
    if (!validationResult) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <div className={`${validationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
          <h4 className="font-medium flex items-center">
            {validationResult.valid ? '✅' : '❌'}
            <span className="ml-2">
              {validationResult.valid ? 'Package is valid' : 'Package validation failed'}
            </span>
          </h4>
          
          {validationResult.packageInfo && (
            <div className="mt-3 text-sm">
              <h5 className="font-medium text-gray-900">Package Information:</h5>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Name:</span> {validationResult.packageInfo.name}
                </div>
                <div>
                  <span className="font-medium">Version:</span> {validationResult.packageInfo.version}
                </div>
                <div>
                  <span className="font-medium">Author:</span> {validationResult.packageInfo.author || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Nodes:</span> {validationResult.packageInfo.nodes.length}
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">Description:</span> {validationResult.packageInfo.description}
              </div>
              {validationResult.packageInfo.nodes.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">Node Files:</span>
                  <ul className="mt-1 list-disc list-inside text-xs">
                    {validationResult.packageInfo.nodes.map((node, index) => (
                      <li key={index}>{node}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {validationResult.errors.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-red-900">Errors:</h5>
              <ul className="mt-1 text-sm list-disc list-inside">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-yellow-800">Warnings:</h5>
              <ul className="mt-1 text-sm list-disc list-inside text-yellow-700">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCompilationResult = () => {
    if (!compilationResult) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <div className={`${compilationResult.success ? 'text-green-800' : 'text-red-800'}`}>
          <h4 className="font-medium flex items-center">
            {compilationResult.success ? '✅' : '❌'}
            <span className="ml-2">
              {compilationResult.success ? 'Compilation successful' : 'Compilation failed'}
            </span>
          </h4>
          
          {compilationResult.compiledPath && (
            <p className="mt-1 text-sm">
              Output: <code className="bg-white px-1 rounded">{compilationResult.compiledPath}</code>
            </p>
          )}

          {compilationResult.errors && compilationResult.errors.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-red-900">Errors:</h5>
              <ul className="mt-1 text-sm list-disc list-inside">
                {compilationResult.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {compilationResult.warnings && compilationResult.warnings.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-yellow-800">Warnings:</h5>
              <ul className="mt-1 text-sm list-disc list-inside text-yellow-700">
                {compilationResult.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLoadResult = () => {
    if (!loadResult) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <div className={`${loadResult.success ? 'text-green-800' : 'text-red-800'}`}>
          <h4 className="font-medium flex items-center">
            {loadResult.success ? '✅' : '❌'}
            <span className="ml-2">
              {loadResult.success ? 'Package loaded successfully' : 'Package loading failed'}
            </span>
          </h4>
          
          {loadResult.nodeType && (
            <p className="mt-1 text-sm">
              Node Type: <code className="bg-white px-1 rounded">{loadResult.nodeType}</code>
            </p>
          )}

          {loadResult.errors && loadResult.errors.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-red-900">Errors:</h5>
              <ul className="mt-1 text-sm list-disc list-inside">
                {loadResult.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {loadResult.warnings && loadResult.warnings.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-yellow-800">Warnings:</h5>
              <ul className="mt-1 text-sm list-disc list-inside text-yellow-700">
                {loadResult.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Package Validator & Loader
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Validate, compile, and load custom node packages. Enter the path to your package directory.
          </p>

          <div className="space-y-6">
            {/* Package Path Input */}
            <div>
              <label htmlFor="packagePath" className="block text-sm font-medium text-gray-700">
                Package Path
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="packagePath"
                  value={packagePath}
                  onChange={(e) => setPackagePath(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="/path/to/your/custom-node-package"
                />
                <button
                  type="button"
                  onClick={() => setPackagePath('')}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                >
                  Clear
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Absolute path to the directory containing your custom node package
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleValidate}
                disabled={!packagePath.trim() || loading.validate}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading.validate ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Validate Package
                  </>
                )}
              </button>

              <button
                onClick={handleCompile}
                disabled={!packagePath.trim() || loading.compile}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading.compile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Compiling...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Compile Package
                  </>
                )}
              </button>

              <button
                onClick={handleLoad}
                disabled={!packagePath.trim() || loading.load}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading.load ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Load Package
                  </>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">How to use</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Validate:</strong> Check if your package structure is correct</li>
                      <li><strong>Compile:</strong> Compile TypeScript files to JavaScript (if needed)</li>
                      <li><strong>Load:</strong> Load the package into the system for use</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {renderValidationResult()}
            {renderCompilationResult()}
            {renderLoadResult()}
          </div>
        </div>
      </div>
    </div>
  );
};
