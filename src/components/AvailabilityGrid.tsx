'use client';

import { useState, useEffect } from 'react';
import { format, addWeeks, startOfWeek, addDays, isWithinInterval } from 'date-fns';
import { User, DayPart, Status, Project } from '@prisma/client';

type Props = {
  project: Project & { members: User[] };
};

type Availability = {
  id: number;
  userId: number;
  date: string;
  dayPart: DayPart;
  status: Status;
};

export default function AvailabilityGrid({ project }: Props) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Try to get saved date from localStorage
    const savedDate = localStorage.getItem(`project-${project.id}-weekStart`);
    if (savedDate) {
      const date = new Date(savedDate);
      // Validate the date is valid
      return isNaN(date.getTime()) ? startOfWeek(new Date()) : date;
    }
    return startOfWeek(new Date());
  });
  const [availabilityData, setAvailabilityData] = useState<Availability[]>([]);

  const projectStartDate = new Date(project.startDate);
  const projectMembers = project.members;

  // Generate dates for the next 2 weeks
  const dates = Array.from({ length: 14 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  // Save current week start to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`project-${project.id}-weekStart`, currentWeekStart.toISOString());
  }, [currentWeekStart, project.id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch('/api/availability');
        if (!res.ok) throw new Error('Failed to fetch availability');
        const data = await res.json();
        setAvailabilityData(data);
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    };
    fetchAvailability();
  }, []);

  const getAvailability = (userId: number, date: Date, dayPart: DayPart) => {
    return (
      availabilityData.find(
        (a) =>
          a.userId === userId &&
          a.date.split('T')[0] === format(date, 'yyyy-MM-dd') &&
          a.dayPart === dayPart
      )?.status || 'FREE'
    );
  };

  const updateAvailability = async (
    userId: number,
    date: Date,
    dayPart: DayPart,
    currentStatus: Status
  ) => {
    // Check if the date is within project dates
    if (!isWithinProjectDates(date)) {
      return;
    }

    // Rotate through statuses
    const statusOrder: Status[] = [
      'FREE',
      'NOT_WORKING',
      'PARTIALLY_AVAILABLE',
      'WORKING',
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    const response = await fetch('/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        date: format(date, 'yyyy-MM-dd'),
        dayPart,
        status: newStatus,
      }),
    });

    if (response.ok) {
      const updatedAvailability = await response.json();
      setAvailabilityData((prev) => {
        const index = prev.findIndex(
          (a) =>
            a.userId === userId &&
            a.date.split('T')[0] === format(date, 'yyyy-MM-dd') &&
            a.dayPart === dayPart
        );
        if (index >= 0) {
          return [
            ...prev.slice(0, index),
            updatedAvailability,
            ...prev.slice(index + 1),
          ];
        }
        return [...prev, updatedAvailability];
      });
    }
  };

  const isWithinProjectDates = (date: Date) => {
    if (!projectStartDate) return false;
    const start = startOfWeek(projectStartDate);
    return date >= start;
  };

  const getStatusColor = (status: Status, date: Date) => {
    if (!isWithinProjectDates(date)) {
      return 'bg-gray-100 cursor-not-allowed';
    }

    switch (status) {
      case 'FREE':
        return 'bg-red-200 hover:bg-red-300 cursor-pointer';
      case 'NOT_WORKING':
        return 'bg-orange-200 hover:bg-orange-300 cursor-pointer';
      case 'PARTIALLY_AVAILABLE':
        return 'bg-yellow-200 hover:bg-yellow-300 cursor-pointer';
      case 'WORKING':
        return 'bg-green-200 hover:bg-green-300 cursor-pointer';
      default:
        return 'bg-gray-200 hover:bg-gray-300 cursor-pointer';
    }
  };

  const handlePreviousPeriod = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, -2));
  };

  const handleNextPeriod = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 2));
  };

  const handleTodayPeriod = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousPeriod}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          ← Previous
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleTodayPeriod}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Today
          </button>
          <button
            onClick={handleNextPeriod}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Next →
          </button>
        </div>
      </div>
      <div className="flex justify-center mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentWeekStart, 'd MMM yyyy')} - {format(addDays(currentWeekStart, 13), 'd MMM yyyy')}
        </h2>
      </div>
      <div className="inline-block min-w-full">
        <div className="grid grid-cols-[auto_repeat(14,_minmax(80px,_1fr))]">
          {/* Header */}
          <div className="sticky left-0 bg-white z-10"></div>
          {dates.map((date) => (
            <div
              key={date.toString()}
              className={`text-center py-2 border-b font-medium ${
                !isWithinProjectDates(date) ? 'text-gray-400' : ''
              }`}
            >
              <div>{format(date, 'EEE')}</div>
              <div>{format(date, 'd MMM')}</div>
            </div>
          ))}

          {/* Grid */}
          {projectMembers.map((user) => (
            <div key={user.id} className="contents">
              <div
                className="sticky left-0 bg-white z-10 py-2 pr-4 font-medium border-b"
              >
                {user.name}
              </div>
              {dates.map((date) => (
                <div
                  key={`${user.id}-${date.toString()}`}
                  className="grid grid-rows-2 border-b"
                >
                  {(['MORNING', 'AFTERNOON'] as DayPart[]).map((dayPart) => {
                    const status = getAvailability(user.id, date, dayPart);
                    const withinDates = isWithinProjectDates(date);
                    return (
                      <button
                        key={`${user.id}-${date.toString()}-${dayPart}`}
                        className={`${getStatusColor(
                          status as Status,
                          date
                        )} h-8 transition-colors ${withinDates ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        onClick={() =>
                          withinDates &&
                          updateAvailability(
                            user.id,
                            date,
                            dayPart,
                            status as Status
                          )
                        }
                        disabled={!withinDates}
                        title={`${format(date, 'd MMM')} - ${dayPart.toLowerCase()}\nStatus: ${status.toLowerCase().replace(/_/g, ' ')}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200"></div>
          <span className="text-sm">Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200"></div>
          <span className="text-sm">Not Working</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200"></div>
          <span className="text-sm">Partially Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200"></div>
          <span className="text-sm">Working</span>
        </div>
      </div>
    </div>
  );
}
