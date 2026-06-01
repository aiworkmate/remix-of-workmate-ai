import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

type Mode = "signin" | "signup";

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "signin",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back");
      onOpenChange(false);
      navigate({ to: "/app", replace: true });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: { display_name: name },
        },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Workspace ready — you're in.");
      onOpenChange(false);
      navigate({ to: "/app", replace: true });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border bg-card/95 p-0 backdrop-blur-xl sm:max-w-[440px]">
        <div className="relative px-6 pt-6">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[140%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <DialogHeader className="space-y-0">
                <DialogTitle className="font-display text-lg">
                  {mode === "signin" ? "Welcome back" : "Enter WorkMate"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {mode === "signin" ? "Resume your AI session." : "Set up your workspace in seconds."}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="px-6 pb-6 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <TabsContent value="signup" className="m-0 space-y-4">
              <Field id="name" label="Name">
                <Input id="name" required={mode === "signup"} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" />
              </Field>
            </TabsContent>

            <Field id="email" label="Email">
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            <Field id="password" label="Password">
              <Input
                id="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            <Button type="submit" disabled={loading} className="h-11 w-full shadow-glow">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              By continuing, you agree to our Terms & Privacy.
            </p>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
