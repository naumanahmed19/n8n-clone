import React, { useState } from 'react';
import { useCustomNodeStore } from '../../stores/customNode';
import { NodePackageInfo } from '../../types/customNode';

export const CustomNodeList: React.FC = () => {
  const { packages, unloadPackage, reloadPackage } = useCustomNodeStore();
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const handleUnload = async (packageName: string) => {
    setLoadingActions(prev => ({ ...prev, [packageName]: true }));
    try {
      await unloadPackage(packageName);
    } catch (error) {
      console.error('Failed to unload package:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [packageName]: false }));
    }
  };

  const handleReload = async (packageName: string) => {
    setLoadingActions(prev => ({ ...prev, [`${packageName}-reload`]: true }));
    try {
      await reloadPackage(packageName);
    } catch (error) {
      console.error('Failed to reload package:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [`${packageName}-reload`]: false }));
    }
  };

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No custom nodes installed</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new node or installing one from the marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {packages.map((pkg) => (
          <li key={pkg.name}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {pkg.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pkg.name}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          v{pkg.version}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {pkg.description}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                          {pkg.nodes.length} node{pkg.nodes.length !== 1 ? 's' : ''}
                        </span>
                        {pkg.credentials && pkg.credentials.length > 0 && (
                          <span className="ml-4 flex items-center">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-.257-.257A6 6 0 1118 8zm-6-2a1 1 0 10-2 0 1 1 0 002 0zm-1 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            {pkg.credentials.length} credential{pkg.credentials.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {pkg.author && (
                          <span className="ml-4 flex items-center">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {pkg.author}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReload(pkg.name)}
                    disabled={loadingActions[`${pkg.name}-reload`]}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loadingActions[`${pkg.name}-reload`] ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                    ) : (
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    Reload
                  </button>
                  <button
                    onClick={() => handleUnload(pkg.name)}
                    disabled={loadingActions[pkg.name]}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loadingActions[pkg.name] ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                    ) : (
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Unload
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};