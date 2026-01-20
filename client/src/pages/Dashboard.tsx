import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BarChart3, TrendingUp, Award, AlertTriangle, Plus, FileText, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: resumes, isLoading } = trpc.resume.list.useQuery();

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
            <Link href="/upload">
              <Button size="sm" variant="outline">
                NEW UPLOAD
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 glow-cyan">DASHBOARD</h1>
          <p className="text-muted-foreground font-mono">
            &gt; YOUR RESUME ANALYSIS AND GLOBAL RANKING
          </p>
        </div>

        {/* Resumes List or Empty State */}
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <Card className="border-glow-cyan mb-8">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Loading resumes...</p>
              </CardContent>
            </Card>
          ) : resumes && resumes.length > 0 ? (
            <div className="space-y-4 mb-8">
              <h2 className="text-2xl font-bold mb-4">Your Resumes</h2>
              {resumes.map((resume) => (
                <Card key={resume.id} className="border-glow-cyan">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {resume.fileName}
                    </CardTitle>
                    <CardDescription>
                      Status: <span className="font-mono">{resume.parsingStatus}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </div>
                      {resume.parsingStatus === "completed" && (
                        <Link href={`/resume/${resume.id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Link href="/upload">
                <Button className="gap-2 w-full">
                  <Plus className="w-4 h-4" />
                  UPLOAD ANOTHER RESUME
                </Button>
              </Link>
            </div>
          ) : (
            <Card className="border-glow-cyan mb-8">
              <CardHeader>
                <CardTitle>NO RESUMES UPLOADED YET</CardTitle>
                <CardDescription>Upload your first resume to begin analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Start by uploading a PDF resume. Our AI system will analyze your qualifications, extract key information, and rank you against thousands of professionals worldwide.
                </p>
                <Link href="/upload">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    UPLOAD RESUME
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-glow-magenta">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  SCORE BREAKDOWN
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Once analyzed, you'll see detailed scores for education, experience, skills, and activities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-glow-cyan">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  GLOBAL RANKING
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  See your percentile ranking and position among all users on the platform.
                </p>
              </CardContent>
            </Card>

            <Card className="border-glow-cyan">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  ANALYTICS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Detailed analysis of your strengths, weaknesses, and areas for improvement.
                </p>
              </CardContent>
            </Card>

            <Card className="border-glow-magenta">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-accent" />
                  BIAS DETECTION
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ethical AI systems flag potential discriminatory factors in your resume.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <Card className="mt-8 bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">[ HOW IT WORKS ]</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-mono text-sm text-primary mb-2">1. UPLOAD</p>
                <p className="text-sm text-muted-foreground">
                  Submit your resume in PDF format. Our system validates and prepares it for analysis.
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-accent mb-2">2. PARSE</p>
                <p className="text-sm text-muted-foreground">
                  Advanced parsing extracts education, experience, skills, and achievements from your resume.
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-primary mb-2">3. ANALYZE</p>
                <p className="text-sm text-muted-foreground">
                  NLP algorithms classify skills, detect experience levels, and evaluate qualifications.
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-accent mb-2">4. RANK</p>
                <p className="text-sm text-muted-foreground">
                  Your resume is scored and ranked globally. Bias detection ensures fair evaluation.
                </p>
              </div>
              <div>
                <p className="font-mono text-sm text-primary mb-2">5. IMPROVE</p>
                <p className="text-sm text-muted-foreground">
                  Receive personalized recommendations to boost your ranking and career prospects.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
