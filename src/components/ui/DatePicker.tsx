'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  allowed_dates: 'only_past' | 'only_future' | 'past_today' | 'future_today' | 'all';
}

export function DatePicker({ selected, onSelect, className, placeholder, allowed_dates }: DatePickerProps) {
  const getCalendarRange = () => {
    const currentYear = new Date().getFullYear();
    switch (allowed_dates) {
      case 'only_future':
      case 'future_today':
        return {
          startMonth: new Date(currentYear, 0),
          endMonth: new Date(currentYear + 30, 11),
        };
      case 'only_past':
      case 'past_today':
        return {
          startMonth: new Date(currentYear - 100, 0),
          endMonth: new Date(currentYear, 11),
        };
      case 'all':
      default:
        return {
          startMonth: new Date(currentYear - 100, 0),
          endMonth: new Date(currentYear + 30, 11),
        };
    }
  };

  const { startMonth, endMonth } = getCalendarRange();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className={cn(
            'w-full justify-start text-left font-normal h-12 rounded-lg border-gray-300',
            !selected && 'text-gray-400',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'PPP') : <span>{placeholder || 'Introduce la fecha'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          captionLayout="dropdown"
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalizar al inicio del día para comparaciones de fecha
            switch (allowed_dates) {
              case 'only_past':
                return date >= today;
              case 'only_future':
                return date <= today;
              case 'past_today':
                return date > today;
              case 'future_today':
                return date < today;
              case 'all':
              default:
                return false;
            }
          }}
          startMonth={startMonth}
          endMonth={endMonth}
        />
      </PopoverContent>
    </Popover>
  );
}
