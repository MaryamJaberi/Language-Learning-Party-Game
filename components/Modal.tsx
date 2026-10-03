import React from 'react';

interface Action {
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}

interface Props {
  title?: string;
  body?: string;
  actions?: Action[];
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

const Modal: React.FC<Props> = ({ title, body, actions = [], children, isOpen = true, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0E1530]/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 select-none font-ui">
      {/* Modern UI KIT Dialog Card */}
      <div className="bg-[var(--panel)] border border-[var(--line)] w-full max-w-sm rounded-[24px] shadow-2xl text-[var(--ink)] overflow-hidden animate-fadeIn">
        
        {/* Modal Info */}
        <div className="p-5 sm:p-6 text-center">
          {title && (
            <h3 className="text-lg font-black text-[var(--ink)] mb-2 tracking-tight">
              {title}
            </h3>
          )}
          {body && (
            <p className="text-xs sm:text-sm text-[var(--mute)] font-medium bg-[var(--bg)] p-3 border border-[var(--line)] rounded-xl leading-relaxed mb-3">
              {body}
            </p>
          )}
          {children}
        </div>

        {/* Modal Controls with modern UI KIT buttons */}
        {actions && actions.length > 0 && (
          <div className="p-4 bg-[var(--bg)]/50 border-t border-[var(--line)] flex flex-col gap-2">
            {actions.map((action, i) => {
              let btnClass = 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]';
              if (action.primary) btnClass = 'bg-[var(--lapis)] hover:brightness-105 text-white border-0 shadow-xs';
              if (action.danger) btnClass = 'bg-red-600 hover:bg-red-700 text-white border-0 shadow-xs';

              return (
                <button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${btnClass}`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
