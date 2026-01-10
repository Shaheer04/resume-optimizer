export interface ValidationError {
    field: string;
    issue: string;
}

export function validateResumeStructure(data: any, originalText: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // 1. Check Required Sections
    const requiredSections = [
        "fullName", "contactInfo", "summary",
        "experience", "education", "skills",
        "projects", "certifications"
    ];

    if (!data || typeof data !== 'object') {
        return [{ field: "root", issue: "Output is not a valid JSON object" }];
    }

    if (!data.optimizedContent) {
        // Handle case where AI returns flat object
        if (requiredSections.every(k => k in data)) {
            // It's flat, which we handle in client-gemini, so technically not an error for the content itself,
            // but strictly speaking we expect optimizedContent wrapper. 
            // logic in client-gemini handles this normalization BEFORE validation usually?
            // Let's assume data PASSED into this is the "content" object (the inner part).
            // If the caller passes the whole envelope, we need to adjust.
            // DESIGN DECISION: Caller should pass the CONTENT object.
        } else {
            return [{ field: "root", issue: "Missing 'optimizedContent' wrapper" }];
        }
    }

    // Assume we are validating the content object itself or we extract it
    const content = data.optimizedContent || data;

    requiredSections.forEach(section => {
        if (!(section in content)) {
            errors.push({ field: section, issue: `Missing required section: ${section}` });
        }
    });

    // 2. Skills Count (Min 5)
    if (Array.isArray(content.skills)) {
        if (content.skills.length < 5) {
            errors.push({ field: "skills", issue: `Too few skills (${content.skills.length}). Extract at least 5 relevant skills.` });
        }
    } else {
        errors.push({ field: "skills", issue: "Skills must be an array" });
    }

    // 3. Projects Presence
    if (Array.isArray(content.projects)) {
        if (content.projects.length === 0) {
            // It's possible to have 0 projects if none exist, but prompt asks to use GitHub ones.
            // We'll warn if empty.
            errors.push({ field: "projects", issue: "Projects array is empty. Populate with at least 1 project." });
        }
    }

    // 4. Experience Dates
    if (Array.isArray(content.experience)) {
        content.experience.forEach((exp: any, index: number) => {
            if (!exp.date) {
                errors.push({ field: `experience[${index}]`, issue: "Missing date field" });
            }
        });
    }

    // 5. GPA Check
    const gpaRegex = /\b(gpa|cgpa)\s*:?\s*(\d+\.?\d*)/i;
    const originalHasGPA = gpaRegex.test(originalText);

    if (originalHasGPA && Array.isArray(content.education)) {
        const hasExtractedGPA = content.education.some((edu: any) => edu.gpa && edu.gpa !== "null");
        if (!hasExtractedGPA) {
            errors.push({ field: "education", issue: "Original resume contains GPA but it was not extracted." });
        }
    }

    return errors;
}

export function generateCorrectionPrompt(data: any, errors: ValidationError[], originalText: string): string {
    return `
    **SYSTEM ALERT: VALIDATION FAILED**
    
    Your previous JSON output had errors. You must correct them immediately.
    
    **Errors Found**:
    ${errors.map(e => `- [${e.field}]: ${e.issue}`).join('\n')}
    
    **Instructions**:
    1. Fix ONLY the errors listed above.
    2. Keep the rest of the data intact.
    3. Return the COMPLETE valid JSON object again.
    
    **Original Resume Text (For Reference)**:
    ${originalText.slice(0, 1000)}... (truncated)

    ${JSON.stringify(data)}
    `;
}

export function estimateLineCount(data: any): number {
    const content = data.optimizedContent || data;
    let lines = 0;

    // Header: ~3 lines
    lines += 3;

    // Summary: word_count / 15 lines
    if (content.summary) {
        const words = content.summary.split(/\s+/).length;
        lines += Math.ceil(words / 15);
    }

    // Skills: skill_count / 6 lines
    if (Array.isArray(content.skills)) {
        lines += Math.ceil(content.skills.length / 6);
    }

    // Experience: position_count * 2 + total_bullets * 1.5 lines
    if (Array.isArray(content.experience)) {
        lines += content.experience.length * 2; // Title/Company/Date line
        content.experience.forEach((exp: any) => {
            if (Array.isArray(exp.points)) {
                lines += exp.points.length * 1.5;
            }
        });
    }

    // Projects: project_count * 2 lines
    if (Array.isArray(content.projects)) {
        lines += content.projects.length * 2;
    }

    // Education: edu_count * 2 lines
    if (Array.isArray(content.education)) {
        lines += content.education.length * 2;
    }

    // Certifications: cert_count / 2 lines
    if (Array.isArray(content.certifications)) {
        lines += Math.ceil(content.certifications.length / 2);
    }

    // Section Headers: ~6 lines
    lines += 6;

    return lines;
}
