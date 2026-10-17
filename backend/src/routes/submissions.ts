
import { Router, Response } from "express";
import mongoose from "mongoose";
import Submission from "../models/Submission";
import Campaign from "../models/Campaign";
import { AuthRequest, protect, allowRoles } from "../middleware/auth";

const router = Router();

function isValidPostUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return false;
    }

    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "instagram.com") {
      return /^\/(p|reel|reels|tv)\/[^/]+\/?$/i.test(url.pathname);
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com"
    ) {
      return (
        (url.pathname === "/watch" && Boolean(url.searchParams.get("v"))) ||
        /^\/(shorts|live|embed)\/[^/]+\/?$/i.test(url.pathname)
      );
    }

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean).length > 0;
    }

    return false;
  } catch {
    return false;
  }
}

router.post(
  "/",
  protect,
  allowRoles("creator"),
  async (req: AuthRequest, res: Response) => {
    try {
      const campaignId = req.body.campaignId;
      const postUrl = req.body.postUrl ?? req.body.contentUrl;

      if (!mongoose.isValidObjectId(campaignId)) {
        return res.status(400).json({
          message: "Valid campaign ID is required"
        });
      }

      if (!isValidPostUrl(postUrl)) {
        return res.status(400).json({
          message: "Enter a valid Instagram or YouTube post URL"
        });
      }

      const campaign = await Campaign.findOne({
        _id: campaignId,
        status: "live"
      });

      if (!campaign) {
        return res.status(404).json({
          message: "Live campaign not found"
        });
      }

      const submission = await Submission.create({
        campaign: campaign._id,
        creator: req.user!.userId,
        postUrl: postUrl.trim(),
        views: 0,
        payout: 0,
        paidMilestoneViews: 0,
        reviewStatus: "pending",
        reviewFeedback: ""
      });

      return res.status(201).json({
        message: "Post submitted successfully",
        submission
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "This post has already been submitted to this campaign"
        });
      }

      console.error("Submission error:", error);

      return res.status(500).json({
        message: "Unable to submit post"
      });
    }
  }
);

router.get(
  "/mine",
  protect,
  allowRoles("creator"),
  async (req: AuthRequest, res: Response) => {
    try {
      const submissions = await Submission.find({
        creator: req.user!.userId
      })
        .populate("campaign", "name platform status")
        .sort({ createdAt: -1 });

      return res.status(200).json({ submissions });
    } catch (error) {
      console.error("My submissions error:", error);

      return res.status(500).json({
        message: "Unable to retrieve submissions"
      });
    }
  }
);

router.get(
  "/campaign/:campaignId",
  protect,
  allowRoles("brand"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { campaignId } = req.params;

      if (!mongoose.isValidObjectId(campaignId)) {
        return res.status(400).json({
          message: "Invalid campaign ID"
        });
      }

      const campaign = await Campaign.findOne({
        _id: campaignId,
        brand: req.user!.userId
      });

      if (!campaign) {
        return res.status(404).json({
          message: "Campaign not found"
        });
      }

      const submissions = await Submission.find({
        campaign: campaign._id
      })
        .populate("creator", "name email")
        .sort({ createdAt: -1 });

      return res.status(200).json({ submissions });
    } catch (error) {
      console.error("Campaign submissions error:", error);

      return res.status(500).json({
        message: "Unable to retrieve submissions"
      });
    }
  }
);

