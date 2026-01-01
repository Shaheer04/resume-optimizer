import { NextRequest, NextResponse } from "next/server";
import { fetchUserRepos } from "@/lib/github";
import { processResume } from "@/lib/gemini";
import { parsePdfResume } from "@/lib/parser";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File;
        const jobDescription = formData.get("jobDescription") as string;
        const githubUsername = formData.get("githubUsername") as string;
        const apiKey = formData.get("apiKey") as string | undefined;

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

        // 3. One-Shot Optimization (Performance Fix)
        const result = await processResume(
            resumeText,
            jobDescription,
            githubProjects,
            apiKey
        );

        return NextResponse.json({
            success: true,
            data: result // result already contains optimizedContent, matchScore, and analysis
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
