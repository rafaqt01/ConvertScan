import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentUser, getCurrentOrganization } from '@/lib/auth';
import { complete } from '@/lib/openai';
import { diagnosticSchema } from '@/lib/validations';
import { handleError, ok, ApiError } from '@/lib/api';
import { defaultRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Você é um consultor sênior de growth, marketing e vendas. Sua missão é analisar a operação de uma empresa e produzir um diagnóstico 360° em JSON com a estrutura exata solicitada. Seja objetivo, técnico e orientado a ação.

Responda SOMENTE com JSON válido, sem markdown.`;

const outputSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  acquisition_score: z.number().int().min(0).max(100),
  conversion_score: z.number().int().min(0).max(100),
  retention_score: z.number().int().min(0).max(100),
  revenue_score: z.number().int().min(0).max(100),
  automation_score: z.number().int().min(0).max(100),
  bottlenecks: z.array(z.object({
    area: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
  })),
  opportunities: z.array(z.object({
    area: z.string(),
    potential: z.string(),
    description: z.string(),
  })),
  priorities: z.array(z.object({
    order: z.number().int(),
    title: z.string(),
    rationale: z.string(),
  })),
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
    const data = diagnosticSchema.parse(body);

    const prompt = `Analise a seguinte operação e gere o diagnóstico 360°:

Empresa: ${org.name}
Setor: ${data.niche}
Website: ${data.website || 'não informado'}
Instagram: ${data.instagram || 'não informado'}
Objetivo principal: ${data.objective}

Gere scores (0-100) para: overall, acquisition, conversion, retention, revenue, automation.
Liste 3-5 gargalos (com severidade), 3-5 oportunidades e 3-5 prioridades de ação ordenadas.

Schema JSON esperado:
{
  "overall_score": number,
  "acquisition_score": number,
  "conversion_score": number,
  "retention_score": number,
  "revenue_score": number,
  "automation_score": number,
  "bottlenecks": [{"area": string, "severity": "low|medium|high", "description": string}],
  "opportunities": [{"area": string, "potential": string, "description": string}],
  "priorities": [{"order": number, "title": string, "rationale": string}]
}`;

    const result = await complete<any>(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      jsonMode: true,
      maxTokens: 2500,
      temperature: 0.4,
    });

    const parsed = outputSchema.parse(result);

    const supabase = createServerSupabase();
    const { data: inserted, error } = await supabase
      .from('diagnostics')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        website: data.website || null,
        instagram: data.instagram || null,
        niche: data.niche,
        objective: data.objective,
        overall_score: parsed.overall_score,
        acquisition_score: parsed.acquisition_score,
        conversion_score: parsed.conversion_score,
        retention_score: parsed.retention_score,
        revenue_score: parsed.revenue_score,
        automation_score: parsed.automation_score,
        bottlenecks: parsed.bottlenecks,
        opportunities: parsed.opportunities,
        priorities: parsed.priorities,
        raw_data: { prompt },
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit({
      organizationId: org.id,
      userId: user.id,
      action: 'diagnostic.run',
      resourceType: 'diagnostic',
      resourceId: inserted.id,
    });

    return ok(inserted);
  } catch (err) {
    return handleError(err);
  }
}