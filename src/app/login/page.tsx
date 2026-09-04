"use client";

import { useActionState } from "react";
import { Lock, Mail } from "lucide-react";
import { Input } from "@/components/motion/input";
import { StatefulButton, type ButtonState } from "@/components/motion/button/stateful";
import { login, type LoginState } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    { error: null },
  );
  // Derived, not stored: pending → loading, otherwise error until the next attempt.
  const buttonState: ButtonState = pending
    ? "loading"
    : state?.error
      ? "error"
      : "idle";

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold leading-none tracking-tight text-foreground">
            Potaro
          </h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Your private bookmark library
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            leftIcon={<Mail />}
          />
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            leftIcon={<Lock />}
            error={state?.error ?? undefined}
            reserveErrorLine
          />
          <StatefulButton
            type="submit"
            size="lg"
            state={buttonState}
            loadingText="Signing in…"
            errorText="Try again"
            className="mt-2 w-full"
          >
            Sign in
          </StatefulButton>
        </form>

        <p className="mt-6 text-center text-xs font-bold text-muted-foreground">
          Single account · No sign-ups
        </p>
      </div>
    </main>
  );
}