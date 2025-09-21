# Node Execution System Documentation

This directory contains comprehensive documentation for the n8n-clone node execution system, including architectural decisions, flow diagrams, and business logic explanations.

## Documentation Structure

- **[Execution Overview](./execution-overview.md)** - High-level system overview and architecture
- **[Dual Execution Modes](./dual-execution-modes.md)** - Single node vs workflow execution modes
- **[Workflow Execution Flow](./workflow-execution-flow.md)** - Complete workflow execution process
- **[Single Node Execution](./single-node-execution.md)** - Individual node execution process
- **[Multi-Trigger Handling](./multi-trigger-handling.md)** - How multi-trigger workflows are managed
- **[Real-time Updates](./real-time-updates.md)** - WebSocket-based progress tracking
- **[Error Handling](./error-handling.md)** - Comprehensive error management strategies
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Database Schema](./database-schema.md)** - Execution-related database structures
- **[Flow Diagrams](./flow-diagrams/)** - Visual representations of execution flows

## Quick Start

For a quick understanding of the execution system:

1. Start with [Execution Overview](./execution-overview.md) for the big picture
2. Review [Dual Execution Modes](./dual-execution-modes.md) to understand the two execution paradigms
3. Examine the [Flow Diagrams](./flow-diagrams/) for visual understanding
4. Dive into specific processes as needed

## Key Concepts

- **Dual Execution Modes**: Single node execution vs full workflow execution
- **Trigger-Specific Execution**: Workflows can be executed from specific trigger nodes
- **Real-time Progress**: Live updates via WebSocket connections
- **Error Recovery**: Comprehensive error handling with retry mechanisms
- **Visual Feedback**: Node state updates reflected in the UI

## Last Updated

September 21, 2025
