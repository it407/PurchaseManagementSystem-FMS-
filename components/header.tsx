"use client";

import { LogOut } from "lucide-react";

interface HeaderProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
  onMenuClick: () => void;
}

export function Header({ user, onLogout, onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sm:px-5">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3 ">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-base mb-3font-medium text-blue-700 font-bold  sm:text-lg">
          Purchase Management System
        </h1>
      </div>

      {/* Right: User + Logout */}
      {user && (
        <div className="flex items-center gap-1">
          <span className="hidden text-sm font-medium text-gray-700 sm:inline">
            {user.name}
          </span>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
