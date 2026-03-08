import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TaskCard from "@/components/TaskCard";
import TaskDialog from "@/components/TaskDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;
    let query = supabase.from("tasks").select("*").eq("user_id", user.id).order("deadline");
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setTasks(data);
  };

  useEffect(() => { fetchTasks(); }, [user, filter]);

  const handleSave = async (data: { title: string; description: string; deadline: string; estimated_duration: number; status: string }) => {
    if (!user) return;
    if (editTask) {
      const { error } = await supabase.from("tasks").update(data).eq("id", editTask.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Task updated" });
    } else {
      const { error } = await supabase.from("tasks").insert({ ...data, user_id: user.id });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Task created" });
    }
    setEditTask(null);
    fetchTasks();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("tasks").delete().eq("id", deleteId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Task deleted" });
    setDeleteId(null);
    fetchTasks();
  };

  const handleComplete = async (taskId: string) => {
    const { data, error } = await supabase.functions.invoke("complete-task", { body: { taskId } });
    if (error) {
      toast({ title: "Error", description: "Failed to complete task", variant: "destructive" });
    } else {
      const change = data?.score_change ?? 0;
      toast({
        title: change >= 0 ? `+${change} coins! 🪙` : `${change} coins`,
        description: data?.reason ?? "Task completed",
      });
      fetchTasks();
    }
  };

  const handleSuggest = async () => {
    setSuggestLoading(true);
    const { data, error } = await supabase.functions.invoke("ai-suggestions", { body: { type: "suggest" } });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to get suggestions", variant: "destructive" });
    } else if (data?.suggestions) {
      toast({ title: "AI Suggestions", description: data.suggestions.map((s: { title: string }) => `• ${s.title}`).join("\n") });
    }
    setSuggestLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Task Manager</h1>
          <p className="text-muted-foreground text-sm">Create and manage your tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSuggest} disabled={suggestLoading}>
            {suggestLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            AI Suggest
          </Button>
          <Button size="sm" onClick={() => { setEditTask(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New Task
          </Button>
        </div>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="missed">Missed</SelectItem>
        </SelectContent>
      </Select>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No tasks found. Create one to get started!</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(t) => { setEditTask(t); setDialogOpen(true); }}
              onDelete={(id) => setDeleteId(id)}
              onComplete={handleComplete}
            />
          ))
        )}
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editTask} onSave={handleSave} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tasks;
