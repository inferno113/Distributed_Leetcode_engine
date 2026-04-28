// Placeholder executor. This file will later call into Docker-based sandbox.
// For now it simulates execution and returns a neutral result.

export async function executeSubmission(submission) {
  const start = Date.now();

  // TODO: Replace this simulation with Docker execution.
  // Simulate small execution delay
  await new Promise((r) => setTimeout(r, 200));

  const executionTime = Date.now() - start;

  // For now we return code echoed to stdout for visibility.
  return {
    stdout: `Executed ${submission.language} code (simulated)\n` + submission.code.slice(0, 200),
    stderr: "",
    exitCode: 0,
    executionTime
  };
}

export default executeSubmission;
