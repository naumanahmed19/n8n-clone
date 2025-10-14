import React, { useState, useEffect } from 'react';
import { useCustomNodeStore } from '../../stores/customNode';
import { NodeSearchFilters, NodePackageMetadata } from '../../types/customNode';

export const NodeMarketplace: React.FC = () => {
  const { 
    searchMarketplace, 
    searchResults, 
    searchLoading, 
    selectedPackage,
    setSelectedPackage,
    getPackageInfo,
    installPackage
  } = useCustomNodeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<NodeSearchFilters>({
    sortBy: 'downloads',
    sortOrder: 'desc',
    limit: 20
  });
  const [installing, setInstalling] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initial search
    handleSearch();
  }, []);

  const handleSearch = async () => {
    const searchFilters: NodeSearchFilters = {
      ...filters,
      query: searchQuery || undefined
    };
    
    try {
      await searchMarketplace(searchFilters);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handlePackageClick = async (pkg: NodePackageMetadata) => {
    try {
      const fullPackageInfo = await getPackageInfo(pkg.id);
      setSelectedPackage(fullPackageInfo);
    } catch (error) {
      console.error('Failed to get package info:', error);
    }
  };

  const handleInstall = async (packageId: string) => {
    setInstalling(prev => ({ ...prev, [packageId]: true }));
    try {
      await installPackage(packageId);
      // Close package details after successful install
      if (selectedPackage?.id === packageId) {
        setSelectedPackage(null);
      }
    } catch (error) {
      console.error('Failed to install package:', error);
    } finally {
      setInstalling(prev => ({ ...prev, [packageId]: false }));
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className={`flex-1 ${selectedPackage ? 'mr-96' : ''}`}>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search for custom nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {searchLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="downloads">Downloads</option>
            <option value="rating">Rating</option>
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
          </select>
          
          <select
            value={filters.sortOrder}
            onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.verified}
              onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Verified only</span>
          </label>
        </div>

        {/* Results */}
        {searchLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Searching marketplace...</span>
          </div>
        ) : searchResults?.packages.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No packages found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults?.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePackageClick(pkg)}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {pkg.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pkg.name}
                        </p>
                        {pkg.verified && (
                          <svg className="ml-1 h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {pkg.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStars(pkg.rating)}
                        <span className="ml-1 text-sm text-gray-500">
                          ({pkg.ratingCount})
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatNumber(pkg.downloads)} downloads
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        by {pkg.author}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        v{pkg.version}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package Details Sidebar */}
      {selectedPackage && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Package Details</h2>
              <button
                onClick={() => setSelectedPackage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedPackage.name}</h3>
                <p className="text-sm text-gray-600">{selectedPackage.description}</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {renderStars(selectedPackage.rating)}
                  <span className="ml-1 text-sm text-gray-500">
                    ({selectedPackage.ratingCount})
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatNumber(selectedPackage.downloads)} downloads
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Version:</span>
                  <span className="ml-1 text-gray-600">v{selectedPackage.version}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Author:</span>
                  <span className="ml-1 text-gray-600">{selectedPackage.author}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">License:</span>
                  <span className="ml-1 text-gray-600">{selectedPackage.license || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Updated:</span>
                  <span className="ml-1 text-gray-600">
                    {new Date(selectedPackage.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {selectedPackage.keywords && selectedPackage.keywords.length > 0 && (
                <div>
                  <span className="font-medium text-gray-900">Tags:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedPackage.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-medium text-gray-900">Node Types:</span>
                <div className="mt-1">
                  {selectedPackage.nodeTypes.map((nodeType) => (
                    <span
                      key={nodeType}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-1 mb-1"
                    >
                      {nodeType}
                    </span>
                  ))}
                </div>
              </div>

              {selectedPackage.readme && (
                <div>
                  <span className="font-medium text-gray-900">README:</span>
                  <div className="mt-1 text-sm text-gray-600 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{selectedPackage.readme}</pre>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleInstall(selectedPackage.id)}
                disabled={installing[selectedPackage.id]}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {installing[selectedPackage.id] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Installing...
                  </>
                ) : (
                  'Install Package'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
