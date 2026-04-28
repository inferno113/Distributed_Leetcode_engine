import "dotenv/config";
import mongoose from "mongoose";
import { Worker } from "bullmq";

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
          executionTime: result.executionTime ?? null
        });
      } catch (err) {
        console.error("Execution failed", err);
        await Submission.findByIdAndUpdate(submissionId, {
          status: "FAILED",
          error: String(err)
        });
        throw err;
      }
    },
    { connection }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed`, err?.message ?? err);
  });

  console.log("Worker is listening for jobs");
}

start().catch((err) => {
  console.error("Worker failed to start", err);
  process.exit(1);
});
