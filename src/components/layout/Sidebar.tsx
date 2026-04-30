import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, ClipboardList, Ticket, Users, ShieldCheck, CalendarDays, LogOut, User, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import arenaOsLogo from '@/assets/arenaos-logo-horizontal.svg';
import { APP_ROLE_LABELS } from '@/lib/constants';
import { AppRole } from '@/types';

type NavItem = { icon: any; label: string; href: string; roles?: AppRole[] };
type NavGroup = NavItem & { children?: NavItem[] };

const navGroups: NavGroup[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Box, label: 'Asset MEP', href: '/assets' },
  {
    icon: ClipboardList, label: 'Work Orders', href: '/work-orders',
    children: [
      { icon: FolderOpen, label: 'Rapportini', href: '/rapportini' },
    ],
  },
  { icon: Ticket, label: 'Tickets', href: '/tickets' },
  { icon: CalendarDays, label: 'Scadenzario', href: '/schedule' },
  { icon: Users, label: 'Fornitori', href: '/suppliers' },
  { icon: ShieldCheck, label: 'Audit Log', href: '/audit', roles: ['ADMIN', 'RESPONSABILE'] },
];

export function Sidebar() {
  const { user, signOut, isAdmin, role } = useAuth();
  const location = useLocation();
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';
  const emailLabel = user?.email ?? '';

  const baseGroups = navGroups.filter((item) => !item.roles || item.roles.includes(role));
  const groups: NavGroup[] = isAdmin
    ? [...baseGroups, { icon: User, label: 'Utenti', href: '/users' }]
    : baseGroups;

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const init = new Set<string>();
    if (location.pathname.startsWith('/rapportini')) init.add('/work-orders');
    return init;
  });

  const toggle = (href: string) =>
    setExpanded((s) => { const n = new Set(s); n.has(href) ? n.delete(href) : n.add(href); return n; });

  const handleLogout = async () => {
    await signOut();
    toast.success('Disconnesso');
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-[#0b1220] text-slate-400">
      <div className="border-b border-white/[0.06] px-[18px] py-5">
        <img src={arenaOsLogo} alt="ArenaOS" className="h-10 w-auto max-w-[190px] object-contain brightness-0 invert" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="px-5 pb-3 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Operations
        </div>
        {groups.map((item) => {
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
      </nav>

      <div className="mt-auto space-y-2 border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.035] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-cyan-400 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-semibold text-white">{emailLabel}</p>
            <p className="text-[10px] text-slate-500">Pallacanestro Varese - {APP_ROLE_LABELS[role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={16} />
          Disconnetti
        </button>
      </div>
    </aside>
  );
}
