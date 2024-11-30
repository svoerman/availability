'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, isSameDay, subMonths, startOfMonth, eachMonthOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import MonthView from './MonthView';
import type { Project, Sprint } from '@prisma/client';

type Props = {
  project: Project & { sprints: Sprint[] };
};

export default function SprintCalendar({ project }: Props) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [maxDate] = useState(() => addMonths(new Date(), 6));
  const { toast } = useToast();

  useEffect(() => {
    // Initialize selected dates from project sprints
    setSelectedDates(project.sprints.map(sprint => new Date(sprint.startDate)));
  }, [project.sprints]);

  const handleDateSelect = async (date: Date) => {
    try {
      if (selectedDates.some(d => isSameDay(d, date))) {
        // Remove sprint
        const response = await fetch(`/api/projects/${project.id}/sprints`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ startDate: date }),
        });

        if (!response.ok) throw new Error('Failed to delete sprint');

        setSelectedDates(prev => prev.filter(d => !isSameDay(d, date)));
        toast({
          title: 'Sprint removed',
          description: `Sprint starting on ${format(date, 'PPP')} has been removed.`,
        });
      } else {
        // Add sprint
        const response = await fetch(`/api/projects/${project.id}/sprints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ startDate: date }),
        });

        if (!response.ok) throw new Error('Failed to create sprint');

        setSelectedDates(prev => [...prev, date].sort((a, b) => a.getTime() - b.getTime()));
        toast({
          title: 'Sprint added',
          description: `New sprint starting on ${format(date, 'PPP')} has been added.`,
        });
      }
    } catch (error) {
      console.error('Error managing sprint:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sprint. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePrevious = () => {
    setCurrentDate(prev => subMonths(prev, 3));
  };

  const handleNext = () => {
    setCurrentDate(prev => addMonths(prev, 3));
  };

  // Generate an array of 6 months starting from currentDate
  const months = eachMonthOfInterval({
    start: currentDate,
    end: addMonths(currentDate, 5),
  });

  return (
    <div className="p-4 space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Sprint Planning</h2>
        <p className="text-sm text-muted-foreground">
          Click on dates to set or unset sprint start dates. Weekends are automatically skipped.
          Each sprint runs until the start of the next sprint.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={isSameDay(startOfMonth(currentDate), startOfMonth(project.startDate))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium">
          {format(months[0], 'MMMM yyyy')} - {format(months[5], 'MMMM yyyy')}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={isSameDay(startOfMonth(addMonths(currentDate, 5)), startOfMonth(maxDate))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {months.map((month) => (
          <MonthView
            key={month.toISOString()}
            month={month}
            sprints={selectedDates}
            onDateSelect={handleDateSelect}
            minDate={project.startDate}
            maxDate={maxDate}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Upcoming Sprints</h3>
        <div className="space-y-2">
          {selectedDates.map((date, index) => {
            const nextDate = selectedDates[index + 1];
            const endDate = nextDate ? new Date(nextDate) : undefined;
            return (
              <div key={date.toISOString()} className="flex items-center space-x-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{format(date, 'PPP')}</span>
                {endDate && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">
                      {format(new Date(endDate.setDate(endDate.getDate() - 1)), 'PPP')}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
