import { Queue } from "bullmq";

const connection = { url: process.env.REDIS_URL || "redis://127.0.0.1:6379" };

export const submissionQueue = new Queue("submission", { connection });

export async function addSubmissionJob(submissionId, payload = {}) {
  return submissionQueue.add(
    "execute_submission",
    { submissionId, ...payload },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
  );
}

export default submissionQueue;
