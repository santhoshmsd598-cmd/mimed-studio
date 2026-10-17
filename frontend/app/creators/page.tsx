"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Milestone = {
  views: number;
  payout: number;
};

type Campaign = {
  _id?: string;
  id?: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  status: string;
  milestones?: Milestone[];
};

type Submission = {
  _id?: string;
  id?: string;
  campaign?: {
    name?: string;
    platform?: string;
  } | string | null;
  postUrl?: string;
  contentUrl?: string;
  url?: string;
  reviewStatus?: string;
  status?: string;
  views?: number;
  payout?: number;
  createdAt?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CAMPAIGNS_PER_PAGE = 6;

export default function CreatorsPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Creator");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [profileRole, setProfileRole] = useState("creator");

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [budgetSort, setBudgetSort] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setUserName(user.name || user.username || "Creator");
          setProfileEmail(user.email || "Not provided");
          setProfileRole(user.role || "creator");
        } catch {
          setUserName("Creator");
        }
      }

      const token = localStorage.getItem("token");

      const campaignResponse = await fetch(`${API_URL}/api/campaigns`, {
        cache: "no-store",
      });

      const campaignData = await campaignResponse.json();

      if (!campaignResponse.ok) {
        throw new Error(
          campaignData.message || "Unable to load campaigns."
        );
      }

      const availableCampaigns: Campaign[] = Array.isArray(campaignData)
        ? campaignData
        : Array.isArray(campaignData.campaigns)
          ? campaignData.campaigns
          : [];

      setCampaigns(availableCampaigns);

      if (!token) {
        setSubmissions([]);
        return;
      }

      const submissionResponse = await fetch(
        `${API_URL}/api/submissions/mine`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const submissionData = await submissionResponse.json();

      if (submissionResponse.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setSubmissions([]);
        return;
      }

      if (submissionResponse.status === 403) {
        throw new Error(
          submissionData.message ||
            "Your account does not have creator access."
        );
      }

      if (!submissionResponse.ok) {
        throw new Error(
          submissionData.message || "Unable to load your submissions."
        );
      }

      const items: Submission[] = Array.isArray(submissionData)
        ? submissionData
        : Array.isArray(submissionData.submissions)
          ? submissionData.submissions
          : [];

      setSubmissions(items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the creator dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  const formatMoney = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const totalViews = submissions.reduce(
    (total, submission) => total + Number(submission.views || 0),
    0
  );

  const totalEarnings = submissions.reduce(
    (total, submission) => total + Number(submission.payout || 0),
    0
  );

  const pendingCount = submissions.filter(
    (submission) => getStatus(submission) === "pending"
  ).length;

  const approvedCount = submissions.filter(
    (submission) => getStatus(submission) === "approved"
  ).length;

  const rejectedCount = submissions.filter(
    (submission) => getStatus(submission) === "rejected"
  ).length;

  const platforms = useMemo(
    () =>
      Array.from(
        new Set(
          campaigns
            .map((campaign) => campaign.platform?.trim())
            .filter((platform): platform is string => Boolean(platform))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [campaigns]
  );

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(query) ||
        campaign.platform.toLowerCase().includes(query);

      const matchesPlatform =
        platformFilter === "all" ||
        campaign.platform.toLowerCase() === platformFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        campaign.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesPlatform && matchesStatus;
    });

    if (budgetSort === "low-high") {
      filtered.sort((a, b) => a.budget - b.budget);
    } else if (budgetSort === "high-low") {
      filtered.sort((a, b) => b.budget - a.budget);
    }

    return filtered;
  }, [campaigns, search, platformFilter, statusFilter, budgetSort]);

  const totalPages = Math.ceil(
    filteredCampaigns.length / CAMPAIGNS_PER_PAGE
  );

  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * CAMPAIGNS_PER_PAGE;

    return filteredCampaigns.slice(
      startIndex,
      startIndex + CAMPAIGNS_PER_PAGE
    );
  }, [filteredCampaigns, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, platformFilter, statusFilter, budgetSort]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openSubmissionForm = (campaign: Campaign) => {
    const campaignId = campaign._id || campaign.id;

    if (!campaignId) {
      setError("Campaign ID is missing. Please refresh the page.");
      return;
    }

    router.push(
      `/submit-content?campaignId=${encodeURIComponent(campaignId)}`
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const clearFilters = () => {
    setSearch("");
    setPlatformFilter("all");
    setStatusFilter("all");
    setBudgetSort("default");
    setCurrentPage(1);
  };

  return (
    <main className="studio">
      <section className="studio-main" style={{ width: "100%" }}>
        <header className="studio-header">
          <div>
            <div className="breadcrumb">WORKSPACE / CREATORS</div>
            <div className="header-title">Creator Dashboard</div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="create-button"
              onClick={() => setProfileOpen(true)}
            >
              Profile
            </button>
            <button
              type="button"
              className="create-button"
              onClick={handleLogout}
            >
              Logout
            </button>
            <button
              type="button"
              className="create-button"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span>✳</span> YOUR CREATOR WORKSPACE
              </div>

              <h1>
                Welcome back,
                <br />
                <span>{userName}.</span>
              </h1>

              <p>
                Track your content performance, monitor your earnings, and
                discover your next brand partnership.
              </p>
            </div>
          </section>

          <section className="campaign-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">YOUR PERFORMANCE</div>
                <h2>
                  Creator overview<span>.</span>
                </h2>
              </div>
            </div>

            <div className="metrics-grid">
              <article className="metric-card">
                <div className="metric-top">
                  <span>Total submissions</span>
                  <span className="metric-icon lime">▤</span>
                </div>
                <div className="metric-value">{submissions.length}</div>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <span>Pending reviews</span>
                  <span className="metric-icon orange">◷</span>
                </div>
                <div className="metric-value">{pendingCount}</div>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <span>Total views</span>
                  <span className="metric-icon lime">↗</span>
                </div>
                <div className="metric-value">
                  {totalViews.toLocaleString("en-IN")}
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <span>Total earnings</span>
                  <span className="metric-icon purple">₹</span>
                </div>
                <div className="metric-value">
                  {formatMoney(totalEarnings)}
                </div>
              </article>
            </div>

            <div className="metrics-grid" style={{ marginTop: "16px" }}>
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
            </div>

            {error && (
              <div
                className="empty-state"
                role="alert"
                style={{ marginTop: "20px" }}
              >
                {error}
              </div>
            )}
          </section>

          <section className="campaign-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">AVAILABLE OPPORTUNITIES</div>
                <h2>
                  Explore campaigns<span>.</span>
                </h2>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaign or platform..."
                aria-label="Search campaigns"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #30332a",
                  background: "#11120f",
                  color: "#ffffff",
                }}
              />

              <select
                value={platformFilter}
                onChange={(event) => setPlatformFilter(event.target.value)}
                aria-label="Filter by platform"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #30332a",
                  background: "#11120f",
                  color: "#ffffff",
                }}
              >
                <option value="all">All platforms</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by campaign status"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #30332a",
                  background: "#11120f",
                  color: "#ffffff",
                }}
              >
                <option value="all">All statuses</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>

              <select
                value={budgetSort}
                onChange={(event) => setBudgetSort(event.target.value)}
                aria-label="Sort campaigns by budget"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #30332a",
                  background: "#11120f",
                  color: "#ffffff",
                }}
              >
                <option value="default">Default order</option>
                <option value="low-high">Budget: low to high</option>
                <option value="high-low">Budget: high to low</option>
              </select>
            </div>

            {loading && (
              <div className="empty-state">Loading campaigns...</div>
            )}

            {!loading && campaigns.length === 0 && !error && (
              <div className="empty-state">
                No campaigns are available yet.
              </div>
            )}

            {!loading &&
              campaigns.length > 0 &&
              filteredCampaigns.length === 0 && (
                <div className="empty-state">
                  No campaigns match your search or filters.
                  <div style={{ marginTop: "16px" }}>
                    <button
                      type="button"
                      className="create-button"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}

            {!loading && filteredCampaigns.length > 0 && (
              <>
                <p style={{ marginBottom: "16px", color: "#b8b9ad" }}>
                  Showing{" "}
                  {(currentPage - 1) * CAMPAIGNS_PER_PAGE + 1}–
                  {Math.min(
                    currentPage * CAMPAIGNS_PER_PAGE,
                    filteredCampaigns.length
                  )}{" "}
                  of {filteredCampaigns.length} campaigns
                </p>

                <div className="campaign-grid">
                  {paginatedCampaigns.map((campaign) => {
                    const status = (campaign.status || "").toLowerCase();

                    return (
                      <article
                        className="campaign-card"
                        key={campaign._id || campaign.id || campaign.name}
                      >
                        <div
                          className="campaign-cover"
                          style={{
                            background:
                              "linear-gradient(135deg, #20251b, #c4ff7030)",
                          }}
                        >
                          <div className="cover-topline">
                            <span className="cover-category">
                              CREATOR OPPORTUNITY
                            </span>

                            <span
                              className={`campaign-status ${
                                status === "live"
                                  ? "status-live"
                                  : "status-review"
                              }`}
                            >
                              <i />
                              {campaign.status}
                            </span>
                          </div>

                          <div className="cover-symbol">✳</div>

                          <div className="cover-title">
                            {campaign.platform}
                            <span>.</span>
                          </div>

                          <div className="cover-brand">BRAND CAMPAIGN</div>
                        </div>

                        <div className="campaign-card-body">
                          <div className="campaign-name-row">
                            <div>
                              <h3>{campaign.name}</h3>
                              <p>{campaign.platform} · Creator campaign</p>
                            </div>
                          </div>

                          <div className="campaign-card-footer">
                            <div>
                              <small>TOTAL BUDGET</small>
                              <strong>{formatMoney(campaign.budget)}</strong>
                            </div>

                            <div>
                              <small>STATUS</small>
                              <strong>{campaign.status}</strong>
                            </div>
                          </div>

                          <div style={{ marginTop: "20px" }}>
                            <strong>Reward milestones</strong>

                            {campaign.milestones?.length ? (
                              campaign.milestones.map((milestone, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    padding: "12px 0",
                                    borderBottom: "1px solid #30332a",
                                  }}
                                >
                                  <span>
                                    {Number(milestone.views).toLocaleString(
                                      "en-IN"
                                    )}{" "}
                                    views
                                  </span>

                                  <strong>
                                    {formatMoney(milestone.payout)}
                                  </strong>
                                </div>
                              ))
                            ) : (
                              <p style={{ marginTop: "10px" }}>
                                Reward details are not available.
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            className="create-button"
                            style={{ width: "100%", marginTop: "20px" }}
                            disabled={status !== "live"}
                            onClick={() => openSubmissionForm(campaign)}
                          >
                            {status === "live"
                              ? "Submit content ↗"
                              : "Campaign unavailable"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <nav
                    aria-label="Campaign pages"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "28px",
                    }}
                  >
                    <button
                      type="button"
                      className="create-button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        type="button"
                        key={page}
                        className="create-button"
                        aria-current={currentPage === page ? "page" : undefined}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          minWidth: "44px",
                          background:
                            currentPage === page ? "#c4ff70" : "#171913",
                          color:
                            currentPage === page ? "#10110e" : "#ffffff",
                          border:
                            currentPage === page
                              ? "1px solid #c4ff70"
                              : "1px solid #30332a",
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="create-button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        )
                      }
                      style={{
                        opacity: currentPage === totalPages ? 0.5 : 1,
                      }}
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>

          <section className="campaign-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">RECENT ACTIVITY</div>
                <h2>
                  Your submissions<span>.</span>
                </h2>
              </div>

              <button
                type="button"
                className="create-button"
                onClick={() => router.push("/submissions")}
              >
                View all ↗
              </button>
            </div>

            {!loading && submissions.length === 0 && (
              <div className="empty-state">
                You haven't submitted any content yet.
                <p style={{ marginTop: "8px" }}>
                  Explore live campaigns above to get started.
                </p>
              </div>
            )}

            {submissions.length > 0 && (
              <div className="campaign-grid">
                {submissions.slice(0, 3).map((submission, index) => {
                  const campaign =
                    typeof submission.campaign === "object" &&
                    submission.campaign !== null
                      ? submission.campaign
                      : undefined;

                  const status = getStatus(submission);

                  return (
                    <article
                      className="campaign-card"
                      key={submission._id || submission.id || index}
                    >
                      <div className="campaign-card-body">
                        <div className="campaign-name-row">
                          <div>
                            <h3>
                              {campaign?.name || "Campaign submission"}
                            </h3>
                            <p>{campaign?.platform || "Social media"}</p>
                          </div>

                          <span className="campaign-status">{status}</span>
                        </div>

                        <div className="campaign-card-footer">
                          <div>
                            <small>VIEWS</small>
                            <strong>
                              {Number(submission.views || 0).toLocaleString(
                                "en-IN"
                              )}
                            </strong>
                          </div>

                          <div>
                            <small>PAYOUT</small>
                            <strong>
                              {formatMoney(submission.payout || 0)}
                            </strong>
                          </div>
                        </div>
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
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "28px",
            }}
          >
            <button
              type="button"
              className="create-button"
              onClick={() => router.push("/submissions")}
            >
              My submissions ↗
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

      {profileOpen && (
        <div
          role="presentation"
          onClick={() => setProfileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.75)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "28px",
              border: "1px solid #30332a",
              borderRadius: "18px",
              background: "#11120f",
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <h2 id="profile-title" style={{ margin: 0 }}>Your profile</h2>
              <button type="button" className="create-button" onClick={() => setProfileOpen(false)} aria-label="Close profile">✕</button>
            </div>
            <div style={{ marginTop: "24px", display: "grid", gap: "16px" }}>
              <div>
                <small style={{ color: "#b8b9ad" }}>Name</small>
                <p style={{ margin: "6px 0 0" }}>{userName}</p>
              </div>
              <div>
                <small style={{ color: "#b8b9ad" }}>Email</small>
                <p style={{ margin: "6px 0 0", overflowWrap: "anywhere" }}>{profileEmail || "Not provided"}</p>
              </div>
              <div>
                <small style={{ color: "#b8b9ad" }}>Account type</small>
                <p style={{ margin: "6px 0 0", textTransform: "capitalize" }}>{profileRole}</p>
              </div>
            </div>
            <button type="button" className="create-button" style={{ width: "100%", marginTop: "24px" }} onClick={() => setProfileOpen(false)}>Close</button>
          </section>
        </div>
      )}
    </main>
  );
}