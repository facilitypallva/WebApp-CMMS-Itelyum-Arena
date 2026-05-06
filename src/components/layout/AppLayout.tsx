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
    <div className="flex min-h-screen bg-[#FAFAF9] font-sans text-[#1C1B18] selection:bg-[#2ECC71]/20 selection:text-[#0A3D1F]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-[#FAFAF9]">
        <Header
          title={title}
          globalSearch={globalSearch}
          onGlobalSearchChange={handleGlobalSearchChange}
          onGlobalSearchApply={handleGlobalSearchApply}
        />
        <main className="flex-1 overflow-y-auto bg-[#FAFAF9] px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8 [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-[1680px]">
          {content}
        </main>
      </div>
    </div>
  );
}
