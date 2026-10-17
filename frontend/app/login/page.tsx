"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface User {
  id: string;
  email: string;
  role: "brand" | "creator" | string;
}

interface LoginResponse {
  token?: string;
  user?: User;
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const contentType = response.headers.get("content-type");
      let data: LoginResponse = {};

      if (contentType?.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.message || `Login failed (${response.status})`);
      }

      if (!data.token || !data.user?.role) {
        throw new Error("Login response is missing authentication details.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.replace(data.user.role === "brand" ? "/" : "/creators");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-logo">
          MIME’D<span>.</span>
        </Link>

        <p className="auth-eyebrow">WELCOME BACK</p>

        <h1>
          Log in<span>.</span>
        </h1>

        <p className="auth-description">
          Continue building partnerships that make an impact.
        </p>

        <form onSubmit={handleLogin} noValidate>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
            required
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link
              href="/forgot-password"
              style={{ color: "#c4ff70", fontSize: "14px" }}
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="auth-error" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>

        <Link href="/" className="auth-back">
          ← Back to overview
        </Link>
      </section>
    </main>
  );
}