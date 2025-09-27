import { useState, useEffect } from 'react'
import { nodeService } from '@/services/node'
import { NodeType } from '@/types'

interface UseNodeTypesReturn {
  nodeTypes: NodeType[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useNodeTypes(): UseNodeTypesReturn {
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNodeTypes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await nodeService.getNodeTypes()
      setNodeTypes(response)
    } catch (err) {
      console.error('Failed to fetch node types:', err)
      setError('Failed to load node types')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNodeTypes()
  }, [])

  const refetch = () => {
    fetchNodeTypes()
  }

  return {
    nodeTypes,
    isLoading,
    error,
    refetch
  }
}