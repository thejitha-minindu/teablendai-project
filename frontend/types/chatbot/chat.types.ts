export type ChatSource =
  | "database"
  | "web"
  | "validation"
  | "error"
  | "fallback"
  | "auction_management";

export interface ChatSearchResult {
  title: string;
  url: string;
  content: string;
  snippet?: string;
}

export interface ChatFieldMetadata {
  field_name: string;
  field_type: string;
  options?: string[];
  validation?: Record<string, unknown>;
}

export interface ChatInputRequest {
  type: "input_request";
  flow_id?: string;
  field_name: string;
  field_type: string;
  options?: string[];
  validation?: Record<string, unknown>;
}

export interface ChatValidationPayload {
  type: "validation_error";
  flow_id?: string;
  field_errors: Array<{
    field: string;
    error: string;
    value?: unknown;
  }>;
  next_field?: string;
}

export interface ChatAuctionPayload {
  type: "auction_confirmation";
  flow_id?: string;
  subtype?:
    | "start_time_confirmation"
    | "delete_confirmation"
    | "description_generation_choice"
    | "description_generated_confirmation"
    | string;
  fields: {
    grade?: string;
    quantity?: number | string;
    origin?: string;
    base_price?: number | string;
    start_time?: string;
    duration?: number | string;
    description?: string | null;
    auction_id?: number | string;
    expression?: string;
    display_time_12h?: string;
  };
  display?: {
    start_time?: string;
    duration?: string;
  };
  actions?: Array<"confirm" | "cancel" | "change">;
}

export interface ChatResultPayload {
  type: "result";
  flow_id?: string;
  operation: string;
  status: "success" | "failed";
  auction_id?: string | number;
  details?: Record<string, unknown>;
  error?: string | null;
}

export interface QueryResponse {
  success: boolean;
  conversation_id: string | null;
  answer: string;
  source: ChatSource;
  data_type?: string;
  state?: string;
  message_type?: string;
  prompt_type?: string;
  field_metadata?: ChatFieldMetadata;
  input_request?: ChatInputRequest;
  validation_payload?: ChatValidationPayload;
  auction_payload?: ChatAuctionPayload;
  result_payload?: ChatResultPayload;
  row_count: number;
  timestamp: string;
  sql_query: string | null;
  data: Record<string, unknown>[] | null;
  visualization_type: string | null;
  visualization: string | null;
  search_results: ChatSearchResult[] | null;
  error: string | null;
}

export interface ChatMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sql_query?: string | null;
  data?: Record<string, unknown>[] | null;
  visualization_type?: string | null;
  visualization?: string | null;
  source?: ChatSource;
  data_type?: string;
  row_count?: number;
  search_results?: ChatSearchResult[] | null;
  state?: string;
  message_type?: string;
  prompt_type?: string;
  field_metadata?: ChatFieldMetadata;
  input_request?: ChatInputRequest;
  validation_payload?: ChatValidationPayload;
  auction_payload?: ChatAuctionPayload;
  result_payload?: ChatResultPayload;
  isLoading?: boolean;
  error?: string | null;
}

export interface ConversationSummary {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  is_pinned?: boolean;
  pinned_at?: string | null;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  pinnedAt?: Date | null;
  preview: string;
  isPinned?: boolean;
}

export type Message = ChatMessage;
export type ConversationResponse = QueryResponse;
