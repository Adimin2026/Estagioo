// Helper de API para o Chat IA. Suporta OpenAI, Gemini ou fallback.
// Global: window.Api (usa window.Storage)

window.Api = {
  async sendMessage(messages, options = {}) {
    const provider = options.provider || 'openai';
    const apiKey = window.Storage?.get('ai_api_key', '') || '';

    if (apiKey && provider === 'openai') {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: options.model || 'gpt-3.5-turbo', messages, temperature: 0.7 }),
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || this.fallback(messages);
      } catch (e) {
        return this.fallback(messages);
      }
    }

    if (apiKey && provider === 'gemini') {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages
                .filter((m) => m.role !== 'system')
                .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
            }),
          }
        );
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || this.fallback(messages);
      } catch (e) {
        return this.fallback(messages);
      }
    }

    return this.fallback(messages);
  },

  fallback(messages) {
    const last = messages[messages.length - 1]?.content || '';
    return (
      `Olá! Sou o assistente de estágio do IFRO Ariquemes. Recebi: "${last.slice(0, 80)}...".\n\n` +
      `Para respostas reais, configure uma chave de API (OpenAI ou Gemini) em Storage. ` +
      `Enquanto isso uso respostas de demonstração. Posso ajudar com estágio, programação, ` +
      `manutenção de computadores, banco de dados e impressoras.`
    );
  },
};
