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
    You are an expert Resume Optimizer and Parser.
    
    **Task**: 
    1. Parse the provided **Resume Text** into a structured JSON.
    2. SIMULTANEOUSLY optimize the content based on the **Job Description** and **GitHub Projects**.
    
    **Inputs**:
    - **Resume Text**: ${resumeText}
    - **Job Description**: ${jobDescription}
    - **GitHub Projects**: ${githubProjects}

    **Optimization Rules**:
    1. **Summary**: Rewrite to be extremely concise (Max 40 words), tailored to the JD.
    2. **Experience**: 
       - KEEP ALL ROLES. 
       - Rewrite bullet points per role to match JD keywords. 
       - **CRITICAL**: You MUST return the 'points' array for each role. Do not omit the description.
    3. **Projects**: Integrate 2-3 relevant GitHub projects into the Projects section.
    4. **Skills**: Extract all technical and soft skills. DO NOT SKIP THIS SECTION.
    5. **Education**: Extract degree, school, date, AND **CGPA/Score** if present.
    
    **Output Format**:
    Return a single valid JSON object with this structure:
    {
      "optimizedContent": {
        "fullName": "...",
        "contactInfo": "...",
        "summary": "...",
        "experience": [ 
          { 
            "title": "...", 
            "company": "...", 
            "date": "...", 
            "points": ["Optimization point 1", "Optimization point 2"] // MUST include this
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
        "skills": ["Skill 1", "Skill 2", ...], // MUST include this
        "projects": [ ... ],
        ... (other sections like certifications, languages)
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
