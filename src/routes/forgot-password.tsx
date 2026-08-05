import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Mountain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recordAuthEvent } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — Arquane OS" },
      {
        name: "description",
        content: "Request a secure password reset link for your Arquane OS workspace account.",
      },
      { property: "og:title", content: "Reset your password — Arquane OS" },
      {
        property: "og:description",
        content: "Request a secure password reset link for your Arquane OS workspace account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("arquane.login.email");
    if (saved) setEmail(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const address = email.trim();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    void recordAuthEvent({
      data: { event: "password_reset_requested", email: address },
    }).catch(() => undefined);
    setSent(true);
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

        {sent ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Check your inbox
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>,
              we've sent a secure link to set a new password. The link expires in 60 minutes.
            </p>
            <Button asChild variant="outline" className="mt-8 w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Forgot your password?
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your work email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>

              {error && (
                <p role="alert" className="text-[13px] text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
