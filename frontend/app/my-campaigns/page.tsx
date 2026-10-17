
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCampaigns, type Campaign } from "../lib/api";

export default function MyCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMyCampaigns() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your campaigns.");
        }

        setCampaigns(Array.isArray(data) ? data : data.campaigns || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your campaigns."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMyCampaigns();
  }, [router]);

  const formatMoney = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#0c0e09",
        color: "#f5f5ed",
      }}
    >
      <button
        type="button"
        onClick={() => router.push("/")}
        style={{
          padding: "10px 16px",
          borderRadius: "8px",
          border: "1px solid #343b2b",
          background: "#1b2015",
          color: "#c4ff70",
          cursor: "pointer",
        }}
      >
        ← Back to Dashboard
      </button>

      <header style={{ marginTop: "32px", marginBottom: "28px" }}>
        <p style={{ color: "#c4ff70", letterSpacing: "2px" }}>
          BRAND WORKSPACE
        </p>

        <h1 style={{ fontSize: "36px", margin: "12px 0" }}>
          My Campaigns
        </h1>

        <p style={{ color: "#a2a597" }}>
          View and track the campaigns created by your account.
        </p>
      </header>

      {loading && <p>Loading your campaigns...</p>}

      {!loading && error && (
        <div
          style={{
            padding: "18px",
            border: "1px solid #693b3b",
            borderRadius: "10px",
            color: "#ff9999",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <div
          style={{
            padding: "30px",
            border: "1px solid #343b2b",
            borderRadius: "12px",
            background: "#11130e",
          }}
        >
          <h2>No campaigns yet</h2>
          <p style={{ color: "#a2a597" }}>
            Create your first campaign to get started.
          </p>

          <button
            type="button"
            onClick={() => router.push("/campaigns")}
            style={{
              marginTop: "16px",
              padding: "12px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#c4ff70",
              color: "#11130e",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Create Campaign
          </button>
        </div>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {campaigns.map((campaign) => {
            const id =
              (campaign as Campaign & { _id?: string })._id ||
              campaign.id;

            const budget = Number(campaign.budget) || 0;
            const spent = Number(campaign.spent) || 0;
            const remaining = Math.max(budget - spent, 0);

            return (
              <article
                key={id || campaign.name}
                style={{
                  padding: "24px",
                  background: "#11130e",
                  border: "1px solid #343b2b",
                  borderRadius: "14px",
                }}
              >
                <p style={{ color: "#c4ff70", fontSize: "13px" }}>
                  {campaign.platform}
                </p>

                <h2 style={{ fontSize: "22px", margin: "12px 0" }}>
                  {campaign.name}
                </h2>

                <p style={{ color: "#a2a597" }}>
                  Status: {campaign.status || "Pending"}
                </p>

                <div style={{ marginTop: "24px", lineHeight: 2 }}>
                  <p>
                    Total budget: <strong>{formatMoney(budget)}</strong>
                  </p>
                  <p>
                    Amount spent: <strong>{formatMoney(spent)}</strong>
                  </p>
                  <p>
                    Remaining: <strong>{formatMoney(remaining)}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    id && router.push(`/campaigns/${encodeURIComponent(id)}`)
                  }
                  disabled={!id}
                  style={{
                    width: "100%",
                    marginTop: "20px",
                    padding: "12px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#c4ff70",
                    color: "#11130e",
                    cursor: id ? "pointer" : "not-allowed",
                    fontWeight: 600,
                  }}
                >
                  View Campaign →
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
