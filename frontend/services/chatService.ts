import { apiClient } from "@/lib/apiClient";

export interface QueryResponse {
  success: boolean;
  conversation_id: number | null;
  answer: string;
  source: "database" | "web" | "validation" | "error" | "fallback" | "auction_management";
  data_type?: string;
  state?: string;
  message_type?: string;
  prompt_type?: string;
  field_metadata?: {
    field_name: string;
    field_type: string;
    options?: string[];
    validation?: Record<string, unknown>;
  };
  input_request?: {
    type: "input_request";
    flow_id?: string;
    field_name: string;
    field_type: string;
    options?: string[];
    validation?: Record<string, unknown>;
  };
  validation_payload?: {
    type: "validation_error";
    flow_id?: string;
    field_errors: Array<{
      field: string;
      error: string;
      value?: unknown;
    }>;
    next_field?: string;
  };
  auction_payload?: {
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
  };
  result_payload?: {
    type: "result";
    flow_id?: string;
    operation: string;
    status: "success" | "failed";
    auction_id?: string | number;
    details?: Record<string, unknown>;
    error?: string | null;
  };
  row_count: number;
  timestamp: string;
  sql_query: string | null;
  data: Record<string, unknown>[] | null;
  visualization_type: string | null;
  visualization: string | null;
  search_results: { title: string; url: string; content: string }[] | null;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sql_query?: string | null;
  data?: Record<string, unknown>[] | null;
  visualization_type?: string | null;
  visualization?: string | null;
  source?: string;
  data_type?: string;
  row_count?: number;
  search_results?: { title: string; url: string; content: string }[] | null;
  state?: string;
  message_type?: string;
  prompt_type?: string;
  field_metadata?: {
    field_name: string;
    field_type: string;
    options?: string[];
    validation?: Record<string, unknown>;
  };
  input_request?: QueryResponse["input_request"];
  validation_payload?: QueryResponse["validation_payload"];
  auction_payload?: QueryResponse["auction_payload"];
  result_payload?: QueryResponse["result_payload"];
  isLoading?: boolean;
  error?: string | null;
}

export interface ConversationSummary {
  conversation_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export const chatService = {
  getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("teablend_token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.id ? String(payload.id) : null;
    } catch {
      return null;
    }
  },

  // Send message to backend
  async sendMessage(
    message: string,
    conversationId?: number | null
  ): Promise<QueryResponse> {
    const payload: Record<string, unknown> = { message };
    if (conversationId) payload.conversation_id = conversationId;
    const userId = this.getCurrentUserId();
    if (userId) payload.user_id = userId;
    const response = await apiClient.post<QueryResponse>("/query", payload);
    return response.data;
  },

  // Get all conversations for sidebar
  async getConversations(): Promise<ConversationSummary[]> {
    try {
      const response = await apiClient.get("/conversations");
      return response.data?.conversations || response.data || [];
    } catch {
      return [];
    }
  },

  // Get messages for a specific conversation
  async getConversationMessages(conversationId: number): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get(`/conversations/${conversationId}`);
      const raw = response.data?.messages || [];
      
      return raw.map((m: Record<string, unknown>, i: number) => {
        // Visualization is already parsed JSON from backend, convert to string for Chart.js
        let visualizationStr: string | null = null;
        if (m.visualization) {
          try {
            visualizationStr = typeof m.visualization === "string" 
              ? m.visualization 
              : JSON.stringify(m.visualization);
          } catch {
            visualizationStr = null;
          }
        }

        return {
          id: `msg-${conversationId}-${i}`,
          role: m.role as "user" | "assistant",
          content: String(m.content || ""),
          timestamp: String(m.timestamp || new Date().toISOString()),
          sql_query: (m.sql_query as string) || null,
          data: (m.data as Record<string, unknown>[]) || null,
          visualization: visualizationStr,
          visualization_type: (m.visualization_type as string) || null,
          source: (m.source as string) || "database",
          data_type: (m.data_type as string) || undefined,
          row_count: (m.row_count as number) || ((m.data as unknown[])?.length ?? 0),
          search_results: (m.search_results as unknown[]) || null,
          state: (m.state as string) || undefined,
          message_type: (m.message_type as string) || undefined,
          prompt_type: (m.prompt_type as string) || undefined,
          field_metadata: (m.field_metadata as ChatMessage["field_metadata"]) || undefined,
          input_request: (m.input_request as ChatMessage["input_request"]) || undefined,
          validation_payload: (m.validation_payload as ChatMessage["validation_payload"]) || undefined,
          auction_payload: (m.auction_payload as ChatMessage["auction_payload"]) || undefined,
          result_payload: (m.result_payload as ChatMessage["result_payload"]) || undefined,
          error: (m.error as string) || null,
        };
      });
    } catch (error) {
      console.error("Failed to get conversation messages:", error);
      return [];
    }
  },

  // Delete a conversation
  async deleteConversation(conversationId: number): Promise<void> {
    await apiClient.delete(`/conversations/${conversationId}`);
  },
};