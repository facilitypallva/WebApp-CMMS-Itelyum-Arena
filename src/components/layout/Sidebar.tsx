import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, ClipboardList, Ticket, Users, ShieldCheck, CalendarDays, LogOut, User, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import vareseLogo from '@/assets/pallacanestro-varese-logo.png';
import { APP_ROLE_LABELS } from '@/lib/constants';
import { AppRole } from '@/types';

type NavItem = { icon: any; label: string; href: string; roles?: AppRole[] };
type NavGroup = NavItem & { children?: NavItem[] };

const navGroups: NavGroup[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Box, label: 'Asset', href: '/assets' },
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
    <aside className="w-64 h-screen bg-sidebar border-r flex flex-col shrink-0 sticky top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center p-1">
          <img src={vareseLogo} alt="Pallacanestro Varese" className="h-full w-full object-contain" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">Pallacanestro Varese</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="text-[10px] font-bold text-sidebar-foreground uppercase tracking-wider px-4 mb-4 opacity-50">
          Menu Principale
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
                    'flex flex-1 items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30 dark:bg-blue-600 dark:text-white dark:shadow-blue-950/40'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary dark:hover:bg-slate-800 dark:hover:text-blue-300'
                  )}
                >
                  <item.icon size={20} className="shrink-0 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
                {hasChildren && (
                  <button
                    onClick={() => toggle(item.href)}
                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-sidebar-accent transition-colors"
                  >
                    {isOpen
                      ? <ChevronDown size={14} />
                      : <ChevronRight size={14} />}
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <div className="mt-0.5 ml-4 space-y-0.5">
                  {item.children!.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group text-sm',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold dark:bg-blue-500/15 dark:text-blue-300'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary dark:hover:bg-slate-800 dark:hover:text-blue-300'
                      )}
                    >
                      <child.icon size={16} className="shrink-0 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t space-y-2">
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-slate-900 truncate">{emailLabel}</p>
            <p className="text-[10px] text-slate-500">Pallacanestro Varese • {APP_ROLE_LABELS[role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          Disconnetti
        </button>
      </div>
    </aside>
  );
}
