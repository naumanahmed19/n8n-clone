import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

async function main() {
  logger.info('Starting database seeding...')

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@n8n-clone.com' },
      update: {},
      create: {
        email: 'admin@n8n-clone.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        active: true,
      },
    })

    // Create test user
    const testUserPassword = await bcrypt.hash('test123', 10)
    const testUser = await prisma.user.upsert({
      where: { email: 'test@n8n-clone.com' },
      update: {},
      create: {
        email: 'test@n8n-clone.com',
        password: testUserPassword,
        name: 'Test User',
        role: 'USER',
        active: true,
      },
    })

    // Seed built-in node types
    const builtInNodes = [
      {
        type: 'http-request',
        displayName: 'HTTP Request',
        name: 'HTTP Request',
        group: ['transform'],
        version: 1,
        description: 'Makes HTTP requests to any URL',
        defaults: {
          method: 'GET',
          url: '',
          headers: {},
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
          {
            displayName: 'Method',
            name: 'method',
            type: 'options',
            required: true,
            default: 'GET',
            options: [
              { name: 'GET', value: 'GET' },
              { name: 'POST', value: 'POST' },
              { name: 'PUT', value: 'PUT' },
              { name: 'DELETE', value: 'DELETE' },
            ],
          },
          {
            displayName: 'URL',
            name: 'url',
            type: 'string',
            required: true,
            default: '',
            description: 'The URL to make the request to',
          },
        ],
        icon: 'fa:globe',
        color: '#4CAF50',
      },
      {
        type: 'json',
        displayName: 'JSON',
        name: 'JSON',
        group: ['transform'],
        version: 1,
        description: 'Compose, manipulate and extract JSON data',
        defaults: {
          operation: 'compose',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
          {
            displayName: 'Operation',
            name: 'operation',
            type: 'options',
            required: true,
            default: 'compose',
            options: [
              { name: 'Compose', value: 'compose' },
              { name: 'Extract', value: 'extract' },
            ],
          },
        ],
        icon: 'fa:code',
        color: '#FF9800',
      },
      {
        type: 'set',
        displayName: 'Set',
        name: 'Set',
        group: ['transform'],
        version: 1,
        description: 'Sets values on items and optionally remove other values',
        defaults: {
          keepOnlySet: false,
          values: {},
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
          {
            displayName: 'Keep Only Set',
            name: 'keepOnlySet',
            type: 'boolean',
            default: false,
            description: 'If only the values set on this node should be kept and all others removed',
          },
        ],
        icon: 'fa:pen',
        color: '#2196F3',
      },
      {
        type: 'webhook',
        displayName: 'Webhook',
        name: 'Webhook',
        group: ['trigger'],
        version: 1,
        description: 'Starts the workflow when a webhook is called',
        defaults: {
          httpMethod: 'GET',
          path: '',
        },
        inputs: [],
        outputs: ['main'],
        properties: [
          {
            displayName: 'HTTP Method',
            name: 'httpMethod',
            type: 'options',
            required: true,
            default: 'GET',
            options: [
              { name: 'GET', value: 'GET' },
              { name: 'POST', value: 'POST' },
              { name: 'PUT', value: 'PUT' },
              { name: 'DELETE', value: 'DELETE' },
            ],
          },
          {
            displayName: 'Path',
            name: 'path',
            type: 'string',
            required: true,
            default: '',
            description: 'The path for the webhook URL',
          },
        ],
        icon: 'fa:webhook',
        color: '#9C27B0',
      },
      {
        type: 'schedule',
        displayName: 'Schedule Trigger',
        name: 'Schedule Trigger',
        group: ['trigger'],
        version: 1,
        description: 'Triggers the workflow on a schedule',
        defaults: {
          rule: '0 0 * * *',
        },
        inputs: [],
        outputs: ['main'],
        properties: [
          {
            displayName: 'Rule',
            name: 'rule',
            type: 'string',
            required: true,
            default: '0 0 * * *',
            description: 'Cron expression for the schedule',
          },
        ],
        icon: 'fa:clock',
        color: '#607D8B',
      },
    ]

    for (const nodeData of builtInNodes) {
      await prisma.nodeType.upsert({
        where: { type: nodeData.type },
        update: nodeData,
        create: nodeData,
      })
    }

    // Create sample workflow
    const sampleWorkflow = await prisma.workflow.upsert({
      where: { id: 'sample-workflow-1' },
      update: {},
      create: {
        id: 'sample-workflow-1',
        name: 'Sample HTTP Request Workflow',
        description: 'A simple workflow that makes an HTTP request and processes the response',
        userId: testUser.id,
        nodes: [
          {
            id: 'webhook-1',
            type: 'webhook',
            name: 'Webhook',
            parameters: {
              httpMethod: 'POST',
              path: 'sample-webhook',
            },
            position: { x: 100, y: 100 },
            disabled: false,
          },
          {
            id: 'http-1',
            type: 'http-request',
            name: 'HTTP Request',
            parameters: {
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/posts/1',
            },
            position: { x: 300, y: 100 },
            disabled: false,
          },
          {
            id: 'json-1',
            type: 'json',
            name: 'JSON',
            parameters: {
              operation: 'extract',
            },
            position: { x: 500, y: 100 },
            disabled: false,
          },
        ],
        connections: [
          {
            id: 'conn-1',
            sourceNodeId: 'webhook-1',
            sourceOutput: 'main',
            targetNodeId: 'http-1',
            targetInput: 'main',
          },
          {
            id: 'conn-2',
            sourceNodeId: 'http-1',
            sourceOutput: 'main',
            targetNodeId: 'json-1',
            targetInput: 'main',
          },
        ],
        triggers: [
          {
            id: 'trigger-1',
            type: 'webhook',
            settings: {
              path: 'sample-webhook',
              method: 'POST',
            },
            active: true,
          },
        ],
        settings: {
          timezone: 'UTC',
          saveExecutionProgress: true,
          saveDataErrorExecution: 'all',
          saveDataSuccessExecution: 'all',
          executionTimeout: 300,
        },
        active: false,
      },
    })

    // Create sample execution
    await prisma.execution.upsert({
      where: { id: 'sample-execution-1' },
      update: {},
      create: {
        id: 'sample-execution-1',
        workflowId: sampleWorkflow.id,
        status: 'SUCCESS',
        startedAt: new Date(Date.now() - 60000), // 1 minute ago
        finishedAt: new Date(Date.now() - 30000), // 30 seconds ago
        triggerData: {
          body: { test: 'data' },
          headers: { 'content-type': 'application/json' },
        },
      },
    })

    logger.info('Database seeding completed successfully')
    logger.info(`Created users: ${adminUser.email}, ${testUser.email}`)
    logger.info(`Created ${builtInNodes.length} built-in node types`)
    logger.info(`Created sample workflow: ${sampleWorkflow.name}`)

  } catch (error) {
    logger.error('Error during database seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })