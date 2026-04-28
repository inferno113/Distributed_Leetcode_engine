import { Queue, QueueScheduler } from "bullmq";

const connection = { url: process.env.REDIS_URL || "redis://127.0.0.1:6379" };

// Ensure a QueueScheduler is running for this queue to handle retries and stalled jobs
const scheduler = new QueueScheduler("submission", { connection });

export const submissionQueue = new Queue("submission", { connection });

const DEFAULT_ATTEMPTS = Number(process.env.JOB_ATTEMPTS || 3);
const DEFAULT_BACKOFF_MS = Number(process.env.JOB_BACKOFF_MS || 5000);

export async function addSubmissionJob(submissionId, payload = {}, opts = {}) {
  const attempts = opts.attempts ?? DEFAULT_ATTEMPTS;
  const backoffMs = opts.backoffMs ?? DEFAULT_BACKOFF_MS;

  return submissionQueue.add(
    "execute_submission",
    { submissionId, ...payload },
    { attempts, backoff: { type: "exponential", delay: backoffMs } }
  );
}

export { scheduler };

export default submissionQueue;
