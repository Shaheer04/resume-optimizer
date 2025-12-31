"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Github, Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobDescription: "",
    githubUsername: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.jobDescription) return;

    setLoading(true);

    try {
      const data = new FormData();
      data.append("resume", file);
      data.append("jobDescription", formData.jobDescription);
      data.append("githubUsername", formData.githubUsername);

      const res = await fetch("/api/optimize", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Optimization failed");

      const result = await res.json();

      // Store result in localStorage for simplicity to pass to dashboard
      localStorage.setItem("optimizedResume", JSON.stringify(result.data));
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please check your API keys and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900">
            AI Resume Optimizer
          </h1>
          <p className="text-lg text-slate-600">
            Tailor your resume to any job description in seconds using Gemini AI and your GitHub portfolio.
          </p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle>Start Optimization</CardTitle>
            <CardDescription>Upload your details to generate a perfectly matched resume.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="resume">Upload Resume (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                    className="cursor-pointer"
                  />
                  <Upload className="w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description here..."
                  className="min-h-[150px]"
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub Username (Optional)</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input
                    id="github"
                    placeholder="e.g. shaheer-dev"
                    className="pl-9"
                    value={formData.githubUsername}
                    onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Tailored Resume
                  </>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
