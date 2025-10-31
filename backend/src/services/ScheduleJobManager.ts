/**
 * ScheduleJobManager - Manages scheduled workflow executions using Bull Queue
 * 
 * This replaces the in-memory node-cron approach with persistent Bull jobs
 * that survive server restarts and can be managed (view, pause, delete).
 */

import Bull, { Job, Queue } from 'bull';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ExecutionService } from './ExecutionService';

export interface ScheduleJobData {
    workflowId: string;
    triggerId: string;
    triggerNodeId: string;
    cronExpression: string;
    timezone: string;
    description: string;
    userId: string;
}

export interface ScheduleJobInfo {
    id: string;
    workflowId: string;
    workflowName: string;
    triggerId: string;
    cronExpression: string;
    timezone: string;
    description: string;
    nextRun: Date | null;
    lastRun: Date | null;
    status: 'active' | 'paused' | 'failed';
    failCount: number;
}

export class ScheduleJobManager {
    private scheduleQueue: Queue<ScheduleJobData>;
    private prisma: PrismaClient;
    private executionService: ExecutionService;

    constructor(
        prisma: PrismaClient,
        executionService: ExecutionService,
        redisConfig?: Bull.QueueOptions
    ) {
        this.prisma = prisma;
        this.executionService = executionService;

        // Initialize Bull queue for scheduled jobs
        this.scheduleQueue = new Bull<ScheduleJobData>('schedule-jobs', {
            redis: redisConfig?.redis || {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: false, // Keep completed jobs for history
                removeOnFail: false, // Keep failed jobs for debugging
            },
        });

        this.setupQueueProcessors();
        this.setupQueueEvents();
    }

    /**
     * Initialize - Load all active schedule triggers and create jobs
     */
    async initialize(): Promise<void> {
        try {
            logger.info('Initializing ScheduleJobManager...');

            // Get all active workflows with schedule triggers
            const workflows = await this.prisma.workflow.findMany({
                where: { active: true },
                select: {
                    id: true,
                    name: true,
                    userId: true,
                    triggers: true,
                },
            });

            let jobCount = 0;

            for (const workflow of workflows) {
                const triggers = (workflow.triggers as any[]) || [];
                const scheduleTriggers = triggers.filter((t) => {
                    const isActive = t.active !== undefined ? t.active : true;
                    return t.type === 'schedule' && isActive;
                });

                for (const trigger of scheduleTriggers) {
                    await this.addScheduleJob(workflow.id, workflow.name, workflow.userId, trigger);
                    jobCount++;
                }
            }

            logger.info(`ScheduleJobManager initialized with ${jobCount} scheduled jobs`);
        } catch (error) {
            logger.error('Error initializing ScheduleJobManager:', error);
            throw error;
        }
    }

    /**
     * Add a schedule job for a trigger
     */
    async addScheduleJob(
        workflowId: string,
        workflowName: string,
        userId: string,
        trigger: any
    ): Promise<Job<ScheduleJobData>> {
        const cronExpression = trigger.settings?.cronExpression;
        const timezone = trigger.settings?.timezone || 'UTC';
        const description = trigger.settings?.description || 'Scheduled execution';

        if (!cronExpression) {
            throw new Error('Cron expression is required');
        }

        const jobId = `${workflowId}-${trigger.id}`;

        // Remove existing job if it exists
        await this.removeScheduleJob(jobId);

        // Add new repeatable job
        const job = await this.scheduleQueue.add(
            {
                workflowId,
                triggerId: trigger.id,
                triggerNodeId: trigger.nodeId,
                cronExpression,
                timezone,
                description,
                userId,
            },
            {
                jobId,
                repeat: {
                    cron: cronExpression,
                    tz: timezone,
                },
            }
        );

        logger.info(`Added schedule job: ${jobId} (${description}) - ${cronExpression}`);

        return job;
    }

    /**
     * Remove a schedule job
     */
    async removeScheduleJob(jobId: string): Promise<void> {
        try {
            // Remove repeatable job
            const repeatableJobs = await this.scheduleQueue.getRepeatableJobs();
            const job = repeatableJobs.find((j) => j.id === jobId || j.key.includes(jobId));

            if (job) {
                await this.scheduleQueue.removeRepeatableByKey(job.key);
                logger.info(`Removed schedule job: ${jobId}`);
            }

            // Also remove any pending jobs with this ID
            const jobs = await this.scheduleQueue.getJobs(['waiting', 'delayed']);
            for (const j of jobs) {
                if (j.id === jobId) {
                    await j.remove();
                }
            }
        } catch (error) {
            logger.error(`Error removing schedule job ${jobId}:`, error);
        }
    }

    /**
     * Remove all schedule jobs for a workflow
     */
    async removeWorkflowJobs(workflowId: string): Promise<void> {
        try {
            const repeatableJobs = await this.scheduleQueue.getRepeatableJobs();
            const workflowJobs = repeatableJobs.filter((j) => j.id?.startsWith(workflowId));

            for (const job of workflowJobs) {
                await this.scheduleQueue.removeRepeatableByKey(job.key);
            }

            logger.info(`Removed ${workflowJobs.length} schedule jobs for workflow ${workflowId}`);
        } catch (error) {
            logger.error(`Error removing workflow jobs for ${workflowId}:`, error);
        }
    }

