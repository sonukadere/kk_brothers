import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      success = false,
      options = [],
      placeholder = 'Select an option',
      required = false,
      className = '',
      selectClassName = '',
      id,
      leftIcon,
      children,
      focusColor = 'emerald', // 'emerald' | 'indigo'
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const errorId = selectId ? `${selectId}-error` : undefined;
    const helperId = selectId ? `${selectId}-helper` : undefined;

    const ringFocusClasses =
      focusColor === 'indigo'
        ? 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
        : 'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600';

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide"
          >
            {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs flex items-center">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <select
            id={selectId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full h-12 text-sm rounded-xl border bg-white px-3.5 py-2 pr-10 text-slate-800 appearance-none transition-all duration-150 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed cursor-pointer ${
              leftIcon ? 'pl-10' : ''
            } ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : success
                ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : `border-slate-300 ${ringFocusClasses}`
            } ${selectClassName}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {children ||
              options.map((opt) => (
                <option
                  key={typeof opt === 'object' ? opt.value : opt}
                  value={typeof opt === 'object' ? opt.value : opt}
                >
                  {typeof opt === 'object' ? opt.label : opt}
                </option>
              ))}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            {error ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>

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
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
