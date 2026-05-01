"use client";

import Link from "next/link";
import { useState, useCallback, useMemo, memo } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Brain, User, Copy, Check } from "lucide-react";
import type { ChatMessage } from "@/types/chatbot/chat.types";
import VisualizationRenderer from "./VisualizationRenderer";
import { AuctionCard } from "./AuctionCard";
import { AuctionFieldInput } from "./AuctionFieldInput";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatDurationFromMinutes } from "@/utils/dateFormatter";

// Constants
const AUCTION_INDICATOR_KEYS = [
  "auction_id",
  "grade",
  "quantity",
  "base_price",
  "origin",
  "status",
  "start_time",
] as const;

const AUCTION_CONFIRMATION_PHRASES = [
  "please confirm auction details",
  "reply **'yes'** to create this auction",
  "reply 'yes' to create this auction",
  "please confirm if this is correct",
  "reply **'yes'** to confirm this start time",
] as const;

const AUCTION_CREATION_PHRASES = [
  "auction created",
  "auction was successfully created",
  "created successfully",
] as const;

const FRONTEND_BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.replace(/\/$/, "") || "";

interface MessageBubbleProps {
  message: ChatMessage;
  onSendMessage?: (message: string) => void;
  isActionEnabled?: boolean;
}

// Utility Functions
const renderInlineMarkdown = (text: string): ReactNode[] => {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**") && segment.length > 4) {
      return <strong key={`b-${index}`}>{segment.slice(2, -2)}</strong>;
    }
    return <span key={`t-${index}`}>{segment}</span>;
  });
};

const renderMessageContent = (content: string): ReactNode => {
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
    nodes.push(<p key={`p-${index}`}>{renderInlineMarkdown(line)}</p>);
  });

  flushBullets(lines.length + 1);

  return <div className="space-y-2">{nodes}</div>;
};

const formatPriceLkr = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === "") return "N/A";
  const numericValue = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(numericValue)) return String(value);
  return `LKR ${numericValue.toLocaleString()}`;
};

