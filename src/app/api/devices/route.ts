// src/app/api/devices/route.ts
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireUserId } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await requireUserId()
    const rows = await sql/*sql*/`
      select id, nombre, tipo, marca, serie, is_on, flow_lpm, created_at
      from devices
      where user_id = ${userId}
      order by created_at desc
    `
    return NextResponse.json({ ok: true, devices: rows })
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId()
    const { nombre, tipo, marca, serie, flow_lpm } = await req.json()

    const rows = await sql/*sql*/`
      insert into devices (user_id, nombre, tipo, marca, serie, flow_lpm)
      values (${userId}, ${nombre}, ${tipo}, ${marca}, ${serie}, ${flow_lpm ?? 12})
      returning id, nombre, tipo, marca, serie, is_on, flow_lpm, created_at
    `
    return NextResponse.json({ ok: true, device: rows[0] })
  } catch (e) {
    return NextResponse.json({ ok: false, msg: "No se pudo crear" }, { status: 400 })
  }
}
