import React, { useEffect, useState } from 'react';
import { CustomNodeList } from '../components/customNode/CustomNodeList';
import { CustomNodeUpload } from '../components/customNode/CustomNodeUpload';
import { NodeMarketplace } from '../components/node/NodeMarketplace';
import { NodeTemplateGenerator } from '../components/customNode/NodeTemplateGenerator';
import { PackageValidator } from '../components/customNode/PackageValidator';
import { useCustomNodeStore } from '../stores/customNode';

type TabType = 'installed' | 'upload' | 'marketplace' | 'generator' | 'validator';

export const CustomNodesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('installed');
  const { loadPackages, loading, error, clearError } = useCustomNodeStore();

  // Only load packages when we switch to marketplace tab
  useEffect(() => {
    if (activeTab === 'marketplace') {
      loadPackages();
    }
  }, [activeTab, loadPackages]);

  const tabs = [
    { id: 'installed' as TabType, label: 'Installed Nodes', icon: '📦' },
    { id: 'upload' as TabType, label: 'Upload Nodes', icon: '📤' },
    { id: 'marketplace' as TabType, label: 'Marketplace', icon: '🏪' },
    { id: 'generator' as TabType, label: 'Create Node', icon: '⚡' },
    { id: 'validator' as TabType, label: 'Validate Package', icon: '✅' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'installed':
        return <CustomNodeList />;
      case 'upload':
        return <CustomNodeUpload onUploadSuccess={() => setActiveTab('installed')} />;
      case 'marketplace':
        return <NodeMarketplace />;
      case 'generator':
        return <NodeTemplateGenerator />;
      case 'validator':
        return <PackageValidator />;
      default:
        return <CustomNodeList />;
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Custom Nodes</h1>
          <p className="mt-2 text-gray-600">
            Manage, create, and discover custom nodes for your workflows
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="bg-red-50 text-red-800 px-2 py-1 text-xs font-medium rounded hover:bg-red-100"
                    onClick={clearError}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Loading State - only show for tabs that actually use the store */}
        {loading && (activeTab === 'marketplace') && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading packages...</span>
          </div>
        )}

        {/* Tab Content - always render, let individual components handle their own loading */}
        {renderTabContent()}
      </div>
    </div>
  );
};
