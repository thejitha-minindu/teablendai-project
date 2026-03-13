"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
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
import { AuctionCard } from "./AuctionCard";
import { AuctionFieldInput } from "./AuctionFieldInput";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface MessageBubbleProps {
  message: ChatMessage;
  onSendMessage?: (message: string) => void;
  isActionEnabled?: boolean;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**") && segment.length > 4) {
      return <strong key={`b-${index}`}>{segment.slice(2, -2)}</strong>;
    }
    return <span key={`t-${index}`}>{segment}</span>;
  });
}

function renderMessageContent(content: string): ReactNode {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const nodes: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (keySuffix: number) => {
    if (!bullets.length) return;
    nodes.push(
      <ul key={`ul-${keySuffix}`} className="list-disc pl-5 space-y-1">
        {bullets.map((item, idx) => (
          <li key={`li-${keySuffix}-${idx}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((line, index) => {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      bullets.push(line.slice(2).trim());
      return;
    }

    flushBullets(index);
    nodes.push(
      <p key={`p-${index}`}>{renderInlineMarkdown(line)}</p>
    );
  });

  flushBullets(lines.length + 1);

  return <div className="space-y-2">{nodes}</div>;
}

function formatPriceLkr(value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") return "N/A";
  const numericValue = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(numericValue)) return String(value);
  return `LKR ${numericValue.toLocaleString()}`;
}

export default function MessageBubble({ message, onSendMessage, isActionEnabled = true }: MessageBubbleProps) {
  const [showSQL, setShowSQL] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [actionClicked, setActionClicked] = useState(false);

  const isUser = message.role === "user";
  const firstDataRow = Array.isArray(message.data) ? message.data[0] : null;
  const auctionDataShape =
    Array.isArray(message.data) &&
    message.data.length > 0 &&
    typeof firstDataRow === "object" &&
    firstDataRow !== null &&
    ["auction_id", "grade", "quantity", "base_price", "origin", "status", "start_time"].some(
      (key) => key in (firstDataRow as Record<string, unknown>)
    );

  const isAuctionData =
    !isUser &&
    message.source === "database" &&
    Array.isArray(message.data) &&
    (message.data_type === "auction" || auctionDataShape);
  const normalizedContent = (message.content || "").toLowerCase();
  const inferredAuctionMessage =
    normalizedContent.includes("auction") ||
    normalizedContent.includes("tea grade:") ||
    normalizedContent.includes("starting price:") ||
    normalizedContent.includes("start time:") ||
    normalizedContent.includes("duration:");

  const isAuctionMessage =
    message.source === "auction_management" || inferredAuctionMessage;
  const inputRequest = message.input_request;
  const validationPayload = message.validation_payload;
  const fieldMetadata = message.field_metadata;
  const isFieldPrompt =
    isAuctionMessage &&
    (message.prompt_type === "field_input" || inputRequest?.type === "input_request") &&
    (inputRequest || fieldMetadata);

  const inferredConfirmation =
    normalizedContent.includes("please confirm auction details") ||
    normalizedContent.includes("reply **'yes'** to create this auction") ||
    normalizedContent.includes("reply 'yes' to create this auction") ||
    normalizedContent.includes("please confirm if this is correct") ||
    normalizedContent.includes("reply **'yes'** to confirm this start time");

  const hasStructuredAuctionConfirmation =
    message.auction_payload?.type === "auction_confirmation";
  const structuredFields = message.auction_payload?.fields;
  const structuredDisplay = message.auction_payload?.display;
  const showStructuredAuctionConfirmation =
    hasStructuredAuctionConfirmation && !!structuredFields;
  const allowedActions = message.auction_payload?.actions ?? ["confirm", "cancel", "change"];
  const allowConfirm = allowedActions.includes("confirm");
  const allowCancel = allowedActions.includes("cancel");
  const allowChange = allowedActions.includes("change");

  const isAuctionConfirmation =
    isAuctionMessage &&
    (hasStructuredAuctionConfirmation || message.state === "awaiting_confirmation" || inferredConfirmation) &&
    !!onSendMessage;

  const explicitAuctionIdMatch = message.content?.match(/auction\s*id\s*:\s*[^A-Za-z0-9-]*([A-Za-z0-9-]+)/i);
  const uuidFallbackMatch = message.content?.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  const createdAuctionId = explicitAuctionIdMatch?.[1] ?? uuidFallbackMatch?.[0] ?? null;
  const isAuctionCreatedMessage =
    isAuctionMessage &&
    normalizedContent.includes("auction created") &&
    !!createdAuctionId;

  const isChangeHelpPrompt =
    isAuctionMessage &&
    normalizedContent.includes("i can help you make changes") &&
    normalizedContent.includes("cancel") &&
    !!onSendMessage;

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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  handleCopy(message.content, setCopiedMessage)
                }
                aria-label="Copy message"
                className="absolute right-2 opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                {copiedMessage ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white/80 hover:text-white" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              {copiedMessage ? "Copied!" : "Copy message"}
            </TooltipContent>
          </Tooltip>

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

  if (!isUser && isFieldPrompt && onSendMessage) {
    const promptFieldName = inputRequest?.field_name || fieldMetadata?.field_name || "";
    const promptFieldType = inputRequest?.field_type || fieldMetadata?.field_type || "text";
    const promptOptions = inputRequest?.options || fieldMetadata?.options;
    const promptValidation = inputRequest?.validation || fieldMetadata?.validation;

    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#558332] flex items-center justify-center text-white shrink-0 mt-1">
          <Brain className="w-5 h-5" />
        </div>

        <div className="max-w-[85%] space-y-2">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
            <div className="text-sm text-gray-800 leading-relaxed">
              {renderMessageContent(message.content)}
            </div>
            {validationPayload?.field_errors?.length ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-xs font-semibold text-red-700 mb-1">Please fix these fields:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {validationPayload.field_errors.map((fieldError, index) => (
                    <li key={`${fieldError.field}-${index}`} className="text-xs text-red-700">
                      <span className="font-medium">{fieldError.field.replace(/_/g, " ")}</span>: {fieldError.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <AuctionFieldInput
            fieldName={promptFieldName}
            fieldType={promptFieldType}
            options={promptOptions}
            validation={promptValidation}
            onSubmit={(value) => onSendMessage(String(value))}
            onSkip={() => onSendMessage("skip")}
            disabled={!isActionEnabled}
          />
        </div>
      </div>
    );
  }

  if (isAuctionData) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#558332] flex items-center justify-center text-white shrink-0 mt-1">
          <Brain className="w-5 h-5" />
        </div>

        <div className="flex-1 max-w-[90%] space-y-3">
          {message.data?.map((auction: Record<string, unknown>, index: number) => (
            <AuctionCard
              key={(auction.auction_id as string) || index}
              auction={auction}
              index={index + 1}
            />
          ))}

          {message.visualization && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                View as table
              </summary>
              <div className="mt-2">
                <VisualizationRenderer
                  visualization={message.visualization}
                  visualizationType={message.visualization_type}
                  query={message.content}
                />
              </div>
            </details>
          )}
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

      <div className="flex-1 max-w-[85%] space-y-3">
        {/* Main Message Bubble */}
        <div
          className={`relative rounded-2xl rounded-tl-none px-4 py-3 shadow-sm group border ${
            isAuctionMessage
              ? "bg-purple-50 border-purple-200"
              : "bg-white border-gray-200"
          }`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  handleCopy(message.content, setCopiedMessage)
                }
                aria-label="Copy message"
                className="absolute opacity-0 group-hover:opacity-100 transition cursor-pointer top-3 right-3"
              >
                {copiedMessage ? (
                  <Check className="w-5 h-5 text-[#558332]" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {copiedMessage ? "Copied!" : "Copy message"}
            </TooltipContent>
          </Tooltip>

          {/* Source Badge */}
          <div className="flex items-center gap-1.5 mb-2">
            {message.source === "database" && (
              <span className="inline-flex items-center text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                Database
              </span>
            )}
            {message.source === "web" && (
              <span className="inline-flex items-center text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                Web Search
              </span>
            )}
            {message.source === "validation" && (
              <span className="inline-flex items-center text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                Tea Only
              </span>
            )}
            {message.source === "auction_management" && (
              <span className="inline-flex items-center text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5">
                Auction Management
              </span>
            )}
          </div>

          <div className="text-sm text-gray-800 leading-relaxed pr-6">
            {showStructuredAuctionConfirmation ? (
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">Please confirm auction details:</p>
                <div className="rounded-xl border border-purple-200 bg-white/70 p-3">
                  <dl className="grid grid-cols-1 gap-2 text-sm">
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-gray-600">Tea Grade</dt>
                      <dd>{structuredFields?.grade || "N/A"}</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-gray-600">Quantity</dt>
                      <dd>{structuredFields?.quantity ?? "N/A"} kg</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-gray-600">Origin</dt>
                      <dd>{structuredFields?.origin || "N/A"}</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-gray-600">Starting Price</dt>
                      <dd>{formatPriceLkr(structuredFields?.base_price)}</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-gray-600">Start Time</dt>
                      <dd>{structuredDisplay?.start_time || structuredFields?.start_time || "N/A"}</dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-gray-600">Duration</dt>
                      <dd>
                        {structuredDisplay?.duration ||
                          (structuredFields?.duration !== undefined && structuredFields?.duration !== null
                            ? `${structuredFields.duration} hours`
                            : "N/A")}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <dt className="font-medium text-gray-600">Description</dt>
                      <dd>{structuredFields?.description || "None"}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              renderMessageContent(message.content)
            )}
          </div>

          {isAuctionCreatedMessage && createdAuctionId && (
            <div className="mt-3">
              <p>You can view the auction details here: 
              <Link
                href={`http://localhost:3000/seller/scheduled`}
                className="inline-flex items-center text-sm font-medium text-[#558332] hover:text-[#4a722c] hover:underline"
                target="_blank"
              >
                 View Auction
              </Link>
              </p>
            </div>
          )}

          {message.error && (
            <p className="text-xs text-red-500 mt-2 bg-red-50 rounded p-2">
              {message.error}
            </p>
          )}
        </div>

        {isAuctionConfirmation && (
          <div className="flex flex-wrap gap-2">
            {allowConfirm && (
              <button
                onClick={() => {
                  if (!isActionEnabled || actionClicked) return;
                  setActionClicked(true);
                  onSendMessage?.("yes");
                }}
                disabled={!isActionEnabled || actionClicked}
                className="px-4 py-2 rounded-lg bg-[#558332] text-white text-sm font-semibold hover:bg-[#4a722c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yes
              </button>
            )}
            {allowCancel && (
              <button
                onClick={() => {
                  if (!isActionEnabled || actionClicked) return;
                  setActionClicked(true);
                  onSendMessage?.("no");
                }}
                disabled={!isActionEnabled || actionClicked}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                No
              </button>
            )}
            {allowChange && (
              <button
                onClick={() => {
                  if (!isActionEnabled || actionClicked) return;
                  setActionClicked(true);
                  onSendMessage?.("change");
                }}
                disabled={!isActionEnabled || actionClicked}
                className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change
              </button>
            )}
          </div>
        )}

        {isChangeHelpPrompt && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (!isActionEnabled || actionClicked) return;
                setActionClicked(true);
                onSendMessage?.("cancel");
              }}
              disabled={!isActionEnabled || actionClicked}
              className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel Auction Creation
            </button>
          </div>
        )}

        {/* Sources */}
        {message.source === "web" &&
          Array.isArray(message.search_results) &&
          message.search_results.length > 0 && (
            <div className="border border-gray-200 bg-white rounded-xl shadow-sm px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                Sources
              </p>
              <ul className="space-y-1">
                {message.search_results.map((result, index) => (
                  <li key={`${result.url}-${index}`}>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-700 hover:text-blue-800 break-all hover:underline transition"
                    >
                      {result.title || result.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Visualization */}
        {message.visualization && (
          <VisualizationRenderer
            visualization={message.visualization}
            visualizationType={message.visualization_type}
            query={message.content}
          />
        )}

        {/* SQL Query */}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        handleCopy(message.sql_query!, setCopiedSQL)
                      }
                      aria-label="Copy SQL"
                      className="absolute top-2 right-2 text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedSQL ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {copiedSQL ? "Copied!" : "Copy SQL"}
                  </TooltipContent>
                </Tooltip>

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