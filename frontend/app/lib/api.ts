
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export type Campaign = {
  id: string;
  _id?: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  remaining?: number;
  status: string;
  brand?: string | {
    _id: string;
    name: string;
  };
  milestones?: {
    views: number;
    payout: number;
  }[];
};
export async function getCampaigns(): Promise<Campaign[]> {
  const response = await fetch(`${API_URL}/api/campaigns`);

  if (!response.ok) {
    throw new Error("Unable to load campaigns");
  }

  const data = await response.json();

  return data.campaigns;
}
