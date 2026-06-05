import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.shipmentRecord.delete({
      where: { refNumber: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.shipmentRecord.update({
      where: { refNumber: params.id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
      },
    });
    return NextResponse.json({ success: true, record: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update" }, { status: 500 });
  }
}