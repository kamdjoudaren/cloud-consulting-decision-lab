'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronRight,
  Cloud,
  FlaskConical,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/practice', label: 'Practice', icon: FlaskConical },
  { href: '/scenarios', label: 'Scenario library', icon: BookOpen },
  { href: '/cases', label: 'My cases', icon: BriefcaseBusiness },
  { href: '/skills', label: 'Skill matrix', icon: ChartNoAxesCombined },
  { href: '/learn', label: 'Learning path', icon: BookOpen },
  { href: '/showcase', label: 'Portfolio', icon: ArrowUpRight },
];
export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const title = path.startsWith('/cases/')
    ? 'Consulting workspace'
    : (navigation.find((item) => item.href === path)?.label ?? 'Case study');
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-icon">
            <Cloud size={23} />
          </span>
          <span>
            decision<span className="brand-light">lab</span>
            <small>CLOUD CONSULTING</small>
          </span>
        </Link>
        <div className="workspace-label">
          <span className="status-dot" /> Personal workspace{' '}
          <span className="workspace-key">01</span>
        </div>
        <div className="nav-heading">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`nav-link ${(href === '/' ? path === '/' : path.startsWith(href)) ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {href === '/practice' && <span className="nav-new">LAB</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="practice-note">
            <Sparkles size={19} />
            <strong>Build your judgment.</strong>
            <p>Start with the business problem. Make every decision count.</p>
            <Link href="/practice">
              Find your next case <ChevronRight size={15} />
            </Link>
          </div>
          <div className="profile">
            <span className="profile-avatar">SA</span>
            <div>
              <strong>Solutions architect</strong>
              <small>Learning by deciding</small>
            </div>
            <PanelLeftClose size={16} />
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-pill">
              <span className="status-dot" /> Local workspace
            </span>
            <span className="small-avatar">SA</span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>Cloud Consulting Decision Lab</span>
          <span>Practice the decisions, not just the services.</span>
        </footer>
      </div>
    </div>
  );
}
