import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, ClipboardList, Ticket, Users, ShieldCheck, CalendarDays, User, FolderOpen, ChevronDown, ChevronRight, ChevronUp, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ArenaOsLogo } from '@/components/brand/ArenaOsLogo';
import { APP_ROLE_LABELS } from '@/lib/constants';
import { AppRole } from '@/types';
import { ProfileSheet } from '@/components/profile/ProfileSheet';

type NavItem = { icon: any; label: string; href: string; roles?: AppRole[] };
type NavGroup = NavItem & { children?: NavItem[] };
type NavSection = { label: string; items: NavGroup[] };

const navSections: NavSection[] = [
  {
    label: 'Panoramica',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    ],
  },
  {
    label: 'Operatività',
    items: [
      { icon: CalendarDays, label: 'Scadenzario', href: '/schedule' },
      { icon: Car, label: 'Mezzi', href: '/vehicles' },
      {
        icon: ClipboardList, label: 'Work Orders', href: '/work-orders',
        children: [
          { icon: FolderOpen, label: 'Rapportini', href: '/rapportini' },
        ],
      },
      { icon: Ticket, label: 'Tickets', href: '/tickets' },
    ],
  },
  {
    label: 'Anagrafiche',
    items: [
      { icon: Box, label: 'Asset', href: '/assets' },
      { icon: Users, label: 'Fornitori', href: '/suppliers' },
    ],
  },
  {
    label: 'Amministrazione',
    items: [
      { icon: ShieldCheck, label: 'Audit Log', href: '/audit', roles: ['ADMIN', 'RESPONSABILE'] },
    ],
  },
];

export function Sidebar() {
  const { user, profile, isAdmin, role } = useAuth();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Utente';
  const initials = (profile?.full_name ?? user?.email ?? '??')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const sections = navSections
    .map((section) => {
      const sectionItems = section.items.filter((item) => !item.roles || item.roles.includes(role));
      const items = section.label === 'Amministrazione' && isAdmin
        ? [{ icon: User, label: 'Utenti', href: '/users' }, ...sectionItems]
        : sectionItems;

      return { ...section, items };
    })
    .filter((section) => section.items.length > 0);

  const [expanded, setExpanded] = useState<Set<string>>(() => {

    const init = new Set<string>();
    if (location.pathname.startsWith('/rapportini')) init.add('/work-orders');
    return init;
  });

  const toggle = (href: string) =>
    setExpanded((s) => { const n = new Set(s); n.has(href) ? n.delete(href) : n.add(href); return n; });

  return (
    <aside className="sticky top-0 flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col overflow-y-auto border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]">
      <div className="flex h-11 items-center border-b border-[var(--sidebar-border)] px-4">
        <ArenaOsLogo variant="light" className="h-[34px] w-[116px]" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-3 last:mb-0">
            <div className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--sidebar-text-muted)]">
              {section.label}
            </div>
            {section.items.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isOpen = expanded.has(item.href);

              return (
                <div key={item.href}>
                  <div className="flex items-center gap-1">
                    <NavLink
                      to={item.href}
                      end={item.href === '/'}
                      className={({ isActive }) => cn(
                        'group relative flex h-[var(--sidebar-item-height)] flex-1 items-center gap-2.5 rounded-[var(--sidebar-radius)] px-3 text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ECC71]/35',
                        isActive
                          ? 'bg-[var(--sidebar-item-bg-active)] pl-6 text-[var(--sidebar-text-active)]'
                          : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-bg-hover)] hover:text-slate-200'
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute left-3 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#2ECC71]" />}
                          <item.icon size={16} className="shrink-0" />
                          <span className="font-medium">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                    {hasChildren && (
                      <button
                        onClick={() => toggle(item.href)}
                        className="flex h-8 w-7 shrink-0 items-center justify-center rounded-[var(--sidebar-radius)] text-[var(--sidebar-text-muted)] transition-colors duration-150 hover:bg-[var(--sidebar-item-bg-hover)] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#27e58c]/35"
                      >
                        {isOpen
                          ? <ChevronDown size={13} />
                          : <ChevronRight size={13} />}
                      </button>
                    )}
                  </div>

                  {hasChildren && isOpen && (
                    <div className="ml-3 mt-1 space-y-1 border-l border-[var(--sidebar-border)] pl-2">
                      {item.children!.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={({ isActive }) => cn(
                            'group relative flex h-[var(--sidebar-item-height)] items-center gap-2.5 rounded-[var(--sidebar-radius)] px-3 text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ECC71]/35',
                            isActive
                              ? 'bg-[var(--sidebar-item-bg-active)] pl-6 font-medium text-[var(--sidebar-text-active)]'
                              : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-bg-hover)] hover:text-slate-200'
                          )}
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <span className="absolute left-3 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#2ECC71]" />}
                              <child.icon size={16} className="shrink-0" />
                              <span className="font-medium">{child.label}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-2">
        <button
          onClick={() => setProfileOpen(true)}
          className="group flex h-12 w-full items-center gap-2 rounded-[var(--sidebar-radius)] px-2 text-left transition-colors duration-150 hover:bg-[var(--sidebar-item-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#27e58c]/35"
        >
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#17181d] text-[10px] font-semibold text-white ring-1 ring-white/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <p className="truncate text-[12px] font-medium leading-4 text-white">{displayName}</p>
            <p className="text-[10px] leading-3 text-[var(--sidebar-text-muted)]">{APP_ROLE_LABELS[role]}</p>
          </div>
          <ChevronUp size={13} className="shrink-0 text-[var(--sidebar-text-muted)] transition-colors duration-150 group-hover:text-slate-400" />
        </button>
      </div>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </aside>
  );
}
