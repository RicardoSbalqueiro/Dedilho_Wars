import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';
import { MenuAtmosphere } from './MenuAtmosphere';
import './menus.css';

export function useMenuBack(onBack: () => void, suspended = false) {
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!suspended && event.code === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onBack, suspended]);
}

/** Menus use native CSS pixels. Only the actual arena uses the fixed game frame. */
export function MenuPage({ children, className = '', label, background, style }: {
  children: ReactNode; className?: string; label?: string; background?: ReactNode; style?: CSSProperties;
}) {
  return <main className={`dw-menu ${className}`} aria-label={label} style={style}>
    {background && <div className="dw-backdrop">{background}</div>}
    <MenuAtmosphere />
    <div className="dw-content">{children}</div>
  </main>;
}

export function MenuHeader({ title, eyebrow = 'DEDILHO WARS', description, onBack, actions }: {
  title: string; eyebrow?: string; description?: string; onBack?: () => void; actions?: ReactNode;
}) {
  return <>
    <div className="dw-header-top">
      {onBack ? <button className="dw-button dw-back" onClick={onBack}>← Voltar</button> : <span className="dw-eyebrow">{eyebrow}</span>}
      {actions && <div className="dw-header-actions">{actions}</div>}
    </div>
    <header className="dw-heading">{onBack && <p className="dw-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</header>
  </>;
}

export function MenuFooter({ children }: { children: ReactNode }) {
  return <footer className="dw-footer">{children}</footer>;
}
