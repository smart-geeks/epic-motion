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
            'bg-transparent dark:bg-black/40',
            'border border-gray-200 dark:border-white/20',
            'text-epic-black dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-white/40',
            'focus:outline-none focus:border-epic-gold focus:ring-1 focus:ring-epic-gold/40',
            // Neutraliza el fondo blanco que inyecta el autofill del navegador
            '[&:-webkit-autofill]:![box-shadow:0_0_0_1000px_transparent_inset]',
            'dark:[&:-webkit-autofill]:![box-shadow:0_0_0_1000px_#0A0A0A_inset]',
            'dark:[&:-webkit-autofill]:[-webkit-text-fill-color:white]',
            '[&:-webkit-autofill]:[transition:background-color_9999s_ease_0s]',
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
