import "dotenv/config";
import mongoose from "mongoose";
import { Worker, QueueScheduler } from "bullmq";

import Submission from "../models/submission.model.js";
import { executeSubmission } from "../executor/executor.js";

const connection = { url: process.env.REDIS_URL || "redis://127.0.0.1:6379" };
const QUEUE_NAME = "submission";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required in environment for worker");
  process.exit(1);
}

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log("Worker connected to MongoDB");

  // start a QueueScheduler to handle stalled jobs and retries
  const scheduler = new QueueScheduler(QUEUE_NAME, { connection });

  const concurrency = Number(process.env.WORKER_CONCURRENCY || 2);

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { submissionId } = job.data ?? {};
      if (!submissionId) {
        throw new Error("Job missing submissionId");
      }

      console.log(`Processing submission ${submissionId}`);

      // mark RUNNING
      await Submission.findByIdAndUpdate(submissionId, { status: "RUNNING" });

      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw new Error("Submission not found: " + submissionId);
      }

      try {
        const result = await executeSubmission(submission);

        await Submission.findByIdAndUpdate(submissionId, {
          status: "COMPLETED",
          output: result.stdout ?? "",
          error: result.stderr ?? "",
          exitCode: result.exitCode ?? null,
          executionTime: result.executionTime ?? null
        });
      } catch (err) {
        console.error("Execution failed", err);
        // try to capture stderr/exit info if available on the error
        const details = {
          status: "FAILED",
          error: err?.message ?? String(err),
          exitCode: err?.exitCode ?? null
        };
        await Submission.findByIdAndUpdate(submissionId, details);
        throw err;
      }
    },
    { connection }
  );

  worker.on("active", (job) => {
    console.log(`Job ${job.id} is active`);
  });

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed`, err?.message ?? err);
  });

  worker.on("stalled", (job) => {
    console.warn(`Job ${job?.id} stalled and will be retried`);
  });

  worker.on("error", (err) => {
    console.error("Worker error", err);
  });

  console.log("Worker is listening for jobs");
}

start().catch((err) => {
  console.error("Worker failed to start", err);
  process.exit(1);
});
