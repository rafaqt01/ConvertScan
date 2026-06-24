import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, getCurrentOrganization } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { handleError, ok, ApiError } from '@/lib/api';
import { defaultRateLimit } from '@/lib/rate-limit';
import { streamComplete, DEFAULT_MODEL, FAST_MODEL } from '@/lib/openai';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(8000),
});

const SYSTEM_PROMPT = `Você é o Growth Analyst, um assistente de IA especializado em growth, marketing, vendas, analytics e CRM. Você tem acesso aos dados da empresa do usuário. Seja direto, técnico, use dados quando possível, e sempre termine com uma recomendação acionável. Use formatação markdown quando apropriado.`;

async function buildContext(organizationId: string) {
  const supabase = createServerSupabase();
  const [metrics, deals, alerts, insights] = await Promise.all([
    supabase
      .from('metrics_daily')
      .select('date, sessions, leads_count, opportunities_count, deals_won_count, revenue, spend')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('deals')
      .select('title, value, status, stage:stage_id(name), created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('alerts')
      .select('title, description, severity, current_value, previous_value, change_percent')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('ai_insights')
      .select('title, body, type')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const ctx = {
    metrics: metrics.data ?? [],
    deals: deals.data ?? [],
    alerts: alerts.data ?? [],
    insights: insights.data ?? [],
  };
  return JSON.stringify(ctx).slice(0, 12000);
}

export async function POST(req: Request) {
  try {
    const rl = await defaultRateLimit(req as any);
    if (rl) return rl;

    const user = await getCurrentUser();
    if (!user) throw new ApiError('UNAUTHORIZED', 'Faça login', 401);
    const org = await getCurrentOrganization();
    if (!org) throw new ApiError('FORBIDDEN', 'Sem organização', 403);

    const body = await req.json();
    const { conversationId, message } = schema.parse(body);

    const supabase = createServerSupabase();
    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();
    if (!conv) throw new ApiError('NOT_FOUND', 'Conversa não encontrada', 404);

    const { data: history = [] } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at')
      .limit(20);

    const contextData = await buildContext(org.id);
    const userPrompt = `CONTEXTO ATUAL DA EMPRESA (use para fundamentar respostas):
${contextData}

PERGUNTA DO USUÁRIO:
${message}`;

    await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

    await logAudit({
      organizationId: org.id,
      userId: user.id,
      action: 'ai.chat',
      resourceType: 'ai_conversation',
      resourceId: conversationId,
      metadata: { length: message.length },
    });

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const full = await streamComplete(userPrompt, {
            systemPrompt: SYSTEM_PROMPT,
            model: DEFAULT_MODEL,
            maxTokens: 2000,
            onChunk: (chunk) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            },
          });
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

          // Persist assistant message
          await supabase.from('ai_messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: full,
            metadata: { model: DEFAULT_MODEL },
          });
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return handleError(err);
  }
}