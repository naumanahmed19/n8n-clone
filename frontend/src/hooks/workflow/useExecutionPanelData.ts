import { useMemo } from 'react'

interface UseExecutionPanelDataParams {
    executionId?: string
    getFlowStatus: (executionId: string) => any
    getExecutionMetrics: (executionId: string) => any
}

export function useExecutionPanelData({
    executionId,
    getFlowStatus,
    getExecutionMetrics,
}: UseExecutionPanelDataParams) {
    const flowExecutionStatus = useMemo(() => {
        return executionId ? getFlowStatus(executionId) : null
    }, [executionId, getFlowStatus])

    const executionMetrics = useMemo(() => {
        return executionId ? getExecutionMetrics(executionId) : null
    }, [executionId, getExecutionMetrics])

    return {
        flowExecutionStatus,
        executionMetrics,
    }
}
