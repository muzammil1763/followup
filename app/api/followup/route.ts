import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.followupRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch followup records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.followupRecord.create({
      data: {
        awbNumber: body.awbNumber ?? '',
        customerName: body.customerName ?? '',
        contactNumber: body.contactNumber ?? '',
        city: body.city ?? '',
        country: body.country ?? '',
        updatedAddress: body.updatedAddress ?? '',
        courierCurrentStatus: body.courierCurrentStatus ?? '',
      },
    });
    return NextResponse.json({ success: true, record });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (Array.isArray(ids) && ids.length > 0) {
      await prisma.followupRecord.deleteMany({ where: { id: { in: ids } } });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete' }, { status: 500 });
  }
}
