"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Campaign = {
  _id?: string;
  id?: string;
  name: string;
  platform: string;
  status?: string;
};

type ApiResponse = {
  message?: string;
  error?: string;
  submission?: unknown;
  [key: string]: unknown;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SubmitContentPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const response = await fetch(`${API_URL}/api/campaigns`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load campaigns.");
        }

        const data = await response.json();
        const items: Campaign[] = Array.isArray(data.campaigns)
          ? data.campaigns
          : [];

        const liveCampaigns = items.filter(
          (campaign) =>
            (campaign.status || "").toLowerCase() === "live"
        );

        setCampaigns(liveCampaigns);

        const params = new URLSearchParams(window.location.search);
        const requestedCampaignId = params.get("campaignId");

        const selectedCampaign = liveCampaigns.find(
          (campaign) =>
            (campaign._id || campaign.id) === requestedCampaignId
        );

        if (selectedCampaign) {
          setCampaignId(
            selectedCampaign._id || selectedCampaign.id || ""
          );
        } else if (liveCampaigns.length > 0) {
          setCampaignId(
            liveCampaigns[0]._id || liveCampaigns[0].id || ""
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load campaigns. Check your backend connection."
        );
      } finally {
        setLoadingCampaigns(false);
      }
    }

    loadCampaigns();
  }, []);

  function isValidContentUrl(value: string) {
    try {
      const url = new URL(value.trim());

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return false;
      }

      const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

      if (
        hostname === "youtube.com" ||
        hostname === "m.youtube.com" ||
        hostname === "music.youtube.com"
      ) {
        return (
          (url.pathname === "/watch" &&
            Boolean(url.searchParams.get("v"))) ||
          /^\/(shorts|live|embed)\/[^/]+\/?$/i.test(url.pathname)
        );
      }

      if (hostname === "youtu.be") {
        return url.pathname.split("/").filter(Boolean).length > 0;
      }

      if (hostname === "instagram.com") {
        return /^\/(p|reel|reels|tv)\/[^/]+\/?$/i.test(url.pathname);
      }

      return false;
    } catch {
      return false;
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.role !== "creator") {
        setError("Please log in with a creator account to submit content.");
        return;
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    if (!campaignId) {
      setError("Select a campaign.");
      return;
    }

    const trimmedUrl = contentUrl.trim();

    if (!isValidContentUrl(trimmedUrl)) {
      setError(
        "Enter a valid Instagram post/Reel or YouTube video URL."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId,
          contentUrl: trimmedUrl,
        }),
      });

      const responseText = await response.text();
      let data: ApiResponse = {};

      try {
        data = JSON.parse(responseText) as ApiResponse;
      } catch {
        data = { message: responseText };
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const details =
          data.message ||
          data.error ||
          `The server rejected the submission (HTTP ${response.status}).`;

        throw new Error(
          typeof details === "string"
            ? details
            : JSON.stringify(details)
        );
      }

      setMessage("Your content was submitted successfully!");
      setContentUrl("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit content."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="studio">
      <section className="studio-main" style={{ width: "100%" }}>
        <header className="studio-header">
          <div>
            <div className="breadcrumb">
              WORKSPACE / SUBMIT CONTENT
            </div>
            <div className="header-title">Submit Content</div>
          </div>

          <a href="/creators" className="create-button">
            Browse campaigns
          </a>
        </header>

        <div className="dashboard-content">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span>✳</span> CREATOR SUBMISSION
              </div>

              <h1>
                Your content.
                <br />
                <span>Your opportunity.</span>
              </h1>

              <p>
                Choose a live campaign and share your published content
                for brand review.
              </p>
            </div>
          </section>

          <section className="campaign-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">CONTENT DETAILS</div>
                <h2>
                  Submit your work<span>.</span>
                </h2>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="metric-card"
              style={{
                maxWidth: "850px",
                display: "grid",
                gap: "22px",
              }}
            >
              <div>
                <label
                  htmlFor="campaign"
                  style={{
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  Select campaign
                </label>

                <select
                  id="campaign"
                  className="campaign-search"
                  style={{ width: "100%", maxWidth: "100%" }}
                  value={campaignId}
                  onChange={(event) =>
                    setCampaignId(event.target.value)
                  }
                  disabled={
                    loadingCampaigns || campaigns.length === 0
                  }
                  required
                >
                  {loadingCampaigns && (
                    <option value="">Loading campaigns...</option>
                  )}

                  {!loadingCampaigns && campaigns.length === 0 && (
                    <option value="">
                      No live campaigns available
                    </option>
                  )}

                  {campaigns.map((campaign) => (
                    <option
                      key={campaign._id || campaign.id}
                      value={campaign._id || campaign.id || ""}
                    >
                      {campaign.name} — {campaign.platform}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="contentUrl"
                  style={{
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  Content URL
                </label>

                <input
                  id="contentUrl"
                  className="campaign-search"
                  style={{ width: "100%", maxWidth: "100%" }}
                  type="url"
                  placeholder="Paste your Instagram post, Reel, or YouTube URL"
                  value={contentUrl}
                  onChange={(event) =>
                    setContentUrl(event.target.value)
                  }
                  required
                />

                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#999d8f",
                    overflowWrap: "anywhere",
                  }}
                >
                  Supported: Instagram posts/Reels and YouTube
                  videos/Shorts. Extra URL parameters are allowed.
                </p>
              </div>

              {error && (
                <div className="empty-state" role="alert">
                  {error}
                </div>
              )}

              {message && (
                <div className="empty-state" role="status">
                  {message}
                  <p style={{ marginTop: "10px" }}>
                    <a href="/submissions">
                      View my submissions ↗
                    </a>
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="create-button"
                disabled={
                  loading ||
                  loadingCampaigns ||
                  campaigns.length === 0
                }
                style={{ width: "100%" }}
              >
                {loading ? "Submitting..." : "Submit content ↗"}
              </button>
            </form>

            <div style={{ marginTop: "20px" }}>
              <a href="/submissions">
                View my submissions ↗
              </a>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}