'use client';

import { useState } from 'react';
import { format, eachWeekOfInterval, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameDay, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Sprint } from '@prisma/client';

interface MonthViewProps {
  month: Date;
  sprints: Date[];
  onDateSelect: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
}

export default function MonthView({ month, sprints, onDateSelect, minDate, maxDate }: MonthViewProps) {
  const weeks = eachWeekOfInterval(
    {
      start: startOfMonth(month),
      end: endOfMonth(month)
    },
    { weekStartsOn: 1 } // Start weeks on Monday
  );

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="text-sm font-medium mb-4">
        {format(month, 'MMMM yyyy')}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-muted-foreground text-center py-1"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {weeks.map((week) => {
          const days = eachDayOfInterval({
            start: week,
            end: new Date(week.getTime() + 6 * 24 * 60 * 60 * 1000)
          });

          return days.map((day) => {
            const isCurrentMonth = isSameMonth(day, month);
            const isSprintStart = sprints.some((sprint) => isSameDay(sprint, day));
            const isDisabled = day < minDate || day > maxDate || isWeekend(day);
            const nextSprintIndex = sprints.findIndex((sprint) => sprint > day);
            const previousSprintIndex = sprints.findIndex((sprint) => sprint > day) - 1;
            const isInSprintRange = previousSprintIndex >= 0 && 
              day > sprints[previousSprintIndex] && 
              (nextSprintIndex === -1 || day < sprints[nextSprintIndex]);

            return (
              <button
                key={day.toISOString()}
                onClick={() => !isDisabled && onDateSelect(day)}
                disabled={isDisabled}
                className={cn(
                  "h-8 text-xs relative rounded-sm",
                  isCurrentMonth ? "bg-background" : "bg-muted/50",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  !isDisabled && "hover:bg-muted cursor-pointer",
                  isSprintStart && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isInSprintRange && !isSprintStart && "bg-primary/10",
                  "relative group"
                )}
              >
                <time dateTime={format(day, 'yyyy-MM-dd')}>
                  {format(day, 'd')}
                </time>
                {isSprintStart && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                    Sprint Start
                  </div>
                )}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}
