import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategory: {
      type: String,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "assigned",
        "in_progress",
        "resolved",
        "rejected",
        "reopened",
      ],
      default: "submitted",
    },

    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    location: {
      address: {
        type: String,
        trim: true,
      },

      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },
    },

    evidence: [
      {
        url: {
          type: String,
          required: true,
        },

        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
      },
    ],

    resolutionProof: [
      {
        url: {
          type: String,
          required: true,
        },

        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
      },
    ],

    departmentRemark: {
      type: String,
      trim: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    citizenVerifiedResolution: {
      type: Boolean,
      default: false,
    },

    reopenedReason: {
      type: String,
      trim: true,
    },

    // AI related information

    aiCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    aiPriority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: null,
    },

    aiSuggestedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    // Duplicate complaint information

    isDuplicate: {
      type: Boolean,
      default: false,
    },

    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;