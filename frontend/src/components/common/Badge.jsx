import React from 'react';

const variantStyles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  info: 'bg-sky-50 text-sky-700 border-sky-200/80',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
};

const dotColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  indigo: 'bg-indigo-500',
  neutral: 'bg-slate-400',
  purple: 'bg-purple-500',
};

export const Badge = ({
  children,
  variant = 'neutral',
  dot = false,
  size = 'sm',
  className = '',
}) => {
  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const selectedVariant = variantStyles[variant] || variantStyles.neutral;
  const dotColor = dotColors[variant] || dotColors.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${selectedVariant} ${sizeStyle} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
};

// Automatic status mapping helper
export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase();
  let variant = 'neutral';
  let dot = true;

  if (['active', 'approved', 'paid', 'completed', 'received', 'operational'].includes(normalized)) {
    variant = 'success';
  } else if (['pending', 'unpaid', 'on_leave', 'connecting', 'degraded'].includes(normalized)) {
    variant = 'warning';
  } else if (['rejected', 'inactive', 'cancelled', 'bounced', 'disconnected'].includes(normalized)) {
    variant = 'danger';
  } else if (['hotel', 'waiter', 'captain'].includes(normalized)) {
    variant = 'indigo';
  } else if (['catering company', 'chef', 'bartender'].includes(normalized)) {
    variant = 'purple';
  } else if (['banquet hall', 'resort'].includes(normalized)) {
    variant = 'info';
  }

  return (
    <Badge variant={variant} dot={dot} className={className}>
      {status}
    </Badge>
  );
};

export default Badge;
