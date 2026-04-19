"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LayoutDashboard, FolderOpen, Settings, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  exact?: boolean;
}

function NavItem({ href, icon: Icon, children, exact = false }: NavItemProps) {
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
      <Icon size={16} className="flex-shrink-0" />
      <span className="font-medium">{children}</span>
    </Link>
  );
}

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-0.5 flex-1">
      <NavItem href="/dashboard/generate" icon={Zap}>New project</NavItem>
      <NavItem href="/dashboard" icon={LayoutDashboard} exact>Dashboard</NavItem>
      <NavItem href="/dashboard/projects" icon={FolderOpen}>My projects</NavItem>
      <NavItem href="/dashboard/serial" icon={Terminal}>Serial monitor</NavItem>
      <NavItem href="/dashboard/settings" icon={Settings}>Settings</NavItem>
    </nav>
  );
}
