import { Metadata } from "next";
import "./globals.css"
import AppShell from "@/components/AppShell"


export const metadata: Metadata = {
  title: "AquaSave",
  description: "",
   icons: {
    icon: "/img/logo.png",
  },

};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
