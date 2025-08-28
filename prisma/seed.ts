import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'
const prisma = new PrismaClient()
import { v4 as uuidv4 } from 'uuid'


async function main() {
  const plans = [
    {
      code: 'BASIC',
      name: 'Básico',
      price: 9990.00,
      currency: 'ARS',
      features: { bookings: true, reminders: true, reports: 'basic' },
    },
    {
      code: 'PRO',
      name: 'Pro',
      price: 19990.00,
      currency: 'ARS',
      features: { bookings: true, reminders: true, reports: 'advanced', wa: true },
    },
    {
      code: 'BUSINESS',
      name: 'Business',
      price: 34990.00,
      currency: 'ARS',
      features: { bookings: true, reminders: true, reports: 'advanced', wa: true, api: true },
    },
  ]
  for (const p of plans) {
    await prisma.planCatalog.upsert({
      where: { code: p.code },
      update: {},
      create: p as any,
    })
  }
  const org = await prisma.organization.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: { name: 'Demo Org', subdomain: 'demo' },
  })

  // Location
  const locId = uuidv4()
  const loc = await prisma.location.upsert({
    where: { id: locId },
    update: {},
    create: {
      id: locId,
      organizationId: org.id,
      name: 'Sede Central',
      timezone: 'America/Argentina/Buenos_Aires',
    },
  })

  // Service con UUID real
  const svcId = uuidv4()
  const svc = await prisma.service.upsert({
    where: { id: svcId },
    update: {},
    create: {
      id: svcId,
      organizationId: org.id,
      locationId: loc.id,
      name: 'Consulta Inicial',
      durationMin: 60,
      bufferMin: 0,
      price: 0.0,
    },
  })

  // Staff con UUID real
  const staffId = uuidv4()
  const st = await prisma.staff.upsert({
    where: { id: staffId },
    update: {},
    create: {
      id: staffId,
      organizationId: org.id,
      locationId: loc.id,
      name: 'Profesional Demo',
    },
  })

  // Working hours Lun–Vie 9 a 18
  for (const wd of [1, 2, 3, 4, 5]) {
    const existing = await prisma.workingHours.findFirst({
      where: { locationId: loc.id, staffId: null, weekday: wd },
    })

    if (existing) {
      await prisma.workingHours.update({
        where: { id: existing.id },
        data: {},
      })
    } else {
      await prisma.workingHours.create({
        data: {
          id: uuidv4(),
          organizationId: org.id,
          locationId: loc.id,
          staffId: null,
          weekday: wd,
          startMin: 9 * 60,
          endMin: 18 * 60,
        },
      })
    }
  }
  // Guardar JSON con IDs para usar en Thunder Client
  const demoFile = join(process.cwd(), '.demo.json')
  const demoData = {
    orgId: org.id,
    locId: loc.id,
    svcId: svc.id,
    staffId: st.id,
  }
  writeFileSync(demoFile, JSON.stringify(demoData, null, 2))

  console.log('Seed OK')
  console.log({ orgId: org.id, locId: loc.id, svcId: svc.id, staffId: st.id })
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
