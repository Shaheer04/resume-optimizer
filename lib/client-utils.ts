
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Determine the worker source based on environment
if (typeof window !== "undefined" && "Worker" in window) {
    // Use a CDN for the worker in production/browser to avoid complex bundler setup issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export async function parsePdfInBrowser(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
    }

    return fullText;
}

export async function fetchGithubReposClient(username: string, token?: string): Promise<string> {
    try {
        const headers: HeadersInit = {
            "Accept": "application/vnd.github.v3+json",
        };
        // Use provided token only if available (User input or env var if we choose that route)
        if (token) {
            headers["Authorization"] = `token ${token}`;
        }

        const res = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=10`, { headers });

        if (!res.ok) {
            if (res.status === 404) return ""; // User not found
            if (res.status === 403) console.warn("GitHub rate limit exceeded");
            return "";
        }

        const repos = await res.json();

        // Filter and map relevant info
        const relevantRepos = repos
            .filter((repo: any) => !repo.fork && repo.description) // Only non-forks with descriptions
            .map((repo: any) => ({
                name: repo.name,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                url: repo.html_url
            }))
            .slice(0, 5); // strict limit

        return JSON.stringify(relevantRepos);
    } catch (e) {
        console.error("Client GitHub Fetch Error", e);
        return "";
    }
}
