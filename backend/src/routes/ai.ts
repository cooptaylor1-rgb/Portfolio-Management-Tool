import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { config } from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  portfolioContext: z.string().min(1).max(50_000),
});

/**
 * AI Routes
 * Proxies requests to OpenAI (or other providers) so secrets remain server-side.
 */
export async function aiRoutes(app: FastifyInstance) {
  app.post(
    '/search',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!config.apiKeys.openai) {
        throw new ApiError(503, 'AI_NOT_CONFIGURED', 'AI is not configured on the server');
      }

      const { query, portfolioContext } = searchSchema.parse(request.body);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKeys.openai}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                "You are a helpful financial assistant analyzing a user's investment portfolio. Provide clear, concise answers about their investments, performance, and recommendations. Always cite specific investments by name when relevant. Keep responses under 150 words and actionable.",
            },
            {
              role: 'user',
              content: `Portfolio Context:\n${portfolioContext}\n\nUser Question: ${query}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new ApiError(
          502,
          'AI_PROVIDER_ERROR',
          `AI provider error (${response.status}): ${body || response.statusText}`
        );
      }

      const data: any = await response.json();
      const answer = data?.choices?.[0]?.message?.content;

      if (!answer || typeof answer !== 'string') {
        throw new ApiError(502, 'AI_INVALID_RESPONSE', 'AI provider returned an invalid response');
      }

      return reply.send({
        success: true,
        data: { answer },
      });
    }
  );
}
