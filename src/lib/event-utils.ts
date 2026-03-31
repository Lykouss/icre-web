import { addDays, setDate, isAfter, isSameDay, startOfDay } from 'date-fns';

export interface RecurrenceRules {
  type: 'weekly' | 'monthly';
  days: number[];
}

export function getNextEventOccurrence(
  event: { date?: string | null; is_recurring?: boolean; recurrence_rules?: RecurrenceRules | null; cancelled_dates?: string[] | null }
): { nextDate: string | null; isCancelled: boolean } {
  const today = startOfDay(new Date());

  if (!event.is_recurring) {
    if (!event.date) return { nextDate: null, isCancelled: false };
    const eventDate = startOfDay(new Date(event.date + 'T12:00:00'));
    if (isAfter(eventDate, today) || isSameDay(eventDate, today)) {
      return { 
        nextDate: event.date, 
        isCancelled: event.cancelled_dates?.includes(event.date) || false 
      };
    }
    return { nextDate: null, isCancelled: false };
  }

  if (!event.recurrence_rules || !event.recurrence_rules.days.length) {
    return { nextDate: null, isCancelled: false };
  }

  // Iterate over the next 60 days to find the closest occurrence
  for (let i = 0; i <= 60; i++) {
    const d = addDays(today, i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Check if it matches the recurrence rule
    let matches = false;
    if (event.recurrence_rules.type === 'weekly') {
      matches = event.recurrence_rules.days.includes(d.getDay());
    } else if (event.recurrence_rules.type === 'monthly') {
      matches = event.recurrence_rules.days.includes(d.getDate());
    }

    if (matches) {
      // If it's cancelled, we STILL return it so the UI can show the CANCELLED warning!
      const isCancelled = event.cancelled_dates?.includes(dateStr) || false;
      return { nextDate: dateStr, isCancelled };
    }
  }

  return { nextDate: null, isCancelled: false };
}
