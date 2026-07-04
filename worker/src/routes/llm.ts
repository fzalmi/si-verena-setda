import { Hono } from 'hono';
import { getLLMProvider } from '../llm/provider';
import type { Bindings } from '../index';

export const llmRoutes = new Hono<{ Bindings: Bindings }>();

// POST /api/llm/generate — generate text dengan LLM
llmRoutes.post('/generate', async (c) => {
  const { prompt, model, responseJsonSchema } = await c.req.json();

  if (!prompt) {
    return c.json({ error: 'Prompt diperlukan' }, 400);
  }

  const provider = getLLMProvider({ AI: c.env.AI });

  try {
    const result = await provider.generate(prompt, {
      model,
      responseJsonSchema,
    });

    return c.json({ result });
  } catch (error: any) {
    return c.json({ 
      error: 'Gagal generate text',
      detail: error.message 
    }, 500);
  }
});

// POST /api/llm/verify — auto verifikasi dokumen
llmRoutes.post('/verify', async (c) => {
  const { dokumen_id, kategori } = await c.req.json();

  if (!dokumen_id) {
    return c.json({ error: 'dokumen_id diperlukan' }, 400);
  }

  // Get document
  const dokumen = await c.env.DB.prepare(
    'SELECT * FROM dokumen_renja WHERE id = ?'
  ).bind(dokumen_id).first();

  if (!dokumen) {
    return c.json({ error: 'Dokumen tidak ditemukan' }, 404);
  }

  // TODO: Implement actual document verification logic
  // This is a placeholder that returns mock data
  
  return c.json({
    message: 'Auto verifikasi belum diimplementasikan',
    dokumen: dokumen,
    kategori: kategori || 'all'
  });
});

// GET /api/llm/models — list available models
llmRoutes.get('/models', async (c) => {
  return c.json({
    models: [
      {
        id: '@cf/qwen/qwen3-30b-a3b-fp8',
        name: 'Qwen3 30B',
        description: 'Best value - good quality, low cost',
        neurons_per_m_input: 4625,
        neurons_per_m_output: 30475
      },
      {
        id: '@cf/meta/llama-3.2-3b-instruct',
        name: 'Llama 3.2 3B',
        description: 'General purpose, fast',
        neurons_per_m_input: 4625,
        neurons_per_m_output: 30475
      },
      {
        id: '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
        name: 'Llama 3.1 8B',
        description: 'Higher accuracy',
        neurons_per_m_input: 4119,
        neurons_per_m_output: 34868
      },
      {
        id: '@cf/meta/llama-3.2-1b-instruct',
        name: 'Llama 3.2 1B',
        description: 'Fastest, cheapest',
        neurons_per_m_input: 2457,
        neurons_per_m_output: 18252
      }
    ],
    default: '@cf/qwen/qwen3-30b-a3b-fp8',
    free_tier: {
      neurons_per_day: 10000,
      estimated_calls_per_day: 322,
      estimated_documents_per_day: 80
    }
  });
});
