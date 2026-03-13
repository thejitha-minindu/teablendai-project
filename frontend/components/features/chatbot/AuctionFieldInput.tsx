"use client";

import { useState } from "react";
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
  const [time, setTime] = useState<string>("14:00");
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

  const buildDateTime = (selectedDate: Date, selectedTime: string): Date => {
    const [hours, minutes] = selectedTime.split(":").map((part) => parseInt(part, 10));
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours || 0, minutes || 0, 0, 0);
    return dateTime;
  };

  const isSameDay = (a: Date, b: Date): boolean => (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );

  const now = new Date();
  const minTimeForToday = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const getSuggestions = (): string[] => {
    if (fieldName === "base_price") {
      return ["10000", "15000", "20000"];
    }
    if (fieldName === "quantity") {
      return ["500", "1000", "2000"];
    }
    if (fieldName === "duration") {
      return ["6", "12", "24"];
    }
    if (fieldName === "description") {
      return ["Fresh high-grown tea lot", "Premium auction batch"];
    }
    return [];
  };

  const getDateTimeSuggestions = (): Array<{ label: string; date: Date; time: string }> => {
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
  };

  const handleSubmit = () => {
    if (isLocked) return;
    setError("");

    if (required && !value && !date) {
      setError("This field is required");
      return;
    }

    if (fieldType === "number") {
      const num = parseFloat(value);
      if (Number.isNaN(num)) {
        setError("Please enter a valid number");
        return;
      }
      if (min !== undefined && num < min) {
        setError(`Minimum value is ${min}`);
        return;
      }
      if (max !== undefined && num > max) {
        setError(`Maximum value is ${max}`);
        return;
      }
    }

    if (fieldType === "datetime") {
      if (!date) {
        setError("Please select a date");
        return;
      }

      const selectedDateTime = buildDateTime(date, time);
      const threshold = new Date(Date.now() + minMinutesAhead * 60 * 1000);
      if (selectedDateTime < threshold) {
        setError(
          minMinutesAhead > 0
            ? `Please choose a time at least ${minMinutesAhead} minutes from now`
            : "Please choose a future date and time"
        );
        return;
      }

      const dateTime = `${format(date, "yyyy-MM-dd")} ${time}`;
      setSubmitted(true);
      onSubmit(dateTime);
      return;
    }

    setSubmitted(true);
    onSubmit(value);
  };

  const handleSkip = () => {
    if (isLocked) return;
    if (!required && onSkip) {
      setSubmitted(true);
      onSkip();
    }
  };

  const isSubmitDisabled = fieldType === "datetime"
    ? !date
    : required && !value.trim();

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
      <div>
        <Label className="text-sm font-medium capitalize">
          {fieldName.replace(/_/g, " ")}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {(min !== undefined || max !== undefined || unit) && (
          <p className="text-xs text-gray-500 mt-1">
            {min !== undefined && <>Min: {min}</>}
            {min !== undefined && max !== undefined && <> · </>}
            {max !== undefined && <>Max: {max}</>}
            {unit && <> · Unit: {unit}</>}
          </p>
        )}

        {fieldType === "select" && (
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
        )}

        {fieldType === "number" && (
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
        )}

        {fieldType === "text" && (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${fieldName}`}
            className="mt-2"
            disabled={isLocked}
          />
        )}

        {fieldType === "textarea" && (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${fieldName}`}
            className="mt-2 w-full min-h-22 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            rows={3}
            disabled={isLocked}
          />
        )}

        {fieldType === "datetime" && (
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
              {getDateTimeSuggestions().map((suggestion) => (
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
        )}

        {fieldType !== "datetime" && fieldType !== "select" && getSuggestions().length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {getSuggestions().map((suggestion) => (
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
        )}

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} className="flex-1" disabled={isLocked || isSubmitDisabled}>
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
