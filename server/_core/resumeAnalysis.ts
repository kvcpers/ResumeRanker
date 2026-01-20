import { invokeLLM } from "./llm";
import { createRequire } from "module";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// pdf-parse is a CommonJS module, use createRequire to load it properly
const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");

// pdf-parse v2.4.5 - PDFParse is a class that requires options
// The constructor expects an options object with verbosity and data/buffer
// Use load() then getText() to extract text
function getPdfParseFn(): (buffer: Buffer) => Promise<any> {
  try {
    const PDFParseClass = pdfParseModule.PDFParse;
    const VerbosityLevel = pdfParseModule.VerbosityLevel || { ERRORS: 0, WARNINGS: 1, INFOS: 5 };
    
    if (!PDFParseClass || typeof PDFParseClass !== 'function') {
      throw new Error("PDFParse class not found");
    }
    
    // Create a function that instantiates the class, loads the PDF, and extracts text
    return async (buffer: Buffer) => {
      // PDFNodeStream only supports file:// URLs, so we need to save to a temp file
      const tempFilePath = join(tmpdir(), `pdf-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`);
      const fileUrl = `file://${tempFilePath}`;
      
      try {
        // Write buffer to temporary file
        await writeFile(tempFilePath, buffer);
        
        // Create instance with options - pass file URL
        const instance = new PDFParseClass({
          verbosity: VerbosityLevel.ERRORS || 0,
          url: fileUrl,
        });
        
        // Load the PDF (it will use the url from options)
        await instance.load();
        
        // Extract text using getText() method
        let text = '';
        if (typeof instance.getText === 'function') {
          const textResult = await instance.getText();
          // Ensure text is a string - getText() might return an object or array
          if (typeof textResult === 'string') {
            text = textResult;
          } else if (textResult && typeof textResult === 'object') {
            // If it's an object, try to extract text property or stringify
            text = textResult.text || textResult.toString() || JSON.stringify(textResult);
          } else {
            text = String(textResult || '');
          }
        } else {
          throw new Error("PDFParse instance has no getText method");
        }
        
        // Clean up temporary file
        try {
          await unlink(tempFilePath);
        } catch (cleanupError) {
          console.warn("[ResumeAnalysis] Failed to delete temp file:", cleanupError);
        }
        
        // Return in the same format as the old pdf-parse (with .text property)
        return { text: text || '' };
      } catch (error) {
        // Clean up temporary file on error
        try {
          await unlink(tempFilePath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    };
  } catch (error) {
    console.error("[ResumeAnalysis] Error initializing pdf-parse:", error);
    throw new Error(`Failed to initialize pdf-parse: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export interface ParsedResumeData {
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    gpa?: string;
    startDate?: string;
    endDate?: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    durationMonths?: number;
  }>;
  skills: Array<{
    skillName: string;
    category: "technical" | "soft" | "domain" | "language" | "tool" | "framework" | "other";
    proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
  }>;
  activities: Array<{
    activityName: string;
    activityType: "leadership" | "volunteer" | "achievement" | "award" | "certification" | "project" | "publication" | "other";
    description?: string;
    date?: string;
  }>;
}

export interface ResumeScores {
  overallScore: string;
  educationScore: string;
  experienceScore: string;
  skillsScore: string;
  activitiesScore: string;
}

export interface Recommendation {
  type: "skill_gap" | "education" | "experience" | "certification" | "activity" | "career_advice";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimatedImpact: string;
}

/**
 * Basic text extraction fallback when LLM is not available
 */
export function extractBasicInfoFromText(text: string): ParsedResumeData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Try to extract basic info using pattern matching
  const education: ParsedResumeData['education'] = [];
  const experience: ParsedResumeData['experience'] = [];
  const skills: ParsedResumeData['skills'] = [];
  const activities: ParsedResumeData['activities'] = [];
  
  // Look for common education keywords
  const eduKeywords = ['university', 'college', 'bachelor', 'master', 'phd', 'degree', 'gpa'];
  const expKeywords = ['experience', 'worked', 'company', 'position', 'role', 'job'];
  const skillKeywords = ['skill', 'proficient', 'expert', 'language', 'framework', 'tool'];
  
  // Basic pattern matching
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Education detection
    if (eduKeywords.some(kw => line.includes(kw))) {
      const nextLines = lines.slice(i, Math.min(i + 3, lines.length));
      education.push({
        institution: nextLines[0] || 'Unknown',
        degree: nextLines.find(l => l.match(/\b(bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?)/i)) || 'Degree',
      });
    }
    
    // Experience detection
    if (expKeywords.some(kw => line.includes(kw))) {
      const nextLines = lines.slice(i, Math.min(i + 3, lines.length));
      experience.push({
        company: nextLines[0] || 'Unknown',
        position: nextLines[1] || 'Position',
      });
    }
    
    // Skills detection
    if (skillKeywords.some(kw => line.includes(kw))) {
      const skillMatches = lines[i].match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
      if (skillMatches) {
        skillMatches.forEach(skill => {
          if (skill.length > 2 && skill.length < 30) {
            skills.push({
              skillName: skill,
              category: 'technical',
              proficiencyLevel: 'intermediate',
            });
          }
        });
      }
    }
  }
  
  return { education, experience, skills, activities };
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfParseFn = getPdfParseFn();
    const data = await pdfParseFn(pdfBuffer);
    
    if (!data) {
      throw new Error("PDF parsing returned no data");
    }
    
    // Ensure text is a string
    let text = '';
    if (typeof data === 'string') {
      text = data;
    } else if (data && typeof data === 'object') {
      text = data.text || data.toString() || '';
    } else {
      text = String(data || '');
    }
    
    if (!text) {
      throw new Error("PDF parsing returned no text content");
    }
    
    return text;
  } catch (error) {
    console.error("[ResumeAnalysis] PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse resume text using LLM to extract structured data
 */
export async function parseResumeWithLLM(resumeText: string): Promise<ParsedResumeData> {
  // Ensure resumeText is a string
  const text = typeof resumeText === 'string' ? resumeText : String(resumeText || '');
  
  const prompt = `You are a resume parsing expert. Extract structured information from the following resume text.

Resume Text:
${text.substring(0, 8000)} ${text.length > 8000 ? "\n[... truncated ...]" : ""}

Extract the following information and return it as JSON:
1. Education: List all educational institutions, degrees, fields of study, GPAs, and dates
2. Experience: List all work experience with company names, positions, descriptions, and dates
3. Skills: Extract all skills mentioned, categorize them (technical, soft, domain, language, tool, framework, other), and estimate proficiency level (beginner, intermediate, advanced, expert)
4. Activities: Extract extracurricular activities, achievements, awards, certifications, projects, publications, etc.

Return ONLY valid JSON in this exact format:
{
  "education": [{"institution": "...", "degree": "...", "fieldOfStudy": "...", "gpa": "...", "startDate": "...", "endDate": "..."}],
  "experience": [{"company": "...", "position": "...", "description": "...", "startDate": "...", "endDate": "..."}],
  "skills": [{"skillName": "...", "category": "technical|soft|domain|language|tool|framework|other", "proficiencyLevel": "beginner|intermediate|advanced|expert"}],
  "activities": [{"activityName": "...", "activityType": "leadership|volunteer|achievement|award|certification|project|publication|other", "description": "...", "date": "..."}]
}

If a field is not found, use an empty array. Be thorough and extract all relevant information.`;

  try {
    // Check if API key is configured
    const { ENV } = await import("./env");
    if (!ENV.forgeApiKey || !ENV.forgeApiUrl) {
      console.warn("[ResumeAnalysis] LLM API not configured, using basic text extraction");
      // Return basic extraction from text patterns
      return extractBasicInfoFromText(resumeText);
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a resume parsing expert. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      responseFormat: { type: "json_object" },
      maxTokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No content in LLM response");
    }

    const parsed = JSON.parse(content) as ParsedResumeData;
    
    // Validate and normalize the data
    return {
      education: Array.isArray(parsed.education) ? parsed.education : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
    };
  } catch (error) {
    console.error("[ResumeAnalysis] LLM parsing failed:", error);
    // Fallback to basic extraction
    return extractBasicInfoFromText(resumeText);
  }
}

/**
 * Calculate resume scores based on parsed data
 */
export function calculateResumeScores(parsedData: ParsedResumeData): ResumeScores {
  // Education Score (0-100)
  let educationScore = 0;
  if (parsedData.education.length > 0) {
    const hasDegree = parsedData.education.some(e => e.degree);
    const hasGPA = parsedData.education.some(e => e.gpa);
    const hasFieldOfStudy = parsedData.education.some(e => e.fieldOfStudy);
    
    educationScore = 40; // Base score for having education
    if (hasDegree) educationScore += 20;
    if (hasGPA) educationScore += 20;
    if (hasFieldOfStudy) educationScore += 20;
  }

  // Experience Score (0-100)
  let experienceScore = 0;
  if (parsedData.experience.length > 0) {
    const totalMonths = parsedData.experience.reduce((sum, exp) => {
      return sum + (exp.durationMonths || 0);
    }, 0);
    
    const hasDescriptions = parsedData.experience.some(e => e.description && e.description.length > 20);
    
    experienceScore = Math.min(40 + (totalMonths / 12) * 10, 80); // Base + months bonus, capped at 80
    if (hasDescriptions) experienceScore += 20;
    experienceScore = Math.min(experienceScore, 100);
  }

  // Skills Score (0-100)
  let skillsScore = 0;
  if (parsedData.skills.length > 0) {
    const technicalSkills = parsedData.skills.filter(s => 
      ["technical", "language", "tool", "framework"].includes(s.category)
    ).length;
    const softSkills = parsedData.skills.filter(s => s.category === "soft").length;
    const advancedSkills = parsedData.skills.filter(s => 
      ["advanced", "expert"].includes(s.proficiencyLevel)
    ).length;
    
    skillsScore = Math.min(30 + technicalSkills * 5 + softSkills * 2 + advancedSkills * 3, 100);
  }

  // Activities Score (0-100)
  let activitiesScore = 0;
  if (parsedData.activities.length > 0) {
    const leadershipActivities = parsedData.activities.filter(a => 
      ["leadership", "achievement", "award"].includes(a.activityType)
    ).length;
    const certifications = parsedData.activities.filter(a => a.activityType === "certification").length;
    
    activitiesScore = Math.min(20 + leadershipActivities * 15 + certifications * 10, 100);
  }

  // Overall Score (weighted average)
  const overallScore = Math.round(
    educationScore * 0.25 +
    experienceScore * 0.35 +
    skillsScore * 0.25 +
    activitiesScore * 0.15
  );

  return {
    overallScore: overallScore.toString(),
    educationScore: Math.round(educationScore).toString(),
    experienceScore: Math.round(experienceScore).toString(),
    skillsScore: Math.round(skillsScore).toString(),
    activitiesScore: Math.round(activitiesScore).toString(),
  };
}

/**
 * Generate recommendations using LLM
 */
export async function generateRecommendations(
  parsedData: ParsedResumeData,
  scores: ResumeScores
): Promise<Recommendation[]> {
  const prompt = `You are a career advisor analyzing a resume. Based on the following data, provide 3-5 specific, actionable recommendations to improve the resume.

Resume Data:
Education: ${parsedData.education.length} entries
Experience: ${parsedData.experience.length} entries
Skills: ${parsedData.skills.length} entries
Activities: ${parsedData.activities.length} entries

Current Scores:
Overall: ${scores.overallScore}/100
Education: ${scores.educationScore}/100
Experience: ${scores.experienceScore}/100
Skills: ${scores.skillsScore}/100
Activities: ${scores.activitiesScore}/100

Provide recommendations that are:
1. Specific and actionable
2. Prioritized by potential impact
3. Include estimated impact percentage

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "type": "skill_gap|education|experience|certification|activity|career_advice",
      "title": "Brief title",
      "description": "Detailed description of the recommendation",
      "priority": "low|medium|high",
      "estimatedImpact": "+X%"
    }
  ]
}`;

  try {
    // Check if API key is configured
    const { ENV } = await import("./env");
    if (!ENV.forgeApiKey || !ENV.forgeApiUrl) {
      console.warn("[ResumeAnalysis] LLM API not configured, using default recommendations");
      // Return basic recommendations when API is not available
      return getDefaultRecommendations(parsedData, scores);
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a career advisor. Always return valid JSON with specific, actionable recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      responseFormat: { type: "json_object" },
      maxTokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No content in LLM response");
    }

    const parsed = JSON.parse(content) as { recommendations: Recommendation[] };
    
    if (Array.isArray(parsed.recommendations)) {
      return parsed.recommendations.slice(0, 5); // Limit to 5 recommendations
    }
    
    return getDefaultRecommendations(parsedData, scores);
  } catch (error) {
    console.error("[ResumeAnalysis] Recommendation generation failed:", error);
    // Return default recommendations on error
    return getDefaultRecommendations(parsedData, scores);
  }
}

/**
 * Generate default recommendations when LLM is not available
 */
export function getDefaultRecommendations(
  parsedData: ParsedResumeData,
  scores: ResumeScores
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  const overallScore = parseFloat(scores.overallScore);
  const educationScore = parseFloat(scores.educationScore);
  const experienceScore = parseFloat(scores.experienceScore);
  const skillsScore = parseFloat(scores.skillsScore);
  const activitiesScore = parseFloat(scores.activitiesScore);
  
  if (educationScore < 60) {
    recommendations.push({
      type: "education",
      title: "Enhance Education Section",
      description: "Consider adding more details about your education, including GPA, relevant coursework, or academic achievements.",
      priority: "high",
      estimatedImpact: "+10%",
    });
  }
  
  if (experienceScore < 60) {
    recommendations.push({
      type: "experience",
      title: "Quantify Your Achievements",
      description: "Add specific metrics and numbers to your work experience. For example: 'Increased sales by 30%' or 'Managed team of 10 people'.",
      priority: "high",
      estimatedImpact: "+12%",
    });
  }
  
  if (skillsScore < 60) {
    recommendations.push({
      type: "skill_gap",
      title: "Add More Technical Skills",
      description: "Consider adding programming languages, frameworks, tools, or technologies relevant to your field.",
      priority: "high",
      estimatedImpact: "+15%",
    });
  }
  
  if (activitiesScore < 50) {
    recommendations.push({
      type: "activity",
      title: "Include Leadership Experience",
      description: "Add any volunteer work, side projects, or leadership roles. These demonstrate soft skills and initiative.",
      priority: "medium",
      estimatedImpact: "+8%",
    });
  }
  
  if (overallScore < 70) {
    recommendations.push({
      type: "career_advice",
      title: "Optimize Resume Structure",
      description: "Ensure your resume follows a clear, professional format with consistent formatting and clear sections.",
      priority: "medium",
      estimatedImpact: "+5%",
    });
  }
  
  // Always add at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      type: "career_advice",
      title: "Keep Resume Updated",
      description: "Regularly update your resume with new skills, experiences, and achievements to maintain a competitive profile.",
      priority: "low",
      estimatedImpact: "+3%",
    });
  }
  
  return recommendations.slice(0, 5);
}

/**
 * Main function to analyze a resume from PDF buffer
 */
export async function analyzeResume(pdfBuffer: Buffer): Promise<{
  parsedData: ParsedResumeData;
  scores: ResumeScores;
  recommendations: Recommendation[];
  rawText: string;
}> {
  try {
    console.log("[ResumeAnalysis] Starting analysis, PDF buffer size:", pdfBuffer.length);
    
    // Step 1: Extract text from PDF
    console.log("[ResumeAnalysis] Step 1: Extracting text from PDF...");
    const rawText = await extractTextFromPDF(pdfBuffer);
    console.log("[ResumeAnalysis] Extracted text length:", rawText.length);
    
    // Step 2: Parse resume with LLM
    console.log("[ResumeAnalysis] Step 2: Parsing resume with LLM...");
    const parsedData = await parseResumeWithLLM(rawText);
    console.log("[ResumeAnalysis] Parsed data:", {
      education: parsedData.education.length,
      experience: parsedData.experience.length,
      skills: parsedData.skills.length,
      activities: parsedData.activities.length,
    });
    
    // Step 3: Calculate scores
    console.log("[ResumeAnalysis] Step 3: Calculating scores...");
    const scores = calculateResumeScores(parsedData);
    console.log("[ResumeAnalysis] Scores calculated:", scores);
    
    // Step 4: Generate recommendations
    console.log("[ResumeAnalysis] Step 4: Generating recommendations...");
    const recommendations = await generateRecommendations(parsedData, scores);
    console.log("[ResumeAnalysis] Generated", recommendations.length, "recommendations");
    
    return {
      parsedData,
      scores,
      recommendations,
      rawText,
    };
  } catch (error) {
    console.error("[ResumeAnalysis] Analysis failed:", error);
    console.error("[ResumeAnalysis] Error stack:", error instanceof Error ? error.stack : "No stack");
    throw error; // Re-throw to be caught by upload handler
  }
}
