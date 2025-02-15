'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addWeeks, startOfWeek, addDays } from 'date-fns';
import { DayPart, Project } from '@prisma/client';
import { Status } from '@/types/prisma';

type Props = {
  project: Project & {
    members: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
    }[];
    organization: {
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      description: string | null;
    } | null;
  };
};

type Availability = {
  id: string;
  userId: string;
  date: string;
  dayPart: DayPart;
  status: Status;
};

type CellPosition = {
  userId: string;
  date: Date;
  dayPart: DayPart;
};

export default function AvailabilityGrid({ project }: Props) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));

  // Handle localStorage on the client side
  useEffect(() => {
    const savedDate = localStorage.getItem(`project-${project.id}-weekStart`);
    if (savedDate) {
      const date = new Date(savedDate);
      if (!isNaN(date.getTime())) {
        setCurrentWeekStart(date);
      }
    }
  }, [project.id]);

  // Save currentWeekStart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(`project-${project.id}-weekStart`, currentWeekStart.toISOString());
  }, [currentWeekStart, project.id]);

  const [availabilityData, setAvailabilityData] = useState<Availability[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);

  // Fetch initial availability data
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch(`/api/availability?projectId=${project.id}`);
        if (!response.ok) throw new Error('Failed to fetch availability');
        const data = await response.json();
        setAvailabilityData(data);
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    };

    fetchAvailability();
  }, [project.id, currentWeekStart]);

  // Listen for real-time updates
  useEffect(() => {
    const es = new EventSource('/api/availability-updates');
    
    es.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.projectId === project.id) {
        setAvailabilityData(prev => {
          const newAvailabilityData = [...prev];
          const index = newAvailabilityData.findIndex(
            a => a.userId === update.userId && 
                 a.date === update.date && 
                 a.dayPart === update.dayPart
          );
          if (index !== -1) {
            newAvailabilityData[index] = { ...newAvailabilityData[index], status: update.status };
          } else {
            newAvailabilityData.push(update);
          }
          return newAvailabilityData;
        });
      }
    };

    return () => {
      es.close();
    };
  }, [project.id]);

  const projectStartDate = useMemo(() => new Date(project.startDate), [project.startDate]);
  const projectMembers = project.members;

  // Generate dates for the next 2 weeks
  const dates = Array.from({ length: 14 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`/api/availability?projectId=${project.id}`);
        if (!res.ok) throw new Error('Failed to fetch availability');
        const data = await res.json();
        setAvailabilityData(data);
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    };
    fetchAvailability();
  }, [project.id]);

  const getAvailability = useCallback((userId: string, date: Date, dayPart: DayPart) => {
    const existingAvailability = availabilityData.find(
      (a) =>
        a.userId === userId &&
        a.date.split('T')[0] === format(date, 'yyyy-MM-dd') &&
        a.dayPart === dayPart
    )?.status;

    if (existingAvailability) return existingAvailability;

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();
    // Return 'FREE' for weekends (Saturday and Sunday), 'WORKING' for weekdays
    return dayOfWeek === 0 || dayOfWeek === 6 ? Status.FREE : Status.WORKING;
  }, [availabilityData]);

  const isWithinProjectDates = useCallback((date: Date) => {
    if (!projectStartDate) return false;
    const start = startOfWeek(projectStartDate);
    return date >= start;
  }, [projectStartDate]);

  const updateAvailability = useCallback(async (
    userId: string,
    date: Date,
    dayPart: DayPart,
    currentStatus: Status,
    newStatus?: Status
  ) => {
    // Check if the date is within project dates
    if (!isWithinProjectDates(date)) {
      return;
    }

    // If newStatus is provided, use it. Otherwise, rotate through statuses
    let statusToSet: Status;
    if (newStatus) {
      statusToSet = newStatus;
    } else {
      const statusOrder: Status[] = [
        Status.FREE,
        Status.NOT_WORKING,
        Status.PARTIALLY_AVAILABLE,
        Status.WORKING,
      ];
      const currentIndex = statusOrder.indexOf(currentStatus);
      statusToSet = statusOrder[(currentIndex + 1) % statusOrder.length];
    }

    const response = await fetch('/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        projectId: project.id,
        date: format(date, 'yyyy-MM-dd'),
        dayPart,
        status: statusToSet,
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
      return updatedAvailability;
    }
    return null;
  }, [setAvailabilityData, isWithinProjectDates, project.id]);

  const getStatusColor = (status: Status, date: Date) => {
    if (!isWithinProjectDates(date)) {
      return 'bg-gray-100 cursor-not-allowed';
    }

    switch (status) {
      case Status.FREE:
        return 'bg-red-400 hover:bg-red-500 cursor-pointer';
      case Status.NOT_WORKING:
        return 'bg-orange-400 hover:bg-orange-500 cursor-pointer';
      case Status.PARTIALLY_AVAILABLE:
        return 'bg-yellow-400 hover:bg-yellow-500 cursor-pointer';
      case Status.WORKING:
        return 'bg-green-400 hover:bg-green-500 cursor-pointer';
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

  const handleMouseDown = (userId: string, date: Date, dayPart: DayPart) => {
    if (!isWithinProjectDates(date)) return;
    
    setIsDragging(true);
    setSelectionStart({ userId, date, dayPart });
    setSelectedCells([{ userId, date, dayPart }]);
  };

  const handleMouseEnter = (userId: string, date: Date, dayPart: DayPart) => {
    if (!isDragging || !selectionStart || !isWithinProjectDates(date)) return;

    const startDate = selectionStart.date;
    const endDate = date;
    const startDayPart = selectionStart.dayPart;
    const endDayPart = dayPart;

    // Get all dates between start and end
    const dates = [];
    let currentDate = new Date(Math.min(startDate.getTime(), endDate.getTime()));
    const lastDate = new Date(Math.max(startDate.getTime(), endDate.getTime()));

    while (currentDate <= lastDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }

    // Create selection for all cells between start and current position
    const newSelection = dates.flatMap(date => {
      if (userId === selectionStart.userId) {
        const isFirstDate = date.getTime() === startDate.getTime();
        const isLastDate = date.getTime() === endDate.getTime();
        const isMiddleDate = !isFirstDate && !isLastDate;

        // For dates in the middle, select both parts
        if (isMiddleDate) {
          return ['MORNING', 'AFTERNOON'].map(part => ({
            userId,
            date: new Date(date),
            dayPart: part as DayPart,
          }));
        }

        // For the first date
        if (isFirstDate && startDate <= endDate) {
          const parts = startDayPart === 'MORNING' 
            ? ['MORNING', 'AFTERNOON']
            : ['AFTERNOON'];
          return parts.map(part => ({
            userId,
            date: new Date(date),
            dayPart: part as DayPart,
          }));
        }

        // For the last date
        if (isLastDate && startDate <= endDate) {
          const parts = endDayPart === 'AFTERNOON'
            ? ['MORNING', 'AFTERNOON']
            : ['MORNING'];
          return parts.map(part => ({
            userId,
            date: new Date(date),
            dayPart: part as DayPart,
          }));
        }

        // For reverse selection (dragging backwards)
        if (isFirstDate && startDate > endDate) {
          const parts = endDayPart === 'MORNING'
            ? ['MORNING']
            : ['MORNING', 'AFTERNOON'];
          return parts.map(part => ({
            userId,
            date: new Date(date),
            dayPart: part as DayPart,
          }));
        }

        if (isLastDate && startDate > endDate) {
          const parts = startDayPart === 'AFTERNOON'
            ? ['AFTERNOON']
            : ['MORNING', 'AFTERNOON'];
          return parts.map(part => ({
            userId,
            date: new Date(date),
            dayPart: part as DayPart,
          }));
        }
      }
      return [];
    });

    setSelectedCells(newSelection);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const updateSelectedCells = useCallback(async (newStatus: Status) => {
    const promises = selectedCells.map(cell => {
      const currentStatus = getAvailability(cell.userId, cell.date, cell.dayPart);
            
      return updateAvailability(
        cell.userId,
        cell.date,
        cell.dayPart,
        currentStatus as Status,
        newStatus
      );
    });
    
    const results = await Promise.all(promises);

    // Broadcast updates to other clients
    await Promise.all(
      results.map(async (result) => {
        if (result) {
          await fetch('/api/availability-updates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: project.id,
              userId: result.userId,
              date: result.date,
              dayPart: result.dayPart,
              status: result.status,
            }),
          });
        }
      })
    );

    // Only proceed with selecting next cell if exactly one cell was selected
    if (selectedCells.length === 1) {
      const currentCell = selectedCells[0];
      let nextDate = new Date(currentCell.date);
      let nextDayPart: DayPart = currentCell.dayPart;

      // Function to check if date is a weekend
      const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
      };

      // If current dayPart is MORNING, select AFTERNOON of the same day
      if (nextDayPart === 'MORNING') {
        nextDayPart = 'AFTERNOON';
      } 
      // If current dayPart is AFTERNOON, move to next day's MORNING
      else {
        nextDate = addDays(nextDate, 1);
        nextDayPart = 'MORNING';
        
        // Skip weekend days
        while (isWeekend(nextDate)) {
          nextDate = addDays(nextDate, 1);
        }
      }

      // Only select next cell if it's within project dates and not a weekend
      if (isWithinProjectDates(nextDate) && !isWeekend(nextDate)) {
        setSelectedCells([{
          userId: currentCell.userId,
          date: nextDate,
          dayPart: nextDayPart,
        }]);
      } else {
        // Clear selection if we've reached the end or hit a weekend
        setSelectedCells([]);
      }
    } else {
      // Clear selection if multiple cells were selected
      setSelectedCells([]);
    }
  }, [selectedCells, getAvailability, updateAvailability, isWithinProjectDates, project.id]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle key events when there are selected cells
      if (selectedCells.length === 0) return;

      const statusMap: Record<string, Status> = {
        '1': Status.WORKING,
        '2': Status.PARTIALLY_AVAILABLE,
        '3': Status.NOT_WORKING,
        '4': Status.FREE
      };

      const newStatus = statusMap[event.key];
      if (newStatus) {
        updateSelectedCells(newStatus);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [selectedCells, updateSelectedCells]);

  const isCellSelected = (userId: string, date: Date, dayPart: DayPart) => {
    return selectedCells.some(
      cell =>
        cell.userId === userId &&
        cell.date.getTime() === date.getTime() &&
        cell.dayPart === dayPart
    );
  };

  const handleCellClick = async (userId: string, date: Date, dayPart: DayPart) => {
    if (!isWithinProjectDates(date)) return;
    
    const currentStatus = getAvailability(userId, date, dayPart);
    const statusValues = [Status.FREE, Status.NOT_WORKING, Status.PARTIALLY_AVAILABLE, Status.WORKING];
    const nextStatus = statusValues[
      (statusValues.indexOf(currentStatus as Status) + 1) % statusValues.length
    ];

    try {
      await updateAvailability(userId, date, dayPart, currentStatus as Status, nextStatus);
      
      // Broadcast the update
      await fetch('/api/availability-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          userId,
          date: format(date, 'yyyy-MM-dd'),
          dayPart,
          status: nextStatus,
        }),
      });
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
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
        <div className="grid grid-cols-[auto_repeat(14,_minmax(80px,_1fr))] gap-x-[2px] bg-gray-300">
          {/* Header */}
          <div className="sticky left-0 bg-white z-10"></div>
          {dates.map((date) => (
            <div
              key={date.toString()}
              className={`text-center py-2 border-b font-medium bg-white ${
                !isWithinProjectDates(date) ? 'text-gray-400' : ''
              }`}
            >
              <div>{format(date, 'EEE')}</div>
              <div>{format(date, 'd MMM')}</div>
            </div>
          ))}

          {/* Grid */}
          {projectMembers.map((member) => (
            <div key={member.id} className="contents">
              <div
                className="sticky left-0 bg-white z-10 py-2 pr-4 font-medium border-b"
              >
                {member.user.name}
              </div>
              {dates.map((date) => (
                <div
                  key={`${member.user.id}-${date.toString()}`}
                  className="flex gap-x-[1px] border-b bg-gray-300"
                >
                  {(['MORNING', 'AFTERNOON'] as DayPart[]).map((dayPart) => {
                    const status = getAvailability(member.user.id, date, dayPart);
                    const withinDates = isWithinProjectDates(date);
                    const isSelected = isCellSelected(member.user.id, date, dayPart);
                    return (
                      <button
                        key={`${member.user.id}-${date.toString()}-${dayPart}`}
                        className={`${getStatusColor(
                          status as Status,
                          date
                        )} flex-1 h-16 transition-colors ${
                          withinDates ? 'cursor-pointer' : 'cursor-not-allowed'
                        } ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                        onMouseDown={() => handleMouseDown(member.user.id, date, dayPart)}
                        onMouseEnter={() => handleMouseEnter(member.user.id, date, dayPart)}
                        onMouseUp={handleMouseUp}
                        onClick={() => 
                          withinDates && 
                          !isDragging && 
                          handleCellClick(member.user.id, date, dayPart)
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
      <div className="mt-4 flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => updateSelectedCells(Status.WORKING)}
          disabled={selectedCells.length === 0}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            selectedCells.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-400 hover:bg-green-500 text-white'
          }`}
        >
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          Working (1)
        </button>
        <button
          onClick={() => updateSelectedCells(Status.PARTIALLY_AVAILABLE)}
          disabled={selectedCells.length === 0}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            selectedCells.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-500 text-white'
          }`}
        >
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          Partially Available (2)
        </button>
        <button
          onClick={() => updateSelectedCells(Status.NOT_WORKING)}
          disabled={selectedCells.length === 0}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            selectedCells.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-orange-400 hover:bg-orange-500 text-white'
          }`}
        >
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          Other assignments (3)
        </button>
        <button
          onClick={() => updateSelectedCells(Status.FREE)}
          disabled={selectedCells.length === 0}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            selectedCells.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-400 hover:bg-red-500 text-white'
          }`}
        >
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          Free (4)
        </button>
      </div>
    </div>
  );
}
