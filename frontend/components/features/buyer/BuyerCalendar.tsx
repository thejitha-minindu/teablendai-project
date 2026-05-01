import { Calendar } from "@/components/ui/calendar";

interface BuyerCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date | undefined) => void;
}

export function BuyerCalendar({ selectedDate, onDateSelect }: BuyerCalendarProps) {
  return (
    <div className="mt-10">
      <div>      
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          today={new Date()}
          modifiers={{
            today: new Date(),
          }}
          modifiersClassNames={{
            today: "bg-primary/20 text-primary font-bold rounded-full",
          }}
        />
      </div>

    </div>
  );
}