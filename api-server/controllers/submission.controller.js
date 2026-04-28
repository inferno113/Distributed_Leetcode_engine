import Submission from "../models/submission.model.js";

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

  const submission = await Submission.create({
    code: code.trim(),
    language,
    status: "QUEUED"
  });

  return res.status(201).json({
    message: "Submission queued successfully",
    submission
  });
};

export { createSubmission };