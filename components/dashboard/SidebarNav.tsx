"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  icon: string;
  children: React.ReactNode;
  exact?: boolean;
}

function NavItem({ href, icon, children, exact = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        isActive
          ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/5 text-blue-300 border border-blue-500/15"
          : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full" />
      )}
      <span className="text-sm">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-0.5 flex-1">
      <NavItem href="/dashboard/generate" icon="⚡">New project</NavItem>
      <NavItem href="/dashboard" icon="🏠" exact>Dashboard</NavItem>
      <NavItem href="/dashboard/projects" icon="📁">My projects</NavItem>
      <NavItem href="/dashboard/settings" icon="⚙">Settings</NavItem>
    </nav>
  );
}
