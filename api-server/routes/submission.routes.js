import { Router } from "express";

import { createSubmission, getSubmission } from "../controllers/submission.controller.js";

const router = Router();

router.post("/submit", createSubmission);
router.get("/submission/:id", getSubmission);

export default router;