import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { toDisplayDate, toIsoDate } from '../../utils/dateUtils';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required = false,
      className = '',
      id,
      type,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hiddenDateInputRef = useRef(null);

    const isDate = type === 'date';
    const [displayDate, setDisplayDate] = useState(() => (isDate ? toDisplayDate(value) : ''));

    useEffect(() => {
      if (isDate) {
        setDisplayDate(toDisplayDate(value));
      }
    }, [isDate, value]);

    const handleDateTextChange = (e) => {
      const raw = e.target.value;
      setDisplayDate(raw);

      // If user typed a full DD/MM/YYYY (10 chars), convert and fire onChange
      if (/^\d{2}[\/\-.]\d{2}[\/\-.]\d{4}$/.test(raw.trim())) {
        const iso = toIsoDate(raw);
        if (iso && !isNaN(new Date(iso).getTime())) {
          if (onChange) {
            onChange({
              target: {
                id: inputId,
                name: props.name,
                value: iso,
              },
            });
          }
        }
      } else if (raw === '') {
        if (onChange) {
          onChange({
            target: {
              id: inputId,
              name: props.name,
              value: '',
            },
          });
        }
      }
    };

    const handleNativeDateChange = (e) => {
      const iso = e.target.value;
      setDisplayDate(toDisplayDate(iso));
      if (onChange) {
        onChange(e);
      }
    };

    const openCalendarPicker = () => {
      if (hiddenDateInputRef.current) {
        try {
          if (typeof hiddenDateInputRef.current.showPicker === 'function') {
            hiddenDateInputRef.current.showPicker();
          } else {
            hiddenDateInputRef.current.focus();
            hiddenDateInputRef.current.click();
          }
        } catch (err) {
          hiddenDateInputRef.current.focus();
        }
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          {isDate ? (
            <>
              <input
                id={inputId}
                ref={ref}
                type="text"
                placeholder="DD/MM/YYYY"
                value={displayDate}
                onChange={handleDateTextChange}
                className={`w-full text-sm rounded-lg border bg-white px-3.5 py-2 pr-10 text-slate-800 placeholder-slate-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                  leftIcon ? 'pl-9' : ''
                } ${
                  error
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300'
                } ${className}`}
                {...props}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={openCalendarPicker}
                title="Select date (DD/MM/YYYY)"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
              >
                <Calendar className="w-4 h-4 text-current" />
              </button>
              {/* Hidden native date input to power calendar picker with standard YYYY-MM-DD */}
              <input
                ref={hiddenDateInputRef}
                type="date"
                value={value ? String(value).slice(0, 10) : ''}
                onChange={handleNativeDateChange}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <input
                id={inputId}
                ref={ref}
                type={type}
                value={value}
                onChange={onChange}
                className={`w-full text-sm rounded-lg border bg-white px-3.5 py-2 text-slate-800 placeholder-slate-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                  leftIcon ? 'pl-9' : ''
                } ${rightIcon ? 'pr-9' : ''} ${
                  error
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300'
                } ${className}`}
                {...props}
              />
              {rightIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                  {rightIcon}
                </div>
              )}
            </>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : isDate ? (
          <p className="mt-0.5 text-[10px] text-slate-400">Format: DD/MM/YYYY</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
