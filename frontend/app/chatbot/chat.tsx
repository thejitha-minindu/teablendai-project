"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Sparkles,
    SendIcon,
    LoaderIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import * as React from "react";

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
}

export function AnimatedAIChat({ onSendMessage, isLoading }: AnimatedAIChatProps) {
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
        <div className="h-screen flex flex-col w-full items-center justify-center bg-black text-white p-6 relative overflow-hidden">

            <div className="w-full max-w-6xl text-center space-y-1 pb-8">
                <h1 className="font-bold text-[#558332] pb-6 text-center leading-tight">
                    <span className="flex pb-4 text-6xl justify-center items-center gap-4">
                        <span>Find teas</span>
                        <img src="/TeacupIcon.png" alt="Tea Cup Icon" className="w-24 h-18 inline-block"/>
                        <span>that warm your soul</span>
                    </span>

                    <span className="block text-5xl">
                        Brew your perfect cup with AI
                    </span>
                </h1>


                <p className="text-xl text-white/40 pt-2">
                    Chat with our Tea AI to discover blends, rituals, and flavors made just for you.
                </p>
            </div>

            <div className="w-full max-w-3xl backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl shadow-xl">
                <div className="p-4 flex flex-row items-center gap-3 w-full">
                    <button 
                        className="p-2 rounded-full transition-all shrink-0 self-center"
                    >
                        <Sparkles className="w-8 h-8 text-[#558332]" />
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
                        className="text-[14px] text-white/90 placeholder:text-white/30 leading-normal py-2"
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
                                ? "bg-[#ffffff] text-black shadow-lg hover:bg-[#6a9e3e]"
                                : "bg-white/5 text-white/30 cursor-not-allowed"
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

            <div className="w-full max-w-3xl mt-4">
                <p className="text-sm text-white/50 mb-2 text-center">Try asking:</p>
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
                            className="p-3 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#558332]/50 transition-all group"
                        >
                            <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                                {question}
                            </p>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
