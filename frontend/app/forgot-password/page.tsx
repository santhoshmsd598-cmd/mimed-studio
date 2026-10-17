"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to process your request. Please try again."
        );
      }

      setMessage(
        data.message ||
          "If an account exists for this email, you will receive password reset instructions."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/login" className="auth-logo">
          MIME’D<span>.</span>
        </Link>

        <p className="auth-eyebrow">ACCOUNT RECOVERY</p>

        <h1>
          Forgot password<span>.</span>
        </h1>

        <p className="auth-description">
          Enter your registered email address. If an account exists, we'll
          send instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
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

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p role="status" style={{ color: "#c4ff70" }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset instructions"}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}