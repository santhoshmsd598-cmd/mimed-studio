
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CreateCampaign() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [budget, setBudget] = useState("10000");
  const [milestones, setMilestones] = useState([
    { views: "10000", payout: "500" },
    { views: "50000", payout: "2000" },
    { views: "100000", payout: "5000" },
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.role !== "brand") {
        setMessage("Only brand accounts can create campaigns.");
        setAuthChecking(false);
        return;
      }

      setAuthChecking(false);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/login");
    }
  }, [router]);

  function updateMilestone(
    index: number,
    field: "views" | "payout",
    value: string
  ) {
    setMilestones((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.role !== "brand") {
        setMessage("Only brand accounts can create campaigns.");
        return;
      }
    } catch {
      setMessage("Your login session is invalid. Please log in again.");
      return;
    }

    const numericBudget = Number(budget);

    if (!name.trim()) {
      setMessage("Enter a campaign name.");
      return;
    }

    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      setMessage("Enter a valid campaign budget.");
      return;
    }

    const parsedMilestones = milestones.map((item) => ({
      views: Number(item.views),
      payout: Number(item.payout),
    }));

    if (
      parsedMilestones.some(
        (item) =>
          !Number.isSafeInteger(item.views) ||
          item.views <= 0 ||
          !Number.isFinite(item.payout) ||
          item.payout <= 0
      )
    ) {
      setMessage("Enter valid positive views and payout values.");
      return;
    }

    if (
      parsedMilestones.some(
        (item, index) =>
          index > 0 && item.views <= parsedMilestones[index - 1].views
      )
    ) {
      setMessage("Milestone views must increase in order.");
      return;
    }

    if (parsedMilestones.some((item) => item.payout > numericBudget)) {
      setMessage("A milestone payout cannot exceed the campaign budget.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          platform,
          budget: numericBudget,
          milestones: parsedMilestones,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to create campaign.");
      }

      setMessage(
        `Campaign created successfully! Campaign ID: ${
          data.campaign?._id || data.campaign?.id || data._id || data.id || "Created"
        }`
      );

      setName("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Check your backend."
      );
    } finally {
      setLoading(false);
    }
  }

  if (authChecking) {
    return (
      <main className="create-page">
        <section className="create-card">
          <p>Checking your brand login...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="create-page">
      <div className="create-topbar">
        <a href="/">MIME'D<span>.</span></a>
        <a href="/">← Back to dashboard</a>
      </div>

      <section className="create-card">
        <div className="create-eyebrow">✳ CAMPAIGN STUDIO / NEW PROJECT</div>
        <h1>Create your next campaign<span>.</span></h1>
        <p className="create-description">
          Set your campaign budget, choose a platform, and define creator
          reward milestones.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="campaign-name">Campaign name</label>
          <input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gaming Goes Viral"
            required
          />

          <label htmlFor="platform">Social platform</label>
          <select
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option>YouTube</option>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>Facebook</option>
          </select>

          <label htmlFor="budget">Total campaign budget (₹)</label>
          <input
            id="budget"
            type="number"
            min="1"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />

          <div className="milestone-heading">
            <div>
              <h2>Reward milestones</h2>
              <p>Set the view target and payout for each milestone.</p>
            </div>
            <button
              type="button"
              className="add-milestone"
              onClick={() =>
                setMilestones((current) => [
                  ...current,
                  { views: "", payout: "" },
                ])
              }
            >
              + Add
            </button>
          </div>

          {milestones.map((milestone, index) => (
            <div className="milestone-row" key={index}>
              <div className="milestone-number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <label htmlFor={`views-${index}`}>Views</label>
                <input
                  id={`views-${index}`}
                  type="number"
                  min="1"
                  value={milestone.views}
                  onChange={(e) =>
                    updateMilestone(index, "views", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor={`payout-${index}`}>Payout (₹)</label>
                <input
                  id={`payout-${index}`}
                  type="number"
                  min="1"
                  value={milestone.payout}
                  onChange={(e) =>
                    updateMilestone(index, "payout", e.target.value)
                  }
                  required
                />
              </div>
              {milestones.length > 1 && (
                <button
                  type="button"
                  className="remove-milestone"
                  aria-label={`Remove milestone ${index + 1}`}
                  onClick={() =>
                    setMilestones((current) =>
                      current.filter((_, i) => i !== index)
                    )
                  }
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {message && (
            <div className="create-message" role="status">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="submit-campaign"
            disabled={loading}
          >
            {loading ? "Creating campaign..." : "Create campaign ↗"}
          </button>
        </form>
      </section>
    </main>
  );
}
