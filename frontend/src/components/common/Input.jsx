import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toDisplayDate, toIsoDate } from '../../utils/dateUtils';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      success = false,
      leftIcon,
      rightIcon,
      prefix,
      required = false,
      className = '',
      inputClassName = '',
      id,
      type = 'text',
      value,
      onChange,
      onBlur,
      focusColor = 'emerald', // 'emerald' | 'indigo'
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;
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

    const ringFocusClasses =
      focusColor === 'indigo'
        ? 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
        : 'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600';

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide"
          >
            {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs flex items-stretch">
          {/* Optional Prefix Chip (e.g. +91) */}
          {prefix && (
            <div className="inline-flex items-center px-3.5 bg-slate-50 border border-r-0 border-slate-300 rounded-l-xl text-slate-700 font-semibold text-sm select-none shrink-0">
              {prefix}
            </div>
          )}

          <div className="relative flex-1 flex items-center">
            {leftIcon && (
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                  onBlur={onBlur}
                  aria-invalid={!!error}
                  aria-describedby={error ? errorId : helperText ? helperId : undefined}
                  className={`w-full h-12 text-sm rounded-xl border bg-white px-3.5 py-2 pr-10 text-slate-800 placeholder-slate-400 transition-all duration-150 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    leftIcon ? 'pl-10' : ''
                  } ${prefix ? 'rounded-l-none' : ''} ${
                    error
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : success
                      ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                      : `border-slate-300 ${ringFocusClasses}`
                  } ${inputClassName}`}
                  {...props}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={openCalendarPicker}
                  title="Select date (DD/MM/YYYY)"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  <Calendar className="w-4 h-4 text-current" />
                </button>
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
                  onBlur={onBlur}
                  aria-invalid={!!error}
                  aria-describedby={error ? errorId : helperText ? helperId : undefined}
                  className={`w-full h-12 text-sm rounded-xl border bg-white px-3.5 py-2 text-slate-800 placeholder-slate-400 transition-all duration-150 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    leftIcon ? 'pl-10' : ''
                  } ${rightIcon || success || error ? 'pr-10' : ''} ${
                    prefix ? 'rounded-l-none' : ''
                  } ${
                    error
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : success
                      ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                      : `border-slate-300 ${ringFocusClasses}`
                  } ${inputClassName}`}
                  {...props}
                />
                {/* Right Status Indicator: error icon > success check > custom rightIcon */}
                {error ? (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-rose-500">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                ) : success ? (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : rightIcon ? (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
                    {rightIcon}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Inline Error or Helper Text */}
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-slate-600 font-normal">
            {helperText}
          </p>
        ) : isDate ? (
          <p className="mt-1 text-[11px] text-slate-500">Format: DD/MM/YYYY</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
