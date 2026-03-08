import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { taskId } = await req.json();
    if (!taskId) throw new Error("taskId required");

    // Get the task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (taskError || !task) throw new Error("Task not found");
    if (task.status === "completed") throw new Error("Task already completed");

    const now = new Date();
    const deadline = new Date(task.deadline);
    const diffMs = deadline.getTime() - now.getTime();
    const diffMin = diffMs / 60000;

    let scoreChange: number;
    let reason: string;

    if (diffMin >= 20) {
      scoreChange = 15;
      reason = `Completed "${task.title}" early (+15 coins)`;
    } else if (diffMin >= 0) {
      scoreChange = 10;
      reason = `Completed "${task.title}" on time (+10 coins)`;
    } else {
      scoreChange = -5;
      reason = `Completed "${task.title}" late (-5 coins)`;
    }

    // Use service role for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update task status
    await adminClient.from("tasks").update({ status: "completed", completed_at: now.toISOString() }).eq("id", taskId);

    // Update profile score
    const { data: profile } = await adminClient.from("profiles").select("score").eq("user_id", user.id).single();
    const newScore = (profile?.score || 0) + scoreChange;
    await adminClient.from("profiles").update({ score: newScore }).eq("user_id", user.id);

    // Insert score history
    await adminClient.from("score_history").insert({
      user_id: user.id,
      task_id: taskId,
      score_change: scoreChange,
      reason,
    });

    // Update weekly stats
    const weekStart = getWeekStart(now);
    const { data: existingWeek } = await adminClient
      .from("weekly_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (existingWeek) {
      await adminClient.from("weekly_stats").update({
        tasks_completed: existingWeek.tasks_completed + 1,
        score_change: existingWeek.score_change + scoreChange,
      }).eq("id", existingWeek.id);
    } else {
      await adminClient.from("weekly_stats").insert({
        user_id: user.id,
        week_start: weekStart,
        tasks_completed: 1,
        score_change: scoreChange,
      });
    }

    // Update monthly stats
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data: existingMonth } = await adminClient
      .from("monthly_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", monthStart)
      .single();

    if (existingMonth) {
      await adminClient.from("monthly_stats").update({
        tasks_completed: existingMonth.tasks_completed + 1,
        score_change: existingMonth.score_change + scoreChange,
      }).eq("id", existingMonth.id);
    } else {
      await adminClient.from("monthly_stats").insert({
        user_id: user.id,
        month: monthStart,
        tasks_completed: 1,
        score_change: scoreChange,
      });
    }

    return new Response(JSON.stringify({ score_change: scoreChange, reason, new_score: newScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
