'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, Loader2, MessageSquare, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/shell/page-header';
import { AIBadge } from '@/components/shell/widgets';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { cn, formatDateTime, initials } from '@/lib/utils';
import { toast } from 'sonner';

const SUGGESTIONS = [
  'Onde estou perdendo mais clientes?',
  'Qual canal tem o melhor ROI?',
  'Como posso aumentar minha conversão?',
  'Quais gargalos devo corrigir primeiro?',
  'Analise o desempenho do meu pipeline',
  'Gere 3 ações para reduzir meu CAC',
];

export function AIClient() {
  const supabase = createBrowserSupabase();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['ai-messages', activeId],
    queryFn: async () => {
      if (!activeId) return [];
      const { data } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('created_at');
      return data ?? [];
    },
    enabled: !!activeId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  async function newConversation() {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ title: 'Nova conversa' })
      .select()
      .single();
    if (error) return toast.error('Erro ao criar conversa');
    setActiveId(data.id);
    queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
  }

  async function send(text: string) {
    if (!text.trim()) return;
    let convId = activeId;
    if (!convId) {
      const { data } = await supabase
        .from('ai_conversations')
        .insert({ title: text.slice(0, 60) })
        .select()
        .single();
      if (data) {
        convId = data.id;
        setActiveId(convId);
      }
    } else if (conversations.find((c: any) => c.id === convId)?.title === 'Nova conversa') {
      await supabase.from('ai_conversations').update({ title: text.slice(0, 60) }).eq('id', convId);
    }

    setInput('');
    setStreaming(true);
    setStreamedText('');

    // Save user message
    await supabase.from('ai_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: text,
    });

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, message: text }),
      });

      if (!res.ok || !res.body) throw new Error('Erro no chat');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                full += parsed.content;
                setStreamedText(full);
              }
            } catch {
              full += data;
              setStreamedText(full);
            }
          }
        }
      }

      // Save assistant message
      await supabase.from('ai_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: full,
      });

      queryClient.invalidateQueries({ queryKey: ['ai-messages', convId] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setStreaming(false);
      setStreamedText('');
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <PageHeader
        title="Growth Analyst AI"
        description="Seu copiloto estratégico. Pergunte. Analise. Decida."
        actions={
          <Button size="sm" onClick={newConversation}>
            <Plus className="h-4 w-4" /> Nova conversa
          </Button>
        }
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 mt-6 min-h-0">
        {/* Sidebar */}
        <Card className="hidden lg:flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Conversas</span>
            <Badge variant="muted">{conversations.length}</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'w-full text-left rounded-md px-2.5 py-2 text-sm transition-colors',
                    activeId === c.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  <p className="font-medium truncate">{c.title ?? 'Sem título'}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(c.updated_at)}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat */}
        <Card className="flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-6">
            {!activeId && messages.length === 0 ? (
              <div className="max-w-2xl mx-auto py-8 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#7B61FF] shadow-[0_0_30px_rgba(26,26,255,0.4)] mb-4">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Olá! Sou o Growth Analyst.</h2>
                <p className="mt-2 text-muted-foreground">
                  Tenho acesso aos seus dados de CRM, pipeline, analytics e integrações. Pergunte o que quiser.
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={streaming}
                      className="rounded-md border border-border bg-card p-3 text-sm hover:border-primary/40 transition-colors text-left"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary inline mr-1.5" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((m: any) => (
                  <Message key={m.id} role={m.role} content={m.content} />
                ))}
                {streaming && (
                  <Message role="assistant" content={streamedText || 'Pensando...'} streaming />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-end gap-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Pergunte algo estratégico..."
                rows={1}
                className="resize-none min-h-[44px] max-h-32"
                disabled={streaming}
              />
              <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              A IA pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Message({ role, content, streaming }: { role: string; content: string; streaming?: boolean }) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-primary to-[#7B61FF]">
            <Bot className="h-4 w-4 text-white" />
          </AvatarFallback>
        )}
      </Avatar>
      <div className={cn('flex-1 rounded-2xl px-4 py-3', isUser ? 'bg-primary/15' : 'bg-muted/40')}>
        {!isUser && <AIBadge>Growth Analyst</AIBadge>}
        <div className={cn('text-sm whitespace-pre-wrap leading-relaxed', streaming && 'after:content-["▋] after:animate-pulse after:text-primary')}>
          {content}
        </div>
      </div>
    </motion.div>
  );
}