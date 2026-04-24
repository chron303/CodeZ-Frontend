// frontend/src/components/Mario/ThemeToggle.jsx
import { useTheme } from '../../themes/ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggle, isMario } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isMario ? 'Switch to Dark mode' : 'Switch to Light mode'}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs
        font-medium transition-all duration-300 border"
      style={isMario ? {
        background: 'rgba(92,148,252,0.2)',
        border:     '1px solid rgba(92,148,252,0.4)',
        color:      '#7dd3fc',
      } : {
        background: 'rgba(124,58,237,0.15)',
        border:     '1px solid rgba(124,58,237,0.3)',
        color:      '#a78bfa',
      }}
    >
      {!isMario && (
        <>
          <span style={{ fontSize: 14 }}>🌙</span>
          <span>Dark</span>
        </>
      )}
      {isMario && (
        <>
          <span style={{ fontSize: 14 }}>☀️</span>
          <span>Light</span>
        </>
      )}
    </button>
  );
}