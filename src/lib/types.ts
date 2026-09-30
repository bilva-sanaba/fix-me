/** One DoorDash group cart posted to Slack, normalized from whatever the export looks like. */
export interface Cart {
  /** Stable id. For Slack messages this is the message `ts`. */
  id: string;
  /** Display name of the person who posted the cart. */
  createdBy: string;
  /** ISO 8601 timestamp of when the cart was posted. */
  createdAt: string;
  /** Restaurant / store name. "Unknown" when we couldn't extract it. */
  restaurant: string;
  /** Total reaction count across all emoji. */
  reactions: number;
  /** Per-emoji reaction counts, e.g. { fire: 3, "+1": 2 }. */
  reactionBreakdown: Record<string, number>;
  /** Link to the cart, if we found one. */
  url?: string;
  /** Raw message text, kept for debugging / future parsing. */
  text?: string;
}
