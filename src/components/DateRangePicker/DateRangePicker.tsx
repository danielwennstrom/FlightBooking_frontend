import React, { useState, useRef, useEffect } from "react";
import type { DateRange } from "../../types/DateRange";

type Props = {
  toolIndex: number;
  onDateSelect: (range: DateRange, toolIndex: number) => void;
};

const DateRangePicker = ({ onDateSelect, toolIndex }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const datepickerRef = useRef<HTMLDivElement>(null);
  const datepickerEndRef = useRef<HTMLDivElement>(null);

  const toggleDatepicker = () => {
    setIsOpen(!isOpen);
  };

  const updateInput = () => {
    if (selectedStartDate && selectedEndDate) {
      return `${selectedStartDate.toLocaleDateString()} - ${selectedEndDate.toLocaleDateString()}`;
    } else if (selectedStartDate) {
      return selectedStartDate.toLocaleDateString();
    }
    return "Select date range";
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsSelectingRange(false);
  };

  const handleConfirm = () => {
    if (selectedStartDate && selectedEndDate) {
      onDateSelect(
        { startDate: selectedStartDate, endDate: selectedEndDate },
        toolIndex
      );
    }
    else {
      onDateSelect(
        { startDate: selectedStartDate, endDate: null },
        toolIndex
      );
    }
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    if (!isSelectingRange) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setIsSelectingRange(true);
    } else {
      if (selectedStartDate !== null && date < selectedStartDate) {
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      } else {
        setSelectedEndDate(date);
        setIsSelectingRange(false);
      }
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const totalDays = 42;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days.map((date, index) => {
      const isCurrentMonth = date.getMonth() === month;
      const isSelected =
        (selectedStartDate &&
          date.toDateString() === selectedStartDate.toDateString()) ||
        (selectedEndDate &&
          date.toDateString() === selectedEndDate.toDateString());
      const isInRange =
        selectedStartDate &&
        selectedEndDate &&
        date >= selectedStartDate &&
        date <= selectedEndDate;

      return (
        <button
          key={index}
          className={`
            h-8 w-8 text-sm rounded-md transition-colors
            ${
              !isCurrentMonth
                ? "text-gray-400 hover:bg-gray-100"
                : "text-gray-900 hover:bg-blue-50"
            }
            ${isSelected ? "bg-button-secondary text-white hover:bg-button-secondary-hover" : ""}
            ${isInRange && !isSelected ? "bg-blue-100 text-blue-900" : ""}
          `}
          onClick={() => handleDateClick(date)}
        >
          {date.getDate()}
        </button>
      );
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datepickerRef.current &&
        !datepickerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    datepickerEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen]);

  return (
    <div className="w-full max-w-sm mt-3" ref={datepickerRef}>
      <div className="relative">
        <div className="flex items-center relative">
          <input
            type="text"
            placeholder="Pick a date range"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={updateInput()}
            onClick={toggleDatepicker}
            readOnly
          />
          <span
            className="absolute right-3 cursor-pointer text-gray-500"
            onClick={toggleDatepicker}
          >
            <svg
              className="fill-current stroke-current"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29635 5.15354L2.29632 5.15357L2.30055 5.1577L7.65055 10.3827L8.00157 10.7255L8.35095 10.381L13.701 5.10603L13.701 5.10604L13.7035 5.10354C13.722 5.08499 13.7385 5.08124 13.7499 5.08124C13.7613 5.08124 13.7778 5.08499 13.7963 5.10354C13.8149 5.12209 13.8187 5.13859 13.8187 5.14999C13.8187 5.1612 13.815 5.17734 13.7973 5.19552L8.04946 10.8433L8.04945 10.8433L8.04635 10.8464C8.01594 10.8768 7.99586 10.8921 7.98509 10.8992C7.97746 10.8983 7.97257 10.8968 7.96852 10.8952C7.96226 10.8929 7.94944 10.887 7.92872 10.8721L2.20253 5.2455C2.18478 5.22733 2.18115 5.2112 2.18115 5.19999C2.18115 5.18859 2.18491 5.17209 2.20346 5.15354C2.222 5.13499 2.2385 5.13124 2.2499 5.13124C2.2613 5.13124 2.2778 5.13499 2.29635 5.15354Z"
                fill=""
                stroke=""
              />
            </svg>
          </span>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                  onClick={() => {
                    setCurrentDate(
                      new Date(currentDate.setMonth(currentDate.getMonth() - 1))
                    );
                  }}
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.5312 17.9062C13.3437 17.9062 13.1562 17.8438 13.0312 17.6875L5.96875 10.5C5.6875 10.2187 5.6875 9.78125 5.96875 9.5L13.0312 2.3125C13.3125 2.03125 13.75 2.03125 14.0312 2.3125C14.3125 2.59375 14.3125 3.03125 14.0312 3.3125L7.46875 10L14.0625 16.6875C14.3438 16.9688 14.3438 17.4062 14.0625 17.6875C13.875 17.8125 13.7187 17.9062 13.5312 17.9062Z"
                      fill=""
                    />
                  </svg>
                </button>

                <div className="text-lg font-medium text-gray-900">
                  {currentDate.toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {currentDate.getFullYear()}
                </div>

                <button
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                  onClick={() =>
                    setCurrentDate(
                      new Date(currentDate.setMonth(currentDate.getMonth() + 1))
                    )
                  }
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.46875 17.9063C6.28125 17.9063 6.125 17.8438 5.96875 17.7188C5.6875 17.4375 5.6875 17 5.96875 16.7188L12.5312 10L5.96875 3.3125C5.6875 3.03125 5.6875 2.59375 5.96875 2.3125C6.25 2.03125 6.6875 2.03125 6.96875 2.3125L14.0313 9.5C14.3125 9.78125 14.3125 10.2187 14.0313 10.5L6.96875 17.6875C6.84375 17.8125 6.65625 17.9063 6.46875 17.9063Z"
                      fill=""
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-medium text-blue-500 hover:bg-blue-50"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                  onClick={handleConfirm}
                >
                  Confirm
                </button>
                <div ref={datepickerEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;
