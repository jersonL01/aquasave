import Link from "next/link"
import { Droplet, BarChart2, MapPin } from "lucide-react"

const items = [
  { href: "/consumo", label: "Consumo de agua", Icon: Droplet },
  { href: "/comparacion", label: "Comparación de tu período", Icon: BarChart2 },
  { href: "/lugares", label: "Lugares con mayor consumo", Icon: MapPin },
]

export default function ActionCards() {
  return (
    <div className="mx-auto max-w-5xl mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-2xl px-6 py-5 text-center text-white bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md shadow-lg transition"
        >
          <div className="mx-auto mb-2 grid place-items-center size-9 rounded-full bg-sky-500/20 group-hover:bg-sky-400/30 transition">
            <Icon className="size-5" />
          </div>
          <span className="font-medium">{label}</span>
        </Link>
      ))}
    </div>
  )
}
