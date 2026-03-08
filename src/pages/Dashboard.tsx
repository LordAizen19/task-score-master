import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ScoreDisplay from "@/components/ScoreDisplay";
import TaskCard from "@/components/TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, Sparkles, Loader2 } from "lucide-react";
import { startOfDay, endOfDay } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type ScoreEntry = Tables<"score_history">;

const Dashboard = () => {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [recentScores, setRecentScores] = useState<ScoreEntry[]>([]);
  const [stats, setStats] = useState({ completed: 0, missed: 0, pending: 0 });
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const today = new Date();

    const [profileRes, tasksRes, todayRes, scoresRes] = await Promise.all([
      supabase.from("profiles").select("score").eq("user_id", user.id).single(),
      supabase.from("tasks").select("status").eq("user_id", user.id),
      supabase.from("tasks").select("*").eq("user_id", user.id).gte("deadline", startOfDay(today).toISOString()).lte("deadline", endOfDay(today).toISOString()).order("deadline"),
      supabase.from("score_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    if (profileRes.data) setScore(profileRes.data.score);
    if (todayRes.data) setTodayTasks(todayRes.data);
    if (scoresRes.data) setRecentScores(scoresRes.data);
    if (tasksRes.data) {
      setStats({
        completed: tasksRes.data.filter((t) => t.status === "completed").length,
        missed: tasksRes.data.filter((t) => t.status === "missed").length,
        pending: tasksRes.data.filter((t) => t.status === "pending" || t.status === "in_progress").length,
      });
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleComplete = async (taskId: string) => {
    const { data, error } = await supabase.functions.invoke("complete-task", {
      body: { taskId },
    });
    if (error) {
      toast({ title: "Error", description: "Failed to complete task", variant: "destructive" });
    } else {
      const change = data?.score_change ?? 0;
      toast({
        title: change >= 0 ? `+${change} coins! 🪙` : `${change} coins`,
        description: data?.reason ?? "Task completed",
      });
      fetchData();
    }
  };

  const handleAiSummary = async () => {
    setAiLoading(true);
    setAiSummary("");
    const { data, error } = await supabase.functions.invoke("ai-suggestions", {
      body: { type: "summary" },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to get AI summary", variant: "destructive" });
    } else {
      setAiSummary(data?.summary || "No summary available.");
    }
    setAiLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your productivity at a glance</p>
        </div>
        <ScoreDisplay score={score} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-success" },
          { label: "Missed", value: stats.missed, icon: XCircle, color: "text-destructive" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className="font-display text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-display text-lg">AI Productivity Summary</CardTitle>
          <Button variant="outline" size="sm" onClick={handleAiSummary} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {aiLoading ? "Analyzing..." : "Get Summary"}
          </Button>
        </CardHeader>
        {aiSummary && (
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiSummary}</p>
          </CardContent>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tasks for today</p>
            ) : (
              todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onComplete={handleComplete}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Score Changes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Recent Score Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentScores.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No score history yet</p>
            ) : (
              <div className="space-y-2">
                {recentScores.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <p className="text-sm truncate flex-1">{entry.reason}</p>
                    <span className={`font-display font-bold text-sm ${entry.score_change >= 0 ? "text-success" : "text-destructive"}`}>
                      {entry.score_change > 0 ? "+" : ""}{entry.score_change}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
