import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const records = await prisma.shipmentRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const mapped = records.map((r) => ({
      id: r.refNumber,
      refNumber: r.refNumber,
      awbNumber: r.awbNumber,
      courier: r.courier,
      country: r.country,
      customerName: r.customerName,
      phone: r.phone,
      city: r.city,
      areaName: r.areaName,
      address: r.address,
      productName: r.productName,
      sku: r.sku,
      codAmount: r.codAmount,
      saleAgent: r.saleAgent,
      team: r.team,
      status: r.status,
      paymentStatus: r.paymentStatus,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    return NextResponse.json(mapped);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const records: any[] = Array.isArray(body) ? body : [body];

    let created = 0;
    let skipped = 0;

    for (const r of records) {
      try {
        await prisma.shipmentRecord.upsert({
          where: { refNumber: r.refNumber },
          update: {},
          create: {
            refNumber: r.refNumber,
            awbNumber: r.awbNumber,
            courier: r.courier || '',
            country: r.country,
            customerName: r.customerName,
            phone: String(r.phone),
            city: r.city,
            areaName: r.areaName || '',
            address: r.address || '',
            productName: r.productName,
            sku: r.sku ? String(r.sku) : '',
            codAmount: Number(r.codAmount) || 0,
            saleAgent: r.saleAgent || '',
            team: r.team || '',
            status: 'IN_PROCESSING',
            paymentStatus: null,
          },
        });
        created++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ created, skipped }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const result = await prisma.shipmentRecord.deleteMany({});
    return NextResponse.json({ deleted: result.count }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete all records' }, { status: 500 });
  }
}