const formatStartTimeDisplay = (value: string | undefined): string => {
  if (!value) return "N/A";

  const normalized = value.trim().replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;

  const datePart = parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} at ${timePart}`;
};

const toDisplayValue = (value: unknown): string | number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return undefined;
};

const formatStructuredDuration = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(numericValue)) {
    return formatDurationFromMinutes(numericValue);
  }
  return String(value);
};

const extractCreatedAuctionDetails = (content: string): {
  grade?: string;
  quantity?: string;
  origin?: string;
  base_price?: string;
  start_time?: string;
  duration?: string;
  description?: string;
  custom_auction_id?: string;
} => {
  const extract = (label: string) => {
    const pattern = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, "i");
    const match = content.match(pattern);
    return match?.[1]?.trim();
  };

  return {
    grade: extract("Grade"),
    quantity: extract("Quantity"),
    origin: extract("Origin"),
    base_price: extract("Starting Price"),
    start_time: extract("Start Time"),
    duration: extract("Duration"),
    description: extract("Description") || "None",
    custom_auction_id: extract("Ref ID") || extract("Custom Auction ID"),
  };
};

const extractAuctionDetailsFromPlainText = (content: string): {
  grade?: string;
  quantity?: string;
  origin?: string;
  base_price?: string;
  start_time?: string;
  duration?: string;
  description?: string;
  custom_auction_id?: string;
} => {
  const extract = (label: string) => {
    const pattern = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, "i");
    const match = content.match(pattern);
    return match?.[1]?.trim();
  };

  return {
    grade: extract("Tea Grade") || extract("Grade"),
    quantity: extract("Quantity"),
    origin: extract("Origin"),
    base_price: extract("Starting Price"),
    start_time: extract("Start Time"),
    duration: extract("Duration"),
    description: extract("Description") || "None",
    custom_auction_id: extract("Ref ID") || extract("Custom Auction ID"),
  };
};

const isAuctionDataShape = (data: unknown): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;
  const firstRow = data[0];
  if (typeof firstRow !== "object" || firstRow === null) return false;
  return AUCTION_INDICATOR_KEYS.some((key) => key in firstRow);
};

// Detail Row Component
const DetailRow = memo(function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <dt className="font-medium text-gray-600">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
});

// Auction Confirmation Content Component
interface AuctionConfirmationContentProps {
  structuredFields?: Record<string, unknown>;
  createdDetails?: ReturnType<typeof extractCreatedAuctionDetails>;
  parsedAuctionDetails?: ReturnType<typeof extractAuctionDetailsFromPlainText>;
  showConfirmationHeader: boolean;
  structuredCardTitle: string;
  structuredDisplay?: Record<string, unknown>;
}

const AuctionConfirmationContent = memo(function AuctionConfirmationContent({
  structuredFields,
  createdDetails,
  parsedAuctionDetails,
  showConfirmationHeader,
  structuredCardTitle,
  structuredDisplay,
}: AuctionConfirmationContentProps) {
  const grade =
    toDisplayValue(structuredFields?.grade) ||
    createdDetails?.grade ||
    parsedAuctionDetails?.grade;
  const quantity =
    structuredFields?.quantity !== undefined && structuredFields?.quantity !== null
      ? `${structuredFields.quantity} kg`
      : createdDetails?.quantity || parsedAuctionDetails?.quantity;
  const origin =
    toDisplayValue(structuredFields?.origin) ||
    createdDetails?.origin ||
    parsedAuctionDetails?.origin;
  const basePrice = formatPriceLkr(
    (structuredFields?.base_price as string | number | undefined) || parsedAuctionDetails?.base_price
  );
  const startTime =
    structuredDisplay?.start_time ||
    structuredFields?.start_time ||
    parsedAuctionDetails?.start_time;
  const structuredDuration = formatStructuredDuration(structuredFields?.duration);
  const duration =
    structuredDisplay?.duration ||
    structuredDuration ||
    parsedAuctionDetails?.duration;
  const description =
    toDisplayValue(structuredFields?.description) ||
    createdDetails?.description ||
    parsedAuctionDetails?.description ||
    "None";
  const customAuctionId =
    toDisplayValue(structuredFields?.custom_auction_id) ||
    createdDetails?.custom_auction_id ||
    parsedAuctionDetails?.custom_auction_id;

  return (
    <div className="space-y-2">
      {showConfirmationHeader ? (
        <div className="rounded-lg border border-purple-200 bg-purple-100/60 px-3 py-2">
          <p className="font-semibold text-gray-900">{structuredCardTitle}</p>
          <p className="text-xs text-gray-800 mt-1">
            Use Yes to confirm, No to cancel, or Change to edit details.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-purple-200 bg-purple-100/60 px-3 py-2">
          <p className="font-semibold text-gray-900">{structuredCardTitle}</p>
        </div>
      )}
      <div className="rounded-xl border border-purple-200 bg-white/70 p-3">
        <dl className="grid grid-cols-1 gap-2 text-sm">
          <DetailRow label="Tea Grade" value={grade} />
          <DetailRow label="Quantity" value={quantity} />
          <DetailRow label="Origin" value={origin} />
          <DetailRow label="Starting Price" value={basePrice} />
          <DetailRow label="Start Time" value={startTime as string | undefined} />
          <DetailRow label="Duration" value={duration as string | undefined} />
          <DetailRow label="Description" value={description} />
          {customAuctionId && <DetailRow label="Ref ID" value={customAuctionId} />}
        </dl>
      </div>
    </div>
  );
});

// Source Badge Component
const SourceBadge = memo(function SourceBadge({ source }: { source?: string }) {
  if (source === "database") {
    return (
      <span className="inline-flex items-center text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
        Database
      </span>
    );
  }
  if (source === "web") {
    return (
      <span className="inline-flex items-center text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
        Web Search
      </span>
    );
  }
  if (source === "validation") {
    return (
      <span className="inline-flex items-center text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
        Tea Only
      </span>
    );
  }
  if (source === "auction_management") {
    return (
      <span className="inline-flex items-center text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5">
        Auction Management
      </span>
    );
  }
  return null;
});

// Loading Bubble Component
const LoadingBubble = memo(function LoadingBubble() {
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
});

// User Message Component
const UserMessage = memo(function UserMessage({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }, [content]);

  return (
    <div className="flex justify-end">
      <div className="relative max-w-[75%] bg-[#558332] text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm group">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              aria-label="Copy message"
              className="absolute right-2 opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              {copied ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Copy className="w-5 h-5 text-white/80 hover:text-white" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            {copied ? "Copied!" : "Copy message"}
          </TooltipContent>
        </Tooltip>

        <p className="text-sm whitespace-pre-wrap pr-6">{content}</p>
      </div>

      <div className="w-8 h-8 ml-2 rounded-full bg-[#558332] flex items-center justify-center text-white shrink-0">
        <User className="w-5 h-5" />
      </div>
    </div>
  );
});

// SQL Query Section Component
const SQLQuerySection = memo(function SQLQuerySection({
  sqlQuery,
}: {
  sqlQuery: string;
}) {
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sqlQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }, [sqlQuery]);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      <button
        onClick={() => setShowSQL(!showSQL)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-300 hover:text-white transition-colors"
      >
        <span className="font-mono">SQL Query</span>
        {showSQL ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showSQL && (
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                aria-label="Copy SQL"
                className="absolute top-2 right-2 text-gray-400 hover:text-white transition cursor-pointer"
              >
                {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-gray-400 hover:text-white" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {copied ? "Copied!" : "Copy SQL"}
            </TooltipContent>
          </Tooltip>

          <pre className="px-4 pb-3 pt-8 text-xs text-white font-mono whitespace-pre-wrap overflow-x-auto">
            {sqlQuery}
          </pre>
        </div>
      )}
    </div>
  );
});

// Main Component
export default function MessageBubble({
  message,
  onSendMessage,
  isActionEnabled = true,
}: MessageBubbleProps) {
  const [actionClicked, setActionClicked] = useState(false);

  const isUser = message.role === "user";

  // Memoized data checks
  const firstDataRow = useMemo(
    () => (Array.isArray(message.data) ? message.data[0] : null),
    [message.data]
  );

  const isAuctionData = useMemo(() => {
    if (isUser) return false;
    if (message.source !== "database") return false;
    if (!Array.isArray(message.data)) return false;
    return message.data_type === "auction" || isAuctionDataShape(message.data);
  }, [isUser, message.source, message.data, message.data_type]);

  const normalizedContent = useMemo(() => (message.content || "").toLowerCase(), [message.content]);
  const inferredAuctionMessage = useMemo(
    () =>
      normalizedContent.includes("auction") ||
      normalizedContent.includes("tea grade:") ||
      normalizedContent.includes("starting price:") ||
      normalizedContent.includes("start time:") ||
      normalizedContent.includes("duration:"),
    [normalizedContent]
  );

  const isAuctionMessage = message.source === "auction_management" || inferredAuctionMessage;
  const inputRequest = message.input_request;
  const validationPayload = message.validation_payload;
  const fieldMetadata = message.field_metadata;
  const isFieldPrompt =
    isAuctionMessage &&
    (message.prompt_type === "field_input" || inputRequest?.type === "input_request") &&
    (inputRequest || fieldMetadata);

  const inferredConfirmation = useMemo(
    () => AUCTION_CONFIRMATION_PHRASES.some((phrase) => normalizedContent.includes(phrase)),
    [normalizedContent]
  );

  const hasStructuredAuctionConfirmation = message.auction_payload?.type === "auction_confirmation";
  const isCreateAuctionSuccess =
    message.result_payload?.type === "result" &&
    message.result_payload?.operation === "create_auction" &&
    message.result_payload?.status === "success";
  const auctionSubtype = message.auction_payload?.subtype;
  const structuredFields = message.auction_payload?.fields as
    | {
        grade?: string;
        quantity?: string | number;
        origin?: string;
        base_price?: string | number;
        start_time?: string;
        duration?: string | number;
        description?: string | null;
        custom_auction_id?: string;
      }
    | undefined;
  const structuredDisplay = message.auction_payload?.display;
  const isFullAuctionDetailsSubtype = !auctionSubtype || auctionSubtype === "create_confirmation";
  const showStructuredAuctionConfirmation =
    hasStructuredAuctionConfirmation && !!structuredFields && isFullAuctionDetailsSubtype;
  const allowedActions = message.auction_payload?.actions ?? ["confirm", "cancel", "change"];
  const isDescriptionActionPrompt =
    auctionSubtype === "description_generation_choice" || auctionSubtype === "description_generated_confirmation";
  const allowConfirm = allowedActions.includes("confirm");
  const allowCancel = allowedActions.includes("cancel");
  const allowChange = allowedActions.includes("change");

  const isAuctionConfirmation =
    isAuctionMessage &&
    (hasStructuredAuctionConfirmation || message.state === "awaiting_confirmation" || inferredConfirmation) &&
    !!onSendMessage;

  const explicitAuctionIdMatch = message.content?.match(/auction\s*id\s*:\s*[^A-Za-z0-9-]*([A-Za-z0-9-]+)/i);
  const uuidFallbackMatch = message.content?.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
  );
  const payloadAuctionId = message.result_payload?.auction_id;
  const createdAuctionId =
    (payloadAuctionId !== undefined && payloadAuctionId !== null ? String(payloadAuctionId) : null) ??
    explicitAuctionIdMatch?.[1] ??
    uuidFallbackMatch?.[0] ??
    null;

  const hasCreateSuccessText = AUCTION_CREATION_PHRASES.some((phrase) => normalizedContent.includes(phrase));
  const isAuctionCreatedMessage =
    isAuctionMessage && (isCreateAuctionSuccess || hasCreateSuccessText) && !!createdAuctionId;
  const createdDetails = isAuctionCreatedMessage
    ? extractCreatedAuctionDetails(message.content || "")
    : undefined;
  const parsedAuctionDetails = extractAuctionDetailsFromPlainText(message.content || "");
  const showStructuredCreatedMessage =
    !!createdDetails &&
    !!createdDetails.grade &&
    !!createdDetails.quantity &&
    !!createdDetails.origin &&
    !!createdDetails.base_price &&
    !!createdDetails.start_time &&
    !!createdDetails.duration;
  const showParsedConfirmationMessage =
    !showStructuredAuctionConfirmation &&
    inferredConfirmation &&
    !!parsedAuctionDetails.grade &&
    !!parsedAuctionDetails.quantity &&
    !!parsedAuctionDetails.origin;
  const structuredCardTitle =
    isAuctionCreatedMessage || showStructuredCreatedMessage
      ? "The auction was successfully created."
      : "Please confirm the auction details below";
  const showConfirmationHeader =
    (showStructuredAuctionConfirmation || showParsedConfirmationMessage) && !showStructuredCreatedMessage;

  const isChangeHelpPrompt =
    isAuctionMessage &&
    normalizedContent.includes("i can help you make changes") &&
    normalizedContent.includes("cancel") &&
    !!onSendMessage;

  // Loading state
  if (message.isLoading) {
    return <LoadingBubble />;
  }

  // User message
  if (isUser) {
    return <UserMessage content={message.content} />;
  }

  // Field input prompt
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
                      <span className="font-medium">{fieldError.field.replace(/_/g, " ")}</span>:{" "}
                      {fieldError.error}
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

  // Auction data display
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

  // Assistant message
  const renderedContent = useMemo(() => {
    if (showStructuredAuctionConfirmation || showStructuredCreatedMessage || showParsedConfirmationMessage) {
      return (
        <AuctionConfirmationContent
          structuredFields={structuredFields}
          createdDetails={createdDetails}
          parsedAuctionDetails={parsedAuctionDetails}
          showConfirmationHeader={showConfirmationHeader}
          structuredCardTitle={structuredCardTitle}
          structuredDisplay={structuredDisplay}
        />
      );
    }
    return renderMessageContent(message.content);
  }, [
    showStructuredAuctionConfirmation,
    showStructuredCreatedMessage,
    showParsedConfirmationMessage,
    structuredFields,
    createdDetails,
    parsedAuctionDetails,
    showConfirmationHeader,
    structuredCardTitle,
    structuredDisplay,
    message.content,
  ]);

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#558332] flex items-center justify-center text-white shrink-0 mt-1">
        <Brain className="w-5 h-5" />
      </div>

      <div className="flex-1 max-w-[85%] space-y-3">
        {/* Main Message Bubble */}
        <div
          className={`relative rounded-2xl rounded-tl-none px-4 py-3 shadow-sm group border ${
            isAuctionMessage ? "bg-purple-50 border-purple-200" : "bg-white border-gray-200"
          }`}
        >
          {/* Copy Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message.content);
                    // Could add a temporary success indicator here
                  } catch (err) {
                    console.error("Copy failed", err);
                  }
                }}
                aria-label="Copy message"
                className="absolute opacity-0 group-hover:opacity-100 transition cursor-pointer top-3 right-3"
              >
                <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Copy message
            </TooltipContent>
          </Tooltip>

          {/* Source Badge */}
          <div className="flex items-center gap-1.5 mb-2">
            <SourceBadge source={message.source} />
          </div>

          <div className="text-sm text-gray-800 leading-relaxed pr-6">{renderedContent}</div>

          {isAuctionCreatedMessage && createdAuctionId && (
            <div className="mt-3">
              <p>
                You can view the auction details here:
                <Link
                  href={`${FRONTEND_BASE_URL}/seller/scheduled`}
                  className="inline-flex items-center text-sm font-medium text-[#558332] hover:text-[#4a722c] hover:underline ml-1"
                  target="_blank"
                >
                  View Auction
                </Link>
              </p>
            </div>
          )}

          {message.error && (
            <p className="text-xs text-red-500 mt-2 bg-red-50 rounded p-2">{message.error}</p>
          )}
        </div>

        {/* Action Buttons */}
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
                  onSendMessage?.(isDescriptionActionPrompt ? "edit" : "change");
                }}
                disabled={!isActionEnabled || actionClicked}
                className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDescriptionActionPrompt ? "Edit" : "Change"}
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
              <p className="text-xs font-semibold text-blue-700 mb-2">Sources</p>
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
        {message.sql_query && <SQLQuerySection sqlQuery={message.sql_query} />}
      </div>
    </div>
  );
}
