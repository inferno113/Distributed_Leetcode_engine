import executeInDocker from "./dockerExecutor.js";

export async function executeSubmission(submission) {
  // Delegate to docker executor which runs code inside container and returns stdout/stderr/exitCode
  return executeInDocker(submission, { timeoutMs: 5000 });
}

export default executeSubmission;
