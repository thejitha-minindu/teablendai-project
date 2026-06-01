"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ChatbotConversationPage from "@/components/features/chatbot/chatbotConversationPage";

export default function ChatbotConversationLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ conversationID?: string }>();
  const routeConversationId =
    typeof params?.conversationID === "string" ? params.conversationID : null;

  return (
    <ProtectedRoute>
      <ChatbotConversationPage routeConversationId={routeConversationId} />
      {children}
    </ProtectedRoute>
  );
}
