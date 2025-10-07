import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface Sheet {
  id: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

interface SheetSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  spreadsheetId?: string;
  credentialId?: string;
  error?: string;
}

export function SheetSelector({
  value,
  onChange,
  disabled = false,
  spreadsheetId,
  credentialId,
  error,
}: SheetSelectorProps) {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);

  // Fetch sheets from Google Sheets API
  const fetchSheets = async () => {
    if (!spreadsheetId || !credentialId) {
      return;
    }

    setLoading(true);
    try {
      // Call Google Sheets API with credential ID
      const response = await fetch(
        `/api/google/spreadsheets/${spreadsheetId}/sheets?credentialId=${credentialId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const data = result.data || {};
        setSheets(data.sheets || []);

        // Find and set the selected sheet
        if (value) {
          const selected = data.sheets.find((s: Sheet) => s.title === value);
          if (selected) {
            setSelectedSheet(selected);
          }
        }
      } else {
        console.error("Failed to fetch sheets:", response.statusText);
        setSheets([]);
      }
    } catch (err) {
      console.error("Failed to fetch sheets:", err);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spreadsheetId) {
      fetchSheets();
    } else {
      setSheets([]);
      setSelectedSheet(null);
    }
  }, [spreadsheetId, credentialId]);

  const handleSelect = (sheet: Sheet) => {
    setSelectedSheet(sheet);
    onChange(sheet.title);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {selectedSheet ? (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{selectedSheet.title}</p>
                      {(selectedSheet.rowCount || selectedSheet.columnCount) && (
                        <p className="text-xs text-muted-foreground">
                          {selectedSheet.rowCount} rows × {selectedSheet.columnCount} columns
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSheet(null);
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
            <Card>
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">
                  {!spreadsheetId
                    ? "Select a spreadsheet first"
                    : "Select a sheet..."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={fetchSheets}
          disabled={disabled || loading || !spreadsheetId || !credentialId}
          title="Refresh sheets"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!selectedSheet && spreadsheetId && (
        <Card>
          <ScrollArea className="h-[200px]">
            <CardContent className="p-2 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sheets.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No sheets found
                </div>
              ) : (
                sheets.map((sheet) => (
                  <Button
                    key={sheet.id}
                    type="button"
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3"
                    onClick={() => handleSelect(sheet)}
                    disabled={disabled}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{sheet.title}</p>
                        {(sheet.rowCount || sheet.columnCount) && (
                          <p className="text-xs text-muted-foreground">
                            {sheet.rowCount} rows × {sheet.columnCount} columns
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

      {!spreadsheetId && (
        <p className="text-xs text-amber-600">
          ⚠️ Please select a spreadsheet first
        </p>
      )}
    </div>
  );
}
