"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface AuctionFieldInputProps {
  fieldName: string;
  fieldType: string;
  options?: string[];
  validation?: Record<string, unknown>;
  onSubmit: (value: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
}

// Constants
const DEFAULT_TIME = "14:00";
const SUGGESTIONS_CONFIG = {
  base_price: ["10000", "15000", "20000"],
  quantity: ["500", "1000", "2000"],
  duration: ["6", "12", "24"],
  description: ["Fresh high-grown tea lot", "Premium auction batch"],
} as const;

// Utility functions
const buildDateTime = (date: Date, time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const dateTime = new Date(date);
  dateTime.setHours(hours || 0, minutes || 0, 0, 0);
  return dateTime;
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatTimeForToday = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

// Validation helper
const validateNumber = (value: string, min?: number, max?: number): string | null => {
  const num = parseFloat(value);
  if (isNaN(num)) return "Please enter a valid number";
  if (min !== undefined && num < min) return `Minimum value is ${min}`;
  if (max !== undefined && num > max) return `Maximum value is ${max}`;
  return null;
};

const validateDateTime = (date: Date | undefined, time: string, minMinutesAhead: number): string | null => {
  if (!date) return "Please select a date";

  const selectedDateTime = buildDateTime(date, time);
  const threshold = new Date(Date.now() + minMinutesAhead * 60 * 1000);

  if (selectedDateTime < threshold) {
    return minMinutesAhead > 0
      ? `Please choose a time at least ${minMinutesAhead} minutes from now`
      : "Please choose a future date and time";
  }
  return null;
};

export function AuctionFieldInput({
  fieldName,
  fieldType,
  options = [],
  validation = {},
  onSubmit,
  onSkip,
  disabled = false,
}: AuctionFieldInputProps) {
  const [value, setValue] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>(DEFAULT_TIME);
  const [error, setError] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const required = Boolean(validation?.required);
  const isLocked = disabled || submitted;
  const min = typeof validation?.min === "number" ? validation.min : undefined;
  const max = typeof validation?.max === "number" ? validation.max : undefined;
  const unit = typeof validation?.unit === "string" ? validation.unit : undefined;
  const minMinutesAhead = typeof validation?.min_minutes_ahead === "number"
    ? validation.min_minutes_ahead
    : 0;

  const now = new Date();
  const minTimeForToday = formatTimeForToday(now);

  // Memoized suggestions
  const suggestions = useMemo(() => {
    if (fieldName === "base_price") return SUGGESTIONS_CONFIG.base_price;
    if (fieldName === "quantity") return SUGGESTIONS_CONFIG.quantity;
    if (fieldName === "duration") return SUGGESTIONS_CONFIG.duration;
    if (fieldName === "description") return SUGGESTIONS_CONFIG.description;
    return [];
  }, [fieldName]);

  const dateTimeSuggestions = useMemo(() => {
    const current = new Date();

    const todayLate = new Date(current);
    todayLate.setHours(Math.max(current.getHours() + 1, 9), 0, 0, 0);

    const tomorrowMorning = new Date(current);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(9, 0, 0, 0);

    const tomorrowAfternoon = new Date(current);
    tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
    tomorrowAfternoon.setHours(14, 0, 0, 0);

    return [
      {
        label: `Today ${format(todayLate, "HH:mm")}`,
        date: todayLate,
        time: format(todayLate, "HH:mm"),
      },
      {
        label: `Tomorrow ${format(tomorrowMorning, "HH:mm")}`,
        date: tomorrowMorning,
        time: format(tomorrowMorning, "HH:mm"),
      },
      {
        label: `Tomorrow ${format(tomorrowAfternoon, "HH:mm")}`,
        date: tomorrowAfternoon,
        time: format(tomorrowAfternoon, "HH:mm"),
      },
    ];
  }, []);

  const handleSubmit = useCallback(() => {
    if (isLocked) return;
    setError("");

    // Required validation
    if (required && !value && !date) {
      setError("This field is required");
      return;
    }

    // Type-specific validation
    if (fieldType === "number") {
      const errorMsg = validateNumber(value, min, max);
      if (errorMsg) {
        setError(errorMsg);
        return;
      }
    }

    if (fieldType === "datetime") {
      const errorMsg = validateDateTime(date, time, minMinutesAhead);
      if (errorMsg) {
        setError(errorMsg);
        return;
      }

      const dateTime = `${format(date!, "yyyy-MM-dd")} ${time}`;
      setSubmitted(true);
      onSubmit(dateTime);
      return;
    }

    setSubmitted(true);
    onSubmit(value);
  }, [isLocked, required, value, date, fieldType, min, max, minMinutesAhead, time, onSubmit]);

  const handleSkip = useCallback(() => {
    if (isLocked) return;
    if (!required && onSkip) {
      setSubmitted(true);
      onSkip();
    }
  }, [isLocked, required, onSkip]);

  const isSubmitDisabled = fieldType === "datetime"
    ? !date
    : required && !value.trim();

  const isSuggestionSelected = (suggestionValue: string): boolean => {
    if (fieldType === "datetime") {
      return date ? format(date, "yyyy-MM-dd") === format(suggestionValue, "yyyy-MM-dd") && time === suggestionValue : false;
    }
    return value === suggestionValue;
  };

  const renderValidationHint = () => {
    if (min === undefined && max === undefined && !unit) return null;
    return (
      <p className="text-xs text-gray-500 mt-1">
        {min !== undefined && <>Min: {min}</>}
        {min !== undefined && max !== undefined && <> · </>}
        {max !== undefined && <>Max: {max}</>}
        {unit && <> · Unit: {unit}</>}
      </p>
    );
  };

  const renderFieldInput = () => {
    if (fieldType === "select") {
      return (
        <Select value={value} onValueChange={setValue} disabled={isLocked}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder={`Select ${fieldName}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (fieldType === "number") {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter ${fieldName}`}
          min={min}
          max={max}
          className="mt-2"
          disabled={isLocked}
        />
      );
    }

    if (fieldType === "text") {
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter ${fieldName}`}
          className="mt-2"
          disabled={isLocked}
        />
      );
    }

    if (fieldType === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter ${fieldName}`}
          className="mt-2 w-full min-h-22 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={3}
          disabled={isLocked}
        />
      );
    }

    if (fieldType === "datetime") {
      return (
        <div className="space-y-2 mt-2">
          <Button
            variant="outline"
            type="button"
            className="w-full justify-start text-left font-normal"
            disabled={isLocked}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date below</span>}
          </Button>

          <div className="border rounded-md p-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={isLocked ? () => true : (day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </div>

          <div className="flex gap-2 items-center">
            <Label className="text-sm">Time:</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              min={date && isSameDay(date, now) ? minTimeForToday : undefined}
              className="flex-1"
              disabled={isLocked}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {dateTimeSuggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => {
                  if (isLocked) return;
                  setDate(suggestion.date);
                  setTime(suggestion.time);
                  setError("");
                }}
                className={`text-xs px-3 py-1.5 rounded-full border text-gray-700 transition ${
                  date && format(date, "yyyy-MM-dd") === format(suggestion.date, "yyyy-MM-dd") && time === suggestion.time
                    ? "bg-[#558332] text-white border-[#558332]"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderSuggestions = () => {
    if (fieldType === "datetime" || fieldType === "select") return null;
    if (suggestions.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              if (isLocked) return;
              setValue(suggestion);
              setError("");
            }}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              value === suggestion
                ? "bg-[#558332] text-white border-[#558332]"
                : "bg-gray-50 hover:bg-gray-100 text-gray-700"
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
      <div>
        <Label className="text-sm font-medium capitalize">
          {fieldName.replace(/_/g, " ")}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {renderValidationHint()}
        {renderFieldInput()}
        {renderSuggestions()}
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          className="flex-1"
          disabled={isLocked || isSubmitDisabled}
        >
          Submit
        </Button>
        {!required && (
          <Button variant="outline" onClick={handleSkip} disabled={isLocked}>
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}