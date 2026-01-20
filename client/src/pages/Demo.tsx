import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  BarChart3,
  Target,
  Lightbulb,
  Info
} from "lucide-react";
import { useState } from "react";

export default function Demo() {
  const [showRanking, setShowRanking] = useState(false);

  // Sample demo data
  const demoResume = {
    fileName: "sample_resume_2026.pdf",
    parsingStatus: "completed"
  };

  const demoScore = {
    overallScore: "87",
    globalRank: 234,
    globalPercentile: "81",
    totalResumesRanked: 1247,
    educationScore: "92",
    experienceScore: "85",
    skillsScore: "88",
    activitiesScore: "82"
  };

  const demoRecommendations = [
    {
      title: "Add Industry-Specific Certifications",
      description: "Consider adding relevant certifications like AWS Certified Solutions Architect or Google Cloud Professional to strengthen your technical credentials and increase your score by 5-8 points.",
      priority: "high" as const,
      estimatedImpact: "+8%"
    },
    {
      title: "Quantify Achievement Metrics",
      description: "Your experience descriptions would benefit from more specific metrics. For example, instead of 'improved performance', use 'increased system efficiency by 40%' or 'reduced costs by $50K annually'.",
      priority: "high" as const,
      estimatedImpact: "+6%"
    },
    {
      title: "Expand Leadership Experience",
      description: "Highlight any team leadership, mentoring, or project management experience. These skills are highly valued and can significantly boost your ranking.",
      priority: "medium" as const,
      estimatedImpact: "+4%"
    },
    {
      title: "Add Recent Professional Development",
      description: "Include any recent courses, workshops, or training programs you've completed. Continuous learning demonstrates commitment to professional growth.",
      priority: "medium" as const,
      estimatedImpact: "+3%"
    },
    {
      title: "Optimize Skills Section",
      description: "Consider grouping related skills and adding proficiency levels. This helps ATS systems and recruiters better understand your expertise.",
      priority: "low" as const,
      estimatedImpact: "+2%"
    }
  ];

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
            <Link href="/">
              <Button size="sm" variant="outline">
                BACK TO HOME
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                GET STARTED
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Demo Banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-3">
        <div className="container">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-mono text-primary">
              [ DEMO MODE ] This is a sample resume analysis. Create an account to analyze your own resume.
            </span>
          </div>
        </div>
      </div>

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
              &gt; {demoResume.fileName} has been processed successfully
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
                {demoRecommendations.map((rec, index) => (
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
                            {rec.estimatedImpact}
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
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-card border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">OVERALL SCORE</p>
                      <p className="text-2xl font-bold glow-cyan">{demoScore.overallScore}</p>
                    </div>
                    <div className="text-center p-4 bg-card border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">GLOBAL RANK</p>
                      <p className="text-2xl font-bold glow-magenta">#{demoScore.globalRank}</p>
                    </div>
                    <div className="text-center p-4 bg-card border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">PERCENTILE</p>
                      <p className="text-2xl font-bold glow-cyan">{demoScore.globalPercentile}%</p>
                    </div>
                    <div className="text-center p-4 bg-card border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">TOTAL RESUMES</p>
                      <p className="text-2xl font-bold glow-magenta">{demoScore.totalResumesRanked}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-card border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">EDUCATION</p>
                      <p className="text-lg font-semibold">{demoScore.educationScore}</p>
                    </div>
                    <div className="p-3 bg-card border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">EXPERIENCE</p>
                      <p className="text-lg font-semibold">{demoScore.experienceScore}</p>
                    </div>
                    <div className="p-3 bg-card border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">SKILLS</p>
                      <p className="text-lg font-semibold">{demoScore.skillsScore}</p>
                    </div>
                    <div className="p-3 bg-card border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">ACTIVITIES</p>
                      <p className="text-lg font-semibold">{demoScore.activitiesScore}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <Link href="/leaderboard" className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <BarChart3 className="w-4 h-4" />
                      VIEW FULL LEADERBOARD
                    </Button>
                  </Link>
                  <Link href="/login" className="flex-1">
                    <Button className="w-full gap-2">
                      <ArrowRight className="w-4 h-4" />
                      GET STARTED
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                BACK TO HOME
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button className="w-full gap-2">
                <ArrowRight className="w-4 h-4" />
                CREATE ACCOUNT & ANALYZE YOUR RESUME
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
