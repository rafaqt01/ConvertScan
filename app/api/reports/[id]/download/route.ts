import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { handleError, ApiError } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError('UNAUTHORIZED', 'Faça login', 401);
    }

    const supabase = createServerSupabase();

    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (!report) {
      throw new ApiError('NOT_FOUND', 'Relatório não encontrado', 404);
    }

    if (!report.file_path) {
      throw new ApiError('NOT_FOUND', 'Arquivo não disponível', 404);
    }

    const { data: file, error } = await supabase.storage
      .from('reports')
      .download(report.file_path);

    if (error || !file) {
      throw new ApiError('NOT_FOUND', 'Arquivo não encontrado', 404);
    }

    const contentType =
      report.format === 'pdf'
        ? 'application/pdf'
        : report.format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const arrayBuffer = await file.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${report.name}.${report.format}"`,
        'Content-Length': String(arrayBuffer.byteLength)
      }
    });
  } catch (err) {
    return handleError(err);
  }
}
