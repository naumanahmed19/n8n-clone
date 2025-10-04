import { nodeService } from "@/services/node";
import { NodeType } from "@/types";
import { useEffect, useState } from "react";

interface UseNodeTypesReturn {
  nodeTypes: NodeType[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNodeTypes(): UseNodeTypesReturn {
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNodeTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await nodeService.getNodeTypes();
      console.log("Fetched node types:", response.length, "nodes");
      setNodeTypes(response);
    } catch (err) {
      console.error("Failed to fetch node types:", err);
      setError("Failed to load node types");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNodeTypes();
  }, []);

  const refetch = async () => {
    await fetchNodeTypes();
  };

  return {
    nodeTypes,
    isLoading,
    error,
    refetch,
  };
}
