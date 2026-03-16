import React from 'react';
import { getPasswordStrength } from '../../utils/validationSchemas';

/**
 * PasswordStrengthMeter
 * Shows a segmented bar + label indicating password strength.
 *
 * Props:
 *  - password : string
 */
const PasswordStrengthMeter = ({ password }) => {
  const { score, label, color } = getPasswordStrength(password);

  if (!password) return null;

  const segments = 6;

  const rules = [
    { label: 'At least 8 characters',          met: password.length >= 8 },
    { label: 'At least one uppercase letter',  met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter',  met: /[a-z]/.test(password) },
    { label: 'At least one number',            met: /\d/.test(password) },
    { label: 'At least one special character', met: /[@$!%*?&#^()_\-+=[\]{}|;:,.<>]/.test(password) },
  ];

  return (
    <div style={styles.container} role="status" aria-label={`Password strength: ${label}`}>
      {/* Segmented bar */}
      <div style={styles.barRow}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.segment,
              background: i < score ? color : '#e8ecf0',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
        {label && (
          <span style={{ ...styles.strengthLabel, color }}>
            {label}
          </span>
        )}
      </div>

      {/* Rules checklist */}
      <ul style={styles.rulesList} aria-label="Password requirements">
        {rules.map((rule) => (
          <li key={rule.label} style={styles.ruleItem}>
            <span
              style={{
                ...styles.ruleIcon,
                color: rule.met ? '#27ae60' : '#bdc3cc',
              }}
              aria-hidden="true"
            >
              {rule.met ? '✓' : '○'}
            </span>
            <span style={{ ...styles.ruleText, color: rule.met ? '#27ae60' : '#8a9bb0' }}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '6px',
  },
  barRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
    marginBottom: '8px',
  },
  segment: {
    flex:         1,
    height:       '4px',
    borderRadius: '2px',
  },
  strengthLabel: {
    fontSize:   '12px',
    fontWeight: '600',
    fontFamily: "'DM Sans', sans-serif",
    minWidth:   '48px',
    textAlign:  'right',
  },
  rulesList: {
    listStyle: 'none',
    margin:    0,
    padding:   0,
    display:   'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:       '3px 12px',
  },
  ruleItem: {
    display:    'flex',
    alignItems: 'center',
    gap:        '5px',
  },
  ruleIcon: {
    fontSize:   '11px',
    fontWeight: '700',
    lineHeight: 1,
    minWidth:   '12px',
  },
  ruleText: {
    fontSize:   '11px',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'color 0.2s',
  },
};

export default PasswordStrengthMeter;
