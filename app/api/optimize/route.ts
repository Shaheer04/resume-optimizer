import { NextRequest, NextResponse } from "next/server";
import { fetchUserRepos } from "@/lib/github";
import { extractResumeStructure, optimizeResumeSections } from "@/lib/gemini";
import { parsePdfResume } from "@/lib/parser";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File;
        const jobDescription = formData.get("jobDescription") as string;
        const githubUsername = formData.get("githubUsername") as string;

        if (!file || !jobDescription) {
            return NextResponse.json(
                { error: "Resume file and Job Description are required." },
                { status: 400 }
            );
        }

        // 1. Parallelize: Parse Resume & Fetch GitHub Repos (if username provided)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const [resumeText, repos] = await Promise.all([
            parsePdfResume(buffer),
            githubUsername ? fetchUserRepos(githubUsername) : Promise.resolve([])
        ]);

        let githubProjects = "";
        if (repos && repos.length > 0) {
            // Limit to top 5 to reduce token usage and latency
            githubProjects = JSON.stringify(repos.slice(0, 5));
        }

        // 3. Two-Step Optimization
        // Step A: Extract structure (Faithful Copy)
        const currentResume = await extractResumeStructure(resumeText);

        // Step B: Optimize specific sections
        const optimizationResult = await optimizeResumeSections(
            currentResume,
            jobDescription,
            githubProjects
        );

        // 4. Merge Results
        const finalResume = {
            ...currentResume,
            summary: optimizationResult.summary,
            experience: optimizationResult.experience, // Replaced with optimized version
            projects: optimizationResult.projects // Added/Replaced
        };

        return NextResponse.json({
            success: true,
            data: {
                optimizedContent: finalResume,
                matchScore: optimizationResult.matchScore,
                analysis: optimizationResult.analysis
            }
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
