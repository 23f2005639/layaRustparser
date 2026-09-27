"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  currentSection?: string;
  eps?: number | null;
}

export function AppShell({ children, currentSection, eps }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#1E293B]">
      <Sidebar />
      <div className="pl-[250px]">
        <Header currentSection={currentSection} eps={eps} />
        <main className="relative pt-16 bg-[#F3F3F3] min-h-screen w-full px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
