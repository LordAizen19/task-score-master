import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { LogOut, Trash2, User } from "lucide-react";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteData = async (table: string, label: string) => {
    if (!user) return;
    setDeleting(table);
    const { error } = await supabase.from(table as any).delete().eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${label} cleared successfully.` });
    }
    setDeleting(null);
  };

  const deleteOptions = [
    { table: "score_history", label: "Score History" },
    { table: "weekly_stats", label: "Weekly Stats" },
    { table: "monthly_stats", label: "Monthly Stats" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Delete Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deleteOptions.map(({ table, label }) => (
            <AlertDialog key={table}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  Delete {label}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete all your {label.toLowerCase()} data. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteData(table, label)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting === table ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
};

export default SettingsPage;
