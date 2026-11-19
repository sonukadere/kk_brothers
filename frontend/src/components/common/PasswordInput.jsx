import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, Check, X } from 'lucide-react';

export const PasswordInput = forwardRef(
  (
    {
      label = 'Password',
      id,
      value = '',
      onChange,
      onBlur,
      error,
      helperText,
      success = false,
      required = false,
      placeholder = 'Create a password',
      showStrengthMeter = false,
      showHints = false,
      focusColor = 'emerald', // 'emerald' | 'indigo'
      className = '',
      autoComplete = 'new-password',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'password-input');
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Password criteria analysis
    const hasMinLength = value.length >= 6;
    const hasNumber = /\d/.test(value);
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasSpecial = /[^a-zA-Z0-9]/.test(value);

    // Calculate strength (0-3)
    let passedCount = 0;
    if (hasMinLength) passedCount++;
    if (hasNumber) passedCount++;
    if (hasLetter) passedCount++;
    if (hasSpecial && value.length >= 8) passedCount++;

    const getStrengthLabel = () => {
      if (!value) return null;
      if (passedCount <= 1) return { text: 'Weak', color: 'text-rose-600', barColor: 'bg-rose-500', bars: 1 };
      if (passedCount === 2) return { text: 'Medium', color: 'text-amber-600', barColor: 'bg-amber-500', bars: 2 };
      return { text: 'Strong', color: 'text-emerald-600', barColor: 'bg-emerald-500', bars: 3 };
    };

    const strength = getStrengthLabel();

    const ringFocusClasses =
      focusColor === 'indigo'
        ? 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
        : 'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600';

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={inputId}
              className="block text-[13px] font-semibold text-slate-700 uppercase tracking-wide"
            >
              {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
            </label>
            {showStrengthMeter && strength && (
              <span className={`text-xs font-bold tracking-tight ${strength.color}`}>
                {strength.text}
              </span>
            )}
          </div>
        )}

        <div className="relative rounded-xl shadow-2xs flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>

          <input
            id={inputId}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            placeholder={placeholder}
            autoComplete={autoComplete}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full h-12 text-sm rounded-xl border bg-white pl-10 pr-12 text-slate-800 placeholder-slate-400 transition-all duration-150 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : success
                ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                : `border-slate-300 ${ringFocusClasses}`
            }`}
            {...props}
          />

          {/* Show / Hide Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Strength Meter (3 Segmented Bars) */}
        {showStrengthMeter && value.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="grid grid-cols-3 gap-1.5 h-1.5">
              <div
                className={`rounded-full transition-all duration-300 ${
                  strength ? strength.barColor : 'bg-slate-200'
                }`}
              />
              <div
                className={`rounded-full transition-all duration-300 ${
                  strength && strength.bars >= 2 ? strength.barColor : 'bg-slate-200'
                }`}
              />
              <div
                className={`rounded-full transition-all duration-300 ${
                  strength && strength.bars >= 3 ? strength.barColor : 'bg-slate-200'
                }`}
              />
            </div>
          </div>
        )}

        {/* Checklist Hints (6+ chars, a number, a letter) */}
        {showHints && (
          <div className="mt-2.5 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-1 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Password Requirements:
            </div>
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <div
                className={`flex items-center gap-1 font-medium transition-colors ${
                  hasMinLength ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                )}
                <span>6+ characters</span>
              </div>

              <div
                className={`flex items-center gap-1 font-medium transition-colors ${
                  hasNumber ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                )}
                <span>A number (0-9)</span>
              </div>

              <div
                className={`flex items-center gap-1 font-medium transition-colors ${
                  hasLetter ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {hasLetter ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" />
                )}
                <span>A letter (a-z)</span>
              </div>
            </div>
          </div>
        )}

        {/* Inline Error or Helper */}
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

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
