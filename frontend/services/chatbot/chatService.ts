import { apiClient } from "@/lib/apiClient";
import type { AxiosError } from "axios";
import type {
  ChatMessage,
  ConversationSummary,
  QueryResponse,
} from "@/types/chatbot/chat.types";

export type {
  ChatMessage,
  ConversationSummary,
  QueryResponse,
} from "@/types/chatbot/chat.types";

export const chatService = {
  getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("teablend_token") ||
      localStorage.getItem("access_token")
    );
  },

  getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;
    const token = this.getAuthToken();
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
    conversationId?: string | null
  ): Promise<QueryResponse> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const payload: Record<string, unknown> = { message };
    if (conversationId) payload.conversation_id = conversationId;
    const userId = this.getCurrentUserId();
    if (userId) payload.user_id = userId;

    try {
      const response = await apiClient.post<QueryResponse>("/query", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      throw error;
    }
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
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
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
  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/conversations/${conversationId}`);
  },

  // Pin a conversation
  async pinConversation(conversationId: string | number): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    try {
      await apiClient.post(
        `/conversations/${conversationId}/pin`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error("Failed to pin conversation");
    }
  },

  // Unpin a conversation
  async unpinConversation(conversationId: string | number): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    try {
      await apiClient.post(
        `/conversations/${conversationId}/unpin`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error("Failed to unpin conversation");
    }
  },
};