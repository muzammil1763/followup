import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

// Payment upload Excel format: AWB # | COD RECEIVED
// Marks matching records as PAID

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    // Validate required columns
    const firstRow = rows[0];
    const headers = Object.keys(firstRow);
    
    const hasAwbColumn = ['AWB #', 'AWB#', 'awb #', 'awb#', 'AWB'].some(name => headers.includes(name));
    const hasCodColumn = ['COD RECEIVED', 'COD RECEIVED', 'cod received', 'COD'].some(name => headers.includes(name));

    if (!hasAwbColumn || !hasCodColumn) {
      return NextResponse.json({ 
        error: `Invalid Excel format. Required columns: AWB # and COD RECEIVED. Please download the correct template from the Downloads tab.` 
      }, { status: 400 });
    }

    let updated = 0;
    let notFound = 0;
    let invalid = 0;
    let notDelivered = 0;

    console.log(`📊 [PAYMENT UPLOAD] Starting upload with ${rows.length} rows`);
    const uploadStartTime = Date.now();

    // Parse and validate all rows first
    const validRows: Array<{ awb: string }> = [];
    
    for (const row of rows) {
      const awb = String(row['AWB #'] || row['AWB#'] || row['awb #'] || row['awb#'] || row['AWB'] || '').trim();

      if (!awb) { 
        invalid++; 
        continue; 
      }

      validRows.push({ awb });
    }

    console.log(`✅ [PAYMENT UPLOAD] Validated ${validRows.length} valid rows (${invalid} invalid)`);

    if (validRows.length === 0) {
      console.log(`⚠️ [PAYMENT UPLOAD] No valid rows to process`);
      return NextResponse.json({ updated, notFound, invalid, notDelivered }, { status: 200 });
    }

    // Process in smaller chunks to avoid transaction limits
    const CHUNK_SIZE = 100;
    const totalChunks = Math.ceil(validRows.length / CHUNK_SIZE);
    
    console.log(`🔄 [PAYMENT UPLOAD] Processing ${validRows.length} records in ${totalChunks} chunks of ${CHUNK_SIZE}`);
    
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
      const chunk = validRows.slice(i, i + CHUNK_SIZE);
      const chunkStartTime = Date.now();
      
      console.log(`\n📦 [CHUNK ${chunkNumber}/${totalChunks}] Processing records ${i + 1} to ${i + chunk.length}`);
      
      const awbNumbers = chunk.map(r => r.awb);
      
      // Batch fetch records for this chunk
      const fetchStart = Date.now();
      const records = await prisma.shipmentRecord.findMany({
        where: { 
          awbNumber: { in: awbNumbers },
          status: 'DELIVERED'
        },
      });
      const fetchTime = Date.now() - fetchStart;
      console.log(`   ✓ Fetched ${records.length} records in ${fetchTime}ms`);

      // Create a map for quick lookup
      const recordMap = new Map(records.map(r => [r.awbNumber, r]));

      // Count not found and not delivered for this chunk
      let chunkNotFound = 0;
      let chunkNotDelivered = 0;
      
      for (const validRow of chunk) {
        const record = recordMap.get(validRow.awb);
        if (!record) {
          const existingRecord = await prisma.shipmentRecord.findUnique({
            where: { awbNumber: validRow.awb },
            select: { status: true }
          });
          
          if (existingRecord) {
            if (existingRecord.status !== 'DELIVERED') {
              chunkNotDelivered++;
              notDelivered++;
            }
          } else {
            chunkNotFound++;
            notFound++;
          }
        }
      }

      // Update records individually
      if (records.length > 0) {
        try {
          const updateStart = Date.now();
          
          // Batch update all records at once (much faster!)
          const recordIds = records.map(r => r.id);
          
          const result = await prisma.shipmentRecord.updateMany({
            where: { id: { in: recordIds } },
            data: { paymentStatus: 'PAID' }
          });
          
          const chunkUpdated = result.count;
          updated += chunkUpdated;
          const updateTime = Date.now() - updateStart;
          const chunkTime = Date.now() - chunkStartTime;
          
          console.log(`   ✅ Batch updated ${chunkUpdated} records in ${updateTime}ms`);
          console.log(`   📊 Chunk stats: ${chunkUpdated} updated, ${chunkNotDelivered} not delivered, ${chunkNotFound} not found`);
          console.log(`   ⏱️  Total chunk time: ${chunkTime}ms`);
        } catch (error: any) {
          console.error(`   ❌ Chunk ${chunkNumber} error:`, error.message);
        }
      } else {
        console.log(`   ⚠️  No records to update in this chunk`);
      }
    }
    
    const totalTime = Date.now() - uploadStartTime;
    console.log(`\n🎉 [PAYMENT UPLOAD] Complete!`);
    console.log(`   📊 Total: ${updated} updated, ${notDelivered} not delivered, ${notFound} not found, ${invalid} invalid`);
    console.log(`   ⏱️  Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`   ⚡ Average: ${(totalTime / validRows.length).toFixed(2)}ms per record\n`);

    return NextResponse.json({ 
      updated, 
      notFound, 
      invalid, 
      notDelivered 
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to process file' }, { status: 500 });
  }
}
