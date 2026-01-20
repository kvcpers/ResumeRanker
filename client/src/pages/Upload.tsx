import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Upload as UploadIcon, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Upload() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-mono mb-4">[ ACCESS DENIED ]</p>
          <p className="text-lg font-bold glow-magenta">AUTHENTICATION REQUIRED</p>
        </div>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setUploadedFile(file);
      } else {
        toast.error("Only PDF files are supported");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setUploadedFile(file);
      } else {
        toast.error("Only PDF files are supported");
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    // Validate file size (max 10MB)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await fetch("/api/upload/resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (data.success) {
        toast.success("Resume uploaded successfully!");
        setUploadedFile(null);
        setIsUploading(false);
        // Redirect to results page with resume ID
        setTimeout(() => {
          navigate(`/resume-results/${data.resumeId}`);
        }, 1000);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload resume";
      toast.error(errorMessage);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="text-2xl font-bold glow-cyan bracket-top-left bracket-top-right">
            ResumeRank
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-mono">
              USER: {user.name || user.email}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 glow-cyan">UPLOAD RESUME</h1>
            <p className="text-muted-foreground font-mono">
              &gt; SUBMIT YOUR RESUME FOR GLOBAL ANALYSIS AND RANKING
            </p>
          </div>

          {/* Upload Area */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Resume File</CardTitle>
              <CardDescription>Upload a PDF resume for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-sm p-12 text-center transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {uploadedFile ? (
                  <div>
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="font-mono text-lg mb-2">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                      disabled={isUploading}
                    >
                      CHANGE FILE
                    </Button>
                  </div>
                ) : (
                  <div>
                    <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-mono mb-2">
                      DRAG & DROP YOUR RESUME HERE
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      OR
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      SELECT FILE
                    </Button>
                  </div>
                )}
              </div>

              {/* File Requirements */}
              <div className="mt-6 p-4 bg-card border border-border rounded-sm">
                <p className="font-mono text-sm text-muted-foreground mb-2">
                  [ FILE REQUIREMENTS ]
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 font-mono">
                  <li>• Format: PDF only</li>
                  <li>• Maximum size: 10 MB</li>
                  <li>• Minimum content: 100 characters</li>
                  <li>• Supported: Standard resume layouts</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Upload Button */}
          {uploadedFile && (
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4" />
                    SUBMIT FOR ANALYSIS
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Information Section */}
          <Card className="mt-8 border-glow-cyan">
            <CardHeader>
              <CardTitle className="text-primary">WHAT HAPPENS NEXT?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-mono text-sm text-primary mb-2">[ 1. PARSING ]</p>
                <p className="text-sm text-muted-foreground">
                  Your resume is extracted and parsed to identify key information including education, experience, skills, and activities.
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-accent mb-2">[ 2. NLP ANALYSIS ]</p>
                <p className="text-sm text-muted-foreground">
                  Advanced natural language processing extracts and classifies skills, detects experience levels, and identifies achievements.
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-primary mb-2">[ 3. RANKING ]</p>
                <p className="text-sm text-muted-foreground">
                  Your resume is scored against multiple factors and ranked globally. Bias detection ensures fair evaluation.
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-accent mb-2">[ 4. RECOMMENDATIONS ]</p>
                <p className="text-sm text-muted-foreground">
                  Receive personalized improvement suggestions and career advice based on your analysis results.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bias Detection Info */}
          <div className="mt-8 p-4 bg-card border border-border border-glow-magenta rounded-sm">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-sm mb-2 text-accent">[ ETHICAL AI NOTICE ]</p>
                <p className="text-sm text-muted-foreground">
                  This system includes bias detection and mitigation. We analyze your resume for potential discriminatory factors and flag them for transparency. Your data is processed securely and never shared without consent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
