import { NextResponse } from 'next/server';
import { z } from 'zod';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getCurrentUser, getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { handleError, ok, ApiError } from '@/lib/api';
import { defaultRateLimit } from '@/lib/rate-limit';
import { getDashboardMetrics } from '@/lib/queries/dashboard';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['executive', 'marketing', 'sales', 'finance']),
  format: z.enum(['pdf', 'csv', 'xlsx']),
  range: z.string().default('30d'),
});

export async function POST(req: Request) {
  try {
    const rl = await defaultRateLimit(req as any);
    if (rl) return rl;

    const user = await getCurrentUser();
    if (!user) throw new ApiError('UNAUTHORIZED', 'Faça login', 401);
    const org = await getCurrentOrganization();
    if (!org) throw new ApiError('FORBIDDEN', 'Sem organização', 403);

    const body = await req.json();
    const data = schema.parse(body);

    const days = data.range === '7d' ? 7 : data.range === '90d' ? 90 : data.range === 'ytd' ? 365 : 30;
    const metrics = await getDashboardMetrics(org.id, days);

    const supabase = createServerSupabase();
    let filePath: string | null = null;
    let fileSize = 0;

    if (data.format === 'pdf') {
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.text(data.name, 14, 18);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 25);
      pdf.text(`Organização: ${org.name}`, 14, 30);

      autoTable(pdf, {
        startY: 40,
        head: [['Métrica', 'Valor']],
        body: [
          ['Receita', `R$ ${metrics.revenue.current.toLocaleString('pt-BR')}`],
          ['Leads', metrics.leads.current.toString()],
          ['Conversão', `${metrics.conversionRate.toFixed(2)}%`],
          ['CAC', `R$ ${metrics.cac.toFixed(2)}`],
          ['LTV', `R$ ${metrics.ltv.toFixed(2)}`],
          ['ROAS', `${metrics.roas.toFixed(2)}x`],
          ['Churn', `${metrics.churnRate.toFixed(2)}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [26, 26, 255] },
      });

      autoTable(pdf, {
        head: [['Estágio do Funil', 'Quantidade']],
        body: metrics.funnel.map((f) => [f.stage, f.count.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [26, 26, 255] },
      });

      const buffer = Buffer.from(pdf.output('arraybuffer'));
      const fileName = `reports/${org.id}/${Date.now()}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from('reports')
        .upload(fileName, buffer, { contentType: 'application/pdf' });
      if (!uploadErr) {
        filePath = fileName;
        fileSize = buffer.length;
      }
    } else {
      // CSV / XLSX
      const rows = [
        ['Métrica', 'Valor'],
        ['Receita', metrics.revenue.current],
        ['Leads', metrics.leads.current],
        ['Conversão %', metrics.conversionRate.toFixed(2)],
        ['Oportunidades', metrics.opportunities.current],
        ['CAC', metrics.cac.toFixed(2)],
        ['LTV', metrics.ltv.toFixed(2)],
        ['ROAS', metrics.roas.toFixed(2)],
        ['Churn %', metrics.churnRate.toFixed(2)],
        ['Crescimento %', metrics.monthlyGrowth.toFixed(2)],
        ...metrics.revenueBySource.map((s) => [`Receita - ${s.name}`, s.value]),
        ...metrics.funnel.map((f) => [`Funil - ${f.stage}`, f.count]),
      ];

      let buffer: Buffer;
      let contentType: string;
      let fileName: string;

      if (data.format === 'csv') {
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        buffer = Buffer.from(csv, 'utf-8');
        contentType = 'text/csv';
        fileName = `reports/${org.id}/${Date.now()}.csv`;
      } else {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
        buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `reports/${org.id}/${Date.now()}.xlsx`;
      }

      const { error: uploadErr } = await supabase.storage
        .from('reports')
        .upload(fileName, buffer, { contentType });
      if (!uploadErr) {
        filePath = fileName;
        fileSize = buffer.length;
      }
    }

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        organization_id: org.id,
        created_by: user.id,
        name: data.name,
        type: data.type,
        format: data.format,
        config: { range: data.range },
        file_path: filePath,
        file_size: fileSize,
        shared_token: crypto.randomUUID(),
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit({
      organizationId: org.id,
      userId: user.id,
      action: 'report.generate',
      resourceType: 'report',
      resourceId: report.id,
      metadata: { format: data.format, type: data.type },
    });

    return ok(report);
  } catch (err) {
    return handleError(err);
  }
}