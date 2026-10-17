
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Campaign = {
  _id?: string;
  id?: string;
  name: string;
  platform: string;
  status?: string;
  budget?: number;
  spent?: number;
};

type Submission = {
  _id: string;
  creator?: {
    name?: string;
    email?: string;
  } | string;
  postUrl?: string;
  contentUrl?: string;
  views?: number;
  payout?: number;
  reviewStatus?: "pending" | "approved" | "rejected";
  reviewFeedback?: string;
  createdAt?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BrandSubmissionsPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [token, setToken] = useState("");
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [reviewingId, setReviewingId] = useState("");
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [viewInputs, setViewInputs] = useState<Record<string, string>>({});
  const [updatingViewsId, setUpdatingViewsId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getCampaignId = (campaign: Campaign) =>
    campaign._id || campaign.id || "";

  const loadSubmissions = useCallback(
    async (campaignId: string, authToken: string) => {
      if (!campaignId || !authToken) {
        setSubmissions([]);
        return;
      }

      setLoadingSubmissions(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `${API_URL}/api/submissions/campaign/${encodeURIComponent(campaignId)}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load campaign submissions."
          );
        }

        const items: Submission[] = Array.isArray(data.submissions)
          ? data.submissions
          : [];

        setSubmissions(items);
        setMessage(
          items.length
            ? `${items.length} submission(s) found.`
            : "No creator submissions for this campaign yet."
        );
      } catch (err) {
        setSubmissions([]);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load submissions."
        );
      } finally {
        setLoadingSubmissions(false);
      }
    },
    []
  );

  useEffect(() => {
    async function initialize() {
      const savedToken = localStorage.getItem("token");

      if (!savedToken) {
        router.replace("/login");
        return;
      }

      setToken(savedToken);

      try {
        const response = await fetch(`${API_URL}/api/campaigns/mine`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your campaigns."
          );
        }

        const items: Campaign[] = Array.isArray(data)
          ? data
          : Array.isArray(data.campaigns)
            ? data.campaigns
            : [];

        setCampaigns(items);

        const firstCampaignId = items[0]
          ? getCampaignId(items[0])
          : "";

        setSelectedCampaignId(firstCampaignId);

        if (firstCampaignId) {
          await loadSubmissions(firstCampaignId, savedToken);
        } else {
          setSubmissions([]);
          setMessage("You haven't created any campaigns yet.");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to initialize Brand Reviews."
        );
      } finally {
        setLoadingCampaigns(false);
      }
    }

    initialize();
  }, [router, loadSubmissions]);

  async function handleCampaignChange(campaignId: string) {
    setSelectedCampaignId(campaignId);
    setFeedbacks({});
    setError("");
    setMessage("");

    await loadSubmissions(campaignId, token);
  }

  async function reviewSubmission(
    submissionId: string,
    reviewStatus: "approved" | "rejected"
  ) {
    const feedback = (feedbacks[submissionId] || "").trim();

    if (reviewStatus === "rejected" && !feedback) {
      setError("Please enter feedback before rejecting this submission.");
      return;
    }

    const confirmed = window.confirm(
      reviewStatus === "approved"
        ? "Approve this creator submission?"
        : "Reject this creator submission?"
    );

    if (!confirmed) return;

    setReviewingId(submissionId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/submissions/${encodeURIComponent(submissionId)}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviewStatus,
            reviewFeedback: feedback,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update the review."
        );
      }

      setMessage(
        reviewStatus === "approved"
          ? "Submission approved successfully."
          : "Submission rejected successfully."
      );

      await loadSubmissions(selectedCampaignId, token);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the review."
      );
    } finally {
      setReviewingId("");
    }
  }

  async function updateSubmissionViews(submission: Submission) {
    const submissionId = submission._id;
    const rawViews = viewInputs[submissionId] ?? String(submission.views ?? 0);
    const views = Number(rawViews);

    if (!Number.isSafeInteger(views) || views < 0) {
      setError("Enter a valid whole number of views (zero or more).");
      return;
    }

    if (views < Number(submission.views || 0)) {
      setError("The new view count cannot be lower than the current view count.");
      return;
    }

    const confirmed = window.confirm(
      `Update this submission to ${views.toLocaleString("en-IN")} views?`
    );

    if (!confirmed) return;

    setUpdatingViewsId(submissionId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/submissions/${encodeURIComponent(submissionId)}/views`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ views }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to update submission views.");
      }

      setMessage(data.message || "Views and milestone payout updated successfully.");
      setViewInputs((previous) => ({
        ...previous,
        [submissionId]: String(views),
      }));
      await loadSubmissions(selectedCampaignId, token);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update submission views."
      );
    } finally {
      setUpdatingViewsId("");
    }
  }

  function creatorDetails(creator?: Submission["creator"]) {
    if (typeof creator === "object" && creator !== null) {
      return {
        name: creator.name || "Creator",
        email: creator.email || "Email unavailable",
      };
    }

    return {
      name: "Creator",
      email:
        typeof creator === "string"
          ? creator
          : "Email unavailable",
    };
  }

  function getReviewStatus(submission: Submission) {
    const status = (submission.reviewStatus || "pending").toLowerCase();

    if (["approved", "rejected"].includes(status)) {
      return status;
    }

    return "pending";
  }

  function statusStyle(status: string): React.CSSProperties {
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
  }

  const pendingCount = submissions.filter(
    (item) => getReviewStatus(item) === "pending"
  ).length;

  const approvedCount = submissions.filter(
    (item) => getReviewStatus(item) === "approved"
  ).length;

  const rejectedCount = submissions.filter(
    (item) => getReviewStatus(item) === "rejected"
  ).length;

  return (
    <main className="studio">
      <section className="studio-main" style={{ width: "100%" }}>
        <header className="studio-header">
          <div>
            <div className="breadcrumb">
              BRAND WORKSPACE / SUBMISSIONS
            </div>
            <div className="header-title">Brand Reviews</div>
          </div>

          <button
            type="button"
            className="create-button"
            onClick={() => router.push("/")}
          >
            ← Back to overview
          </button>
        </header>

        <div className="dashboard-content">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span>✳</span> BRAND REVIEW CENTER
              </div>

              <h1>
                Creator content.
                <br />
                <span>One dashboard.</span>
              </h1>

              <p>
                Select your campaign, review creator posts, and approve
                or reject submissions from one place.
              </p>
            </div>
          </section>

          <section className="campaign-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">YOUR CAMPAIGNS</div>
                <h2>
                  Review submissions<span>.</span>
                </h2>
              </div>
            </div>

            <div
              className="metric-card"
              style={{
                display: "grid",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              <label htmlFor="campaignSelect">
                Select a campaign
              </label>

              <select
                id="campaignSelect"
                className="campaign-search"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  cursor: "pointer",
                }}
                value={selectedCampaignId}
                onChange={(event) =>
                  handleCampaignChange(event.target.value)
                }
                disabled={loadingCampaigns || campaigns.length === 0}
              >
                <option value="">
                  {loadingCampaigns
                    ? "Loading your campaigns..."
                    : campaigns.length === 0
                      ? "No campaigns available"
                      : "Choose a campaign"}
                </option>

                {campaigns.map((campaign) => {
                  const id = getCampaignId(campaign);

                  return (
                    <option key={id} value={id}>
                      {campaign.name} · {campaign.platform}
                    </option>
                  );
                })}
              </select>

              {selectedCampaignId && (
                <button
                  type="button"
                  className="create-button"
                  style={{ width: "100%" }}
                  disabled={loadingSubmissions || Boolean(reviewingId)}
                  onClick={() =>
                    loadSubmissions(selectedCampaignId, token)
                  }
                >
                  {loadingSubmissions
                    ? "Refreshing submissions..."
                    : "↻ Refresh submissions"}
                </button>
              )}
            </div>

            {error && (
              <div
                className="empty-state"
                role="alert"
                style={{ marginBottom: "16px" }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                className="empty-state"
                role="status"
                style={{ marginBottom: "16px" }}
              >
                {message}
              </div>
            )}

            {!loadingCampaigns && campaigns.length > 0 && (
              <section className="metrics-grid">
                <article className="metric-card">
                  <div className="metric-top">
                    <span>Total submissions</span>
                    <span className="metric-icon lime">▤</span>
                  </div>
                  <div className="metric-value">
                    {submissions.length}
                  </div>
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
            )}

            {loadingSubmissions && (
              <div className="empty-state">
                Loading creator submissions...
              </div>
            )}

            {!loadingCampaigns &&
              !loadingSubmissions &&
              campaigns.length > 0 &&
              submissions.length === 0 &&
              !error && (
                <div className="empty-state">
                  No creator submissions for this campaign yet.
                </div>
              )}

            {!loadingSubmissions && submissions.length > 0 && (
              <div className="campaign-grid" style={{ marginTop: "24px" }}>
                {submissions.map((submission) => {
                  const creator = creatorDetails(submission.creator);
                  const postUrl =
                    submission.postUrl || submission.contentUrl || "";
                  const reviewStatus = getReviewStatus(submission);
                  const isReviewing = reviewingId === submission._id;

                  return (
                    <article
                      className="campaign-card"
                      key={submission._id}
                    >
                      <div className="campaign-card-body">
                        <div className="campaign-name-row">
                          <div>
                            <h3>{creator.name}</h3>
                            <p>{creator.email}</p>
                          </div>

                          <span
                            className="campaign-status"
                            style={statusStyle(reviewStatus)}
                          >
                            {reviewStatus.charAt(0).toUpperCase() +
                              reviewStatus.slice(1)}
                          </span>
                        </div>

                        <div style={{ marginTop: "20px" }}>
                          <small>SUBMITTED CONTENT</small>
                          <p style={{ overflowWrap: "anywhere" }}>
                            {postUrl ? (
                              <a
                                href={postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open creator content ↗
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

                        {reviewStatus === "approved" && (
                          <div
                            style={{
                              display: "grid",
                              gap: "10px",
                              marginTop: "20px",
                              padding: "14px",
                              border: "1px solid #526b35",
                              borderRadius: "10px",
                              background: "#202b17",
                            }}
                          >
                            <label htmlFor={`views-${submission._id}`}>
                              Update total views
                            </label>
                            <input
                              id={`views-${submission._id}`}
                              type="number"
                              min={submission.views ?? 0}
                              step="1"
                              value={
                                viewInputs[submission._id] ??
                                String(submission.views ?? 0)
                              }
                              onChange={(event) =>
                                setViewInputs((previous) => ({
                                  ...previous,
                                  [submission._id]: event.target.value,
                                }))
                              }
                              disabled={Boolean(updatingViewsId)}
                              className="campaign-search"
                              style={{ width: "100%", maxWidth: "100%" }}
                            />
                            <button
                              type="button"
                              className="create-button"
                              style={{ width: "100%" }}
                              disabled={Boolean(updatingViewsId)}
                              onClick={() => updateSubmissionViews(submission)}
                            >
                              {updatingViewsId === submission._id
                                ? "Updating views..."
                                : "Update views & payout"}
                            </button>
                            <small>
                              Milestone rewards are calculated by the backend when views are updated.
                            </small>
                          </div>
                        )}

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

                        {submission.reviewFeedback && (
                          <div style={{ marginTop: "16px" }}>
                            <small>REVIEW FEEDBACK</small>
                            <p style={{ overflowWrap: "anywhere" }}>
                              {submission.reviewFeedback}
                            </p>
                          </div>
                        )}

                        {reviewStatus === "pending" && (
                          <div
                            style={{
                              display: "grid",
                              gap: "12px",
                              marginTop: "22px",
                            }}
                          >
                            <label htmlFor={`feedback-${submission._id}`}>
                              Feedback for creator
                            </label>

                            <textarea
                              id={`feedback-${submission._id}`}
                              className="campaign-search"
                              style={{
                                width: "100%",
                                maxWidth: "100%",
                                minHeight: "90px",
                                resize: "vertical",
                              }}
                              placeholder="Enter feedback. Required for rejection."
                              maxLength={500}
                              value={feedbacks[submission._id] || ""}
                              onChange={(event) =>
                                setFeedbacks((previous) => ({
                                  ...previous,
                                  [submission._id]: event.target.value,
                                }))
                              }
                              disabled={Boolean(reviewingId)}
                            />

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(2, minmax(0, 1fr))",
                                gap: "10px",
                              }}
                            >
                              <button
                                type="button"
                                className="create-button"
                                style={{
                                  width: "100%",
                                  borderColor: "#526b35",
                                }}
                                disabled={Boolean(reviewingId)}
                                onClick={() =>
                                  reviewSubmission(
                                    submission._id,
                                    "approved"
                                  )
                                }
                              >
                                {isReviewing ? "Saving..." : "✓ Approve"}
                              </button>

                              <button
                                type="button"
                                className="create-button"
                                style={{
                                  width: "100%",
                                  color: "#ff9999",
                                  borderColor: "#693b3b",
                                }}
                                disabled={Boolean(reviewingId)}
                                onClick={() =>
                                  reviewSubmission(
                                    submission._id,
                                    "rejected"
                                  )
                                }
                              >
                                {isReviewing ? "Saving..." : "✕ Reject"}
                              </button>
                            </div>
                          </div>
                        )}

                        {reviewStatus !== "pending" && (
                          <p
                            style={{
                              marginTop: "20px",
                              color: "#a2a597",
                            }}
                          >
                            This submission has already been reviewed.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
