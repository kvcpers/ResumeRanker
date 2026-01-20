import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Leaderboard() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.resume.getLeaderboard.useQuery({
    limit: 100,
    offset: 0,
  });

  const rankings = data?.rankings || [];
  const total = data?.total || 0;
  const avgScore = data?.avgScore || 0;
  const topScore = data?.topScore || 0;
  const scoreDistribution = data?.scoreDistribution || [];

  // Generate anonymized user IDs
  const getAnonymizedUserId = (userId: number, index: number) => {
    // Create a consistent anonymized ID based on userId
    const hash = userId.toString().split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return `USER_${Math.abs(hash).toString().padStart(6, '0')}`;
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
            {user && (
              <span className="text-sm text-muted-foreground font-mono">
                USER: {user.name || user.email}
              </span>
            )}
            <Link href="/dashboard">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                DASHBOARD
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 glow-cyan">GLOBAL LEADERBOARD</h1>
          <p className="text-muted-foreground font-mono">
            &gt; ANONYMIZED RANKINGS OF TOP PERFORMERS WORLDWIDE
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <Card className="mb-8">
              <CardContent className="py-12 text-center">
                <div className="inline-block animate-spin mb-4">
                  <div className="w-12 h-12 border-2 border-primary border-t-accent rounded-full"></div>
                </div>
                <p className="text-muted-foreground font-mono">[ LOADING RANKINGS ]</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-glow-cyan">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      TOTAL USERS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold glow-cyan">{total.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">Active participants</p>
                  </CardContent>
                </Card>

                <Card className="border-glow-magenta">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      AVG SCORE
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold glow-magenta">{avgScore.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground mt-2">Out of 100</p>
                  </CardContent>
                </Card>

                <Card className="border-glow-cyan">
                  <CardHeader>
                    <CardTitle className="text-primary">TOP SCORE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold glow-cyan">{topScore.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground mt-2">Maximum achieved</p>
                  </CardContent>
                </Card>
              </div>

              {/* Leaderboard Table */}
              {rankings.length > 0 ? (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>TOP {rankings.length} PERFORMERS</CardTitle>
                    <CardDescription>Anonymized rankings based on comprehensive resume analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-primary font-mono">#</th>
                            <th className="text-left py-3 px-4 text-primary font-mono">USER</th>
                            <th className="text-left py-3 px-4 text-primary font-mono">SCORE</th>
                            <th className="text-left py-3 px-4 text-primary font-mono">EDUCATION</th>
                            <th className="text-left py-3 px-4 text-primary font-mono">EXPERIENCE</th>
                            <th className="text-left py-3 px-4 text-primary font-mono">SKILLS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((ranking, i) => (
                            <tr 
                              key={ranking.id} 
                              className={`border-b border-border/50 hover:bg-card/50 transition-colors ${
                                user && ranking.userId === user.id ? 'bg-primary/10' : ''
                              }`}
                            >
                              <td className="py-3 px-4 text-muted-foreground font-mono">
                                {ranking.globalRank || i + 1}
                              </td>
                              <td className="py-3 px-4 text-foreground font-mono">
                                {getAnonymizedUserId(ranking.userId, i)}
                                {user && ranking.userId === user.id && (
                                  <span className="ml-2 text-xs text-primary">(YOU)</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-accent font-bold">
                                {ranking.overallScore || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-primary">
                                {ranking.educationScore || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-primary">
                                {ranking.experienceScore || "N/A"}
                              </td>
                              <td className="py-3 px-4 text-primary">
                                {ranking.skillsScore || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground font-mono">
                        [ SHOWING {rankings.length} OF {total.toLocaleString()} USERS ]
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-8">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground font-mono mb-4">[ NO RANKINGS YET ]</p>
                    <p className="text-lg font-bold glow-magenta">NO RESUMES HAVE BEEN SCORED</p>
                    <p className="text-sm text-muted-foreground mt-4">
                      Upload and analyze resumes to see rankings appear here.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Score Distribution */}
              {scoreDistribution.length > 0 && (
                <Card className="border-glow-magenta">
                  <CardHeader>
                    <CardTitle>SCORE DISTRIBUTION</CardTitle>
                    <CardDescription>Histogram of all user scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scoreDistribution.map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-16 text-sm font-mono text-muted-foreground">{item.range}</div>
                          <div className="flex-1 bg-card border border-border rounded-sm overflow-hidden">
                            <div
                              className="h-8 bg-gradient-to-r from-primary to-accent flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(item.percentage * 3, 2)}%` }}
                            >
                              {item.percentage > 5 && (
                                <span className="text-xs font-mono text-background">{item.percentage}%</span>
                              )}
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm font-mono text-muted-foreground">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Info Section */}
          <Card className="mt-8 bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">[ ABOUT RANKINGS ]</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Rankings are calculated using a comprehensive algorithm that evaluates multiple factors:
              </p>
              <ul className="space-y-2 font-mono">
                <li>• <span className="text-primary">Education (25%)</span> - University prestige, degree, GPA</li>
                <li>• <span className="text-accent">Experience (25%)</span> - Work history, roles, duration</li>
                <li>• <span className="text-primary">Skills (20%)</span> - Technical and soft skill proficiency</li>
                <li>• <span className="text-accent">Activities (10%)</span> - Certifications, achievements, leadership</li>
                <li>• <span className="text-primary">Bias Mitigation (20%)</span> - Fairness scoring adjustment</li>
              </ul>
              <p className="mt-4">
                All rankings are updated in real-time as new resumes are analyzed. User identities are anonymized for privacy.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
