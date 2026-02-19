"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SendIcon, LoaderIcon } from "lucide-react";
import { motion } from "framer-motion";
import * as React from "react";
import { SparklesIcon } from "@/components/ui/sparkles";

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
    }, [minHeight]);

    return { textareaRef, adjustHeight };
}

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { containerClassName?: string }>(
    ({ className, containerClassName, ...props }, ref) => {
        return (
            <div className={cn("relative", containerClassName)}>
                <textarea
                    className={cn(
                        "flex min-h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm",
                        "focus:outline-none resize-none border-none",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
Textarea.displayName = "Textarea";

interface AnimatedAIChatProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    showWelcome?: boolean;
}

export function AnimatedAIChat({ onSendMessage, isLoading, showWelcome = true }: AnimatedAIChatProps) {
    const [value, setValue] = useState("");
    const [suggestionQuestions, setSuggestionQuestions] = useState<string[]>([]);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 24,
        maxHeight: 120,
    });

    const allSuggestionQuestions = [
        "How many customers are there in total?",
        "Compare average purchase prices of BOPF from brokers vs factories over the last 3 years.",
        "Show me the annual trends in total quantity purchased for each tea standard.",
        "Which blends had the highest profit margins in 2024?",
        "What are the top tea-growing regions in Sri Lanka?",
        "How does Sri Lankan tea quality compare to other origins?",
        "What's the best brewing temperature for Ceylon tea?",
        "Which Sri Lankan tea estates produce the finest OP grade?",
        "Tell me about the flavour profiles of Nuwara Eliya teas.",
        "What makes Dimbula tea unique?",
        "How should I store Sri Lankan black tea?",
        "What are the health benefits of Ceylon tea?",
    ];

    useEffect(() => {
        const shuffled = [...allSuggestionQuestions]
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
        setSuggestionQuestions(shuffled);
    }, []);

    const handleSendMessage = () => {
        if (!value.trim() || isLoading) return;
        
        onSendMessage(value.trim());
        setValue("");
        adjustHeight(true);
    };

    const handleSuggestionClick = (question: string) => {
        setValue(question);
        adjustHeight();
    };

    
    return (
        <div className={cn(
            "flex flex-col w-full items-center bg-white text-gray-900 p-6 relative overflow-hidden",
            showWelcome ? "h-screen justify-center" : "justify-end py-4"
        )}>

            {/* Only show welcome text when no messages */}
            {showWelcome && (
                <div className="w-full max-w-6xl text-center space-y-1 pb-8">
                    <p className="text-xl text-gray-500 pt-2">
                        Chat with our Tea AI to discover blends, rituals, and flavors made just for you.
                    </p>
                </div>
            )}

            <div className="w-full max-w-3xl bg-gray-50 border border-gray-200 rounded-2xl shadow-xl">
                <div className="p-4 flex flex-row items-center gap-3 w-full">
                    <button className="p-2 rounded-full shrink-0 self-center">
                        <SparklesIcon 
                            className="w-8 h-8 text-[#558332] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(85,131,50,0.7)]" 
                        />
                    </button>

                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            setValue(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Ask me anything about tea  .  .  ."
                        containerClassName="flex-1"
                        className="text-[14px] text-gray-900 placeholder:text-gray-400 leading-normal py-2"
                    />

                    <motion.button
                        type="button"
                        onClick={handleSendMessage}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isLoading || !value.trim()}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-medium transition-all self-center",
                            "flex items-center gap-2",
                            value.trim() && !isLoading
                                ? "bg-[#558332] text-white shadow-lg hover:bg-[#6a9e3e]"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <LoaderIcon className="w-4 h-4 animate-spin" />
                        ) : (
                            <SendIcon className="w-4 h-4" />
                        )}
                        <span>Send</span>
                    </motion.button>
                </div>
            </div>

            {/* Only show suggestions when no messages */}
            {showWelcome && (
                <div className="w-full max-w-3xl mt-4">
                    <p className="text-sm text-gray-500 mb-2 text-center">Try asking:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestionQuestions.map((question, index) => (
                            <motion.button
                                key={index}
                                onClick={() => handleSuggestionClick(question)}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-3 text-left rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-[#558332]/50 group"
                            >
                                <p className="text-sm text-gray-700 group-hover:text-gray-900">
                                    {question}
                                </p>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
