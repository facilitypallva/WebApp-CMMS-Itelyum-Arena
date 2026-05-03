import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchByPath, setSearchByPath] = useState<Record<string, string>>({});

  const globalSearch = searchByPath[location.pathname] ?? '';

  const handleGlobalSearchChange = (value: string) => {
    setSearchByPath((current) => {
      if (current[location.pathname] === value) {
        return current;
      }

      return {
        ...current,
        [location.pathname]: value,
      };
    });
  };

  const handleGlobalSearchApply = (path: string, value: string) => {
    setSearchByPath((current) => ({
      ...current,
      [path]: value,
    }));
    navigate(path);
  };

  const content = useMemo(() => {
    if (!React.isValidElement(children)) {
      return children;
    }

    return React.cloneElement(children as React.ReactElement<any>, {
      globalSearch,
      onGlobalSearchChange: handleGlobalSearchChange,
    });
  }, [children, globalSearch]);

  return (
    <div className="flex min-h-screen bg-[var(--arena-bg)] text-[var(--arena-text-primary)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          globalSearch={globalSearch}
          onGlobalSearchChange={handleGlobalSearchChange}
          onGlobalSearchApply={handleGlobalSearchApply}
        />
        <main className="flex-1 overflow-y-auto bg-[var(--arena-bg)] p-6 lg:p-7">
          {content}
        </main>
      </div>
    </div>
  );
}