router.patch(
  "/:id/review",
  protect,
  allowRoles("brand"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewStatus, reviewFeedback } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid submission ID"
        });
      }

      if (!["approved", "rejected"].includes(reviewStatus)) {
        return res.status(400).json({
          message: "Review status must be approved or rejected"
        });
      }

      if (
        reviewFeedback !== undefined &&
        (typeof reviewFeedback !== "string" || reviewFeedback.length > 500)
      ) {
        return res.status(400).json({
          message: "Feedback must be text with a maximum of 500 characters"
        });
      }

      const submission = await Submission.findById(id);

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found"
        });
      }

      const campaign = await Campaign.findOne({
        _id: submission.campaign,
        brand: req.user!.userId
      });

      if (!campaign) {
        return res.status(404).json({
          message: "Campaign not found"
        });
      }

      if (submission.reviewStatus !== "pending") {
        return res.status(409).json({
          message: "Only pending submissions can be reviewed"
        });
      }

      if (reviewStatus === "rejected" && submission.payout > 0) {
        return res.status(409).json({
          message: "This submission already has a payout and cannot be rejected without a payout adjustment"
        });
      }

      submission.reviewStatus = reviewStatus;
      submission.reviewFeedback =
        typeof reviewFeedback === "string" ? reviewFeedback.trim() : "";

      await submission.save();

      return res.status(200).json({
        message: `Submission ${reviewStatus} successfully`,
        submission
      });
    } catch (error) {
      console.error("Review submission error:", error);

      return res.status(500).json({
        message: "Unable to review submission"
      });
    }
  }
);

router.patch(
  "/:id/views",
  protect,
  allowRoles("brand"),
  async (req: AuthRequest, res: Response) => {
    const session = await mongoose.startSession();

    try {
      const { id } = req.params;
      const { views } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid submission ID"
        });
      }

      if (!Number.isSafeInteger(views) || views < 0) {
        return res.status(400).json({
          message: "Views must be a non-negative whole number"
        });
      }

      let result: Record<string, unknown> | undefined;
      let failureStatus = 0;
      let failureMessage = "";

      await session.withTransaction(async () => {
        const submission = await Submission.findById(id).session(session);

        if (!submission) {
          failureStatus = 404;
          failureMessage = "Submission not found";
          return;
        }

        const campaign = await Campaign.findOne({
          _id: submission.campaign,
          brand: req.user!.userId
        }).session(session);

        if (!campaign) {
          failureStatus = 404;
          failureMessage = "Campaign not found";
          return;
        }

        if (submission.reviewStatus !== "approved") {
          failureStatus = 409;
          failureMessage = "Only approved submissions can have views and payouts updated";
          return;
        }

        if (views < submission.views) {
          failureStatus = 400;
          failureMessage =
            "Views cannot be lower than the previous recorded count";
          return;
        }

        const eligibleMilestones = campaign.milestones
          .filter((item) => item.views <= views)
          .sort((a, b) => b.views - a.views);

        const highestMilestone = eligibleMilestones[0];

        const newPayout = highestMilestone ? highestMilestone.payout : 0;
        const additionalPayout = newPayout - submission.payout;

        if (additionalPayout < 0) {
          failureStatus = 400;
          failureMessage =
            "The calculated payout is lower than the existing payout";
          return;
        }

        if (additionalPayout > 0) {
          const updatedCampaign = await Campaign.findOneAndUpdate(
            {
              _id: campaign._id,
              brand: req.user!.userId,
              status: "live",
              $expr: {
                $lte: [
                  { $add: ["$spent", additionalPayout] },
                  "$budget"
                ]
              }
            },
            {
              $inc: { spent: additionalPayout },
              $set: {
                status:
                  campaign.spent + additionalPayout >= campaign.budget
                    ? "completed"
                    : "live"
              }
            },
            { new: true, session }
          );

          if (!updatedCampaign) {
            failureStatus = 409;
            failureMessage = "Insufficient remaining campaign budget";
            return;
          }
        }

        submission.views = views;
        submission.payout = newPayout;
        submission.paidMilestoneViews = highestMilestone?.views ?? 0;

        await submission.save({ session });

        result = {
          message: "Views updated successfully",
          submission,
          payoutAdded: additionalPayout,
          remainingBudget:
            campaign.budget - campaign.spent - additionalPayout
        };
      });

      if (failureStatus) {
        return res.status(failureStatus).json({
          message: failureMessage
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Update views error:", error);

      return res.status(500).json({
        message: "Unable to update views"
      });
    } finally {
      await session.endSession();
    }
  }
);

export default router;
