import { useWorkspaceStore } from '@/stores/workspace'
import { Calendar, Folder, Tag, Users, X } from 'lucide-react'
import React from 'react'

export const WorkspaceFilters: React.FC = () => {
  const {
    filters,
    selectedTags,
    selectedCategory,
    availableTags,
    availableCategories,
    setFilters,
    setSelectedTags,
    setSelectedCategory,
    clearFilters
  } = useWorkspaceStore()

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category)
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters({ sortBy, sortOrder })
  }

  const handleVisibilityFilter = (isPublic?: boolean) => {
    setFilters({ isPublic })
  }

  const hasActiveFilters = selectedTags.length > 0 || selectedCategory || 
    filters.isPublic !== undefined

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Folder className="w-4 h-4 inline mr-1" />
            Category
          </label>
          <div className="space-y-2">
            {availableCategories.map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === category}
                  onChange={() => handleCategoryChange(category)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Tags
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableTags.map((tag) => (
              <label key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Visibility
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="visibility"
                checked={filters.isPublic === undefined}
                onChange={() => handleVisibilityFilter(undefined)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">All</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="visibility"
                checked={filters.isPublic === true}
                onChange={() => handleVisibilityFilter(true)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Public</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="visibility"
                checked={filters.isPublic === false}
                onChange={() => handleVisibilityFilter(false)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Private</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Sort by
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'name', label: 'Name' },
            { key: 'createdAt', label: 'Created' },
            { key: 'updatedAt', label: 'Updated' },
            { key: 'popularity', label: 'Popularity' },
            { key: 'executions', label: 'Executions' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-1">
              <button
                onClick={() => handleSortChange(key, 'asc')}
                className={`px-3 py-1 text-sm rounded-l-md border ${
                  filters.sortBy === key && filters.sortOrder === 'asc'
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label} ↑
              </button>
              <button
                onClick={() => handleSortChange(key, 'desc')}
                className={`px-3 py-1 text-sm rounded-r-md border-t border-r border-b ${
                  filters.sortBy === key && filters.sortOrder === 'desc'
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label} ↓
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}