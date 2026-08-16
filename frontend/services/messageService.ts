import { apiClient } from "@/lib/apiClient";

export interface OrderMessage {
  message_id: string;
  order_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
}

const messageService = {
  getMessages: async (orderId: string): Promise<OrderMessage[]> => {
    const res = await apiClient.get<OrderMessage[]>(`/messages/order/${orderId}`);
    return res.data;
  },

  sendMessage: async (orderId: string, content: string): Promise<OrderMessage> => {
    const res = await apiClient.post<OrderMessage>(`/messages/order/${orderId}`, { content });
    return res.data;
  },
};

export default messageService;
