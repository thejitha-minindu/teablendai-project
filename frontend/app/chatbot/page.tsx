"use client";

import { useState } from "react";
import { AnimatedAIChat } from "../../components/features/chatbot/chat";
import { ChatSidebar } from "../../components/features/chatbot/chatSidebar";

export default function ChatbotPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleSelectChat = (chatId: string) => {
    console.log("Selected chat:", chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    console.log("Deleted chat:", chatId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex-1">
        <AnimatedAIChat onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
