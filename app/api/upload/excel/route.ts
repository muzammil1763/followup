import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

// Column mapping from Excel headers to our model fields
// Expected headers: REF #, AWB #, COURIER, Country, Customer Name, Phone Number,
//                   CITY, Area Name, ADDRESS, Product Name, SKU, COD, Sale Agent, TEAM
function mapRow(row: Record<string, any>) {
  return {
    refNumber: String(row['REF #'] || row['REF#'] || row['ref #'] || row['ref#'] || '').trim(),
    awbNumber: String(row['AWB #'] || row['AWB#'] || row['awb #'] || row['awb#'] || '').trim(),
    courier: String(row['COURIER'] || row['Courier'] || row['courier'] || '').trim(),
    country: String(row['Country'] || row['COUNTRY'] || row['country'] || '').trim(),
    customerName: String(row['Customer Name'] || row['CUSTOMER NAME'] || row['customer name'] || '').trim(),
    phone: String(row['Phone Number'] || row['PHONE NUMBER'] || row['Phone'] || row['phone'] || '').trim(),
    city: String(row['CITY'] || row['City'] || row['city'] || '').trim(),
    areaName: String(row['Area Name'] || row['AREA NAME'] || row['area name'] || '').trim(),
    address: String(row['ADDRESS'] || row['Address'] || row['address'] || '').trim(),
    productName: String(row['Product Name'] || row['PRODUCT NAME'] || row['product name'] || '').trim(),
    sku: String(row['SKU'] || row['sku'] || '').trim(),
    codAmount: Number(row['COD'] || row['cod'] || row['Cod'] || 0),
    saleAgent: String(row['Sale Agent'] || row['SALE AGENT'] || row['sale agent'] || '').trim(),
    team: String(row['TEAM'] || row['Team'] || row['team'] || '').trim(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const recordDateStr = formData.get('recordDate') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse and validate record date if provided
    let recordDate: Date | undefined;
    if (recordDateStr) {
      recordDate = new Date(recordDateStr);
      if (isNaN(recordDate.getTime())) {
        return NextResponse.json({ error: 'Invalid record date provided' }, { status: 400 });
      }
      // Ensure date is not in the future
      if (recordDate > new Date()) {
        return NextResponse.json({ error: 'Record date cannot be in the future' }, { status: 400 });
      }
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
    
    const requiredColumns = [
      { names: ['REF #', 'REF#', 'ref #', 'ref#'], label: 'REF #' },
      { names: ['AWB #', 'AWB#', 'awb #', 'awb#'], label: 'AWB #' },
      { names: ['COURIER', 'Courier', 'courier'], label: 'COURIER' },
      { names: ['Country', 'COUNTRY', 'country'], label: 'Country' },
      { names: ['Customer Name', 'CUSTOMER NAME', 'customer name'], label: 'Customer Name' },
      { names: ['Phone Number', 'PHONE NUMBER', 'Phone', 'phone'], label: 'Phone Number' },
      { names: ['CITY', 'City', 'city'], label: 'CITY' },
      { names: ['Area Name', 'AREA NAME', 'area name'], label: 'Area Name' },
      { names: ['ADDRESS', 'Address', 'address'], label: 'ADDRESS' },
      { names: ['Product Name', 'PRODUCT NAME', 'product name'], label: 'Product Name' },
      { names: ['SKU', 'sku'], label: 'SKU' },
      { names: ['COD', 'cod', 'Cod'], label: 'COD' },
      { names: ['Sale Agent', 'SALE AGENT', 'sale agent'], label: 'Sale Agent' },
      { names: ['TEAM', 'Team', 'team'], label: 'TEAM' },
    ];

    const missingColumns: string[] = [];
    
    for (const required of requiredColumns) {
      const hasColumn = required.names.some(name => headers.includes(name));
      if (!hasColumn) {
        missingColumns.push(required.label);
      }
    }

    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Invalid Excel format. Missing required columns: ${missingColumns.join(', ')}. Please download the correct template from the Downloads tab.` 
      }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Parse and validate all rows first
    const validRows: Array<{
      refNumber: string;
      awbNumber: string;
      courier: string;
      country: string;
      customerName: string;
      phone: string;
      city: string;
      areaName: string;
      address: string;
      productName: string;
      sku: string;
      codAmount: number;
      saleAgent: string;
      team: string;
    }> = [];

    for (const row of rows) {
      const mapped = mapRow(row);

      if (!mapped.refNumber || !mapped.awbNumber) {
        skipped++;
        continue;
      }

      validRows.push(mapped);
    }

    if (validRows.length === 0) {
      return NextResponse.json({ created, skipped, errors }, { status: 201 });
    }

    // Check which records already exist
    const refNumbers = validRows.map(r => r.refNumber);
    const existingRecords = await prisma.shipmentRecord.findMany({
      where: { refNumber: { in: refNumbers } },
      select: { refNumber: true }
    });

    const existingRefSet = new Set(existingRecords.map(r => r.refNumber));

    // Filter out existing records
    const newRecords = validRows.filter(r => !existingRefSet.has(r.refNumber));
    skipped += validRows.length - newRecords.length;

    // Process in chunks to avoid memory/transaction limits
    const CHUNK_SIZE = 500;
    
    for (let i = 0; i < newRecords.length; i += CHUNK_SIZE) {
      const chunk = newRecords.slice(i, i + CHUNK_SIZE);
      
      try {
        // Use createMany for bulk insert (much faster)
        const result = await prisma.shipmentRecord.createMany({
          data: chunk.map(mapped => ({
            refNumber: mapped.refNumber,
            awbNumber: mapped.awbNumber,
            courier: mapped.courier,
            country: mapped.country,
            customerName: mapped.customerName,
            phone: mapped.phone,
            city: mapped.city,
            areaName: mapped.areaName,
            address: mapped.address,
            productName: mapped.productName,
            sku: mapped.sku,
            codAmount: mapped.codAmount,
            saleAgent: mapped.saleAgent,
            team: mapped.team,
            status: 'IN_PROCESSING',
            paymentStatus: null,
            // Use provided recordDate if available, otherwise use current date
            createdAt: recordDate || new Date(),
          })),
        });
        
        created += result.count;
      } catch (e: any) {
        console.error('Batch create error:', e);
        errors.push(`Chunk ${i / CHUNK_SIZE + 1} failed: ${e.message}`);
      }
    }

    return NextResponse.json({ created, skipped, errors }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to process file' }, { status: 500 });
  }
}
