"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  User,
  Copy,
  Check,
} from "lucide-react";
import { ChatMessage } from "@/services/chatService";
import VisualizationRenderer from "./VisualizationRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showSQL, setShowSQL] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  const isUser = message.role === "user";

  // Reusable copy handler
  const handleCopy = async (
    text: string,
    setState: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setState(true);
      setTimeout(() => setState(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  // LOADING STATE
  if (message.isLoading) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#558332] flex items-center justify-center text-white shrink-0">
          <Brain className="w-5 h-5" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-[#558332] rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-[#558332] rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-[#558332] rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  // USER MESSAGE
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="relative max-w-[75%] bg-[#558332] text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm group">
          {/* Copy button */}
          <button
            onClick={() =>
              handleCopy(message.content, setCopiedMessage)
            }
            className="absolute right-2 opacity-0 group-hover:opacity-100 transition cursor-pointer"
          >
            {copiedMessage ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <Copy className="w-5 h-5 text-white/80 hover:text-white" />
            )}
          </button>

          <p className="text-sm whitespace-pre-wrap pr-6">
            {message.content}
          </p>
        </div>

        <div className="w-8 h-8 ml-2 rounded-full bg-[#558332] flex items-center justify-center text-white shrink-0">
          <User className="w-5 h-5" />
        </div>
      </div>
    );
  }

  // ASSISTANT MESSAGE
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#558332] flex items-center justify-center text-white shrink-0 mt-1">
        <Brain className="w-5 h-5" />
      </div>

      <div className="flex-1 max-w-[85%] space-y-2">
        <div className="relative bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm group">
          {/* Copy button */}
          <button
            onClick={() =>
              handleCopy(message.content, setCopiedMessage)
            }
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition cursor-pointer"
          >
            {copiedMessage ? (
              <Check className="w-5 h-5 text-[#558332]" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            )}
          </button>

          {/* Source badge */}
          <div className="flex items-center gap-1.5 mb-2">
            {message.source === "database" ? (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                Database
              </span>
            ) : message.source === "web" ? (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                Web Search
              </span>
            ) : message.source === "validation" ? (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                Tea Only
              </span>
            ) : null}
          </div>

          <p className="text-sm text-justify text-gray-800 whitespace-pre-wrap leading-relaxed pr-6">
            {message.content}
          </p>

          {message.error && (
            <p className="text-xs text-red-500 mt-2 bg-red-50 rounded p-2">
              {message.error}
            </p>
          )}
        </div>

        {/* Visualization */}
        {message.visualization && (
          <VisualizationRenderer
            visualization={message.visualization}
            visualizationType={message.visualization_type}
            query={message.content}
          />
        )}

        {/* SQL Query Block */}
        {message.sql_query && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSQL(!showSQL)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-300 hover:text-white transition-colors"
            >
              <span className="font-mono">SQL Query</span>
              {showSQL ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showSQL && (
              <div className="relative">
                {/* SQL Copy Button */}
                <button
                  onClick={() =>
                    handleCopy(message.sql_query!, setCopiedSQL)
                  }
                  className="absolute top-2 right-2 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {copiedSQL ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                  )}
                </button>

                <pre className="px-4 pb-3 pt-8 text-xs text-white font-mono whitespace-pre-wrap overflow-x-auto">
                  {message.sql_query}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
