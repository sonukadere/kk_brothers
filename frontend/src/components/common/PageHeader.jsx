import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  actions,
  badge,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`mb-6 pb-5 border-b border-slate-200/80 ${className}`}>
      {breadcrumbs && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-slate-700' : ''}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1 leading-normal max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
