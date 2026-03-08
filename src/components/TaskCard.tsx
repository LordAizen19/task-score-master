import { format, isPast } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Edit2, Trash2, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Task = Tables<"tasks">;

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-warning/15 text-warning-foreground border-warning/30", icon: Clock },
  in_progress: { label: "In Progress", className: "bg-info/15 text-info border-info/30", icon: Clock },
  completed: { label: "Completed", className: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  missed: { label: "Missed", className: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

const TaskCard = ({ task, onEdit, onDelete, onComplete }: TaskCardProps) => {
  const config = statusConfig[task.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const overdue = task.status === "pending" && isPast(new Date(task.deadline));

  return (
    <Card className={cn("transition-all hover:shadow-md", overdue && "border-destructive/40")}>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-sm truncate">{task.title}</h3>
            <Badge variant="outline" className={cn("text-xs shrink-0", config.className)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground truncate mb-1">{task.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Due: {format(new Date(task.deadline), "MMM d, h:mm a")}
            {task.estimated_duration && ` · ${task.estimated_duration}min`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(task.status === "pending" || task.status === "in_progress") && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success" onClick={() => onComplete(task.id)}>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(task)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
