import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (data: { title: string; description: string; deadline: string; estimated_duration: number; status: string }) => Promise<void>;
}

const TaskDialog = ({ open, onOpenChange, task, onSave }: TaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");
  const [duration, setDuration] = useState(30);
  const [status, setStatus] = useState("pending");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      const d = new Date(task.deadline);
      setDeadlineDate(d.toISOString().slice(0, 10));
      let h = d.getHours();
      const m = d.getMinutes();
      setAmpm(h >= 12 ? "PM" : "AM");
      h = h % 12 || 12;
      setHour(String(h));
      setMinute(String(m).padStart(2, "0"));
      setDuration(task.estimated_duration || 30);
      setStatus(task.status);
    } else {
      setTitle("");
      setDescription("");
      setDeadlineDate("");
      setHour("12");
      setMinute("00");
      setAmpm("AM");
      setDuration(30);
      setStatus("pending");
    }
  }, [task, open]);

  const buildDeadline = () => {
    let h = parseInt(hour);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    const dateStr = `${deadlineDate}T${String(h).padStart(2, "0")}:${minute}:00`;
    return new Date(dateStr).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ title, description, deadline: buildDeadline(), estimated_duration: duration, status });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Task title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Deadline Date</Label>
            <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Deadline Time</Label>
            <div className="flex gap-2 items-center">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground font-bold">:</span>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ampm} onValueChange={setAmpm}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duration (min)</Label>
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          {task && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {task ? "Update" : "Create"} Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
