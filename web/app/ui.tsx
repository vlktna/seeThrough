'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`icon ${className}`} aria-hidden="true" style={{ '--icon': `url(/icons/${name}.svg)` } as CSSProperties} />;
}
export function Navigation() {
  const pathname = usePathname();
  return <header className="topbar"><a className="wordmark" href="/" aria-label="SeeThrough home"><span className="brand-mark" aria-hidden="true">/</span>See<span>/</span>Through</a><nav className="main-nav" aria-label="Main navigation"><a href="/" aria-current={pathname === '/' ? 'page' : undefined}><Icon name="map-trifold" />Live map</a><a href="/api-guide" aria-current={pathname === '/api-guide' ? 'page' : undefined}>API guide<Icon name="arrow-up-right" /></a></nav></header>;
}
export function Footer() {
  return <footer><a className="footer-brand" href="/">See/Through<span>A shared sense of place.</span></a><nav aria-label="Footer"><a href="/privacy">Data & privacy</a><a href="/api-guide">Developer guide</a><a href="https://github.com/vlktna/seeThrough" target="_blank" rel="noreferrer">GitHub<Icon name="arrow-up-right" /></a></nav></footer>;
}
export function RevealObserver() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const reveal = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); } }, { threshold: 0.05 });
    const attach = () => document.querySelectorAll('[data-reveal]:not([data-observed])').forEach(el => { el.setAttribute('data-observed', ''); reveal.observe(el); });
    attach();
    const changes = new MutationObserver(attach); changes.observe(document.body, { childList: true, subtree: true });
    return () => { changes.disconnect(); reveal.disconnect(); };
  }, []);
  return null;
}

export function SkipLink() {
  return <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); const main = document.getElementById('main-content'); main?.focus({ preventScroll: true }); main?.scrollIntoView({ block: 'start' }); }}>Skip to content</a>;
}
