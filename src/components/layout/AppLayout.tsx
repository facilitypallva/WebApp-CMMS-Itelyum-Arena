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
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          globalSearch={globalSearch}
          onGlobalSearchChange={handleGlobalSearchChange}
          onGlobalSearchApply={handleGlobalSearchApply}
        />
        <main className="flex-1 p-8 overflow-y-auto">
          {content}
        </main>
      </div>
    </div>
  );
}
