import mongoose from "mongoose";

const ALLOWED_LANGUAGES = ["python", "cpp"];
const ALLOWED_STATUSES = ["QUEUED", "RUNNING", "COMPLETED", "FAILED"];

const submissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      required: true,
      enum: ALLOWED_LANGUAGES
    },
    status: {
      type: String,
      enum: ALLOWED_STATUSES,
      default: "QUEUED",
      index: true
    },
    output: {
      type: String,
      default: ""
    },
    error: {
      type: String,
      default: ""
    },
    exitCode: {
      type: Number,
      default: null
    },
    executionTime: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;