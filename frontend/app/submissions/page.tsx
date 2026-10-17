"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Submission = {
  _id?: string;
  id?: string;
  campaign?: {
    name?: string;
    platform?: string;
  } | string | null;
  contentUrl?: string;
  postUrl?: string;
  url?: string;
  status?: string;
  reviewStatus?: "pending" | "approved" | "rejected";
  reviewFeedback?: string;
  views?: number;
  payout?: number;
  createdAt?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SubmissionsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      setAuthenticated(false);
      setError("You are not logged in. Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/submissions/mine`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        setAuthenticated(false);
        setError(
          data.message ||
            "Your login session could not be verified. Please log in again."
        );
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to load submissions."
        );
      }

      const items: unknown = Array.isArray(data)
        ? data
        : Array.isArray(data.submissions)
          ? data.submissions
          : Array.isArray(data.data)
            ? data.data
            : [];

      const normalized = (items as Submission[]).map(
        (submission, index) => ({
          ...submission,
          _id: submission._id || submission.id || `submission-${index}`,
          reviewStatus:
            submission.reviewStatus ||
            (submission.status?.toLowerCase() === "approved"
              ? "approved"
              : submission.status?.toLowerCase() === "rejected"
                ? "rejected"
                : "pending"),
        })
      );

      setAuthenticated(true);
      setSubmissions(normalized);
      setMessage(
        normalized.length
          ? "Your submissions are up to date."
          : "You haven't submitted any content yet."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const getContentUrl = (submission: Submission) =>
    submission.postUrl || submission.contentUrl || submission.url || "";

  const getCampaign = (submission: Submission) => {
    if (
      typeof submission.campaign === "object" &&
      submission.campaign !== null
    ) {
      return submission.campaign;
    }

    return undefined;
  };

  const getStatus = (submission: Submission) => {
    const status = (
      submission.reviewStatus ||
      submission.status ||
      "pending"
    ).toLowerCase();

    if (status === "approved" || status === "rejected") {
      return status;
    }

    return "pending";
  };

  const statusStyle = (status: string): React.CSSProperties => {
    if (status === "approved") {
      return {
        color: "#c4ff70",
        borderColor: "#526b35",
        background: "#202b17",
      };
    }

    if (status === "rejected") {
      return {
        color: "#ff9999",
        borderColor: "#693b3b",
        background: "#301b1b",
      };
    }

    return {
      color: "#ffbc8b",
      borderColor: "#75543b",
      background: "#302319",
    };
  };

  const pendingCount = submissions.filter(
    (submission) => getStatus(submission) === "pending"
  ).length;

  const approvedCount = submissions.filter(
    (submission) => getStatus(submission) === "approved"
  ).length;

  const rejectedCount = submissions.filter(
    (submission) => getStatus(submission) === "rejected"
  ).length;

  return (
    <main className="studio">
      <section className="studio-main" style={{ width: "100%" }}>
        <header className="studio-header">
          <div>
            <div className="breadcrumb">WORKSPACE / SUBMISSIONS</div>
            <div className="header-title">My Submissions</div>
          </div>

          <button
            type="button"
            className="create-button"
            onClick={() => router.push("/creators")}
          >
            Browse campaigns
          </button>
        </header>

        <div className="dashboard-content">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span>✳</span> YOUR CREATOR WORKSPACE
              </div>

              <h1>
                Every submission,
                <br />
                <span>one place.</span>
              </h1>

              <p>
                Track your content, check review decisions, and read
                feedback from brands.
              </p>
            </div>
          </section>

          <section className="campaign-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">CONTENT TRACKER</div>
                <h2>
                  My submissions<span>.</span>
                </h2>
              </div>

              <button
                type="button"
                className="create-button"
                disabled={loading}
                onClick={loadSubmissions}
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            <section className="metrics-grid">
              <article className="metric-card">
                <div className="metric-top">
                  <span>Total submissions</span>
                  <span className="metric-icon lime">▤</span>
                </div>
                <div className="metric-value">{submissions.length}</div>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <span>Pending</span>
                  <span className="metric-icon orange">◷</span>
                </div>
                <div className="metric-value">{pendingCount}</div>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <span>Approved</span>
                  <span className="metric-icon lime">✓</span>
                </div>
                <div className="metric-value">{approvedCount}</div>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <span>Rejected</span>
                  <span className="metric-icon purple">×</span>
                </div>
                <div className="metric-value">{rejectedCount}</div>
              </article>
            </section>

            {error && (
              <div
                className="empty-state"
                role="alert"
                style={{ marginTop: "20px" }}
              >
                <p>{error}</p>

                {!authenticated && (
                  <button
                    type="button"
                    className="create-button"
                    style={{ marginTop: "14px" }}
                    onClick={() => router.push("/login")}
                  >
                    Log in again
                  </button>
                )}
              </div>
            )}

            {message && !error && (
              <div
                className="empty-state"
                role="status"
                style={{ marginTop: "20px" }}
              >
                {message}
              </div>
            )}

            {loading && (
              <div className="empty-state">
                Loading your submissions...
              </div>
            )}

            {!loading && !error && submissions.length > 0 && (
              <div className="campaign-grid" style={{ marginTop: "24px" }}>
                {submissions.map((submission) => {
                  const campaign = getCampaign(submission);
                  const contentUrl = getContentUrl(submission);
                  const status = getStatus(submission);

                  return (
                    <article
                      className="campaign-card"
                      key={submission._id}
                    >
                      <div className="campaign-card-body">
                        <div className="campaign-name-row">
                          <div>
                            <h3>
                              {campaign?.name || "Campaign submission"}
                            </h3>
                            <p>{campaign?.platform || "Social media"}</p>
                          </div>

                          <span
                            className="campaign-status"
                            style={statusStyle(status)}
                          >
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </span>
                        </div>

                        <div style={{ marginTop: "20px" }}>
                          <small>SUBMITTED CONTENT</small>
                          <p style={{ overflowWrap: "anywhere" }}>
                            {contentUrl ? (
                              <a
                                href={contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open my content ↗
                              </a>
                            ) : (
                              "Content URL unavailable"
                            )}
                          </p>
                        </div>

                        <div
                          className="campaign-card-footer"
                          style={{ marginTop: "20px" }}
                        >
                          <div>
                            <small>VIEWS</small>
                            <strong>
                              {(submission.views ?? 0).toLocaleString("en-IN")}
                            </strong>
                          </div>

                          <div>
                            <small>PAYOUT</small>
                            <strong>
                              ₹{(submission.payout ?? 0).toLocaleString("en-IN")}
                            </strong>
                          </div>
                        </div>

                        <div style={{ marginTop: "18px" }}>
                          <small>SUBMITTED ON</small>
                          <p>
                            {submission.createdAt &&
                            !Number.isNaN(
                              new Date(submission.createdAt).getTime()
                            )
                              ? new Date(
                                  submission.createdAt
                                ).toLocaleDateString("en-IN")
                              : "Date unavailable"}
                          </p>
                        </div>

                        {status === "pending" && (
                          <div
                            style={{
                              marginTop: "18px",
                              padding: "14px",
                              border: "1px solid #75543b",
                              borderRadius: "10px",
                              background: "#302319",
                            }}
                          >
                            <strong style={{ color: "#ffbc8b" }}>
                              Awaiting brand review
                            </strong>
                            <p style={{ marginTop: "6px", color: "#c5c5b9" }}>
                              Your submission is waiting for a decision.
                            </p>
                          </div>
                        )}

                        {status === "approved" && (
                          <div
                            style={{
                              marginTop: "18px",
                              padding: "14px",
                              border: "1px solid #526b35",
                              borderRadius: "10px",
                              background: "#202b17",
                            }}
                          >
                            <strong style={{ color: "#c4ff70" }}>
                              ✓ Content approved
                            </strong>
                            <p style={{ marginTop: "6px", color: "#d0d4c6" }}>
                              The brand has approved your submission.
                            </p>
                          </div>
                        )}

                        {status === "rejected" && (
                          <div
                            style={{
                              marginTop: "18px",
                              padding: "14px",
                              border: "1px solid #693b3b",
                              borderRadius: "10px",
                              background: "#301b1b",
                            }}
                          >
                            <strong style={{ color: "#ff9999" }}>
                              ✕ Content rejected
                            </strong>
                            <p style={{ marginTop: "10px", color: "#d0c5c5" }}>
                              <strong>Brand feedback:</strong>
                            </p>
                            <p
                              style={{
                                marginTop: "6px",
                                overflowWrap: "anywhere",
                                color: "#d0c5c5",
                              }}
                            >
                              {submission.reviewFeedback ||
                                "The brand did not provide feedback."}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginTop: "24px",
            }}
          >
            <button
              type="button"
              className="create-button"
              onClick={() => router.push("/creators")}
            >
              Browse campaigns ↗
            </button>

            <button
              type="button"
              className="create-button"
              onClick={() => router.push("/")}
            >
              Back to overview
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}