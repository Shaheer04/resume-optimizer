# 🚀 Resume Optimizer

**Resume Optimizer** is an intelligent, full-stack web application designed to help developers tailor their resumes to specific job descriptions. Powered by **Google Gemini AI**, it analyzes your specific background and the job requirements to generate a hyper-focused, one-page resume that highlights your most relevant skills and experience.

## ✨ Key Features

- **📄 AI-Powered Optimization**: Uses Gemini AI to rewrite your Professional Summary and Experience points to align with JD keywords.
- **🐙 GitHub Integration**: Automatically fetches your public GitHub repositories and selects the top 2-3 projects most relevant to the job.
- **🎯 One-Page Focus**: Enforces a strict, concise format to ensure your resume is punchy and impactful (max 1 page).
- **📊 Match Score Analysis**: Provides a 0-100 match score and a detailed breakdown of *why* changes were made.
- **📥 PDF Export**: Generates a clean, ATS-friendly PDF of your tailored resume.
- **🔒 Privacy Focused**: Resumes are processed in memory and results are stored locally in your browser (LocalStorage).

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn UI
- **AI Model**: Google Gemini 2.5 Flash
- **PDF Processing**: `pdf2json` (Parsing) & `jspdf` (Generation)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google [Gemini API Key](https://aistudio.google.com/app/apikey)
- (Optional) A GitHub Personal Access Token

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Shaheer04/resume-optimizer.git
    cd resume-optimizer
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```env
    # Required
    GEMINI_API_KEY=your_gemini_api_key_here

    # Optional (Recommended for higher rate limits)
    GITHUB_TOKEN=your_github_token_here
    ```

4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

5.  **Open the App**:
    Visit `http://localhost:3000` in your browser.

## 📝 Usage

1.  **Upload Resume**: Upload your existing master resume (PDF format).
2.  **Add Job Description**: Paste the job description you are applying for.
3.  **Link GitHub**: Enter your GitHub username to pull in your best projects.
4.  **Optimize**: Click "Generate Tailored Resume" and let the AI do the work.
5.  **Review & Download**: Check your match score, review the specific edits, and download your new PDF.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
