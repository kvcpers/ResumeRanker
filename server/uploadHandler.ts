import { Request, Response } from "express";
import { storagePut } from "./storage";
import { createResume, updateResumeParsingStatus, updateResumeRawText, getUserById, createOrUpdateResumeScore, getTotalResumeCount } from "./db";
import busboy from "busboy";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { verifySessionToken } from "./_core/auth";
import * as db from "./db";

/**
 * Handle resume file uploads
 * Expects multipart/form-data with a 'file' field containing the PDF
 */
export async function handleResumeUpload(req: Request, res: Response) {
  try {
    console.log("[Upload] Request received");

    // Authenticate user
    const cookies = req.headers.cookie || "";
    const cookieMatch = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    const token = cookieMatch ? cookieMatch[1] : null;
    
    if (!token) {
      console.error("[Upload] Missing session token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionData = await verifySessionToken(token);
    if (!sessionData) {
      console.error("[Upload] Invalid session token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = await db.getSessionByToken(token);
    if (!session) {
      console.error("[Upload] Session not found or expired");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getUserById(sessionData.userId);
    if (!user) {
      console.error("[Upload] User not found");
      return res.status(401).json({ error: "User not found" });
    }

    console.log("[Upload] User authenticated:", user?.id);

    // Parse multipart form data
    console.log("[Upload] Starting multipart parsing");
    const bb = busboy({ headers: req.headers });
    let fileBuffer: Buffer | null = null;
    let fileName: string = "";
    let fileSize = 0;

    return new Promise<void>((resolve, reject) => {
      bb.on("file", (fieldname: string, file: any, info: any) => {
        console.log("[Upload] File field received:", fieldname);

        if (fieldname !== "file") {
          console.log("[Upload] Ignoring non-file field:", fieldname);
          file.resume();
          return;
        }

        fileName = info.filename;
        console.log("[Upload] Processing file:", fileName);
        const chunks: Buffer[] = [];

        file.on("data", (data: Buffer) => {
          chunks.push(data);
          fileSize += data.length;

          // Enforce 10MB limit
          if (fileSize > 10 * 1024 * 1024) {
            console.error("[Upload] File exceeds 10MB limit");
            file.destroy();
            bb.destroy();
            res.status(413).json({ error: "File too large (max 10MB)" });
            resolve();
          }
        });

        file.on("end", () => {
          console.log("[Upload] File stream ended, size:", fileSize);
          fileBuffer = Buffer.concat(chunks);
        });

        file.on("error", (err: Error) => {
          console.error("[Upload] File stream error:", err);
          bb.destroy();
          res.status(400).json({ error: "File upload failed" });
          resolve();
        });
      });

      bb.on("close", async () => {
        console.log("[Upload] Busboy closed, processing file");

        try {
          if (!fileBuffer || !fileName) {
            console.error("[Upload] No file buffer or filename");
            return res.status(400).json({ error: "No file provided" });
          }

          console.log("[Upload] File buffer size:", fileBuffer.length);

          // Validate PDF
          if (!fileName.toLowerCase().endsWith(".pdf")) {
            console.error("[Upload] Invalid file extension:", fileName);
            return res.status(400).json({ error: "Only PDF files are supported" });
          }

          // Check PDF magic number (25 50 44 46 = %PDF)
          if (
            fileBuffer.length < 4 ||
            fileBuffer[0] !== 0x25 ||
            fileBuffer[1] !== 0x50 ||
            fileBuffer[2] !== 0x44 ||
            fileBuffer[3] !== 0x46
          ) {
            console.error("[Upload] Invalid PDF magic number");
            return res.status(400).json({ error: "Invalid PDF file" });
          }

          console.log("[Upload] PDF validation passed");

          // Upload to S3
          console.log("[Upload] Uploading to S3");
          const fileKey = `resumes/${user.id}/${nanoid()}-${fileName}`;
          const { url: fileUrl } = await storagePut(fileKey, fileBuffer, "application/pdf");
          console.log("[Upload] S3 upload successful:", fileUrl);

          // Create resume record
          console.log("[Upload] Creating resume record");
          const resumeResult = await createResume(user.id, fileName, fileKey, fileUrl);
          console.log("[Upload] Resume result:", resumeResult);

          // Get the inserted resume ID from the result
          const resumeId = resumeResult?.id;
          console.log("[Upload] Resume ID:", resumeId);

          if (!resumeId) {
            console.error("[Upload] Failed to get resume ID");
            return res.status(500).json({ error: "Failed to create resume record" });
          }

          // Update with raw text and mark as ready for parsing
          const rawText = `[PDF Content - ${fileName}] Size: ${fileSize} bytes`;
          await updateResumeRawText(resumeId, rawText);
          await updateResumeParsingStatus(resumeId, "completed");

          // Create initial score (mock scores for now - in production, these would come from AI analysis)
          const totalResumes = await getTotalResumeCount();
          const mockScores = {
            overallScore: "75",
            educationScore: "80",
            experienceScore: "70",
            skillsScore: "75",
            activitiesScore: "65",
            globalPercentile: "68",
            globalRank: totalResumes + 1,
            totalResumesRanked: totalResumes + 1,
          };
          
          await createOrUpdateResumeScore(resumeId, user.id, mockScores);

          console.log("[Upload] Resume processing complete");

          res.status(200).json({
            success: true,
            resumeId,
            fileName,
            fileSize,
            fileUrl,
            message: "Resume uploaded successfully",
          });

          resolve();
        } catch (error) {
          console.error("[Upload] Error during processing:", error);
          res.status(500).json({ error: "Upload failed", details: String(error) });
          resolve();
        }
      });

      bb.on("error", (err: Error) => {
        console.error("[Upload] Busboy error:", err);
        res.status(400).json({ error: "Invalid multipart data" });
        resolve();
      });

      req.pipe(bb);
    });
  } catch (error) {
    console.error("[Upload] Unhandled error:", error);
    return res.status(500).json({ error: "Upload failed", details: String(error) });
  }
}
