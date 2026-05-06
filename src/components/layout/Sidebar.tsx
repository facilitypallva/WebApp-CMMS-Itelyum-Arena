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
    <aside className="sticky top-0 z-30 flex h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#1C1B18] text-[#FAFAF9] shadow-[8px_0_24px_-18px_rgba(28,27,24,0.75)]">
      <div className="flex h-[68px] items-center border-b border-white/[0.055] px-5">
        <ArenaOsLogo variant="light" className="h-[34px] w-[116px]" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 px-3.5 pb-2 pt-2">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A8A6A0]">
                {section.label}
              </span>
              <span className="h-px flex-1 bg-white/[0.045]" />
            </div>
            <div className="space-y-1">
            {section.items.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isOpen = expanded.has(item.href);
              const isItemActive = item.href === '/'
                ? location.pathname === '/'
                : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

              return (
                <div key={item.href}>
                  <div
                    className={cn(
                      'relative flex h-9 items-center rounded-[10px] text-[13.5px] transition-all duration-150',
                      isItemActive
                        ? 'bg-[#123821] font-semibold text-[#FAFAF9] shadow-[inset_0_0_0_1px_rgba(46,204,113,0.16)]'
                        : 'text-[#D6D3CC] hover:bg-white/[0.055] hover:text-[#FAFAF9] hover:shadow-[inset_0_0_0_1px_rgba(250,250,249,0.04)]'
                    )}
                  >
                    {isItemActive && <span className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-sm bg-[#2ECC71]" />}
                    <NavLink
                      to={item.href}
                      end={item.href === '/'}
                      className={cn(
                        'group flex h-full items-center gap-2.5 rounded-[10px] pl-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ECC71] focus-visible:ring-offset-[-2px]',
                        hasChildren ? 'pr-1' : 'flex-1 pr-4'
                      )}
                    >
                      <item.icon size={18} strokeWidth={isItemActive ? 2.35 : 2} className={cn('shrink-0 transition-colors', isItemActive ? 'text-[#2ECC71]' : 'text-[#A8A6A0] group-hover:text-[#FAFAF9]')} />
                      <span className={cn('font-medium', isItemActive && 'font-semibold')}>{item.label}</span>
                    </NavLink>
                    {hasChildren && (
                      <button
                        onClick={() => toggle(item.href)}
                        className="flex h-full w-8 shrink-0 items-center justify-center rounded-[10px] text-[#A8A6A0] transition-colors duration-150 hover:text-[#FAFAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ECC71] focus-visible:ring-offset-[-2px]"
                        aria-label={isOpen ? 'Chiudi sottomenu' : 'Apri sottomenu'}
                      >
                        {isOpen
                          ? <ChevronDown size={13} />
                          : <ChevronRight size={13} />}
                      </button>
                    )}
                  </div>

                  {hasChildren && isOpen && (
                    <div className="ml-5 mt-1.5 space-y-1 border-l border-white/[0.08] pl-3">
                      {item.children!.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={({ isActive }) => cn(
                            'group relative flex h-8 items-center gap-2.5 rounded-[10px] px-3 text-[13px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ECC71] focus-visible:ring-offset-[-2px]',
                            isActive
                              ? 'bg-[#123821] font-semibold text-[#FAFAF9] shadow-[inset_0_0_0_1px_rgba(46,204,113,0.16)]'
                              : 'text-[#D6D3CC] hover:bg-white/[0.055] hover:text-[#FAFAF9]'
                          )}
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <span className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-sm bg-[#2ECC71]" />}
                              <child.icon size={16} strokeWidth={isActive ? 2.35 : 2} className={cn('shrink-0 transition-colors', isActive ? 'text-[#2ECC71]' : 'text-[#A8A6A0] group-hover:text-[#FAFAF9]')} />
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
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.055] p-3">
        <button
          onClick={() => setProfileOpen(true)}
          className="group flex h-[56px] w-full items-center gap-2.5 rounded-xl border border-white/[0.065] bg-white/[0.035] px-3 text-left shadow-[inset_0_1px_0_rgba(250,250,249,0.04)] transition-all duration-150 hover:border-white/[0.11] hover:bg-white/[0.065] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ECC71] focus-visible:ring-offset-[-2px]"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#5F5E5A] text-[11px] font-bold text-[#FAFAF9] ring-1 ring-white/[0.12]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <p className="truncate text-[13px] font-bold leading-4 text-[#FAFAF9]">{displayName}</p>
            <p className="truncate text-[11px] font-medium leading-4 text-[#A8A6A0]">{APP_ROLE_LABELS[role]}</p>
          </div>
          <ChevronUp size={13} className="shrink-0 text-[#A8A6A0] transition-colors duration-150 group-hover:text-[#FAFAF9]" />
        </button>
      </div>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </aside>
  );
}
