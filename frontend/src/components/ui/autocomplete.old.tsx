import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, RefreshCw, Search } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";

export interface AutoCompleteOption<T = any> {
  id: string;
  label: string;
  value: T;
  metadata?: Record<string, any>;
}

export interface AutoCompleteProps<T = any> {
  // Value and onChange
  value: string;
  onChange: (value: string, option?: AutoCompleteOption<T>) => void;
  
  // Data fetching
  options?: AutoCompleteOption<T>[];
  onFetch?: () => Promise<AutoCompleteOption<T>[]>;
  onSearch?: (query: string) => Promise<AutoCompleteOption<T>[]>;
  
  // Preload behavior
  preloadOnMount?: boolean;
  preloadOnFocus?: boolean;
  
  // UI customization
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  errorMessage?: string;
  noOptionsMessage?: string;
  icon?: React.ReactNode;
  renderOption?: (option: AutoCompleteOption<T>) => React.ReactNode;
  renderSelected?: (option: AutoCompleteOption<T>) => React.ReactNode;
  
  // State
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  
  // Behavior
  clearable?: boolean;
  refreshable?: boolean;
  searchable?: boolean;
  maxHeight?: number;
  
  // Styling
  className?: string;
  inputClassName?: string;
  
  // Filtering
  filterFn?: (option: AutoCompleteOption<T>, searchTerm: string) => boolean;
}

export function AutoComplete<T = any>({
  value,
  onChange,
  options: propOptions = [],
  onFetch,
  onSearch,
  preloadOnMount = false,
  preloadOnFocus = false,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options available",
  errorMessage,
  noOptionsMessage = "No results found",
  icon,
  renderOption,
  renderSelected,
  disabled = false,
  loading: propLoading = false,
  error,
  clearable = true,
  refreshable = true,
  searchable = true,
  maxHeight = 300,
  className,
  inputClassName,
  filterFn = defaultFilterFn,
}: AutoCompleteProps<T>) {
  const [options, setOptions] = useState<AutoCompleteOption<T>[]>(propOptions);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState<AutoCompleteOption<T> | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Track if initial load has happened
  const hasLoadedRef = useRef(false);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!onFetch) return;

    setLoading(true);
    setApiError(null);
    
    try {
      const result = await onFetch();
      setOptions(result);
      
      // Open dropdown after fetching (check current state, not dependency)
      setIsOpen(prev => {
        // Only open if no option is currently selected
        if (!prev) return true;
        return prev;
      });
      
      // Find and set selected option
      if (value) {
        const selected = result.find((opt) => opt.id === value);
        if (selected) {
          setSelectedOption(selected);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load options";
      setApiError(errorMsg);
      console.error("Failed to fetch options:", err);
      setIsOpen(true); // Open to show error
    } finally {
      setLoading(false);
    }
  }, [onFetch, value]);

  // Search function
  const handleSearch = async (query: string) => {
    if (!onSearch) {
      setSearchTerm(query);
      return;
    }

    setSearchTerm(query);
    if (!query) {
      // Re-fetch original data if search is cleared
      if (onFetch) {
        setLoading(true);
        setApiError(null);
        try {
          const result = await onFetch();
          setOptions(result);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Failed to load options";
          setApiError(errorMsg);
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    setLoading(true);
    setApiError(null);
    
    try {
      const result = await onSearch(query);
      setOptions(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Search failed";
      setApiError(errorMsg);
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Preload on mount
  useEffect(() => {
    // Prevent multiple loads
    if (hasLoadedRef.current) return;
    
    if (preloadOnMount && onFetch) {
      hasLoadedRef.current = true;
      
      // Call fetchData directly without dependency
      const loadData = async () => {
        setLoading(true);
        setApiError(null);
        
        try {
          const result = await onFetch();
          setOptions(result);
          setIsOpen(true); // Open dropdown after initial load
          
          // Find and set selected option if value is provided
          if (value) {
            const selected = result.find((opt) => opt.id === value);
            if (selected) {
              setSelectedOption(selected);
              setIsOpen(false); // Don't open if we have a selection
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Failed to load options";
          setApiError(errorMsg);
          console.error("Failed to fetch options:", err);
          setIsOpen(true); // Open to show error
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadOnMount]); // Only run on mount or when preloadOnMount changes

  // Preload on focus
  const handleFocus = () => {
    if (!selectedOption) {
      setIsOpen(true);
    }
    if (preloadOnFocus && onFetch && options.length === 0) {
      fetchData();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Handle selection
  const handleSelect = (option: AutoCompleteOption<T>) => {
    setSelectedOption(option);
    onChange(option.id, option);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Handle clear
  const handleClear = () => {
    setSelectedOption(null);
    onChange("", undefined);
    setSearchTerm("");
  };

  // Filter options
  const filteredOptions = searchTerm && !onSearch
    ? options.filter((opt) => filterFn(opt, searchTerm))
    : options;

  // Default render functions
  const defaultRenderOption = (option: AutoCompleteOption<T>) => (
    <div className="flex items-start gap-2 w-full">
      {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{option.label}</p>
        {option.metadata?.subtitle && (
          <p className="text-xs text-muted-foreground">{option.metadata.subtitle}</p>
        )}
      </div>
    </div>
  );

  const defaultRenderSelected = (option: AutoCompleteOption<T>) => (
    <div className="flex items-center gap-2">
      {icon && <span>{icon}</span>}
      <div>
        <p className="text-sm font-medium">{option.label}</p>
        {option.metadata?.subtitle && (
          <p className="text-xs text-muted-foreground">{option.metadata.subtitle}</p>
        )}
      </div>
    </div>
  );

  const isLoading = loading || propLoading;

  // Handle container click to prevent closing
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={cn("space-y-2", className)} onClick={handleContainerClick}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {selectedOption ? (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  {renderSelected 
                    ? renderSelected(selectedOption) 
                    : defaultRenderSelected(selectedOption)
                  }
                  {clearable && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      disabled={disabled}
                    >
                      Change
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <Input
                type="text"
                placeholder={searchable ? searchPlaceholder : placeholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={handleFocus}
                onClick={handleFocus}
                disabled={disabled || isLoading}
                className={cn(
                  error ? "border-red-500" : "",
                  !searchable && "cursor-pointer",
                  inputClassName
                )}
                readOnly={!searchable}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>
        
        {refreshable && onFetch && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={disabled || isLoading}
            title="Refresh options"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {!selectedOption && isOpen && (
        <Card>
          <ScrollArea className={cn(`h-[${maxHeight}px]`)}>
            <CardContent className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : apiError || errorMessage ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2 text-red-600">
                    <svg
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Error</p>
                      <p className="text-sm mt-1 text-red-500">
                        {errorMessage || apiError}
                      </p>
                    </div>
                  </div>
                  {refreshable && onFetch && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchData}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchTerm ? noOptionsMessage : emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3"
                    onClick={() => handleSelect(option)}
                    disabled={disabled}
                  >
                    {renderOption ? renderOption(option) : defaultRenderOption(option)}
                  </Button>
                ))
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Default filter function
function defaultFilterFn<T>(option: AutoCompleteOption<T>, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase();
  return (
    option.label.toLowerCase().includes(term) ||
    option.id.toLowerCase().includes(term) ||
    (option.metadata?.subtitle && 
      String(option.metadata.subtitle).toLowerCase().includes(term))
  );
}
