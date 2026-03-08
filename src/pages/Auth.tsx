import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Coins, Loader2, Eye, EyeOff, Sun, Moon } from "lucide-react";

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isForgot) {
      const { error } = await resetPassword(email);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "Password reset link sent." });
        setIsForgot(false);
      }
      setSubmitting(false);
      return;
    }

    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (!isLogin) {
      toast({ title: "Success", description: "Check your email to confirm your account." });
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 right-4 p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <Card className="w-full max-w-md coin-shadow">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-3xl">TaskScore</CardTitle>
          <CardDescription>
            {isForgot ? "Reset your password" : isLogin ? "Welcome back! Sign in to continue." : "Create an account to start earning coins."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!isForgot && (
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isForgot ? "Send Reset Link" : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 flex flex-col items-center gap-2 text-sm">
            {!isForgot && (
              <button onClick={() => setIsForgot(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </button>
            )}
            <button
              onClick={() => { setIsLogin(!isLogin); setIsForgot(false); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;