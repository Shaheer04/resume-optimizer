import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  }[];
  skills?: string[];
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

export async function extractResumeStructure(resumeText: string): Promise<ResumeContent> {
  const prompt = `
    You are a precise Data Extractor. Your task is to convert the following Resume Text into a structured JSON object.
    
    **Resume Text**:
    ${resumeText}

    **Instructions**:
    - Extract ALL fields exactly as they appear. Do not summarize or rewrite.
    - If a section (like Certifications, Languages, Awards) exists, include it.
    - For lists (Skills, Certs, Languages), return array of strings.
    - For Education, extract degree, school, and date.
    
    **Output Format**:
    Return only valid JSON:
    {
        "fullName": "...",
        "contactInfo": "...",
        "summary": "...",
        "experience": [ { "title": "...", "company": "...", "date": "...", "points": ["..."] } ],
        "education": [ { "degree": "...", "school": "...", "date": "..." } ],
        "skills": [ ... ],
        "certifications": [ ... ],
        "languages": [ ... ],
        "awards": [ ... ],
        "projects": [ ... ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString) as ResumeContent;
  } catch (e) {
    console.error("Extraction Error", e);
    throw new Error("Failed to extract resume structure");
  }
}

export async function optimizeResumeSections(
  currentResume: ResumeContent,
  jobDescription: string,
  githubProjects: string
): Promise<{
  summary: string;
  experience: any[];
  projects: any[];
  matchScore: number;
  analysis: any[]
}> {
  const prompt = `
    You are an expert Resume Optimizer.
    
    **Job Description**: ${jobDescription}
    **Current Resume JSON**: ${JSON.stringify(currentResume)}
    **GitHub Projects**: ${githubProjects}

    **Task**:
    1. **Summary**: Rewrite the professional summary to be **extremely concise** (Max 40 words). Focus only on the most relevant value proposition for this specific JD.
    2. **Experience**: Rewrite the bullet points for the top 3 most relevant roles to match JD keywords. Keep it concise.
    3. **Projects**: Select the top 2-3 GitHub projects relevant to the JD.

    **Output**:
    JSON ONLY:
    {
        "summary": "...",
        "experience": [ ... ],
        "projects": [ { "name": "Project Name", "description": "Description..." } ],
        "matchScore": 85,
        "analysis": [ { "section": "...", "change": "...", "reason": "..." } ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Optimization Error", e);
    throw new Error("Failed to optimize sections");
  }
}
