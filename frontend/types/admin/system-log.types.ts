export type LogStatus = "success" | "warning" | "error";

export type ActivityType =
  | "Login"
  | "Logout"
  | "Document Upload"
  | "Bid Placed"
  | "Auction Viewed"
  | "User Verified"
  | "User Deleted"
  | "Profile Updated"
  | "System Settings Changed"
  | "Payment Processed"
  | "Product Listed"
  | "Auction Created"
  | "Auction Cancelled"
  | "Violation Flagged"
  | "Violation Resolved"
  | "Password Reset";

export interface SystemLog {
  id: string;
  userName: string;
  userId?: string | null;
  activityType: string;
  timestamp: string;
  status: LogStatus;
  ipAddress?: string | null;
  details: string;
}

export interface SystemLogFilters {
  status?: string;
  activity_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SystemLogListResponse {
  items: SystemLog[];
  total: number;
  skip: number;
  limit: number;
}
