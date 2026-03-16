import React, { useState } from 'react';

/**
 * FormInput – reusable controlled input with error display and password toggle
 *
 * Props:
 *  - label        : string
 *  - name         : string  (matches react-hook-form register name)
 *  - type         : 'text' | 'email' | 'password' | 'tel' | etc.
 *  - register     : RHF register function
 *  - error        : string | undefined  (field error message)
 *  - placeholder  : string
 *  - required     : bool
 *  - hint         : string  (optional helper text below input)
 *  - autoComplete : string
 */
const FormInput = ({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder,
  required = false,
  hint,
  autoComplete,
  disabled = false,
  icon: Icon,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={styles.wrapper}>
      {label && (
        <label htmlFor={name} style={styles.label}>
          {label}
          {required && <span style={styles.required} aria-hidden="true"> *</span>}
        </label>
      )}

      <div style={styles.inputWrapper}>
        {Icon && (
          <span style={styles.iconLeft}>
            <Icon size={16} />
          </span>
        )}

        <input
          id={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
          style={{
            ...styles.input,
            ...(Icon       ? styles.inputWithIcon  : {}),
            ...(isPassword ? styles.inputWithToggle : {}),
            ...(error      ? styles.inputError      : {}),
            ...(disabled   ? styles.inputDisabled   : {}),
          }}
          {...register(name)}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={styles.toggleBtn}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <EyeOn size={16} />}
          </button>
        )}
      </div>

      {error && (
        <p id={`${name}-error`} role="alert" style={styles.errorMsg}>
          ⚠ {error}
        </p>
      )}

      {hint && !error && (
        <p id={`${name}-hint`} style={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
};

// ─── Inline SVG icons to avoid dependencies ───────────────────────────────────
const EyeOn = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
    marginBottom:  '4px',
  },
  label: {
    fontSize:   '14px',
    fontWeight: '600',
    color:      '#1a2e44',
    fontFamily: "'DM Sans', sans-serif",
  },
  required: {
    color: '#e74c3c',
  },
  inputWrapper: {
    position: 'relative',
    display:  'flex',
    alignItems: 'center',
  },
  iconLeft: {
    position:   'absolute',
    left:       '12px',
    color:      '#8a9bb0',
    display:    'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  input: {
    width:        '100%',
    padding:      '11px 14px',
    border:       '1.5px solid #dde3eb',
    borderRadius: '8px',
    fontSize:     '14px',
    fontFamily:   "'DM Sans', sans-serif",
    color:        '#1a2e44',
    background:   '#ffffff',
    outline:      'none',
    transition:   'border-color 0.2s, box-shadow 0.2s',
    boxSizing:    'border-box',
  },
  inputWithIcon: {
    paddingLeft: '38px',
  },
  inputWithToggle: {
    paddingRight: '42px',
  },
  inputError: {
    borderColor: '#e74c3c',
    background:  '#fff8f8',
  },
  inputDisabled: {
    background:  '#f5f7fa',
    color:       '#9aa5b4',
    cursor:      'not-allowed',
  },
  toggleBtn: {
    position:   'absolute',
    right:      '12px',
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    color:      '#8a9bb0',
    display:    'flex',
    alignItems: 'center',
    padding:    '4px',
    borderRadius: '4px',
  },
  errorMsg: {
    margin:     0,
    fontSize:   '12px',
    color:      '#e74c3c',
    fontFamily: "'DM Sans', sans-serif",
  },
  hint: {
    margin:     0,
    fontSize:   '12px',
    color:      '#8a9bb0',
    fontFamily: "'DM Sans', sans-serif",
  },
};

export default FormInput;
