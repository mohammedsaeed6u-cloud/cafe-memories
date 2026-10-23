'use client';

export type JobPriority = 'HIGH' | 'NORMAL' | 'LOW';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BackgroundJob<T = unknown> {
  id: string;
  type: 'PRINT_RENDER' | 'WEBHOOK_DISPATCH' | 'ANALYTICS_ROLLUP';
  payload: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxRetries: number;
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export class JobQueueService {
  private static queue: BackgroundJob[] = [];
  private static deadLetterQueue: BackgroundJob[] = [];
  private static isProcessing = false;

  public static enqueue<T>(
    type: BackgroundJob['type'],
    payload: T,
    priority: JobPriority = 'NORMAL'
  ): BackgroundJob<T> {
    const job: BackgroundJob<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      payload,
      priority,
      status: 'PENDING',
      attempts: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
    };

    if (priority === 'HIGH') {
      this.queue.unshift(job as BackgroundJob);
    } else {
      this.queue.push(job as BackgroundJob);
    }

    // Trigger async processing loop
    setTimeout(() => this.processNext(), 0);
    return job;
  }

  private static async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
    if (!job) {
      this.isProcessing = false;
      return;
    }

    job.status = 'PROCESSING';
    job.attempts += 1;

    try {
      // Simulate background job execution
      await new Promise((resolve) => setTimeout(resolve, 10));
      job.status = 'COMPLETED';
      job.processedAt = new Date().toISOString();
    } catch (err) {
      job.error = err instanceof Error ? err.message : String(err);
      if (job.attempts < job.maxRetries) {
        job.status = 'PENDING';
        this.queue.push(job); // Retry with backoff
      } else {
        job.status = 'FAILED';
        this.deadLetterQueue.push(job);
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), 0);
      }
    }
  }

  public static getQueueStats() {
    return {
      pending: this.queue.filter((j) => j.status === 'PENDING').length,
      processing: this.queue.filter((j) => j.status === 'PROCESSING').length,
      deadLetterCount: this.deadLetterQueue.length,
    };
  }
}
