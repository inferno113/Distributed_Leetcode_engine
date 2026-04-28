import Submission from "../models/submission.model.js";
import { addSubmissionJob } from "../queue/queue.js";

const ALLOWED_LANGUAGES = new Set(["python", "cpp"]);

const createSubmission = async (req, res) => {
  const { code, language } = req.body ?? {};

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({ message: "Code is required" });
  }

  if (typeof language !== "string" || !ALLOWED_LANGUAGES.has(language)) {
    return res.status(400).json({
      message: "Language must be either python or cpp"
    });
  }

  let submission;
  try {
    submission = await Submission.create({
      code: code.trim(),
      language,
      status: "QUEUED"
    });
  } catch (err) {
    console.error("Failed to create submission", err);
    return res.status(500).json({ message: "Internal error creating submission" });
  }

  // Enqueue the job for workers. If enqueue fails, mark submission FAILED.
  try {
    await addSubmissionJob(submission._id.toString());
  } catch (err) {
    console.error("Failed to enqueue submission job", err);
    try {
      await Submission.findByIdAndUpdate(submission._id, {
        status: "FAILED",
        error: String(err)
      });
    } catch (uErr) {
      console.error("Failed to update submission status after enqueue failure", uErr);
    }
    return res.status(500).json({ message: "Failed to enqueue job", submission });
  }

  return res.status(201).json({
    message: "Submission queued successfully",
    submission
  });
};

export { createSubmission };

const getSubmission = async (req, res) => {
  const { id } = req.params ?? {};
  if (!id) return res.status(400).json({ message: "submission id required" });

  try {
    const submission = await Submission.findById(id).lean();
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    return res.status(200).json({ submission });
  } catch (err) {
    console.error("Failed to fetch submission", err);
    return res.status(500).json({ message: "Internal error fetching submission" });
  }
};

export { getSubmission };