
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubmission extends Document {
  campaign: Types.ObjectId;
  creator: Types.ObjectId;
  postUrl: string;
  views: number;
  payout: number;
  paidMilestoneViews: number;
  flagged: boolean;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewFeedback: string;
}

const submissionSchema = new Schema<ISubmission>(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    postUrl: {
      type: String,
      required: true,
      trim: true
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    payout: {
      type: Number,
      default: 0,
      min: 0
    },
    paidMilestoneViews: {
      type: Number,
      default: 0,
      min: 0
    },
    flagged: {
      type: Boolean,
      default: false
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    reviewFeedback: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

submissionSchema.index(
  { campaign: 1, creator: 1, postUrl: 1 },
  { unique: true }
);

export default mongoose.model<ISubmission>("Submission", submissionSchema);
