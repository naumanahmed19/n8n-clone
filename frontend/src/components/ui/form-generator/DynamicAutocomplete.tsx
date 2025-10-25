import { AutoComplete, AutoCompleteOption } from '@/components/ui/autocomplete';
import { apiClient } from '@/services/api';
import { useEffect, useMemo, useRef, useState } from 'react';

interface DynamicAutocompleteProps {
  nodeType: string;
  loadOptionsMethod: string;
  loadOptionsDependsOn?: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  displayName?: string;
  // Current form values for context
  parameters?: Record<string, any>;
  credentials?: Record<string, any>;
}

export function DynamicAutocomplete({
  nodeType,
  loadOptionsMethod,
  loadOptionsDependsOn,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
  error,
  required,
  displayName = 'option',
  parameters = {},
  credentials = {},
}: DynamicAutocompleteProps) {
  const [options, setOptions] = useState<AutoCompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Use ref to track if we've loaded options
  const hasLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const previousDependencyKeyRef = useRef<string>('');
  
  // Memoize the credentials key to prevent unnecessary re-renders
  const credentialsKey = useMemo(() => {
    return JSON.stringify(credentials);
  }, [JSON.stringify(credentials)]);

  // Memoize the dependency values to detect changes
  const dependencyValues = useMemo(() => {
    if (!loadOptionsDependsOn || !Array.isArray(loadOptionsDependsOn)) {
      return {};
    }
    const values: Record<string, any> = {};
    loadOptionsDependsOn.forEach(dep => {
      values[dep] = parameters[dep];
    });
    return values;
  }, [loadOptionsDependsOn, parameters]);

  const dependencyKey = useMemo(() => {
    return JSON.stringify(dependencyValues);
  }, [dependencyValues]);

  const loadOptions = async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      console.log('DynamicAutocomplete: Already loading, skipping');
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setLoadError(null);

    console.log('DynamicAutocomplete: Loading options', {
      nodeType,
      loadOptionsMethod,
      hasCredentials: Object.keys(credentials).length > 0,
    });

    try {
      console.log('DynamicAutocomplete: Making API request', {
        url: `/nodes/${nodeType}/load-options`,
        payload: {
          method: loadOptionsMethod,
          parameters,
          credentials,
        },
      });

      const response = await apiClient.post<any>(`/nodes/${nodeType}/load-options`, {
        method: loadOptionsMethod,
        parameters,
        credentials,
      });

      console.log('DynamicAutocomplete: API response', response.data);

      // Check if response has the expected structure
      let dataArray: any[] = [];
      
      if (response.data.success && Array.isArray(response.data.data)) {
        // Wrapped response: { success: true, data: [...] }
        dataArray = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array response: [...]
        dataArray = response.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to load options');
      }

      const formattedOptions: AutoCompleteOption[] = dataArray.map((option: any) => ({
        id: String(option.value),
        label: option.name,
        value: String(option.value),
        metadata: {
          subtitle: option.description,
        },
      }));

      console.log('DynamicAutocomplete: Loaded options', {
        count: formattedOptions.length,
      });

      setOptions(formattedOptions);
      hasLoadedRef.current = true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to load options';
      setLoadError(errorMessage);
      console.error('Failed to load dynamic options:', {
        error: err,
        response: err.response?.data,
        message: errorMessage,
      });
      
      // Show error as an option
      setOptions([
        {
          id: 'error',
          label: `Error: ${errorMessage}`,
          value: '',
          metadata: {
            subtitle: 'Check your credentials and try again',
          },
        },
      ]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Reset when credentials change
  useEffect(() => {
    console.log('DynamicAutocomplete: Credentials changed, resetting');
    hasLoadedRef.current = false;
    loadingRef.current = false;
    setOptions([]);
    setLoadError(null);
  }, [credentialsKey, nodeType, loadOptionsMethod]);

  // Reset when dependencies change
  useEffect(() => {
    const previousDependencyKey = previousDependencyKeyRef.current;
    
    // Only reset if dependency key actually changed (not on initial mount)
    if (previousDependencyKey && previousDependencyKey !== dependencyKey) {
      console.log('DynamicAutocomplete: Dependencies changed, resetting and clearing value');
      hasLoadedRef.current = false;
      loadingRef.current = false;
      setOptions([]);
      setLoadError(null);
      
      // Clear the selected value when dependencies change
      if (loadOptionsDependsOn) {
        console.log('DynamicAutocomplete: Clearing value due to dependency change');
        onChange('');
      }
    }
    
    // Update the ref with current dependency key
    previousDependencyKeyRef.current = dependencyKey;
  }, [dependencyKey, loadOptionsDependsOn, onChange]);

  // Load options once when component mounts or dependencies change
  useEffect(() => {
    if (!hasLoadedRef.current && !loadingRef.current) {
      console.log('DynamicAutocomplete: Triggering load due to dependency change');
      loadOptions();
    }
  }, [credentialsKey, dependencyKey]); // Depend on both credentials and dependencies

  return (
    <div>
      <AutoComplete
        value={String(value || '')}
        onChange={onChange}
        options={options}
        placeholder={loading ? 'Loading options...' : placeholder || `Select ${displayName}`}
        searchPlaceholder={searchPlaceholder || `Search ${displayName.toLowerCase()}...`}
        emptyMessage={
          loadError
            ? `Error: ${loadError}`
            : loading
            ? 'Loading...'
            : `No ${displayName.toLowerCase()} available`
        }
        noOptionsMessage={loading ? 'Loading...' : 'No matching results'}
        disabled={disabled || loading}
        error={error}
        clearable={!required}
        refreshable={false}
        searchable={true}
        renderOption={(option) => (
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{option.label}</p>
            {option.metadata?.subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {option.metadata.subtitle}
              </p>
            )}
          </div>
        )}
      />
      {loadError && (
        <p className="text-xs text-destructive mt-1">
          {loadError}
        </p>
      )}
    </div>
  );
}
