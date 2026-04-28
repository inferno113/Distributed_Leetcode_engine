import fs from "fs/promises";
import path from "path";
import os from "os";
import { spawn } from "child_process";

function randomName() {
  return `exec-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

async function writeTempFile(dir, name, content) {
  const p = path.join(dir, name);
  await fs.writeFile(p, content, { encoding: "utf8", mode: 0o600 });
  return p;
}

function runDockerProcess(args, timeoutMs, containerName) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args);
    let stdout = "";
    let stderr = "";
    let finished = false;

    const onFinish = (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(killTimer);
      resolve({ stdout, stderr, code, signal });
    };

    child.stdout.on("data", (b) => (stdout += b.toString()));
    child.stderr.on("data", (b) => (stderr += b.toString()));

    child.on("error", (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(killTimer);
      reject(err);
    });

    child.on("close", onFinish);

    const killTimer = setTimeout(async () => {
      if (finished) return;
      // attempt to force-remove container by name, then resolve as timeout
      try {
        await new Promise((res) => {
          const killer = spawn("docker", ["rm", "-f", containerName]);
          killer.on("close", () => res());
        });
      } catch (e) {
        // ignore
      }
      finished = true;
      resolve({ stdout, stderr: stderr + `\n[timeout]`, code: null, signal: "SIGTERM" });
    }, timeoutMs);
  });
}

export async function executeInDocker(submission, opts = {}) {
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 5000;

  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), "exec-"));
  const containerName = randomName();

  try {
    let fileName;
    if (submission.language === "python") {
      fileName = "main.py";
      await writeTempFile(tmpBase, fileName, submission.code);

      const args = [
        "run",
        "--rm",
        "--name",
        containerName,
        "--network=none",
        "--memory=256m",
        "--cpus=0.5",
        "-v",
        `${tmpBase}:/work:ro`,
        "-w",
        "/work",
        "python:3.11",
        "python",
        fileName
      ];

      const start = Date.now();
      const result = await runDockerProcess(args, timeoutMs, containerName);
      const executionTime = Date.now() - start;
      return { stdout: result.stdout, stderr: result.stderr, exitCode: result.code, executionTime };
    }

    if (submission.language === "cpp") {
      fileName = "main.cpp";
      await writeTempFile(tmpBase, fileName, submission.code);

      // Compile and run inside container. We don't mount as read-only because compilation writes output.
      const args = [
        "run",
        "--rm",
        "--name",
        containerName,
        "--network=none",
        "--memory=256m",
        "--cpus=0.5",
        "-v",
        `${tmpBase}:/work`,
        "-w",
        "/work",
        "gcc:12",
        "bash",
        "-lc",
        `g++ ${fileName} -O2 -std=c++17 -o main && ./main`
      ];

      const start = Date.now();
      const result = await runDockerProcess(args, timeoutMs, containerName);
      const executionTime = Date.now() - start;
      return { stdout: result.stdout, stderr: result.stderr, exitCode: result.code, executionTime };
    }

    throw new Error("Unsupported language: " + submission.language);
  } finally {
    // cleanup temp dir
    try {
      await fs.rm(tmpBase, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  }
}

export default executeInDocker;
