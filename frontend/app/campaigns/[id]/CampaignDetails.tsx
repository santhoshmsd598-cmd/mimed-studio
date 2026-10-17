"use client";

import { useEffect, useState } from "react";
import { getCampaigns, type Campaign } from "../../lib/api";

export default function CampaignDetails({ id }: { id: string }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCampaign() {
      try {
        const campaigns = await getCampaigns();

        const selected = campaigns.find((item) => {
          const itemId = (item as Campaign & { _id?: string })._id || item.id;
          return itemId === id;
        });

        if (!selected) {
          setError("Campaign not found.");
          return;
        }

        setCampaign(selected);
      } catch {
        setError("Unable to load campaign details. Check your backend.");
      } finally {
        setLoading(false);
      }
    }

    loadCampaign();
  }, [id]);

  const formatMoney = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <main className="studio">
        <section className="studio-main">
          <div className="dashboard-content">
            <div className="empty-state">Loading campaign details...</div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="studio">
        <section className="studio-main">
          <div className="dashboard-content">
            <div className="welcome-banner">
              <div className="welcome-copy">
                <h1>Campaign not found.</h1>
                <p>{error}</p>
                <a href="/" className="create-button">Back to dashboard</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const remaining = Math.max(campaign.budget - campaign.spent, 0);
  const percentage =
    campaign.budget > 0
      ? Math.min((campaign.spent / campaign.budget) * 100, 100)
      : 0;

  const brandName =
    typeof campaign.brand === "object"
      ? campaign.brand?.name || "Brand"
      : "Brand";

  return (
    <main className="studio">
      <section className="studio-main" style={{ width: "100%" }}>
        <header className="studio-header">
          <div>
            <div className="breadcrumb">WORKSPACE / CAMPAIGN DETAILS</div>
            <div className="header-title">{campaign.name}</div>
          </div>
          <a href="/" className="create-button">Back to dashboard</a>
        </header>

        <div className="dashboard-content">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <div className="eyebrow">✳ CAMPAIGN DETAILS</div>
              <h1>{campaign.name}<span>.</span></h1>
              <p>View campaign information, budget usage, and creator rewards.</p>
            </div>
          </section>

          <div className="section-heading">
            <div>
              <div className="section-kicker">CAMPAIGN OVERVIEW</div>
              <h2>The details<span>.</span></h2>
            </div>
          </div>

          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-top">
                <span>Total budget</span>
                <span className="metric-icon lime">₹</span>
              </div>
              <div className="metric-value">{formatMoney(campaign.budget)}</div>
              <div className="metric-bottom">Allocated campaign budget</div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>Amount spent</span>
                <span className="metric-icon purple">↗</span>
              </div>
              <div className="metric-value">{formatMoney(campaign.spent)}</div>
              <div className="metric-bottom">{percentage.toFixed(1)}% used</div>
              <div className="metric-progress">
                <span style={{ width: `${percentage}%` }} />
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>Remaining budget</span>
                <span className="metric-icon blue">₹</span>
              </div>
              <div className="metric-value">{formatMoney(remaining)}</div>
              <div className="metric-bottom">Budget still available</div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span>Status</span>
                <span className="metric-icon orange">✳</span>
              </div>
              <div className="metric-value">{campaign.status}</div>
              <div className="metric-bottom">{campaign.platform} campaign</div>
            </article>
          </section>

          <section className="campaign-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">CAMPAIGN INFORMATION</div>
                <h2>At a glance<span>.</span></h2>
              </div>
            </div>

            <article className="metric-card">
              <p>Campaign: <strong>{campaign.name}</strong></p>
              <p>Platform: <strong>{campaign.platform}</strong></p>
              <p>Brand: <strong>{brandName}</strong></p>
            </article>
          </section>

          <section className="campaign-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">CREATOR REWARDS</div>
                <h2>Reward milestones<span>.</span></h2>
              </div>
            </div>

            <article className="metric-card">
              {campaign.milestones?.length ? (
                campaign.milestones.map((milestone, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "16px 0",
                      borderBottom: "1px solid #30332a",
                    }}
                  >
                    <span>
                      Milestone {index + 1}: {milestone.views.toLocaleString("en-IN")} views
                    </span>
                    <strong>{formatMoney(milestone.payout)}</strong>
                  </div>
                ))
              ) : (
                <p>Reward milestones are not available.</p>
              )}
            </article>
          </section>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "24px" }}>
            <a href="/campaigns" className="create-button">All campaigns</a>
            <a href="/creators" className="create-button">Creator dashboard</a>
          </div>
        </div>
      </section>
    </main>
  );
}