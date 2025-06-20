'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { Calendar, Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const DateTimePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  className = '',
  placeholder = 'Select date and time',
}: DateTimePickerProps) => {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize values from prop
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const dateStr = date.toISOString().split('T')[0] || '';
      const timeStr = date.toTimeString().slice(0, 5) || '';
      setDateValue(dateStr);
      setTimeValue(timeStr);
    } else {
      setDateValue('');
      setTimeValue('');
    }
  }, [value]);

  // Validate and update parent component
  const validateAndUpdate = useCallback(
    (dateStr: string, timeStr: string) => {
      if (!dateStr || !timeStr) {
        setIsValid(true);
        setErrorMessage('');
        onChange(undefined);
        return;
      }

      try {
        const combinedDateTime = new Date(`${dateStr}T${timeStr}`);

        // Check if date is valid
        if (isNaN(combinedDateTime.getTime())) {
          setIsValid(false);
          setErrorMessage('Invalid date or time');
          return;
        }

        // Check minimum date constraint
        if (minDate && combinedDateTime < minDate) {
          setIsValid(false);
          setErrorMessage('Date cannot be in the past');
          return;
        }

        // Check maximum date constraint
        if (maxDate && combinedDateTime > maxDate) {
          setIsValid(false);
          setErrorMessage('Date is too far in the future');
          return;
        }

        // All validations passed
        setIsValid(true);
        setErrorMessage('');
        onChange(combinedDateTime);
      } catch (error) {
        setIsValid(false);
        setErrorMessage('Invalid date or time format');
      }
    },
    [minDate, maxDate, onChange]
  );

  // Handle date change
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      setDateValue(newDate);
      validateAndUpdate(newDate, timeValue);
    },
    [timeValue, validateAndUpdate]
  );

  // Handle time change
  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = e.target.value;
      setTimeValue(newTime);
      validateAndUpdate(dateValue, newTime);
    },
    [dateValue, validateAndUpdate]
  );

  // Quick preset buttons
  const getPresetTimes = () => {
    const now = new Date();
    const presets = [
      { label: 'In 1 hour', minutes: 60 },
      { label: 'In 4 hours', minutes: 240 },
      { label: 'Tomorrow 9 AM', minutes: null, custom: true },
    ];

    return presets.map((preset) => {
      let targetDate: Date;

      if (preset.custom && preset.label === 'Tomorrow 9 AM') {
        targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(9, 0, 0, 0);
      } else if (preset.minutes) {
        targetDate = new Date(now.getTime() + preset.minutes * 60000);
      } else {
        return null;
      }

      // Check if preset is valid (not in the past, within constraints)
      const isValidPreset = 
        (!minDate || targetDate >= minDate) && 
        (!maxDate || targetDate <= maxDate);

      return isValidPreset ? (
        <Button
          key={preset.label}
          variant="outline"
          size="sm"
          onClick={() => {
            const dateStr = targetDate.toISOString().split('T')[0] || '';
            const timeStr = targetDate.toTimeString().slice(0, 5) || '';
            setDateValue(dateStr);
            setTimeValue(timeStr);
            validateAndUpdate(dateStr, timeStr);
          }}
          disabled={disabled}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ) : null;
    }).filter(Boolean);
  };

  // Get min/max attributes for inputs
  const getDateConstraints = () => {
    const today = new Date();
    const minDateStr = minDate 
      ? minDate.toISOString().split('T')[0] 
      : today.toISOString().split('T')[0];
    
    const maxDateStr = maxDate 
      ? maxDate.toISOString().split('T')[0] 
      : undefined;

    return { min: minDateStr, max: maxDateStr };
  };

  const dateConstraints = getDateConstraints();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Date and Time Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-input" className="text-sm font-medium">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date
          </Label>
          <Input
            id="date-input"
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            min={dateConstraints.min}
            max={dateConstraints.max || undefined}
            disabled={disabled}
            className={cn(
              'w-full',
              !isValid && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time-input" className="text-sm font-medium">
            <Clock className="w-4 h-4 inline mr-1" />
            Time
          </Label>
          <Input
            id="time-input"
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            className={cn(
              'w-full',
              !isValid && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        </div>
      </div>

      {/* Error Message */}
      {!isValid && errorMessage && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          {errorMessage}
        </p>
      )}

      {/* Quick Preset Buttons */}
      {!disabled && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Quick Options
          </Label>
          <div className="flex flex-wrap gap-2">
            {getPresetTimes()}
          </div>
        </div>
      )}

      {/* Selected DateTime Display */}
      {value && isValid && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Scheduled for:</p>
          <p className="font-medium">
            {value.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {' at '}
            {value.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
        </div>
      )}
    </div>
  );
}; 