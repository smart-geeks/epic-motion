'use client';

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="font-inter text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-epic-silver"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full font-inter text-sm px-3.5 py-2.5',
            'bg-gray-50 dark:bg-white/5',
            'border border-gray-200 dark:border-white/10',
            'text-epic-black dark:text-white',
            'placeholder-gray-400 dark:placeholder-white/20',
            'focus:outline-none focus:border-epic-gold dark:focus:border-epic-gold',
            'transition-colors rounded-sm',
            error ? 'border-red-400 dark:border-red-500' : '',
            props.disabled ? 'opacity-50 cursor-not-allowed' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && (
          <p className="font-inter text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="font-inter text-xs text-gray-400 dark:text-white/30">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
