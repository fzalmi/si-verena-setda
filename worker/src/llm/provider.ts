export interface LLMProvider {
  generate(prompt: string, options?: {
    model?: string;
    responseJsonSchema?: object;
  }): Promise<string>;
}

// Workers AI — Primary (GRATIS!)
export class WorkersAIProvider implements LLMProvider {
  constructor(private ai: Ai) {}

  async generate(prompt: string, options?: {
    model?: string;
    responseJsonSchema?: object;
  }): Promise<string> {
    const model = options?.model || '@cf/qwen/qwen3-30b-a3b-fp8';
    
    const response = await this.ai.run(model, {
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah asisten AI untuk verifikasi dokumen perencanaan pemerintahan Indonesia. Berikan jawaban yang akurat dan formal dalam format JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: options?.responseJsonSchema 
        ? { type: 'json_object' } 
        : undefined,
    });

    return (response as any).response;
  }
}

// Factory function
export function getLLMProvider(env: { AI: Ai }): LLMProvider {
  return new WorkersAIProvider(env.AI);
}
