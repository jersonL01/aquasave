"use client"
import { usePathname } from "next/navigation"
import Header from "@/components/Header"        // marketing (landing/login/signup)
import React from "react"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showMarketingHeader =
    pathname === "/" || pathname.startsWith("/signup") || pathname.startsWith("/login")

  return (
    <>
      {showMarketingHeader && <Header />}
      {children}
    </>
  )
}
