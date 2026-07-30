import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import Atmosphere from "@/components/app/atmosphere";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { partOfDay } from "@/lib/weather";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — PREDI-FARM X" },
      {
        name: "description",
        content:
          "Sign in to PREDI-FARM X to get a live, weather-driven action plan for every block of your farm.",
      },
      { property: "og:title", content: "Sign in — PREDI-FARM X" },
      {
        property: "og:description",
        content: "Your farm, your fields, your forecast — one plan every morning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const part = partOfDay(new Date().getHours());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim() || password.length < 6) {
      setError("Enter your email and a password of at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          return;
        }
        navigate({ to: "/onboarding", replace: true });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-5 py-14">
      <Atmosphere part={part} condition="cloudy" windKph={10} />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative z-10 w-full max-w-md rounded-3xl p-7 grain"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-sm font-bold">PF</span>
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">PREDI-FARM X</p>
            <p className="mt-1 text-xs text-muted-foreground">Your farm, decided by data</p>
          </div>
        </div>

        <h1 className="mt-7 text-2xl font-semibold tracking-tight text-balance-pretty">
          {mode === "signin" ? "Welcome back to your fields" : "Set up your farm account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in and today's plan will be rebuilt from the live forecast over your village."
            : "One account holds your blocks, crops, sowing dates and every plan we build for them."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@farm.in"
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              maxLength={72}
              required
            />
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {notice}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="mt-5 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "signin"
            ? "New here? Create your farm account"
            : "Already have an account? Sign in"}
        </button>
      </motion.section>
    </main>
  );
}
