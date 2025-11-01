import React from "react"
export default function Section({title, subtitle, children}:{title?:string; subtitle?:string; children:React.ReactNode}) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        {title && <h2 className="text-3xl font-bold">{title}</h2>}
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </section>
  )
}
