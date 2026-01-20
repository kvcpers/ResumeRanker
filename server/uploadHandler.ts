import { Request, Response } from "express";
import { storagePut } from "./storage";
import { createResume, updateResumeParsingStatus, updateResumeRawText, getUserById, createOrUpdateResumeScore, getTotalResumeCount, createResumeEducation, createResumeExperience, createResumeSkills, createResumeActivities, createRecommendation } from "./db";
import busboy from "busboy";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { verifySessionToken } from "./_core/auth";
import * as db from "./db";
import { analyzeResume } from "./_core/resumeAnalysis";

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
          console.log("[Upload] File name:", fileName);

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

          // Update parsing status to "parsing"
          await updateResumeParsingStatus(resumeId, "parsing");

          // Analyze resume with AI
          console.log("[Upload] Starting AI analysis...");
          try {
            const analysis = await analyzeResume(fileBuffer);
            
            // Store raw text
            await updateResumeRawText(resumeId, analysis.rawText);
            
            // Store parsed data
            await createResumeEducation(resumeId, analysis.parsedData.education);
            await createResumeExperience(resumeId, analysis.parsedData.experience);
            await createResumeSkills(resumeId, analysis.parsedData.skills);
            await createResumeActivities(resumeId, analysis.parsedData.activities);
            
            // Calculate global rank and percentile
            const totalResumes = await getTotalResumeCount();
            const overallScoreNum = parseFloat(analysis.scores.overallScore);
            
            // Get all scores to calculate percentile
            const allScores = await db.getGlobalRankings(10000, 0);
            const scoresArray = allScores.map(s => parseFloat(s.overallScore || "0")).sort((a, b) => b - a);
            
            // Calculate rank: find position where this score would fit (higher scores first)
            let rank = scoresArray.length + 1; // Default to last if no scores exist
            for (let i = 0; i < scoresArray.length; i++) {
              if (overallScoreNum >= scoresArray[i]) {
                rank = i + 1;
                break;
              }
            }
            
            // Calculate percentile: percentage of resumes with lower scores
            const totalRanked = scoresArray.length + 1; // Include this resume
            const percentile = Math.round(((totalRanked - rank) / totalRanked) * 100);
            
            // Store scores
            await createOrUpdateResumeScore(resumeId, user.id, {
              ...analysis.scores,
              globalPercentile: percentile.toString(),
              globalRank: rank,
              totalResumesRanked: totalRanked,
            });
            
            // Store recommendations
            for (const rec of analysis.recommendations) {
              await createRecommendation(
                resumeId,
                user.id,
                rec.type,
                rec.title,
                rec.description,
                rec.priority,
                rec.estimatedImpact
              );
            }
            
            // Mark parsing as completed
            await updateResumeParsingStatus(resumeId, "completed");
            
            console.log("[Upload] AI analysis complete");
          } catch (analysisError) {
            console.error("[Upload] AI analysis failed:", analysisError);
            console.error("[Upload] Error message:", analysisError instanceof Error ? analysisError.message : String(analysisError));
            console.error("[Upload] Error stack:", analysisError instanceof Error ? analysisError.stack : "No stack trace");
            
            // Try to extract more details from the error
            if (analysisError instanceof Error) {
              console.error("[Upload] Error name:", analysisError.name);
              if ((analysisError as any).cause) {
                console.error("[Upload] Error cause:", (analysisError as any).cause);
              }
            }
            
            // Even if analysis fails, try to create basic scores and recommendations from PDF text
            try {
              console.log("[Upload] Attempting fallback analysis...");
              const { extractTextFromPDF } = await import("./_core/resumeAnalysis");
              const rawText = await extractTextFromPDF(fileBuffer);
              await updateResumeRawText(resumeId, rawText);
              
              // Use basic extraction - import the module
              const resumeAnalysis = await import("./_core/resumeAnalysis");
              const basicData = resumeAnalysis.extractBasicInfoFromText(rawText);
              const basicScores = resumeAnalysis.calculateResumeScores(basicData);
              const basicRecommendations = resumeAnalysis.getDefaultRecommendations(basicData, basicScores);
              
              // Store basic data
              await createResumeEducation(resumeId, basicData.education);
              await createResumeExperience(resumeId, basicData.experience);
              await createResumeSkills(resumeId, basicData.skills);
              await createResumeActivities(resumeId, basicData.activities);
              
              // Calculate rank
              const totalResumes = await getTotalResumeCount();
              const overallScoreNum = parseFloat(basicScores.overallScore);
              const allScores = await db.getGlobalRankings(10000, 0);
              const scoresArray = allScores.map(s => parseFloat(s.overallScore || "0")).sort((a, b) => b - a);
              let rank = scoresArray.length + 1;
              for (let i = 0; i < scoresArray.length; i++) {
                if (overallScoreNum >= scoresArray[i]) {
                  rank = i + 1;
                  break;
                }
              }
              const totalRanked = scoresArray.length + 1;
              const percentile = Math.round(((totalRanked - rank) / totalRanked) * 100);
              
              // Store scores
              await createOrUpdateResumeScore(resumeId, user.id, {
                ...basicScores,
                globalPercentile: percentile.toString(),
                globalRank: rank,
                totalResumesRanked: totalRanked,
              });
              
              // Store recommendations
              for (const rec of basicRecommendations) {
                await createRecommendation(
                  resumeId,
                  user.id,
                  rec.type,
                  rec.title,
                  rec.description,
                  rec.priority,
                  rec.estimatedImpact
                );
              }
              
              await updateResumeParsingStatus(resumeId, "completed");
              console.log("[Upload] Fallback analysis completed successfully");
            } catch (fallbackError) {
              console.error("[Upload] Fallback analysis also failed:", fallbackError);
              await updateResumeParsingStatus(resumeId, "failed", String(analysisError));
            }
            // Still return success, but with failed parsing status if both failed
            // Don't throw - allow upload to complete even if analysis fails
          }

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
          console.error("[Upload] Error stack:", error instanceof Error ? error.stack : "No stack trace");
          console.error("[Upload] Error details:", {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : "Unknown",
          });
          res.status(500).json({ 
            error: "Upload failed", 
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
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
