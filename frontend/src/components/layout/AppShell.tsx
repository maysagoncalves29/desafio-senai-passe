import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { SidebarNav } from './SidebarNav';

function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center gap-2 border-b bg-sidebar px-3 py-2 md:hidden">
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger asChild>
          <Button variant="outline" size="icon" aria-label="Abrir menu">
            <Menu />
          </Button>
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-r bg-sidebar shadow-lg"
          >
            <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      <span className="text-base font-semibold">Passe</span>
    </header>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-sidebar">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-sidebar-border md:block">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="min-w-0 flex-1 bg-background p-4 md:m-2 md:rounded-xl md:border md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
