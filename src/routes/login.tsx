import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Mountain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recordAuthEvent } from "@/lib/auth.functions";
import { sanitizeRedirect } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const value = sanitizeRedirect(search["redirect"]);
    return value ? { redirect: value } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — Arquane OS" },
      {
        name: "description",
        content:
          "Sign in to Arquane OS, the enterprise operating system for the natural stone and quartz industry.",
      },
      { property: "og:title", content: "Sign in — Arquane OS" },
      {
        property: "og:description",
        content: "Secure access to your Arquane OS workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const REMEMBER_KEY = "arquane.login.email";

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const destination = redirect ?? "/workspace";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) goTo(destination);
    });
  }, [navigate, destination]);

  function goTo(target: string) {
    // Destinations carrying a query string (e.g. the OAuth consent URL) are
    // navigated natively so the search params survive.
    if (target.includes("?")) window.location.replace(target);
    else navigate({ to: target, replace: true });
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const address = email.trim();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: address,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      void recordAuthEvent({
        data: { event: "failed_login", email: address, detail: signInError.message },
      }).catch(() => undefined);
      return;
    }
    if (remember) localStorage.setItem(REMEMBER_KEY, address);
    else localStorage.removeItem(REMEMBER_KEY);
    void recordAuthEvent({ data: { event: "sign_in", email: address } }).catch(
      () => undefined,
    );
    await router.invalidate();
    navigate({ to: destination, replace: true });
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Mountain className="h-5 w-5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Arquane OS</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            The operating system for the global stone industry.
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-80">
            CRM, inventory intelligence, quotations, production, logistics and AI
            agents — unified in one executive workspace.
          </p>
        </div>
        <p className="text-xs opacity-60">
          © {new Date().getFullYear()} Arquane. All rights reserved.
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Mountain className="h-5 w-5" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Arquane OS</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {redirect
              ? "Sign in to continue to the page you requested."
              : "Sign in to your workspace to continue."}
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

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-[13px] font-medium text-primary transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p role="alert" className="text-[13px] text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Access is provisioned by your workspace administrator.
          </p>
        </div>
      </section>
    </main>
  );
}
