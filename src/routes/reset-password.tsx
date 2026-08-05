import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Mountain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recordAuthEvent } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Arquane OS" },
      {
        name: "description",
        content: "Choose a new password for your Arquane OS workspace account.",
      },
      { property: "og:title", content: "Set a new password — Arquane OS" },
      {
        property: "og:description",
        content: "Choose a new password for your Arquane OS workspace account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase exchanges the recovery link for a session on load.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setLinkValid(true);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: sessionData }) => {
      const hash = window.location.hash;
      const isRecovery = hash.includes("type=recovery");
      setLinkValid(Boolean(sessionData.session) || isRecovery);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    void recordAuthEvent({
      data: {
        event: "password_reset_completed",
        email: userData.user?.email ?? undefined,
      },
    }).catch(() => undefined);
    setDone(true);
    setTimeout(() => navigate({ to: "/workspace", replace: true }), 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Arquane OS</span>
        </div>

        {!ready ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying your reset link…
          </div>
        ) : !linkValid ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Link expired or invalid
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Reset links can only be used once and expire after 60 minutes.
            </p>
            <Button asChild className="mt-8 w-full">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </>
        ) : done ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Password updated
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Taking you to your workspace…
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Set a new password
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Use at least 8 characters. You'll stay signed in on this device.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              {error && (
                <p role="alert" className="text-[13px] text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
