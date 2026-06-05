import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

// Status upload Excel format: AWB # | STATUS
// STATUS values: DELIVERED, RTO  (IN_PROCESSING is default, not set via this upload)
// Only updates records that are currently IN_PROCESSING

function normalizeStatus(raw: string): 'DELIVERED' | 'RTO' | null {
  const s = String(raw || '').trim().toUpperCase();
  if (s === 'DELIVERED' || s === 'DELIVER' || s === 'DELIVERE' || s === 'DELIVERD') return 'DELIVERED';
  if (s === 'RTO') return 'RTO';
  return null;
}

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
    const hasStatusColumn = ['STATUS', 'Status', 'status'].some(name => headers.includes(name));

    if (!hasAwbColumn || !hasStatusColumn) {
      return NextResponse.json({ 
        error: `Invalid Excel format. Required columns: AWB # and STATUS. Please download the correct template from the Downloads tab.` 
      }, { status: 400 });
    }

    let updated = 0;
    let notFound = 0;
    let invalid = 0;
    let alreadyProcessed = 0;

    console.log(`📊 [STATUS UPLOAD] Starting upload with ${rows.length} rows`);
    const uploadStartTime = Date.now();

    // Parse and validate all rows first
    const validRows: Array<{ awb: string; status: 'DELIVERED' | 'RTO' }> = [];
    
    for (const row of rows) {
      const awb = String(row['AWB #'] || row['AWB#'] || row['awb #'] || row['awb#'] || row['AWB'] || '').trim();
      const rawStatus = row['STATUS'] || row['Status'] || row['status'] || '';
      const status = normalizeStatus(rawStatus);

      if (!awb) { invalid++; continue; }
      if (!status) { invalid++; continue; }

      validRows.push({ awb, status });
    }

    console.log(`✅ [STATUS UPLOAD] Validated ${validRows.length} valid rows (${invalid} invalid)`);

    if (validRows.length === 0) {
      console.log(`⚠️ [STATUS UPLOAD] No valid rows to process`);
      return NextResponse.json({ updated, notFound, invalid, alreadyProcessed }, { status: 200 });
    }

    // Process in smaller chunks to avoid transaction limits
    const CHUNK_SIZE = 100; // Reduced from 500 to 100 for better reliability
    const totalChunks = Math.ceil(validRows.length / CHUNK_SIZE);
    
    console.log(`🔄 [STATUS UPLOAD] Processing ${validRows.length} records in ${totalChunks} chunks of ${CHUNK_SIZE}`);
    
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
          status: 'IN_PROCESSING'
        },
      });
      const fetchTime = Date.now() - fetchStart;
      console.log(`   ✓ Fetched ${records.length} records in ${fetchTime}ms`);

      // Create a map for quick lookup
      const recordMap = new Map(records.map(r => [r.awbNumber, r]));

      // Count not found and already processed for this chunk
      let chunkNotFound = 0;
      let chunkAlreadyProcessed = 0;
      
      for (const validRow of chunk) {
        const record = recordMap.get(validRow.awb);
        if (!record) {
          // Check if record exists but is already processed
          const existingRecord = await prisma.shipmentRecord.findUnique({
            where: { awbNumber: validRow.awb },
            select: { status: true }
          });
          
          if (existingRecord) {
            chunkAlreadyProcessed++;
            alreadyProcessed++;
          } else {
            chunkNotFound++;
            notFound++;
          }
        }
      }

      // Batch update all valid records in this chunk
      if (records.length > 0) {
        try {
          const updateStart = Date.now();
          
          // Group records by update type for batch operations
          const deliveredIds: string[] = [];
          const deliveredUnpaidIds: string[] = [];
          const rtoIds: string[] = [];
          
          for (const record of records) {
            const validRow = chunk.find(r => r.awb === record.awbNumber);
            if (!validRow) continue;

            if (validRow.status === 'DELIVERED') {
              if (record.paymentStatus === null) {
                deliveredUnpaidIds.push(record.id);
              } else {
                deliveredIds.push(record.id);
              }
            } else if (validRow.status === 'RTO') {
              rtoIds.push(record.id);
            }
          }
          
          // Batch update using updateMany (much faster!)
          let chunkUpdated = 0;
          
          if (deliveredIds.length > 0) {
            const result = await prisma.shipmentRecord.updateMany({
              where: { id: { in: deliveredIds } },
              data: { status: 'DELIVERED' }
            });
            chunkUpdated += result.count;
            console.log(`   ✓ Batch updated ${result.count} DELIVERED records`);
          }
          
          if (deliveredUnpaidIds.length > 0) {
            const result = await prisma.shipmentRecord.updateMany({
              where: { id: { in: deliveredUnpaidIds } },
              data: { status: 'DELIVERED', paymentStatus: 'UNPAID' }
            });
            chunkUpdated += result.count;
            console.log(`   ✓ Batch updated ${result.count} DELIVERED+UNPAID records`);
          }
          
          if (rtoIds.length > 0) {
            const result = await prisma.shipmentRecord.updateMany({
              where: { id: { in: rtoIds } },
              data: { status: 'RTO', paymentStatus: null }
            });
            chunkUpdated += result.count;
            console.log(`   ✓ Batch updated ${result.count} RTO records`);
          }
          
          updated += chunkUpdated;
          const updateTime = Date.now() - updateStart;
          const chunkTime = Date.now() - chunkStartTime;
          
          console.log(`   ✅ Updated ${chunkUpdated} records in ${updateTime}ms`);
          console.log(`   📊 Chunk stats: ${chunkUpdated} updated, ${chunkAlreadyProcessed} already processed, ${chunkNotFound} not found`);
          console.log(`   ⏱️  Total chunk time: ${chunkTime}ms`);
        } catch (error: any) {
          console.error(`   ❌ Chunk ${chunkNumber} error:`, error.message);
        }
      } else {
        console.log(`   ⚠️  No records to update in this chunk`);
      }
    }
    
    const totalTime = Date.now() - uploadStartTime;
    console.log(`\n🎉 [STATUS UPLOAD] Complete!`);
    console.log(`   📊 Total: ${updated} updated, ${alreadyProcessed} already processed, ${notFound} not found, ${invalid} invalid`);
    console.log(`   ⏱️  Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`   ⚡ Average: ${(totalTime / validRows.length).toFixed(2)}ms per record\n`);

    return NextResponse.json({ updated, notFound, invalid, alreadyProcessed }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to process file' }, { status: 500 });
  }
}
