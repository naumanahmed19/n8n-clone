import OpenAI from 'openai';
import {
  NodeDefinition,
  NodeInputData,
  NodeOutputData,
} from '../../types/node.types';
import { AIMessage, OPENAI_MODELS } from '../../types/ai.types';
import { MemoryManager } from '../../utils/ai/MemoryManager';

export const OpenAINode: NodeDefinition = {
  type: 'openai',
  displayName: 'OpenAI',
  name: 'openai',
  group: ['ai', 'transform'],
  version: 1,
  description: 'Interact with OpenAI models (GPT-4, GPT-3.5, etc.)',
  icon: '🤖',
  color: '#10A37F',
  defaults: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    enableMemory: false,
    sessionId: 'default',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'apiKey',
      displayName: 'API Key',
      properties: [],
    },
  ],
  properties: [
    {
      displayName: 'Model',
      name: 'model',
      type: 'options',
      required: true,
      default: 'gpt-4o-mini',
      description: 'The OpenAI model to use',
      options: Object.entries(OPENAI_MODELS).map(([value, info]) => ({
        name: `${info.name} (${info.contextWindow.toLocaleString()} tokens)`,
        value,
      })),
    },
    {
      displayName: 'System Prompt',
      name: 'systemPrompt',
      type: 'string',
      required: false,
      default: 'You are a helpful AI assistant.',
      description: 'System instructions for the AI',
      placeholder: 'You are a helpful AI assistant that...',
    },
    {
      displayName: 'User Message',
      name: 'userMessage',
      type: 'string',
      required: true,
      default: '',
      description: 'The message to send to OpenAI. You can use {{json.fieldName}} to reference input data.',
      placeholder: 'Enter your message or use {{json.field}}',
    },
    {
      displayName: 'Temperature',
      name: 'temperature',
      type: 'number',
      required: false,
      default: 0.7,
      description: 'Controls randomness. Higher values (e.g., 1.0) make output more random, lower values (e.g., 0.2) make it more focused and deterministic.',
      placeholder: '0.7',
    },
    {
      displayName: 'Max Tokens',
      name: 'maxTokens',
      type: 'number',
      required: false,
      default: 1000,
      description: 'Maximum number of tokens to generate in the response',
      placeholder: '1000',
    },
    {
      displayName: 'Enable Conversation Memory',
      name: 'enableMemory',
      type: 'boolean',
      required: false,
      default: false,
      description: 'Maintain conversation history across multiple executions',
    },
    {
      displayName: 'Session ID',
      name: 'sessionId',
      type: 'string',
      required: false,
      default: 'default',
      description: 'Unique identifier for the conversation session',
      placeholder: 'user-123-chat',
      displayOptions: {
        show: {
          enableMemory: [true],
        },
      },
    },
    {
      displayName: 'JSON Mode',
      name: 'jsonMode',
      type: 'boolean',
      required: false,
      default: false,
      description: 'Enable JSON mode for structured outputs (GPT-4 Turbo and newer)',
    },
  ],
  execute: async function (
    inputData: NodeInputData
  ): Promise<NodeOutputData[]> {
    // Get parameters
    const model = this.getNodeParameter('model') as string;
    const systemPrompt = this.getNodeParameter('systemPrompt') as string;
    const userMessage = this.getNodeParameter('userMessage') as string;
    const temperature = this.getNodeParameter('temperature') as number;
    const maxTokens = this.getNodeParameter('maxTokens') as number;
    const enableMemory = this.getNodeParameter('enableMemory') as boolean;
    const sessionId = this.getNodeParameter('sessionId') as string;
    const jsonMode = this.getNodeParameter('jsonMode') as boolean;

    // Get credentials
    const credentials = await this.getCredentials('apiKey');
    
    if (!credentials || !credentials.apiKey) {
      throw new Error('OpenAI API key is required. Please configure credentials.');
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: credentials.apiKey as string,
    });

    // Resolve user message with input data
    const items = this.extractJsonData(
      this.normalizeInputItems(inputData.main || [])
    );
    const resolvedMessage =
      items.length > 0 ? this.resolveValue(userMessage, items[0]) : userMessage;

    if (!resolvedMessage || resolvedMessage.trim() === '') {
      throw new Error('User message cannot be empty');
    }

    // Get memory manager
    const memoryManager = MemoryManager.getInstance();

    // Build messages array
    const messages: AIMessage[] = [];

    // Add conversation history if memory is enabled
    if (enableMemory) {
      const memory = memoryManager.getMemory(sessionId);
      
      // Add system prompt if this is the first message
      if (memory.messages.length === 0 && systemPrompt) {
        const systemMessage: AIMessage = {
          role: 'system',
          content: systemPrompt,
          timestamp: Date.now(),
        };
        memoryManager.addMessage(sessionId, systemMessage);
        messages.push(systemMessage);
      } else {
        // Use existing messages
        messages.push(...memory.messages);
      }
    } else {
      // No memory - just system prompt and current message
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
          timestamp: Date.now(),
        });
      }
    }

    // Add current user message
    const currentUserMessage: AIMessage = {
      role: 'user',
      content: resolvedMessage,
      timestamp: Date.now(),
    };
    messages.push(currentUserMessage);

    // Save user message to memory if enabled
    if (enableMemory) {
      memoryManager.addMessage(sessionId, currentUserMessage);
    }

    this.logger.info('Sending request to OpenAI', {
      model,
      messageCount: messages.length,
      sessionId: enableMemory ? sessionId : 'none',
      temperature,
      maxTokens,
    });

    try {
      // Prepare request options
      const requestOptions: any = {
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
      };

      // Add JSON mode if enabled (for compatible models)
      if (jsonMode && (model.includes('gpt-4') || model.includes('gpt-3.5'))) {
        requestOptions.response_format = { type: 'json_object' };
      }

      // Make API call
      const completion = await openai.chat.completions.create(requestOptions);

      const response = completion.choices[0];
      const assistantMessage = response.message.content || '';

      // Save assistant response to memory if enabled
      if (enableMemory) {
        const assistantAIMessage: AIMessage = {
          role: 'assistant',
          content: assistantMessage,
          timestamp: Date.now(),
        };
        memoryManager.addMessage(sessionId, assistantAIMessage);
      }

      // Calculate estimated cost
      const modelInfo = OPENAI_MODELS[model as keyof typeof OPENAI_MODELS];
      const promptTokens = completion.usage?.prompt_tokens || 0;
      const completionTokens = completion.usage?.completion_tokens || 0;
      const totalTokens = completion.usage?.total_tokens || 0;

      const estimatedCost =
        (promptTokens / 1000) * modelInfo.costPer1kInput +
        (completionTokens / 1000) * modelInfo.costPer1kOutput;

      this.logger.info('OpenAI request completed', {
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost: `$${estimatedCost.toFixed(6)}`,
        finishReason: response.finish_reason,
      });

      // Return output
      return [
        {
          main: [
            {
              json: {
                response: assistantMessage,
                model,
                usage: {
                  promptTokens,
                  completionTokens,
                  totalTokens,
                  estimatedCost,
                },
                finishReason: response.finish_reason,
                sessionId: enableMemory ? sessionId : null,
                conversationLength: enableMemory
                  ? memoryManager.getMemory(sessionId).messages.length
                  : messages.length,
              },
            },
          ],
        },
      ];
    } catch (error: any) {
      this.logger.error('OpenAI request failed', {
        error: error.message,
        model,
        sessionId: enableMemory ? sessionId : 'none',
      });

      // Provide helpful error messages
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your credentials.');
      } else if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      } else if (error.status === 500) {
        throw new Error('OpenAI service error. Please try again later.');
      } else {
        throw new Error(`OpenAI error: ${error.message}`);
      }
    }
  },
};
