
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMilestone {
  views: number;
  payout: number;
}

export interface ICampaign extends Document {
  name: string;
  platform: "Instagram" | "YouTube";
  budget: number;
  spent: number;
  milestones: IMilestone[];
  brand: Types.ObjectId;
  status: "live" | "paused" | "completed";
}

const milestoneSchema = new Schema<IMilestone>(
  {
    views: {
      type: Number,
      required: true,
      min: 1
    },
    payout: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    platform: {
      type: String,
      enum: ["Instagram", "YouTube"],
      required: true
    },
    budget: {
      type: Number,
      required: true,
      min: 1
    },
    spent: {
      type: Number,
      default: 0,
      min: 0
    },
    milestones: {
      type: [milestoneSchema],
      required: true,
      validate: {
        validator: (items: IMilestone[]) =>
          items.length > 0 &&
          items.every((item, index) =>
            index === 0 || item.views > items[index - 1].views
          ),
        message: "Milestones must have strictly increasing view thresholds"
      }
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["live", "paused", "completed"],
      default: "live"
    }
  },
  { timestamps: true }
);

export default mongoose.model<ICampaign>("Campaign", campaignSchema);
