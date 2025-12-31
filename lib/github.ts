import { Octokit } from "octokit";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export interface GenericRepo {
    name: string;
    description: string | null;
    language: string | null;
    html_url: string;
    stargazers_count: number;
    updated_at: string | null;
    topics: string[];
}

export async function fetchUserRepos(username: string): Promise<GenericRepo[]> {
    try {
        const response = await octokit.request("GET /users/{username}/repos", {
            username,
            sort: "pushed", // Most recently active first
            direction: "desc",
            per_page: 100, // Fetch up to 100 repos
        });

        // Filter and map to a simpler structure
        const repos = response.data
            .filter((repo) => !repo.fork && repo.description) // Exclude forks and repos without description
            .map((repo) => ({
                name: repo.name,
                description: repo.description,
                language: repo.language || null,
                html_url: repo.html_url,
                stargazers_count: repo.stargazers_count ?? 0,
                updated_at: repo.updated_at ?? null,
                topics: repo.topics ?? [],
            }));

        return repos;
    } catch (error) {
        console.error("Error fetching GitHub repos:", error);
        return [];
    }
}
