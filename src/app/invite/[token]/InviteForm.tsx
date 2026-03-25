"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function InviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd       = new FormData(e.currentTarget);
    const username = (fd.get("username") as string).trim();
    const password = fd.get("password") as string;
    const confirm  = fd.get("confirm")  as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/invites/${token}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label className="field-label">Username</label>
        <input type="text" name="username" className="field-input" autoFocus required />
      </div>
      <div className="field">
        <label className="field-label">Password</label>
        <input type="password" name="password" className="field-input" required />
      </div>
      <div className="field">
        <label className="field-label">Confirm Password</label>
        <input type="password" name="confirm" className="field-input" required />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center mt-1"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
