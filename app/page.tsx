"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Github, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

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
    <main className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white z-0" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Loading Overlay */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Optimizing Resume</h3>
                <p className="text-slate-500 text-sm mt-2">This may take up to a minute...</p>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-600 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 45, ease: "linear" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Analyzing Profile</span>
                  <span>Crafting Resume</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Left Column: Hero Content */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium uppercase tracking-wide">
              <Sparkles className="w-3 h-3 mr-2" />
              AI-Powered Career Assistant
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              Land Your Dream Job with a <span className="text-indigo-600">Tailored Resume</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Stop sending generic resumes. Our AI analyzes the Job Description and your GitHub profile to craft a hyper-personalized, one-page resume that gets you hired.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-green-100 rounded-full"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
              <div>
                <h3 className="font-semibold text-slate-900">ATS Friendly</h3>
                <p className="text-sm text-slate-500">Optimized for automated screening.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-green-100 rounded-full"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
              <div>
                <h3 className="font-semibold text-slate-900">GitHub Integrated</h3>
                <p className="text-sm text-slate-500">Showcase relevant code projects.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Optimization Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 ring-1 ring-slate-200/60 backdrop-blur-sm bg-white/90">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">Start Optimizing</CardTitle>
              <CardDescription>Upload your master resume to begin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="resume" className="font-medium text-slate-700">Resume (PDF)</Label>
                  <div className="group border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg p-4 text-center transition-colors cursor-pointer bg-slate-50 hover:bg-indigo-50/30 relative">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                      {file ? (
                        <>
                          <FileText className="w-6 h-6 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-700 break-all px-2">{file.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          <span className="text-xs text-slate-600">Click to upload or drag & drop</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription" className="font-medium text-slate-700">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the full job description here..."
                    className="min-h-[80px] max-h-[160px] overflow-y-auto resize-none focus-visible:ring-indigo-500 text-sm"
                    value={formData.jobDescription}
                    onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github" className="font-medium text-slate-700 flex justify-between">
                    <span>GitHub Username</span>
                    <span className="text-xs text-slate-400 font-normal">Optional</span>
                  </Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <Input
                      id="github"
                      placeholder="username"
                      className="pl-9 h-9 focus-visible:ring-indigo-500"
                      value={formData.githubUsername}
                      onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
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
        </motion.div>
      </div>
    </main>
  );
}
