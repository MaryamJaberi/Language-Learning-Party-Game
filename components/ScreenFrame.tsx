import React from 'react';

export const ScreenFrame: React.FC<{
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  dir?: 'rtl' | 'ltr';
  className?: string;
}> = ({ header, footer, children, dir, className = '' }) => {
  const rows = header && footer
    ? 'auto minmax(0,1fr) auto'
    : header
      ? 'auto minmax(0,1fr)'
      : footer
        ? 'minmax(0,1fr) auto'
        : 'minmax(0,1fr)';
  return (
    <div
      dir={dir}
      className={`h-full min-h-0 w-full ${className}`}
      style={{
        display: 'grid',
        gridTemplateRows: rows,
        height: '100%',
        minHeight: 0,
      }}
    >
      {header ? <div className="shrink-0">{header}</div> : null}
      <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
};

export default ScreenFrame;
