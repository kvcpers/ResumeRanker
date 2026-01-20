import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  BarChart3,
  Target,
  Lightbulb
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function ResumeResults() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [showRanking, setShowRanking] = useState(false);
  
  // Extract resumeId from URL: /resume-results/:resumeId
  const match = location.match(/\/resume-results\/(\d+)/);
  const resumeId = match ? parseInt(match[1], 10) : null;

  const { data: resume, isLoading: resumeLoading } = trpc.resume.getById.useQuery(
    { resumeId: resumeId! },
    { enabled: !!resumeId }
  );

  const { data: score } = trpc.resume.getScore.useQuery(
    { resumeId: resumeId! },
    { enabled: !!resumeId }
  );

  // Mock recommendations - in production, these would come from AI analysis
  const recommendations = [
    {
      type: "skill_gap",
      title: "Add More Technical Skills",
      description: "Consider adding programming languages like Python, JavaScript, or cloud technologies (AWS, Azure) to increase your technical score.",
      priority: "high",
      impact: "+15%"
    },
    {
      type: "experience",
      title: "Quantify Your Achievements",
      description: "Add specific metrics and numbers to your work experience. For example: 'Increased sales by 30%' or 'Managed team of 10 people'.",
      priority: "high",
      impact: "+12%"
    },
    {
      type: "education",
      title: "Highlight Relevant Certifications",
      description: "If you have professional certifications, make sure they're prominently displayed. Consider adding industry-specific certifications.",
      priority: "medium",
      impact: "+8%"
    },
    {
      type: "activity",
      title: "Include Leadership Experience",
      description: "Add any volunteer work, side projects, or leadership roles. These demonstrate soft skills and initiative.",
      priority: "medium",
      impact: "+6%"
    },
    {
      type: "career_advice",
      title: "Optimize Keywords",
      description: "Review job descriptions in your field and ensure your resume includes relevant keywords. This helps with ATS (Applicant Tracking Systems).",
      priority: "low",
      impact: "+5%"
    }
  ];

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

  if (resumeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-2 border-primary border-t-accent rounded-full"></div>
          </div>
          <p className="text-muted-foreground font-mono">[ ANALYZING RESUME ]</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-mono mb-4">[ RESUME NOT FOUND ]</p>
          <Link href="/upload">
            <Button>Upload Resume</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-yellow-500";
      case "low": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case "medium": return <Target className="w-5 h-5 text-yellow-500" />;
      case "low": return <Lightbulb className="w-5 h-5 text-muted-foreground" />;
      default: return <Lightbulb className="w-5 h-5" />;
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
            <Link href="/dashboard">
              <Button size="sm" variant="outline">
                DASHBOARD
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2 glow-cyan">RESUME ANALYZED</h1>
            <p className="text-muted-foreground font-mono">
              &gt; {resume.fileName} has been processed successfully
            </p>
          </div>

          {/* Recommendations Section */}
          <Card className="border-glow-cyan mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                IMPROVEMENT RECOMMENDATIONS
              </CardTitle>
              <CardDescription>
                Based on our analysis, here are areas where you can improve your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(rec.priority)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{rec.title}</h3>
                          <span className={`text-sm font-mono ${getPriorityColor(rec.priority)}`}>
                            {rec.impact}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(rec.priority)} bg-opacity-10`}>
                            {rec.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking Section */}
          {!showRanking ? (
            <Card className="border-glow-magenta mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  VIEW YOUR GLOBAL RANKING
                </CardTitle>
                <CardDescription>
                  See how your resume ranks against thousands of professionals worldwide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Your resume has been scored and ranked. Click below to see your position in the global leaderboard, 
                  percentile ranking, and detailed score breakdown.
                </p>
                <Button
                  onClick={() => setShowRanking(true)}
                  size="lg"
                  className="w-full gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  VIEW GLOBAL RANKING
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-glow-magenta mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  YOUR GLOBAL RANKING
                </CardTitle>
              </CardHeader>
              <CardContent>
                {score ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-card border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">OVERALL SCORE</p>
                        <p className="text-2xl font-bold glow-cyan">{score.overallScore || "N/A"}</p>
                      </div>
                      <div className="text-center p-4 bg-card border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">GLOBAL RANK</p>
                        <p className="text-2xl font-bold glow-magenta">#{score.globalRank || "N/A"}</p>
                      </div>
                      <div className="text-center p-4 bg-card border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">PERCENTILE</p>
                        <p className="text-2xl font-bold glow-cyan">{score.globalPercentile || "N/A"}%</p>
                      </div>
                      <div className="text-center p-4 bg-card border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">TOTAL RESUMES</p>
                        <p className="text-2xl font-bold glow-magenta">{score.totalResumesRanked || "N/A"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-card border border-border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">EDUCATION</p>
                        <p className="text-lg font-semibold">{score.educationScore || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-card border border-border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">EXPERIENCE</p>
                        <p className="text-lg font-semibold">{score.experienceScore || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-card border border-border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">SKILLS</p>
                        <p className="text-lg font-semibold">{score.skillsScore || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-card border border-border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">ACTIVITIES</p>
                        <p className="text-lg font-semibold">{score.activitiesScore || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Your resume is still being analyzed. Scores will be available shortly.
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      Status: {resume.parsingStatus}
                    </p>
                  </div>
                )}
                <div className="mt-6 flex gap-4">
                  <Link href="/leaderboard" className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <BarChart3 className="w-4 h-4" />
                      VIEW FULL LEADERBOARD
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="flex-1">
                    <Button className="w-full gap-2">
                      <ArrowRight className="w-4 h-4" />
                      GO TO DASHBOARD
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link href="/upload" className="flex-1">
              <Button variant="outline" className="w-full">
                UPLOAD ANOTHER RESUME
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                VIEW ALL RESUMES
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
