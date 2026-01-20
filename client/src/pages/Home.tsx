import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, TrendingUp, Shield, Brain, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-2 border-primary border-t-accent rounded-full"></div>
          </div>
          <p className="text-muted-foreground font-mono">[ INITIALIZING SYSTEM ]</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold glow-cyan bracket-top-left bracket-top-right">
                ResumeRank
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground font-mono">
                USER: {user.name || user.email}
              </span>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  DASHBOARD
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h1 className="text-5xl font-bold mb-4 glow-cyan">
                WELCOME TO THE SYSTEM
              </h1>
              <p className="text-lg text-muted-foreground font-mono mb-8">
                &gt; Your resume has been registered in the global ranking network.
              </p>
              <div className="flex gap-4">
                <Link href="/upload">
                  <Button size="lg" className="gap-2">
                    UPLOAD RESUME <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="outline" size="lg">
                    VIEW LEADERBOARD
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Card className="border-glow-cyan">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    AI ANALYSIS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Advanced NLP algorithms extract and classify your skills, experience, and achievements with precision.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-glow-magenta">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    GLOBAL RANKING
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    See how you rank against thousands of professionals worldwide with real-time percentile calculations.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-glow-cyan">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    BIAS DETECTION
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ethical AI systems detect and mitigate potential discrimination in the ranking process.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-glow-magenta">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    RECOMMENDATIONS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Receive personalized improvement suggestions to boost your ranking and career prospects.
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
                    Detailed breakdowns of your strengths and weaknesses across all evaluation categories.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-glow-magenta">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent" />
                    SECURE STORAGE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your resume data is encrypted and stored securely with user-specific access controls.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Status Bar */}
            <div className="bg-card border border-border p-6 rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-muted-foreground mb-2">
                    [ SYSTEM STATUS ]
                  </p>
                  <p className="text-lg font-bold glow-cyan">
                    OPERATIONAL
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-muted-foreground mb-2">
                    [ CONNECTED USERS ]
                  </p>
                  <p className="text-lg font-bold glow-magenta">
                    ACTIVE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not authenticated - show landing page
  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="text-2xl font-bold glow-cyan bracket-top-left bracket-top-right">
            ResumeRank
          </div>
          <Link href="/login">
            <Button>ENTER SYSTEM</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="mb-8">
            <p className="text-sm font-mono text-primary mb-4 error-code">
              [ SYSTEM INITIALIZED ]
            </p>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 glow-cyan chromatic-aberration">
              ResumeRank
            </h1>
            <p className="text-xl text-muted-foreground font-mono mb-8 leading-relaxed">
              &gt; AI-POWERED RESUME ANALYSIS &amp; GLOBAL RANKING SYSTEM<br/>
              &gt; ETHICAL INTELLIGENCE. TRANSPARENT METRICS. REAL RESULTS.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/login">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                INITIALIZE LOGIN <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              VIEW DEMO
            </Button>
          </div>

          {/* Error Code Display */}
          <div className="bg-card border border-border p-8 rounded-sm mb-12">
            <div className="font-mono text-left space-y-2">
              <p className="text-primary">&gt; STATUS: ONLINE</p>
              <p className="text-accent">&gt; USERS_RANKED: 1,247</p>
              <p className="text-primary">&gt; ACCURACY: 98.7%</p>
              <p className="text-accent">&gt; BIAS_DETECTION: ACTIVE</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <Card className="border-glow-cyan">
            <CardHeader>
              <CardTitle className="text-primary">INTELLIGENT PARSING</CardTitle>
              <CardDescription>Extract structured data from any resume format</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our advanced NLP engine automatically identifies education, experience, skills, and achievements with high accuracy.
              </p>
            </CardContent>
          </Card>

          <Card className="border-glow-magenta">
            <CardHeader>
              <CardTitle className="text-accent">GLOBAL LEADERBOARD</CardTitle>
              <CardDescription>See your position in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Compete on a global scale with anonymized rankings. Track your percentile and watch your position evolve.
              </p>
            </CardContent>
          </Card>

          <Card className="border-glow-cyan">
            <CardHeader>
              <CardTitle className="text-primary">ETHICAL AI</CardTitle>
              <CardDescription>Bias detection and mitigation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built-in fairness metrics and bias detection ensure transparent, equitable evaluation for all candidates.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          <div className="text-center p-6 bg-card border border-border rounded-sm">
            <p className="text-3xl font-bold glow-cyan mb-2">1.2K+</p>
            <p className="text-sm text-muted-foreground font-mono">RESUMES ANALYZED</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-sm">
            <p className="text-3xl font-bold glow-magenta mb-2">98.7%</p>
            <p className="text-sm text-muted-foreground font-mono">ACCURACY RATE</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-sm">
            <p className="text-3xl font-bold glow-cyan mb-2">47</p>
            <p className="text-sm text-muted-foreground font-mono">COUNTRIES</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-sm">
            <p className="text-3xl font-bold glow-magenta mb-2">24/7</p>
            <p className="text-sm text-muted-foreground font-mono">REAL-TIME RANKING</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <h2 className="text-3xl font-bold mb-4 glow-cyan">READY TO RANK?</h2>
          <p className="text-muted-foreground mb-8 font-mono">
            Upload your resume and join thousands of professionals competing on the global stage.
          </p>
          <Link href="/login">
            <Button size="lg" className="gap-2">
              START YOUR ANALYSIS <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-20 py-8">
        <div className="container text-center text-sm text-muted-foreground font-mono">
          <p>&gt; ResumeRank v1.0 | POWERED BY ETHICAL AI</p>
          <p className="mt-2">&gt; ALL RIGHTS RESERVED | CONFIDENTIAL</p>
        </div>
      </footer>
    </div>
  );
}
