"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { OptimizationResult, ResumeContent } from "@/lib/gemini";

export default function Dashboard() {
    const [data, setData] = useState<OptimizationResult | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("optimizedResume");
        if (stored) {
            setTimeout(() => {
                setData(JSON.parse(stored));
            }, 0);
        }
    }, []);

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>No data found. Please go back and submit a request.</p>
                <Link href="/" className="ml-4 underline text-blue-600">Go Home</Link>
            </div>
        );
    }

    const { optimizedContent, matchScore, analysis } = data;

    const handleDownloadPDF = () => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: "letter"
        });

        // Fonts & Config (COMPACT MODE)
        const MARGIN = 30; // Reduced from 40
        const PAGE_WIDTH = doc.internal.pageSize.getWidth();
        const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
        let cursorY = 40; // Start higher
        const lineHeight = 12; // Reduced from 14

        // Helper: Add Section Header
        const addSectionHeader = (title: string) => {
            if (cursorY + 25 > doc.internal.pageSize.getHeight()) {
                doc.addPage();
                cursorY = 40;
            }
            cursorY += 4;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10); // Reduced from 11
            doc.setTextColor(50, 50, 150); // Indigo-ish
            doc.text(title.toUpperCase(), MARGIN, cursorY);
            cursorY += 5;
            doc.setDrawColor(200, 200, 200);
            doc.line(MARGIN, cursorY, MARGIN + CONTENT_WIDTH, cursorY);
            cursorY += 12; // Reduced spacing
            doc.setTextColor(0, 0, 0); // Reset
            doc.setFont("helvetica", "normal");
        };

        // Helper: Add Text wrapped
        const addText = (text: string, fontSize = 9, isBold = false) => { // Default font reduced to 9
            doc.setFont("helvetica", isBold ? "bold" : "normal");
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, CONTENT_WIDTH);

            if (cursorY + (lines.length * lineHeight) > doc.internal.pageSize.getHeight()) {
                doc.addPage();
                cursorY = 40;
            }

            doc.text(lines, MARGIN, cursorY);
            cursorY += (lines.length * lineHeight);
        };

        // Name & Contact
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18); // Reduced from 22
        doc.text(optimizedContent.fullName || "Resume", PAGE_WIDTH / 2, cursorY, { align: "center" });
        cursorY += 16;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9); // Reduced from 10
        doc.setTextColor(80, 80, 80);
        const contact = optimizedContent.contactInfo || "";
        doc.text(contact, PAGE_WIDTH / 2, cursorY, { align: "center" });
        cursorY += 20; // Reduced from 30
        doc.setTextColor(0, 0, 0);

        // Summary
        if (optimizedContent.summary) {
            addSectionHeader("Professional Summary");
            addText(optimizedContent.summary);
            cursorY += 8; // Reduced spacing
        }

        // Experience
        if (optimizedContent.experience && optimizedContent.experience.length > 0) {
            addSectionHeader("Professional Experience");
            optimizedContent.experience.forEach((exp) => {
                // Check page break for block start
                if (cursorY + 35 > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    cursorY = 40;
                }

                // Title & Date
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10); // Reduced from 11
                doc.text(exp.title, MARGIN, cursorY);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text(exp.date, PAGE_WIDTH - MARGIN, cursorY, { align: "right" });
                cursorY += 12;

                // Company
                doc.setFont("helvetica", "italic"); // Italic for company
                doc.setFontSize(9); // Reduced from 10
                doc.text(exp.company, MARGIN, cursorY);
                cursorY += 12;

                // Points using circles for bullets
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9); // Reduced from 10
                if (exp.points) {
                    exp.points.forEach(pt => {
                        const bullet = "•";
                        const lines = doc.splitTextToSize(`${bullet}  ${pt}`, CONTENT_WIDTH - 10);

                        // Check page break for bullet
                        if (cursorY + (lines.length * 11) > doc.internal.pageSize.getHeight()) {
                            doc.addPage();
                            cursorY = 40;
                        }

                        doc.text(lines, MARGIN + 5, cursorY);
                        cursorY += (lines.length * 11); // Tighter line spacing
                    });
                }
                cursorY += 6; // Reduced spacing between jobs
            });
        }

        // Projects (MOVED ABOVE EDUCATION AS REQUESTED)
        if (optimizedContent.projects && optimizedContent.projects.length > 0) {
            addSectionHeader("Relevant Projects");
            optimizedContent.projects.forEach((proj) => {
                if (cursorY + 25 > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    cursorY = 40;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(9.5); // Slightly larger than body
                doc.text(proj.name, MARGIN, cursorY);
                cursorY += 10;

                addText(proj.description, 9);
                cursorY += 6;
            });
            cursorY += 4;
        }

        // Education
        if (optimizedContent.education && optimizedContent.education.length > 0) {
            addSectionHeader("Education");
            optimizedContent.education.forEach((edu) => {
                if (cursorY + 25 > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    cursorY = 40;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(edu.school, MARGIN, cursorY);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text(edu.date, PAGE_WIDTH - MARGIN, cursorY, { align: "right" });
                cursorY += 11;

                doc.setFont("helvetica", "italic");
                doc.setFontSize(9);
                // Combine degree and CGPA
                const degreeLine = edu.score ? `${edu.degree} — CGPA: ${edu.score}` : edu.degree;
                doc.text(degreeLine, MARGIN, cursorY);
                cursorY += 14; // Reduced spacing
            });
            cursorY += 4;
        }

        // Skills
        if (optimizedContent.skills && optimizedContent.skills.length > 0) {
            addSectionHeader("Skills");
            addText(optimizedContent.skills.join(" • "), 9);
            cursorY += 12;
        }

        // Certifications
        if (optimizedContent.certifications && optimizedContent.certifications.length > 0) {
            addSectionHeader("Certifications");
            optimizedContent.certifications.forEach(cert => {
                // Check page break
                if (cursorY + 11 > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    cursorY = 40;
                }
                doc.setFontSize(9);
                doc.text(`• ${cert}`, MARGIN + 5, cursorY);
                cursorY += 11;
            });
            cursorY += 8;
        }

        // Awards
        if (optimizedContent.awards && optimizedContent.awards.length > 0) {
            addSectionHeader("Honors & Awards");
            optimizedContent.awards.forEach(awr => {
                if (cursorY + 11 > doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    cursorY = 40;
                }
                doc.setFontSize(9);
                doc.text(`• ${awr}`, MARGIN + 5, cursorY);
                cursorY += 11;
            });
        }

        doc.save(`${optimizedContent.fullName || "resume"}_optimized.pdf`);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col gap-6">
            <header className="flex items-center justify-between max-w-7xl mx-auto w-full">
                <Link href="/">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Optimization Result</h1>
                <Button onClick={handleDownloadPDF} variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full flex-1">

                {/* Left Column: Match Score & Analysis */}
                <aside className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Match Score</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center">
                            <div className="text-6xl font-black text-indigo-600">
                                {matchScore}%
                            </div>
                            <p className="text-sm text-slate-500 mt-2">Relevance to Job Description</p>
                        </CardContent>
                    </Card>

                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>AI Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px] w-full pr-4">
                                <ul className="space-y-4">
                                    {analysis && analysis.map((item, idx) => (
                                        <li key={idx} className="bg-slate-100 p-3 rounded-md text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary">{item.section}</Badge>
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                            </div>
                                            <p className="font-semibold text-slate-800">{item.change}</p>
                                            <p className="text-slate-600 text-xs mt-1">{item.reason}</p>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </aside>

                {/* Right Column: Resume Preview */}
                <main className="lg:col-span-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Tailored Resume Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 bg-white border border-slate-200 m-6 p-8 shadow-sm text-slate-800 rounded-sm font-serif min-h-[800px]">
                            {/* Visual Resume Rendering */}
                            <div className="text-center border-b pb-4 mb-4">
                                <h1 className="text-3xl font-bold uppercase tracking-wide">{optimizedContent.fullName}</h1>
                                <p className="text-sm text-slate-600 mt-1">{optimizedContent.contactInfo}</p>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-sm font-bold uppercase text-indigo-800 border-b border-indigo-200 mb-2 pb-1">Professional Summary</h2>
                                <p className="text-sm leading-relaxed">{optimizedContent.summary}</p>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-sm font-bold uppercase text-indigo-800 border-b border-indigo-200 mb-2 pb-1">Experience</h2>
                                <div className="space-y-4">
                                    {optimizedContent.experience && optimizedContent.experience.map((exp, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-bold text-sm">{exp.title}</h3>
                                                <span className="text-xs text-slate-500">{exp.date}</span>
                                            </div>
                                            <p className="text-xs font-semibold italic mb-1">{exp.company}</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1">
                                                {exp.points && exp.points.map((pt, j) => (
                                                    <li key={j} className="text-sm">{pt}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PROJECTS MOVED HERE (ABOVE EDUCATION) */}
                            {optimizedContent.projects && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-bold uppercase text-indigo-800 border-b border-indigo-200 mb-2 pb-1">Relevant Projects</h2>
                                    <div className="space-y-3">
                                        {optimizedContent.projects.map((proj, k) => (
                                            <div key={k}>
                                                <h3 className="font-bold text-sm">{proj.name}</h3>
                                                <p className="text-sm">{proj.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {optimizedContent.education && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-bold uppercase text-indigo-800 border-b border-indigo-200 mb-2 pb-1">Education</h2>
                                    <div className="space-y-2">
                                        {optimizedContent.education.map((edu, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between items-baseline">
                                                    <h3 className="font-bold text-sm">{edu.school}</h3>
                                                    <span className="text-xs text-slate-500">{edu.date}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <p className="text-xs italic">{edu.degree}</p>
                                                    {edu.score && <span className="text-xs font-semibold text-slate-600">CGPA: {edu.score}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {optimizedContent.skills && optimizedContent.skills.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-bold uppercase text-indigo-800 border-b border-indigo-200 mb-2 pb-1">Skills</h2>
                                    <div className="flex flex-wrap gap-2 text-sm leading-relaxed">
                                        {optimizedContent.skills.join(" • ")}
                                    </div>
                                </div>
                            )}

                            {optimizedContent.certifications && optimizedContent.certifications.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-bold uppercase text-indigo-800 border-b border-indigo-200 mb-2 pb-1">Certifications</h2>
                                    <ul className="list-disc list-outside ml-4 space-y-1">
                                        {optimizedContent.certifications.map((cert, cx) => (
                                            <li key={cx} className="text-sm">{cert}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {optimizedContent.awards && optimizedContent.awards.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-bold uppercase text-indigo-800 border-b border-indigo-200 mb-2 pb-1">Honors & Awards</h2>
                                    <ul className="list-disc list-outside ml-4 space-y-1">
                                        {optimizedContent.awards.map((awr, ax) => (
                                            <li key={ax} className="text-sm">{awr}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};