    /**
     * Sync schedule jobs for a workflow
     */
    async syncWorkflowJobs(workflowId: string): Promise<void> {
        try {
            // Remove existing jobs
            await this.removeWorkflowJobs(workflowId);

            // Get workflow
            const workflow = await this.prisma.workflow.findUnique({
                where: { id: workflowId },
                select: {
                    id: true,
                    name: true,
                    userId: true,
                    active: true,
                    triggers: true,
                },
            });

            if (!workflow || !workflow.active) {
                logger.info(`Workflow ${workflowId} is not active, skipping job sync`);
                return;
            }

            // Add new jobs
            const triggers = (workflow.triggers as any[]) || [];
            const scheduleTriggers = triggers.filter((t) => {
                const isActive = t.active !== undefined ? t.active : true;
                return t.type === 'schedule' && isActive;
            });

            for (const trigger of scheduleTriggers) {
                await this.addScheduleJob(workflow.id, workflow.name, workflow.userId, trigger);
            }

            logger.info(`Synced ${scheduleTriggers.length} schedule jobs for workflow ${workflowId}`);
        } catch (error) {
            logger.error(`Error syncing workflow jobs for ${workflowId}:`, error);
            throw error;
        }
    }

    /**
     * Get all schedule jobs
     */
    async getAllScheduleJobs(): Promise<ScheduleJobInfo[]> {
        try {
            const repeatableJobs = await this.scheduleQueue.getRepeatableJobs();
            const jobInfos: ScheduleJobInfo[] = [];

            for (const repeatableJob of repeatableJobs) {
                const [workflowId, triggerId] = repeatableJob.id?.split('-') || [];

                // Get workflow name
                const workflow = await this.prisma.workflow.findUnique({
                    where: { id: workflowId },
                    select: { name: true },
                });

                // Get job details
                const jobs = await this.scheduleQueue.getJobs(['completed', 'failed'], 0, 1);
                const lastJob = jobs.find((j) => j.data.workflowId === workflowId);

                jobInfos.push({
                    id: repeatableJob.id || repeatableJob.key,
                    workflowId,
                    workflowName: workflow?.name || 'Unknown',
                    triggerId: triggerId || '',
                    cronExpression: repeatableJob.cron,
                    timezone: repeatableJob.tz || 'UTC',
                    description: repeatableJob.name || 'Scheduled execution',
                    nextRun: repeatableJob.next ? new Date(repeatableJob.next) : null,
                    lastRun: lastJob?.finishedOn ? new Date(lastJob.finishedOn) : null,
                    status: 'active',
                    failCount: 0,
                });
            }

            return jobInfos;
        } catch (error) {
            logger.error('Error getting schedule jobs:', error);
            return [];
        }
    }

    /**
     * Get schedule jobs for a workflow
     */
    async getWorkflowScheduleJobs(workflowId: string): Promise<ScheduleJobInfo[]> {
        const allJobs = await this.getAllScheduleJobs();
        return allJobs.filter((job) => job.workflowId === workflowId);
    }

    /**
     * Pause a schedule job
     */
    async pauseScheduleJob(jobId: string): Promise<void> {
        try {
            const repeatableJobs = await this.scheduleQueue.getRepeatableJobs();
            const job = repeatableJobs.find((j) => j.id === jobId || j.key.includes(jobId));

            if (job) {
                await this.scheduleQueue.removeRepeatableByKey(job.key);
                logger.info(`Paused schedule job: ${jobId}`);
            }
        } catch (error) {
            logger.error(`Error pausing schedule job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Resume a schedule job
     */
    async resumeScheduleJob(workflowId: string, triggerId: string): Promise<void> {
        try {
            // Get workflow and trigger
            const workflow = await this.prisma.workflow.findUnique({
                where: { id: workflowId },
                select: {
                    id: true,
                    name: true,
                    userId: true,
                    triggers: true,
                },
            });

            if (!workflow) {
                throw new Error('Workflow not found');
            }

            const triggers = (workflow.triggers as any[]) || [];
            const trigger = triggers.find((t) => t.id === triggerId);

            if (!trigger) {
                throw new Error('Trigger not found');
            }

            await this.addScheduleJob(workflow.id, workflow.name, workflow.userId, trigger);
            logger.info(`Resumed schedule job: ${workflowId}-${triggerId}`);
        } catch (error) {
            logger.error(`Error resuming schedule job ${workflowId}-${triggerId}:`, error);
            throw error;
        }
    }

    /**
     * Setup queue processors
     */
    private setupQueueProcessors(): void {
        this.scheduleQueue.process(async (job: Job<ScheduleJobData>) => {
            const { workflowId, triggerId, triggerNodeId, userId, description } = job.data;

            logger.info(`Processing scheduled execution: ${workflowId} (${description})`);

            try {
                // Execute workflow
                const result = await this.executionService.executeWorkflow(
                    workflowId,
                    userId,
                    {
                        scheduledAt: new Date().toISOString(),
                        triggerId,
                        triggerType: 'schedule',
                    },
                    {},
                    triggerNodeId
                );

                const executionId = result.data?.executionId;
                logger.info(`Scheduled execution completed: ${executionId}`);

                return {
                    success: true,
                    executionId,
                };
            } catch (error) {
                logger.error(`Scheduled execution failed for ${workflowId}:`, error);
                throw error;
            }
        });
    }

    /**
     * Setup queue events
     */
    private setupQueueEvents(): void {
        this.scheduleQueue.on('completed', (job, result) => {
            logger.info(`Schedule job completed: ${job.id}`, result);
        });

        this.scheduleQueue.on('failed', (job, err) => {
            logger.error(`Schedule job failed: ${job?.id}`, err);
        });

        this.scheduleQueue.on('error', (error) => {
            logger.error('Schedule queue error:', error);
        });
    }

    /**
     * Shutdown - Clean up resources
     */
    async shutdown(): Promise<void> {
        try {
            await this.scheduleQueue.close();
            logger.info('ScheduleJobManager shut down');
        } catch (error) {
            logger.error('Error shutting down ScheduleJobManager:', error);
        }
    }
}
