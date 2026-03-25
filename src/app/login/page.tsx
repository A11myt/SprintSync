"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const errorParam   = searchParams.get("error");

  const [error, setError] = useState(
    errorParam === "CredentialsSignin" ? "Invalid credentials." :
    errorParam ? "Session expired." : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd       = new FormData(e.currentTarget);
    const username = (fd.get("username") as string).trim();
    const password = fd.get("password") as string;

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[min(360px,95vw)]">

        <div className="mb-6 text-center">
          <div className="font-mono text-sm font-bold tracking-tight mb-1">
            Vault<span className="text-primary">Board</span>
          </div>
          <div className="text-2xs text-muted">Please sign in</div>
        </div>

        <div className="bg-surface border border-outline rounded-sm p-6">
          {error && (
            <div className="form-error mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="field">
              <label className="field-label">Username</label>
              <input
                type="text"
                name="username"
                className="field-input"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                name="password"
                className="field-input"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-1"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xs text-muted">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
