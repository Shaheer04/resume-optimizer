
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeContent } from "./gemini";
import { validateResumeStructure, generateCorrectionPrompt, estimateLineCount } from "./validation";

// DO NOT Initialize here with global env to prevent static build issues if undefined
// We will initialize in the function call

export async function optimizeResumeClient(
    apiKey: string,
    resumeText: string,
    jobDescription: string,
    githubProjects: string
): Promise<{ optimizedContent: any; matchScore: number; analysis: any }> {

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const hasGithub = githubProjects && githubProjects.trim().length > 0;

    // ONE-SHOT PROMPT FOR SPEED AND RELIABILITY (Since we are in browser, one HTTP call is safer than two)
    const prompt = `
    You are an expert Resume Optimizer.
    
    **Strict System Instruction**:
    You must output **ONLY** a valid JSON object.
    Do NOT include any markdown formatting, code blocks, or backticks.
    Do NOT include any text before or after the JSON.
    
    **Task**:
    Take the provided **Resume Text** and **Job Description**, and produce a **completely optimized resume JSON** object.
    
    **Inputs**:
    1. **Job Description**: ${jobDescription}
    2. **GitHub Projects**: ${hasGithub ? `(Insert top 2-3 most relevant if applicable): ${githubProjects}` : "(Not Provided)"}
    3. **Original Resume Text**:
    ${resumeText}

    **Schema & Constraints**:
    You MUST populate ALL of the following 8 sections. If a section has no data, use an empty array [] or empty string "".
    
    1. **fullName**: (String) Candidate's full name.
    2. **contactInfo**: (String) Phone | Email | LinkedIn | Location.
    3. **summary**: (String) concise professional summary (max 40 words).
    4. **experience**: (Array) Work history. 
       - Limit to top 3-4 most relevant roles.
       - Each role MUST have: "title", "company", "date" (Format: "MM/YYYY - MM/YYYY" or "Present"), "points" (Array of strings, max 3 bullet points).
    5. **education**: (Array) 
       - Must include "degree", "school", "date", "gpa" (String, extract if present, else null).
    6. **skills**: (Array of Strings) 
       - CRITICAL: Extract ALL relevant technical and soft skills.
       - MINIMUM 10 items.
    7. **projects**: (Array) 
       ${hasGithub ? `- TOTAL LIMIT: Max 3 projects. 
       - Selection: best 3 from (Original Projects + GitHub Projects).
       - Format: { "name": "...", "description": "..." } (Max 2 lines description).` : `- RETURN AN EMPTY ARRAY []. Do NOT include any projects.`}
    8. **certifications**: (Array of Strings) 
       - List valid certifications if available, otherwise empty array.
    
    **Optimization Rules**:
    - **Layout Constraint**: The output content must fit on ONE PAGE. Be concise.
    - **Original Data**: PRESERVE dates, schools, degrees, company names exactly.
    - **Match Score**: Calculate a relevance score (0-100).
    - **Analysis**: Explain 3 key changes.
    
    **Content Strategy (Layer 2)**:
    1. **Dynamic Section Budgeting**:
       - **Senior Roles (5+ years exp)**: Prioritize DEPTH over breadth. 
          - Max 3 roles. 
          - limit to 2-3 significant bullets per role.
          ${hasGithub ? "- Projects: Limit to 1-2 highly relevant ones." : ""}
       - **Entry/Mid Roles**: 
          - Max 4 roles.
          - Up to 4 short bullets per role.
          ${hasGithub ? "- Projects: Include 2-3 relevant projects." : ""}
    2. **Content Density**:
       - Summary: 2-3 lines max (40-60 words).
       - Experience Bullets: 1 line each (12-15 words).
       ${hasGithub ? "- Project Descriptions: 1 line each." : ""}
       - Skills: 10-12 items (fit in 2 lines).
       - Education: Concise format.
       - Certifications: 2-4 items max. If JD mentions specific certs, prioritize them HIGHLY.

    **Example Output JSON**:
    {
      "optimizedContent": {
        "fullName": "Names",
        "contactInfo": "Contact",
        "summary": "Summary...",
        "experience": [{ "title": "...", "company": "...", "date": "01/2020 - Present", "points": ["..."] }],
        "education": [{ "degree": "...", "school": "...", "date": "...", "gpa": "3.8/4.0" }],
        "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6", "Skill7", "Skill8", "Skill9", "Skill10"],
        "certifications": [],
        "languages": [],
        "awards": [],
        "projects": [${hasGithub ? '{ "name": "...", "description": "..." }' : ""}]
      },
      "matchScore": 85,
      "analysis": [{ "section": "...", "change": "...", "reason": "..." }]
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();

        // Cleanup Markdown if present (often models return ```json ... ``` despite instructions)
        text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();

        // Strict JSON parsing as requested
        let parsed = JSON.parse(text);

        // --- VALIDATION LAYER ---
        const errors = validateResumeStructure(parsed, resumeText);

        if (errors.length > 0) {
            console.warn("Resume Validation Failed - Attempting Correction", errors);

            // Generate correction prompt
            const correctionPrompt = generateCorrectionPrompt(parsed, errors, resumeText);

            try {
                // Second call to fix specific errors
                const correctionResult = await model.generateContent(correctionPrompt);
                const correctionText = correctionResult.response.text().replace(/^```json\s*/, "").replace(/```$/, "").trim();
                const correctionParsed = JSON.parse(correctionText);

                // If correction parses successfully, use it
                parsed = correctionParsed;
                console.log("Resume Correction Successful");
            } catch (correctionError) {
                console.error("Resume Correction Failed", correctionError);
                // Fallback: Proceed with original parsed data (better than crashing)
            }
        }

        // --- LAYER 3: PAGE FITTING & CONDENSING ---
        const estimatedLines = estimateLineCount(parsed);
        if (estimatedLines > 50) {
            console.warn(`Resume too long (~${estimatedLines} lines). Triggering Condensing Pass.`);

            const condensingPrompt = `
             **STRICT SYSTEM INSTRUCTION**:
             You must output **ONLY** a valid JSON object. No markdown.
             
             **Task**:
             The following resume JSON is TOO LONG to fit on one page.
             You must **CONDENSE** it to strictly fit on one page (approx 45-50 lines).
             
             **Rules**:
             1. **Keep ALL Sections**: Do not remove sections completely.
             2. **Shorten Bullets**: Rewrite bullets to be shorter (1 line max).
             3. **Select Best Items**: If experience has >4 roles, keep top 3. If projects >3, keep top 2.
             4. **Structure**: Return the EXACT same JSON structure.
             
             **Input JSON**:
             ${JSON.stringify(parsed)}
             `;

            try {
                const condensingResult = await model.generateContent(condensingPrompt);
                const condensedText = condensingResult.response.text().replace(/^```json\s*/, "").replace(/```$/, "").trim();
                const condensedParsed = JSON.parse(condensedText);

                // If consistent, blindly swap.
                // We could re-validate here, but let's assume if it returns valid JSON it's okay for now
                // or ideally run validateResumeStructure again.
                const reValidation = validateResumeStructure(condensedParsed, resumeText);
                if (reValidation.length === 0) {
                    parsed = condensedParsed;
                    console.log("Condensing Pass Successful");
                } else {
                    console.warn("Condensing Pass produced invalid structure. Reverting.", reValidation);
                }
            } catch (condenseError) {
                console.error("Condensing Pass Failed", condenseError);
                // Fallback to original long version
            }
        }
        // ------------------------------------------

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
