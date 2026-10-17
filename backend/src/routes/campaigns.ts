
import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import { AuthRequest, protect, allowRoles } from "../middleware/auth";

const router = Router();

const supportedPlatforms = [
  "Instagram",
  "YouTube",
  "TikTok",
  "Facebook",
];

function formatCampaign(campaign: any) {
  return {
    id: campaign.id,
    name: campaign.name,
    platform: campaign.platform,
    budget: campaign.budget,
    spent: campaign.spent,
    remaining: campaign.budget - campaign.spent,
    milestones: campaign.milestones,
    brand: campaign.brand,
    status: campaign.status,
  };
}

router.post(
  "/",
  protect,
  allowRoles("brand"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, platform, budget, milestones } = req.body;
      const numericBudget = Number(budget);

      if (
        typeof name !== "string" ||
        !name.trim() ||
        !supportedPlatforms.includes(platform) ||
        !Number.isFinite(numericBudget) ||
        numericBudget <= 0 ||
        !Array.isArray(milestones) ||
        milestones.length === 0
      ) {
        return res.status(400).json({
          message: "Invalid campaign details",
        });
      }

      const validMilestones = milestones.every(
        (item: any) =>
          item &&
          Number.isSafeInteger(item.views) &&
          item.views > 0 &&
          Number.isFinite(item.payout) &&
          item.payout > 0
      );

      if (!validMilestones) {
        return res.status(400).json({
          message:
            "Milestones must contain positive integer view thresholds and positive payouts",
        });
      }

      const sortedMilestones = [...milestones].sort(
        (a: any, b: any) => a.views - b.views
      );

      for (let i = 1; i < sortedMilestones.length; i++) {
        if (sortedMilestones[i].views <= sortedMilestones[i - 1].views) {
          return res.status(400).json({
            message:
              "Milestone view thresholds must be unique and increasing",
          });
        }
      }

      if (sortedMilestones.some((item: any) => item.payout > numericBudget)) {
        return res.status(400).json({
          message: "No individual payout can exceed the campaign budget",
        });
      }

      if (!req.user?.userId) {
        return res.status(401).json({
          message: "Your login session is invalid. Please log in again.",
        });
      }

      const campaign = await Campaign.create({
        name: name.trim(),
        platform,
        budget: numericBudget,
        milestones: sortedMilestones,
        brand: req.user.userId,
      });

      return res.status(201).json({
        message: "Campaign created successfully",
        campaign: formatCampaign(campaign),
      });
    } catch (error: unknown) {
      console.error("Create campaign error:", error);

      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
          message: "Campaign model validation failed",
          details: error.message,
        });
      }

      if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({
          message: "Invalid campaign field value",
          details: error.message,
        });
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        return res.status(409).json({
          message: "A duplicate campaign record was detected",
        });
      }

      return res.status(500).json({
        message: "Unable to create campaign. Check the backend terminal.",
      });
    }
  }
);

router.get("/", async (_req: Request, res: Response) => {
  try {
    const campaigns = await Campaign.find({ status: "live" })
      .populate("brand", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      campaigns: campaigns.map(formatCampaign),
    });
  } catch (error) {
    console.error("List campaigns error:", error);

    return res.status(500).json({
      message: "Unable to retrieve campaigns",
    });
  }
});

router.get(
  "/mine",
  protect,
  allowRoles("brand"),
  async (req: AuthRequest, res: Response) => {
    try {
      const campaigns = await Campaign.find({
        brand: req.user!.userId,
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        campaigns: campaigns.map(formatCampaign),
      });
    } catch (error) {
      console.error("My campaigns error:", error);

      return res.status(500).json({
        message: "Unable to retrieve your campaigns",
      });
    }
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid campaign ID",
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      status: "live",
    }).populate("brand", "name");

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    return res.status(200).json({
      campaign: formatCampaign(campaign),
    });
  } catch (error) {
    console.error("Campaign details error:", error);

    return res.status(500).json({
      message: "Unable to retrieve campaign",
    });
  }
});

export default router;
