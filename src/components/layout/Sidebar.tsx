import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, ClipboardList, Ticket, Users, ShieldCheck, CalendarDays, User, FolderOpen, ChevronDown, ChevronRight, ChevronUp, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import arenaOsLogo from '@/assets/arenaos-logo-horizontal.svg';
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
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-sidebar text-slate-400">
      <div className="flex h-15 items-center justify-center border-b border-white/6 px-4">
        <img src={arenaOsLogo} alt="ArenaOS" className="h-8 w-auto max-w-40 object-contain brightness-0 invert" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            <div className="px-5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
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
                        'group relative my-px flex flex-1 items-center gap-3 rounded-lg border-l-2 px-4 py-2.5 text-[13.5px] transition-all duration-200',
                        isActive
                          ? 'border-cyan-400 bg-cyan-400/[0.08] text-white'
                          : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                      )}
                    >
                      <item.icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                    {hasChildren && (
                      <button
                        onClick={() => toggle(item.href)}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
                      >
                        {isOpen
                          ? <ChevronDown size={14} />
                          : <ChevronRight size={14} />}
                      </button>
                    )}
                  </div>

                  {hasChildren && isOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/[0.06] pl-2">
                      {item.children!.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={({ isActive }) => cn(
                            'group flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-all duration-200',
                            isActive
                              ? 'bg-cyan-400/[0.08] font-semibold text-cyan-200'
                              : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
                          )}
                        >
                          <child.icon size={16} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
                          <span className="font-medium">{child.label}</span>
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

      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={() => setProfileOpen(true)}
          className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.035] p-3 transition-all hover:border-cyan-400/20 hover:bg-white/[0.06]"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-700 to-cyan-400 text-xs font-bold text-white ring-1 ring-white/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <p className="truncate text-xs font-semibold text-white">{displayName}</p>
            <p className="text-[10px] text-slate-500">{APP_ROLE_LABELS[role]}</p>
          </div>
          <ChevronUp size={14} className="shrink-0 text-slate-600 transition-colors group-hover:text-slate-400" />
        </button>
      </div>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </aside>
  );
}
