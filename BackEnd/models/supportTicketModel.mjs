import mongoose from "mongoose";

const { Schema } = mongoose;

const supportTicketSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  topic: {
    type: String,
    required: [true, "Support topic is required"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved"],
    default: "open",
  },
}, { timestamps: true });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
