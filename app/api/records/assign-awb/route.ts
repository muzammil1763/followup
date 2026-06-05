import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/records/assign-awb
// Body: { refNumber: string, paymentStatus: 'PAID' | 'UNPAID' }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { refNumber, paymentStatus } = body;

    if (!refNumber || !paymentStatus) {
      return NextResponse.json({ error: 'refNumber and paymentStatus are required' }, { status: 400 });
    }

    const record = await prisma.shipmentRecord.findUnique({ where: { refNumber } });
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (record.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Payment status can only be set for DELIVERED records' }, { status: 400 });
    }

    const updated = await prisma.shipmentRecord.update({
      where: { refNumber },
      data: { paymentStatus },
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update' }, { status: 500 });
  }
}
