
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeContent } from "./gemini";

// DO NOT Initialize here with global env to prevent static build issues if undefined
// We will initialize in the function call

export async function optimizeResumeClient(
    apiKey: string,
    resumeText: string,
    jobDescription: string,
    githubProjects: string
): Promise<{ data: any; matchScore: number; analysis: any }> {

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ONE-SHOT PROMPT FOR SPEED AND RELIABILITY (Since we are in browser, one HTTP call is safer than two)
    const prompt = `
    You are an expert Resume Optimizer.
    
    **Task**:
    Take the provided **Resume Text** and **Job Description**, and produce a **completely optimized resume JSON** object.
    
    **Inputs**:
    1. **Job Description**: ${jobDescription}
    2. **GitHub Projects** (Insert top 2-3 most relevant if applicable): ${githubProjects}
    3. **Original Resume Text**:
    ${resumeText}

    **Optimization Rules**:
    - **Structure**: Output a standard JSON structure with: fullName, contactInfo, summary, experience, education, skills, certifications, languages, awards, projects.
    - **Layout Constraint**: The output MUST fit on ONE PAGE. Be extremely ruthless with brevity.
    - **Summary**: MUST be concise (max 40 words).
    - **Experience**: limit to top 3-4 most relevant roles. Max 3 bullet points per role. Short, punchy sentences.
    - **Projects**: CRITICAL: Adaptive Quantity.
        - **TOTAL LIMIT**: Output a MAXIMUM of 3 projects total.
        - **Selection**: Select the best 3 from (Original Resume Projects + Provided GitHub Projects). DO NOT just append GitHub projects to the existing list. Merge and Select.
        - If Experience has 3+ roles: Include ONLY the top 1-2 most relevant projects.
        - Format: { "name": "...", "description": "..." }. Max 2 lines description.
    - **Original Data**: PRESERVE dates, schools, degrees, company names exactly. Only OPTIMIZE the descriptive text.
    - **Match Score**: Calculate a relevance score (0-100).
    - **Analysis**: Explain 3 key changes.

    **Output Format**:
    JSON ONLY.
    {
      "optimizedContent": {
        "fullName": "...",
        "contactInfo": "...",
        "summary": "...",
        "experience": [{ "title": "...", "company": "...", "date": "...", "points": ["..."] }],
        "education": [...],
        "skills": [...],
        "certifications": [...],
        "languages": [...],
        "awards": [...],
        "projects": [{ "name": "...", "description": "..." }]
      },
      "matchScore": 85,
      "analysis": [{ "section": "...", "change": "...", "reason": "..." }]
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Clean code fences
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(jsonString);

        // Normalize structure if AI missed a wrapper
        if (!parsed.optimizedContent && parsed.fullName) {
            // AI returned just the content
            return {
                optimizedContent: parsed,
                matchScore: parsed.matchScore || 80,
                analysis: parsed.analysis || []
            };
        }

        return {
            optimizedContent: parsed.optimizedContent,
            matchScore: parsed.matchScore,
            analysis: parsed.analysis
        };

    } catch (e) {
        console.error("Client AI Error", e);
        throw new Error("Failed to optimize resume in browser");
    }
}
