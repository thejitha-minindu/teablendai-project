import { apiClient } from "@/lib/apiClient";

export interface QueryResponse {
  success: boolean;
  conversation_id: number | null;
  answer: string;
  source: "database" | "web" | "validation" | "error" | "fallback";
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
  row_count?: number;
  search_results?: { title: string; url: string; content: string }[] | null;
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
  // Send message to backend
  async sendMessage(
    message: string,
    conversationId?: number | null
  ): Promise<QueryResponse> {
    const payload: Record<string, unknown> = { message };
    if (conversationId) payload.conversation_id = conversationId;
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
          visualization: visualizationStr,
          visualization_type: (m.visualization_type as string) || null,
          source: (m.source as string) || "database",
          row_count: (m.row_count as number) || 0,
          search_results: (m.search_results as unknown[]) || null,
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