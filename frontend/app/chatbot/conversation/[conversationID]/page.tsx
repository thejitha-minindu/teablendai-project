import ChatbotConversationPage from "@/components/features/chatbot/chatbotConversationPage";

interface ConversationPageProps {
  params: Promise<{
    conversationID: string;
  }>;
}

export default async function ChatbotConversationByIdPage({ params }: ConversationPageProps) {
  const { conversationID } = await params;
  return <ChatbotConversationPage routeConversationId={conversationID} />;
}