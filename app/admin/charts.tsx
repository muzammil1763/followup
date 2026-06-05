'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Line, LineChart, Area, AreaChart } from 'recharts';
import { ShipmentRecord } from '@/lib/types';
import { TrendingUp, Package, DollarSign } from 'lucide-react';

const chartConfig: ChartConfig = {
  count: { label: 'Records' },
  IN_PROCESSING: { label: 'In Processing', color: 'hsl(45, 93%, 47%)' },
  DELIVERED: { label: 'Delivered', color: 'hsl(142, 71%, 45%)' },
  RTO: { label: 'RTO', color: 'hsl(0, 84%, 60%)' },
};

const STATUS_COLORS = {
  'In Processing': '#f59e0b',
  'Delivered': '#10b981',
  'RTO': '#ef4444',
};

const PAYMENT_COLORS = {
  'Paid': '#3b82f6',
  'Unpaid': '#f97316',
};

export function DashboardCharts({ records }: { records: ShipmentRecord[] }) {
  const statusData = useMemo(() => {
    const inProcessing = records.filter((r) => r.status === 'IN_PROCESSING').length;
    const delivered = records.filter((r) => r.status === 'DELIVERED').length;
    const rto = records.filter((r) => r.status === 'RTO').length;
    return [
      { name: 'In Processing', value: inProcessing, color: STATUS_COLORS['In Processing'] },
      { name: 'Delivered', value: delivered, color: STATUS_COLORS['Delivered'] },
      { name: 'RTO', value: rto, color: STATUS_COLORS['RTO'] },
    ].filter((d) => d.value > 0);
  }, [records]);

  const paymentData = useMemo(() => {
    const paid = records.filter((r) => r.paymentStatus === 'PAID').length;
    const unpaid = records.filter((r) => r.paymentStatus === 'UNPAID').length;
    return [
      { name: 'Paid', value: paid, color: PAYMENT_COLORS['Paid'] },
      { name: 'Unpaid', value: unpaid, color: PAYMENT_COLORS['Unpaid'] },
    ].filter((d) => d.value > 0);
  }, [records]);

  const countryData = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      map[r.country] = (map[r.country] || 0) + 1;
    });
    return Object.entries(map)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [records]);

  const codData = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      map[r.country] = (map[r.country] || 0) + r.codAmount;
    });
    return Object.entries(map)
      .map(([country, amount]) => ({ country, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [records]);

  const dailyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const date = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map[date] = (map[date] || 0) + 1;
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .slice(-7);
  }, [records]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Status Distribution Pie Chart */}
      <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 transition-all duration-300 hover:border-gray-400 hover:shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">STATUS DISTRIBUTION</h3>
            <p className="text-xs font-light text-gray-500">Shipment status breakdown</p>
          </div>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart width={400} height={280}>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                innerRadius={45}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={3}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      {/* Payment Status Pie Chart */}
      <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 transition-all duration-300 hover:border-gray-400 hover:shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">PAYMENT STATUS</h3>
            <p className="text-xs font-light text-gray-500">Payment collection status</p>
          </div>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart width={400} height={280}>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                innerRadius={45}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={3}
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      {/* Country Distribution Bar Chart */}
      <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 transition-all duration-300 hover:border-gray-400 hover:shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">SHIPMENTS BY COUNTRY</h3>
            <p className="text-xs font-light text-gray-500">Top countries by volume</p>
          </div>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart width={500} height={280} data={countryData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis dataKey="country" type="category" stroke="#9ca3af" fontSize={12} width={60} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[0, 8, 8, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* COD by Country */}
      <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 transition-all duration-300 hover:border-gray-400 hover:shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">COD BY COUNTRY</h3>
            <p className="text-xs font-light text-gray-500">Total COD amount per country</p>
          </div>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart width={500} height={280} data={codData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis dataKey="country" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="url(#codGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="codGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Daily Trend - Full Width */}
      <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 transition-all duration-300 hover:border-gray-400 hover:shadow-xl lg:col-span-2">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">DAILY SHIPMENT TREND</h3>
            <p className="text-xs font-light text-gray-500">Last 7 days activity</p>
          </div>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart width={1000} height={280} data={dailyTrend} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#trendGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
