import { GoogleGenerativeAI } from "@google/generative-ai";

const getModel = (apiKey?: string) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Gemini API Key is missing");
  }
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

export interface ResumeContent {
  fullName?: string;
  contactInfo?: string;
  summary?: string;
  experience?: {
    title: string;
    date: string;
    company: string;
    points: string[];
  }[];
  projects?: {
    name: string;
    description: string;
  }[];
  education?: {
    degree: string;
    school: string;
    date: string;
    score?: string; // Added CGPA/Score
  }[];
  skills?: string[]; // Made explicit that this is array of strings
  certifications?: string[];
  languages?: string[];
  awards?: string[];
  [key: string]: unknown;
}

export interface OptimizationResult {
  optimizedContent: ResumeContent;
  matchScore: number;
  analysis: {
    section: string;
    change: string;
    reason: string;
  }[];
}

export async function processResume(
  resumeText: string,
  jobDescription: string,
  githubProjects: string,
  apiKey?: string
): Promise<{
  optimizedContent: ResumeContent;
  matchScore: number;
  analysis: { section: string; change: string; reason: string }[];
}> {
  const model = getModel(apiKey);
  const prompt = `
    You are an expert Resume Optimizer and Parser with a specialty in creating ATS-friendly, one-page resumes.
    
    **Task**: 
    1. Parse the provided **Resume Text** into a structured JSON.
    2. SIMULTANEOUSLY optimize the content based on the **Job Description** and **GitHub Projects**.
    3. **CRITICAL**: Ensure the final resume fits on ONE PAGE when rendered as PDF.
    
    **Inputs**:
    - **Resume Text**: ${resumeText}
    - **Job Description**: ${jobDescription}
    - **GitHub Projects**: ${githubProjects}

    **ONE-PAGE CONSTRAINT - CRITICAL RULES**:
    ⚠️ **NEVER drop entire sections to save space**. Instead, use these strategies:
    1. **Projects**: Limit to 1-2 MOST RELEVANT projects only (not 2-3). Each project description should be 1-2 concise sentences.
    2. **Experience Points**: Limit to 2-3 bullet points per role (prioritize JD-relevant achievements).
    3. **Skills**: Keep all skills but format as comma-separated list (not bullets).
    4. **Certifications/Awards**: If space is tight, limit to top 2-3 most relevant.
    5. **Summary**: Strict 40-word maximum.
    
    **MANDATORY SECTIONS** (Never omit these):
    - Professional Summary
    - Experience (all roles, but condensed points)
    - Education (with CGPA if present)
    - Skills (ALWAYS include this section)
    - Projects (1-2 entries minimum)

    **Optimization Rules**:
    1. **Summary**: Rewrite to be extremely concise (Max 40 words), tailored to the JD.
    2. **Experience**: 
       - KEEP ALL ROLES in their ORIGINAL CHRONOLOGICAL ORDER (do not reorder).
       - Limit to 2-3 most impactful bullet points per role that match JD keywords.
       - **CRITICAL**: You MUST return the 'points' array for each role. Do not omit descriptions.
    3. **Projects**: 
       - Select 1-2 MOST RELEVANT projects (from resume + GitHub).
       - Each description: 1-2 sentences maximum, highlighting tech stack and impact.
       - Prioritize projects that align with JD requirements.
    4. **Skills**: 
       - Extract ALL technical and soft skills from resume.
       - **NEVER SKIP THIS SECTION** - it's critical for ATS.
       - Format as array for comma-separated display.
    5. **Education**: 
       - Extract degree, school, date, AND **CGPA/Score** if present.
       - Keep concise (one entry per degree).
    6. **Certifications/Awards**: 
       - Include if present, but limit to 2-3 most relevant if space is tight.
    
    **Output Format**:
    Return a single valid JSON object with this structure:
    {
      "optimizedContent": {
        "fullName": "...",
        "contactInfo": "...",
        "summary": "... (max 40 words)",
        "experience": [ 
          { 
            "title": "...", 
            "company": "...", 
            "date": "...", 
            "points": ["Impact point 1", "Impact point 2"] // 2-3 points max per role
          } 
        ],
        "education": [ 
          { 
            "degree": "...", 
            "school": "...", 
            "date": "...",
            "score": "3.8/4.0" // Include if present
          } 
        ],
        "skills": ["Skill 1", "Skill 2", ...], // ALL skills, NEVER omit this section
        "projects": [ 
          {
            "name": "Project Name",
            "description": "1-2 sentence description with tech stack and impact"
          }
        ], // 1-2 projects only
        "certifications": ["Cert 1", "Cert 2"], // Optional, 2-3 max if present
        "awards": ["Award 1", "Award 2"] // Optional, 2-3 max if present
      },
      "matchScore": 85, // 0-100 score based on JD match
      "analysis": [ 
        { "section": "Summary", "change": "Focused on React...", "reason": "JD requires React expert" } 
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Processing Error", e);
    throw new Error("Failed to process resume");
  }
}
