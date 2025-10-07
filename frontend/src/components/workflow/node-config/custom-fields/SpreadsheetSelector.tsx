import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Search, Sheet } from "lucide-react";
import { useEffect, useState } from "react";

interface Spreadsheet {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

interface SpreadsheetSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  credentialId?: string;
  error?: string;
}

export function SpreadsheetSelector({
  value,
  onChange,
  disabled = false,
  credentialId,
  error,
}: SpreadsheetSelectorProps) {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<Spreadsheet | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch spreadsheets from Google Sheets API
  const fetchSpreadsheets = async () => {
    if (!credentialId) {
      return;
    }

    setLoading(true);
    setApiError(null); // Clear previous errors
    try {
      const token = localStorage.getItem("auth_token");
      
      // Call Google Sheets API with credential ID
      const response = await fetch(`/api/google/spreadsheets?credentialId=${credentialId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || {};
        setSpreadsheets(data.spreadsheets || []);
        
        // Find and set the selected spreadsheet
        if (value) {
          const selected = data.spreadsheets.find((s: Spreadsheet) => s.id === value);
          if (selected) {
            setSelectedSpreadsheet(selected);
          }
        }
      } else {
        // Parse error response
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || response.statusText;
        
        // Extract Google API error if present
        if (errorMessage.includes("Google Drive API has not been used") || 
            errorMessage.includes("is disabled")) {
          setApiError("Google Drive API is not enabled in your Google Cloud Project. Please enable it in the Google Cloud Console.");
        } else if (errorMessage.includes("Invalid token") || errorMessage.includes("Token expired")) {
          setApiError("Your Google credentials have expired. Please update your credentials.");
        } else {
          setApiError(errorMessage);
        }
        
        console.error("Failed to fetch spreadsheets:", errorMessage);
        setSpreadsheets([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setApiError(errorMsg);
      console.error("Failed to fetch spreadsheets:", err);
      setSpreadsheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheets();
  }, [credentialId]);

  const handleSelect = (spreadsheet: Spreadsheet) => {
    setSelectedSpreadsheet(spreadsheet);
    onChange(spreadsheet.id);
  };

  const filteredSpreadsheets = spreadsheets.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {selectedSpreadsheet ? (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sheet className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">{selectedSpreadsheet.name}</p>
                      {selectedSpreadsheet.modifiedTime && (
                        <p className="text-xs text-muted-foreground">
                          Modified: {new Date(selectedSpreadsheet.modifiedTime).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSpreadsheet(null);
                      onChange("");
                    }}
                    disabled={disabled}
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search spreadsheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={disabled || loading}
                className={error ? "border-red-500" : ""}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={fetchSpreadsheets}
          disabled={disabled || loading || !credentialId}
          title="Refresh spreadsheets"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!selectedSpreadsheet && (
        <Card>
          <ScrollArea className="h-[300px]">
            <CardContent className="p-2 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : apiError ? (
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
                      <p className="text-sm font-medium">Failed to load spreadsheets</p>
                      <p className="text-sm mt-1 text-red-500">{apiError}</p>
                    </div>
                  </div>
                  {apiError.includes("Google Drive API") && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="font-medium mb-1">How to fix:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to Google Cloud Console</li>
                        <li>Select your project</li>
                        <li>Navigate to "APIs & Services" → "Library"</li>
                        <li>Search for "Google Drive API" and enable it</li>
                        <li>Also enable "Google Sheets API" if not enabled</li>
                        <li>Wait 2-3 minutes and try again</li>
                      </ol>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchSpreadsheets}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : filteredSpreadsheets.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {!credentialId
                    ? "Please select credentials first"
                    : searchTerm
                    ? "No spreadsheets found"
                    : "No spreadsheets available"}
                </div>
              ) : (
                filteredSpreadsheets.map((spreadsheet) => (
                  <Button
                    key={spreadsheet.id}
                    type="button"
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3"
                    onClick={() => handleSelect(spreadsheet)}
                    disabled={disabled}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <Sheet className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{spreadsheet.name}</p>
                        {spreadsheet.modifiedTime && (
                          <p className="text-xs text-muted-foreground">
                            Modified: {new Date(spreadsheet.modifiedTime).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!credentialId && (
        <p className="text-xs text-amber-600">
          ⚠️ Please configure Google Sheets credentials first
        </p>
      )}
    </div>
  );
}
