import { describe, it, expect } from 'vitest'
import {
  getNodeTypeMetadata,
  canNodeExecuteIndividually,
  canNodeBeDisabled,
  getNodeExecutionCapability,
  isTriggerNode,
  isActionNode,
  isTransformNode,
  isConditionNode,
  getAllNodeTypes,
  registerNodeType,
  shouldShowExecuteButton,
  shouldShowDisableButton
} from '../nodeTypeClassification'

describe('nodeTypeClassification', () => {
  describe('getNodeTypeMetadata', () => {
    it('returns metadata for known node types', () => {
      const metadata = getNodeTypeMetadata('Manual Trigger')
      expect(metadata).toEqual({
        type: 'Manual Trigger',
        group: ['trigger'],
        executionCapability: 'trigger',
        canExecuteIndividually: true,
        canBeDisabled: true
      })
    })

    it('returns null for unknown node types', () => {
      const metadata = getNodeTypeMetadata('Unknown Node')
      expect(metadata).toBeNull()
    })
  })

  describe('canNodeExecuteIndividually', () => {
    it('returns true for trigger nodes (display names)', () => {
      expect(canNodeExecuteIndividually('Manual Trigger')).toBe(true)
      expect(canNodeExecuteIndividually('Webhook Trigger')).toBe(true)
      expect(canNodeExecuteIndividually('Schedule Trigger')).toBe(true)
    })

    it('returns true for trigger nodes (backend types)', () => {
      expect(canNodeExecuteIndividually('manual-trigger')).toBe(true)
      expect(canNodeExecuteIndividually('webhook-trigger')).toBe(true)
      expect(canNodeExecuteIndividually('schedule-trigger')).toBe(true)
      expect(canNodeExecuteIndividually('workflow-called')).toBe(true)
      expect(canNodeExecuteIndividually('webhook')).toBe(true)
    })

    it('returns false for action nodes (display names)', () => {
      expect(canNodeExecuteIndividually('HTTP Request')).toBe(false)
      expect(canNodeExecuteIndividually('Set')).toBe(false)
    })

    it('returns false for action nodes (backend types)', () => {
      expect(canNodeExecuteIndividually('http-request')).toBe(false)
      expect(canNodeExecuteIndividually('set')).toBe(false)
    })

    it('returns false for transform nodes (display names)', () => {
      expect(canNodeExecuteIndividually('JSON')).toBe(false)
      expect(canNodeExecuteIndividually('Code')).toBe(false)
    })

    it('returns false for transform nodes (backend types)', () => {
      expect(canNodeExecuteIndividually('json')).toBe(false)
      expect(canNodeExecuteIndividually('code')).toBe(false)
    })

    it('returns false for condition nodes (display names)', () => {
      expect(canNodeExecuteIndividually('IF')).toBe(false)
      expect(canNodeExecuteIndividually('Switch')).toBe(false)
    })

    it('returns false for condition nodes (backend types)', () => {
      expect(canNodeExecuteIndividually('if')).toBe(false)
      expect(canNodeExecuteIndividually('switch')).toBe(false)
    })

    it('returns false for unknown node types', () => {
      expect(canNodeExecuteIndividually('Unknown Node')).toBe(false)
    })
  })

  describe('canNodeBeDisabled', () => {
    it('returns true for all known node types', () => {
      const nodeTypes = getAllNodeTypes()
      nodeTypes.forEach(nodeType => {
        expect(canNodeBeDisabled(nodeType)).toBe(true)
      })
    })

    it('returns true for unknown node types (default behavior)', () => {
      expect(canNodeBeDisabled('Unknown Node')).toBe(true)
    })
  })

  describe('getNodeExecutionCapability', () => {
    it('returns correct capability for trigger nodes (display names)', () => {
      expect(getNodeExecutionCapability('Manual Trigger')).toBe('trigger')
      expect(getNodeExecutionCapability('Webhook Trigger')).toBe('trigger')
    })

    it('returns correct capability for trigger nodes (backend types)', () => {
      expect(getNodeExecutionCapability('manual-trigger')).toBe('trigger')
      expect(getNodeExecutionCapability('webhook-trigger')).toBe('trigger')
      expect(getNodeExecutionCapability('workflow-called')).toBe('trigger')
      expect(getNodeExecutionCapability('webhook')).toBe('trigger')
    })

    it('returns correct capability for action nodes (display names)', () => {
      expect(getNodeExecutionCapability('HTTP Request')).toBe('action')
      expect(getNodeExecutionCapability('Set')).toBe('action')
    })

    it('returns correct capability for action nodes (backend types)', () => {
      expect(getNodeExecutionCapability('http-request')).toBe('action')
      expect(getNodeExecutionCapability('set')).toBe('action')
    })

    it('returns correct capability for transform nodes (display names)', () => {
      expect(getNodeExecutionCapability('JSON')).toBe('transform')
      expect(getNodeExecutionCapability('Code')).toBe('transform')
    })

    it('returns correct capability for transform nodes (backend types)', () => {
      expect(getNodeExecutionCapability('json')).toBe('transform')
      expect(getNodeExecutionCapability('code')).toBe('transform')
    })

    it('returns correct capability for condition nodes (display names)', () => {
      expect(getNodeExecutionCapability('IF')).toBe('condition')
      expect(getNodeExecutionCapability('Switch')).toBe('condition')
    })

    it('returns correct capability for condition nodes (backend types)', () => {
      expect(getNodeExecutionCapability('if')).toBe('condition')
      expect(getNodeExecutionCapability('switch')).toBe('condition')
    })

    it('returns null for unknown node types', () => {
      expect(getNodeExecutionCapability('Unknown Node')).toBeNull()
    })
  })

  describe('node type checkers', () => {
    describe('isTriggerNode', () => {
      it('returns true for trigger nodes', () => {
        expect(isTriggerNode('Manual Trigger')).toBe(true)
        expect(isTriggerNode('Webhook Trigger')).toBe(true)
        expect(isTriggerNode('Schedule Trigger')).toBe(true)
      })

      it('returns false for non-trigger nodes', () => {
        expect(isTriggerNode('HTTP Request')).toBe(false)
        expect(isTriggerNode('JSON')).toBe(false)
        expect(isTriggerNode('IF')).toBe(false)
        expect(isTriggerNode('Unknown Node')).toBe(false)
      })
    })

    describe('isActionNode', () => {
      it('returns true for action nodes', () => {
        expect(isActionNode('HTTP Request')).toBe(true)
        expect(isActionNode('Set')).toBe(true)
      })

      it('returns false for non-action nodes', () => {
        expect(isActionNode('Manual Trigger')).toBe(false)
        expect(isActionNode('JSON')).toBe(false)
        expect(isActionNode('IF')).toBe(false)
        expect(isActionNode('Unknown Node')).toBe(false)
      })
    })

    describe('isTransformNode', () => {
      it('returns true for transform nodes', () => {
        expect(isTransformNode('JSON')).toBe(true)
        expect(isTransformNode('Code')).toBe(true)
      })

      it('returns false for non-transform nodes', () => {
        expect(isTransformNode('Manual Trigger')).toBe(false)
        expect(isTransformNode('HTTP Request')).toBe(false)
        expect(isTransformNode('IF')).toBe(false)
        expect(isTransformNode('Unknown Node')).toBe(false)
      })
    })

    describe('isConditionNode', () => {
      it('returns true for condition nodes', () => {
        expect(isConditionNode('IF')).toBe(true)
        expect(isConditionNode('Switch')).toBe(true)
      })

      it('returns false for non-condition nodes', () => {
        expect(isConditionNode('Manual Trigger')).toBe(false)
        expect(isConditionNode('HTTP Request')).toBe(false)
        expect(isConditionNode('JSON')).toBe(false)
        expect(isConditionNode('Unknown Node')).toBe(false)
      })
    })
  })

  describe('getAllNodeTypes', () => {
    it('returns all registered node types', () => {
      const nodeTypes = getAllNodeTypes()
      expect(nodeTypes).toContain('Manual Trigger')
      expect(nodeTypes).toContain('HTTP Request')
      expect(nodeTypes).toContain('JSON')
      expect(nodeTypes).toContain('IF')
      expect(nodeTypes.length).toBeGreaterThan(0)
    })
  })

  describe('registerNodeType', () => {
    it('allows registering new node types', () => {
      const customMetadata = {
        type: 'Custom Node',
        group: ['custom'],
        executionCapability: 'action' as const,
        canExecuteIndividually: true,
        canBeDisabled: true
      }

      registerNodeType('Custom Node', customMetadata)
      
      const metadata = getNodeTypeMetadata('Custom Node')
      expect(metadata).toEqual(customMetadata)
      expect(canNodeExecuteIndividually('Custom Node')).toBe(true)
    })
  })

  describe('button visibility helpers', () => {
    describe('shouldShowExecuteButton', () => {
      it('returns true for nodes that can execute individually', () => {
        expect(shouldShowExecuteButton('Manual Trigger')).toBe(true)
        expect(shouldShowExecuteButton('Webhook Trigger')).toBe(true)
      })

      it('returns false for nodes that cannot execute individually', () => {
        expect(shouldShowExecuteButton('HTTP Request')).toBe(false)
        expect(shouldShowExecuteButton('JSON')).toBe(false)
        expect(shouldShowExecuteButton('IF')).toBe(false)
      })
    })

    describe('shouldShowDisableButton', () => {
      it('returns true for all known node types', () => {
        const nodeTypes = getAllNodeTypes()
        nodeTypes.forEach(nodeType => {
          expect(shouldShowDisableButton(nodeType)).toBe(true)
        })
      })

      it('returns true for unknown node types', () => {
        expect(shouldShowDisableButton('Unknown Node')).toBe(true)
      })
    })
  })
})