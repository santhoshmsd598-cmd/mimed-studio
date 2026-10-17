"use client";

import { useEffect, useState } from "react";
import { getCampaigns, type Campaign } from "./lib/api";

const navigation = [
  { label: "Overview", icon: "◫", href: "/" },
  { label: "Campaigns", icon: "▤", href: "/campaigns" },
  { label: "My Campaigns", icon: "▣", href: "/my-campaigns" },
  { label: "Creators", icon: "♧", href: "/creators" },
  { label: "Submissions", icon: "↗", href: "/submissions" },
];

type User = {
  id?: string;
  name: string;
  email: string;
  role: string;
};

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    async function loadCampaigns() {
      try {
        const data = await getCampaigns();
        setCampaigns(data);
        setError("");
      } catch {
        setError("Unable to load campaigns. Check your backend connection.");
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

  const navigateTo = (href: string) => {
    window.location.href = href;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getCampaignId = (campaign: Campaign) => {
    return (
      (campaign as Campaign & { _id?: string })._id ||
      campaign.id ||
      ""
    );
  };

  const openCampaign = (campaign: Campaign) => {
    const id = getCampaignId(campaign);

    if (!id) {
      setError("Campaign ID is missing. Please refresh the page.");
      return;
    }

    navigateTo(`/campaigns/${encodeURIComponent(id)}`);
  };

  const submitContent = (campaign: Campaign) => {
    const id = getCampaignId(campaign);

    if (!id) {
      setError("Campaign ID is missing. Please refresh the page.");
      return;
    }

    navigateTo(`/submit-content?campaignId=${encodeURIComponent(id)}`);
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = campaigns.reduce(
    (sum, campaign) => sum + (Number(campaign.budget) || 0),
    0
  );

  const totalSpent = campaigns.reduce(
    (sum, campaign) => sum + (Number(campaign.spent) || 0),
    0
  );

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status?.toLowerCase() === "live"
  ).length;

  const totalRemaining = campaigns.reduce(
    (sum, campaign) =>
      sum +
      Math.max(
        (Number(campaign.budget) || 0) -
          (Number(campaign.spent) || 0),
        0
      ),
    0
  );

  const formatMoney = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const budgetPercentage =
    totalBudget > 0
      ? Math.min((totalSpent / totalBudget) * 100, 100)
      : 0;

  const campaignColor = (platform: string) => {
    const colors: Record<string, string> = {
      YouTube: "#c4ff70",
      Instagram: "#d7a6ff",
      TikTok: "#ffbc8b",
    };

    return colors[platform] ?? "#8bd5ff";
  };

  const campaignIcon = (platform: string) => {
    const icons: Record<string, string> = {
      YouTube: "▶",
      Instagram: "◎",
      TikTok: "✳",
    };

    return icons[platform] ?? "✦";
  };

  const displayStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  const userInitial = (currentUser?.name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: 0,
    zIndex: 9999,
    width: "280px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "#11130e",
    border: "1px solid #343b2b",
    borderRadius: "14px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
    color: "#f5f5ed",
  };

  const dropdownHeadingStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
    paddingBottom: "14px",
    marginBottom: "4px",
    borderBottom: "1px solid #303529",
  };

  const dropdownButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    minHeight: "42px",
    padding: "12px",
    textAlign: "left",
    color: "#f5f5ed",
    background: "#1b2015",
    border: "1px solid #343b2b",
    borderRadius: "8px",
    cursor: "pointer",
  };

  return (
    <main className="studio">
      <aside className="studio-sidebar">
        <a className="studio-logo" href="/">
          MIME'D<span>.</span>
        </a>

        <div className="workspace-label">WORKSPACE</div>

        <button
          type="button"
          className="workspace-card"
          onClick={() => navigateTo("/")}
        >
          <span className="workspace-avatar">M</span>
          <span className="workspace-details">
            <strong>MIME'D Studio</strong>
            <small>Brand workspace</small>
          </span>
          <span className="workspace-arrow">⌄</span>
        </button>

        <div className="nav-label">MENU</div>

        <nav className="studio-nav">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`nav-item ${
                active === item.label ? "active" : ""
              }`}
              onClick={() => {
                setActive(item.label);
                navigateTo(item.href);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.label === "Submissions" && (
                <span className="nav-count">↗</span>
              )}
            </button>
          ))}

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("/submit-content")}
          >
            <span className="nav-icon">＋</span>
            Submit content
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("/brand/submissions")}
          >
            <span className="nav-icon">✓</span>
            Brand reviews
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <span className="upgrade-spark">✳</span>
            <strong>Your next big thing starts here.</strong>
            <p>Turn attention into measurable growth.</p>
            <button
              type="button"
              onClick={() => navigateTo("/creators")}
            >
              Explore campaigns ↗
            </button>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">{userInitial}</div>
            <div className="workspace-details">
              <strong>{currentUser?.name || "Guest"}</strong>
              <small>
                {currentUser?.role
                  ? `${currentUser.role.charAt(0).toUpperCase()}${currentUser.role.slice(1)} account`
                  : "Not logged in"}
              </small>
            </div>
            <button
              type="button"
              className="sidebar-profile-menu"
              aria-label="Open profile"
              onClick={() => setProfileOpen((open) => !open)}
            >
              ···
            </button>
          </div>
        </div>
      </aside>

      <section className="studio-main">
        <header className="studio-header">
          <div>
            <div className="breadcrumb">
              WORKSPACE <span>/</span> OVERVIEW
            </div>
            <div className="header-title">Overview</div>
          </div>

          <div className="header-actions">
            <div className="connection-status">
              <span />
              {loading
                ? "Connecting..."
                : error
                  ? "Connection issue"
                  : "Live campaign data"}
            </div>

            <div
              className="profile-menu"
              style={{
                position: "relative",
                zIndex: 9999,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                className="profile-avatar profile-trigger"
                onClick={() => setProfileOpen((open) => !open)}
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                {userInitial}
              </button>

              {profileOpen && (
                <div style={dropdownStyle}>
                  <div style={dropdownHeadingStyle}>
                    <strong
                      style={{
                        display: "block",
                        color: "#f5f5ed",
                        fontSize: "15px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {currentUser?.name || "Guest"}
                    </strong>

                    <span
                      style={{
                        color: "#a2a597",
                        fontSize: "12px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {currentUser?.email || "Not logged in"}
                    </span>

                    <span
                      style={{ color: "#a2a597", fontSize: "12px" }}
                    >
                      Account type: {currentUser?.role || "Unknown"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo("/profile")}
                    style={dropdownButtonStyle}
                  >
                    <span style={{ color: "#c4ff70" }}>♙</span>
                    My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/my-campaigns")}
                    style={dropdownButtonStyle}
                  >
                    <span style={{ color: "#c4ff70" }}>▤</span>
                    My Campaigns
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      ...dropdownButtonStyle,
                      color: "#ff9999",
                    }}
                  >
                    <span>↪</span>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span>✳</span> YOUR CREATOR ECONOMY, IN MOTION
              </div>

              <h1>
                Good things happen
                <br />
                when <span>ideas connect.</span>
              </h1>

              <p>
                One workspace. Every campaign. All your creator partnerships
                in one place.
              </p>

              <div className="welcome-actions">
                <button
                  type="button"
                  className="create-button"
                  onClick={() => navigateTo("/campaigns")}
                >
                  ＋ Create campaign
                </button>

                <button
                  type="button"
                  className="create-button"
                  onClick={() => navigateTo("/submit-content")}
                >
                  Submit content ↗
                </button>
              </div>
            </div>

            <div className="banner-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-core">
                M<span>.</span>
              </div>
              <div className="art-tag tag-one">✳ CREATIVE</div>
              <div className="art-tag tag-two">↗ GROWTH</div>
              <div className="art-tag tag-three">✦ IMPACT</div>
            </div>

            <div className="banner-footer">
              <span>
                <i /> YOUR BRAND, AMPLIFIED
              </span>
              <span>EST. 2026</span>
            </div>
          </section>

          <div className="section-heading">
            <div>
              <div className="section-kicker">
                YOUR NUMBERS, AT A GLANCE
              </div>
              <h2>
                The big picture<span>.</span>
              </h2>
            </div>

            <span className="updated-label">
              <span />
              {loading ? "Updating dashboard" : "Connected to API"}
            </span>
          </div>

          {error && <div className="empty-state">{error}</div>}

          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-top">
                <span>Total campaign budget</span>
                <span className="metric-icon lime">₹</span>
              </div>
              <div className="metric-value">
                {loading ? "—" : formatMoney(totalBudget)}
              </div>
              <div className="metric-bottom">
                <span className="metric-dot" /> Across all campaigns
              </div>
              <div className="metric-decoration">₹</div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>Budget spent</span>
                <span className="metric-icon purple">↗</span>
              </div>
              <div className="metric-value">
                {loading ? "—" : formatMoney(totalSpent)}
              </div>
              <div className="metric-bottom">
                {budgetPercentage.toFixed(1)}% of total budget
              </div>
              <div className="metric-progress">
                <span style={{ width: `${budgetPercentage}%` }} />
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>Active campaigns</span>
                <span className="metric-icon orange">✳</span>
              </div>
              <div className="metric-value">
                {loading ? "—" : String(activeCampaigns).padStart(2, "0")}
              </div>
              <div className="metric-bottom">
                <span className="live-dot" /> Campaigns running
              </div>
              <div className="metric-decoration">↗</div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>Budget remaining</span>
                <span className="metric-icon blue">₹</span>
              </div>
              <div className="metric-value">
                {loading ? "—" : formatMoney(totalRemaining)}
              </div>
              <div className="metric-bottom">
                Available across your campaigns
              </div>
              <div className="avatar-stack">
                <span>₹</span>
                <span>↗</span>
                <span>✳</span>
                <span>+</span>
              </div>
            </article>
          </section>

          <section className="campaign-section">
            <div className="campaign-heading">
              <div>
                <div className="section-kicker">
                  MAKE SOMETHING MEMORABLE
                </div>
                <h2>
                  Your campaigns<span>.</span>
                </h2>
              </div>

              <button
                type="button"
                className="create-button"
                onClick={() => navigateTo("/campaigns")}
              >
                ＋ Create campaign
              </button>
            </div>

            <div className="campaign-toolbar">
              <div className="campaign-tabs">
                <button
                  type="button"
                  className={search === "" ? "selected-tab" : ""}
                  onClick={() => setSearch("")}
                >
                  All campaigns <span>{campaigns.length}</span>
                </button>
                <button
                  type="button"
                  className={search === "Gaming" ? "selected-tab" : ""}
                  onClick={() => setSearch("Gaming")}
                >
                  Featured
                </button>
                <button
                  type="button"
                  className={search === "Luma" ? "selected-tab" : ""}
                  onClick={() => setSearch("Luma")}
                >
                  Recently active
                </button>
              </div>

              <input
                className="campaign-search"
                placeholder="Search campaigns..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {loading && (
              <div className="empty-state">Loading your campaigns...</div>
            )}

            {!loading && !error && filteredCampaigns.length === 0 && (
              <div className="empty-state">
                No campaigns found. Create your first campaign to get started.
              </div>
            )}

            {!loading && !error && filteredCampaigns.length > 0 && (
              <div className="campaign-grid">
                {filteredCampaigns.map((campaign, index) => {
                  const budget = Number(campaign.budget) || 0;
                  const spent = Number(campaign.spent) || 0;
                  const spentPercentage =
                    budget > 0
                      ? Math.min((spent / budget) * 100, 100)
                      : 0;

                  const brandName =
                    typeof campaign.brand === "object"
                      ? campaign.brand?.name ?? "Brand"
                      : "Brand";

                  const isLive =
                    campaign.status?.toLowerCase() === "live";

                  return (
                    <article
                      className="campaign-card"
                      key={getCampaignId(campaign) || campaign.name}
                    >
                      <button
                        type="button"
                        onClick={() => openCampaign(campaign)}
                        aria-label={`Open ${campaign.name} details`}
                        className="campaign-cover-button"
                      >
                        <div
                          className="campaign-cover"
                          style={{
                            background: `linear-gradient(135deg, #20251b, ${campaignColor(campaign.platform)}30)`,
                          }}
                        >
                          <div className="cover-topline">
                            <span className="cover-category">
                              CREATOR CAMPAIGN /{" "}
                              {String(index + 1).padStart(2, "0")}
                            </span>

                            <span
                              className={`campaign-status ${
                                isLive ? "status-live" : "status-review"
                              }`}
                            >
                              <i />{" "}
                              {displayStatus(campaign.status || "pending")}
                            </span>
                          </div>

                          <div
                            className="cover-symbol"
                            style={{
                              color: campaignColor(campaign.platform),
                            }}
                          >
                            {campaignIcon(campaign.platform)}
                          </div>

                          <div className="cover-title">
                            {campaign.platform}<span>.</span>
                          </div>

                          <div className="cover-brand">
                            {brandName.toUpperCase()}
                          </div>
                        </div>
                      </button>

                      <div className="campaign-card-body">
                        <div className="campaign-name-row">
                          <div>
                            <h3>{campaign.name}</h3>
                            <p>
                              {brandName} · {campaign.platform}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="more-button"
                            aria-label={`Open ${campaign.name}`}
                            onClick={() => openCampaign(campaign)}
                          >
                            ···
                          </button>
                        </div>

                        <div className="campaign-budget-row">
                          <span>Budget utilization</span>
                          <strong>{spentPercentage.toFixed(1)}%</strong>
                        </div>

                        <div className="budget-track">
                          <span
                            style={{
                              width: `${spentPercentage}%`,
                              background: campaignColor(campaign.platform),
                            }}
                          />
                        </div>

                        <div className="campaign-card-footer">
                          <div>
                            <small>SPENT</small>
                            <strong>{formatMoney(spent)}</strong>
                          </div>

                          <div>
                            <small>AVAILABLE</small>
                            <strong>
                              {formatMoney(Math.max(budget - spent, 0))}
                            </strong>
                          </div>

                          <button
                            type="button"
                            aria-label="Open campaign details"
                            onClick={() => openCampaign(campaign)}
                          >
                            ↗
                          </button>
                        </div>

                        <button
                          type="button"
                          className="create-button"
                          style={{ width: "100%", marginTop: "18px" }}
                          onClick={() => submitContent(campaign)}
                        >
                          Submit content ↗
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section
            className="campaign-section"
            style={{ marginTop: "36px" }}
          >
            <div className="section-heading">
              <div>
                <div className="section-kicker">CREATOR WORKSPACE</div>
                <h2>
                  Quick access<span>.</span>
                </h2>
              </div>
            </div>

            <div className="quick-access-actions">
              <button
                type="button"
                className="create-button"
                onClick={() => navigateTo("/creators")}
              >
                Browse campaigns ↗
              </button>

              <button
                type="button"
                className="create-button"
                onClick={() => navigateTo("/submit-content")}
              >
                Submit content ↗
              </button>

              <button
                type="button"
                className="create-button"
                onClick={() => navigateTo("/submissions")}
              >
                My submissions ↗
              </button>

              <button
                type="button"
                className="create-button"
                onClick={() => navigateTo("/brand/submissions")}
              >
                Brand reviews ↗
              </button>

              <button
                type="button"
                className="create-button"
                onClick={() => navigateTo("/my-campaigns")}
              >
                My Campaigns ↗
              </button>
            </div>
          </section>

          <footer className="studio-footer">
            <span>© 2026 MIME'D STUDIO</span>
            <span>BUILT FOR THE CULTURE. DESIGNED FOR GROWTH.</span>
            <span>
              <i /> ALL SYSTEMS NOMINAL
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}