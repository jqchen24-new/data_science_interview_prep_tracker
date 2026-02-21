"use client";

import { useState } from "react";

/** Local calendar date as YYYY-MM-DD (avoids timezone off-by-one). */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysInMonth(d: Date): number {
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return next.getDate();
}

function firstWeekday(d: Date): number {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return first.getDay(); // 0 = Sunday
}

export function TasksCalendar({
  selectedDate,
  onSelectDate,
  datesWithCompletions,
}: {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  datesWithCompletions: string[];
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return startOfMonth(d);
  });

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const nDays = daysInMonth(viewMonth);
  const firstDay = firstWeekday(viewMonth);
  const completionSet = new Set(datesWithCompletions);

  const handleDayClick = (day: number) => {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (selectedDate && isSameDay(d, selectedDate)) {
      onSelectDate(null);
    } else {
      onSelectDate(d);
    }
  };

  const goPrevMonth = () => {
    setViewMonth((m) => {
      const next = new Date(m);
      next.setMonth(next.getMonth() - 1);
      return startOfMonth(next);
    });
  };

  const goNextMonth = () => {
    setViewMonth((m) => {
      const next = new Date(m);
      next.setMonth(next.getMonth() + 1);
      return startOfMonth(next);
    });
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= nDays; day++) cells.push(day);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={goNextMonth}
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekdays.map((wd) => (
          <div
            key={wd}
            className="py-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400"
          >
            {wd}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }
          const cellDate = new Date(
            viewMonth.getFullYear(),
            viewMonth.getMonth(),
            day
          );
          const key = dateKey(cellDate);
          const hasCompletions = completionSet.has(key);
          const isSelected =
            selectedDate !== null && isSameDay(cellDate, selectedDate);
          const isToday = isSameDay(cellDate, new Date());
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`flex h-7 w-7 items-center justify-center rounded text-sm ${
                isSelected
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : isToday
                    ? "bg-neutral-200 font-medium dark:bg-neutral-700"
                    : hasCompletions
                      ? "text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                      : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <button
          type="button"
          onClick={() => onSelectDate(null)}
          className="mt-2 w-full rounded border border-neutral-200 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          Clear date
        </button>
      )}
    </div>
  );
}
