import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { format, parseISO } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type WeekStat = Tables<"weekly_stats">;
type MonthStat = Tables<"monthly_stats">;

const chartConfig = {
  tasks_completed: { label: "Completed", color: "hsl(142 71% 45%)" },
  tasks_missed: { label: "Missed", color: "hsl(0 72% 51%)" },
  score_change: { label: "Score Change", color: "hsl(38 92% 50%)" },
};

const Statistics = () => {
  const { user } = useAuth();
  const [weekly, setWeekly] = useState<WeekStat[]>([]);
  const [monthly, setMonthly] = useState<MonthStat[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("weekly_stats").select("*").eq("user_id", user.id).order("week_start", { ascending: true }).limit(12),
      supabase.from("monthly_stats").select("*").eq("user_id", user.id).order("month", { ascending: true }).limit(12),
    ]).then(([w, m]) => {
      if (w.data) setWeekly(w.data);
      if (m.data) setMonthly(m.data);
    });
  }, [user]);

  const formatWeek = (d: string) => format(parseISO(d), "MMM d");
  const formatMonth = (d: string) => format(parseISO(d), "MMM yyyy");

  const renderChart = (data: (WeekStat | MonthStat)[], labelFn: (d: string) => string, dateKey: string) => {
    const mapped = data.map((d) => ({
      ...d,
      label: labelFn((d as any)[dateKey]),
    }));

    if (mapped.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No data yet. Complete tasks to see statistics!</p>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Tasks Overview</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={mapped}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="tasks_completed" fill="var(--color-tasks_completed)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tasks_missed" fill="var(--color-tasks_missed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-display text-base">Score Trend</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={mapped}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="score_change" stroke="var(--color-score_change)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground text-sm">Track your productivity over time</p>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-4">
          {renderChart(weekly, formatWeek, "week_start")}
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          {renderChart(monthly, formatMonth, "month")}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistics;
