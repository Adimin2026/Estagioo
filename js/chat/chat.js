// Lógica do Chat IA do estagiário. Global: window.Chat
// Usa window.Api e window.Storage.

window.Chat = {
  messagesEl: null,
  inputEl: null,
  sendBtn: null,
  history: [],

  init() {
    this.messagesEl = document.getElementById('chatMessages');
    this.inputEl = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSend');
    if (!this.messagesEl) return;

    this.history = (window.Storage?.getChatHistory?.() || []);

    document.querySelectorAll('.chat-prompt-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.send(btn.getAttribute('data-prompt')));
    });

    if (this.sendBtn) this.sendBtn.addEventListener('click', () => this.send());
    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
      });
      this.inputEl.addEventListener('input', () => this.autoResize());
    }

    const newBtn = document.querySelector('.chat-new');
    if (newBtn) newBtn.addEventListener('click', () => this.reset());

    const fab = document.getElementById('chatFab');
    if (fab) fab.addEventListener('click', () => this.scrollToInput());

    if (this.history.length) {
      this.messagesEl.innerHTML = '';
      this.history.forEach((m) => this.appendMessage(m.role, m.content, false));
    }
  },

  autoResize() {
    this.inputEl.style.height = 'auto';
    this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 140) + 'px';
  },

  scrollToInput() {
    this.inputEl?.focus();
    this.inputEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  appendMessage(role, content, save = true) {
    const empty = this.messagesEl.querySelector('.chat-empty');
    if (empty) empty.remove();

    const div = document.createElement('div');
    div.className = `chat-msg ${role === 'user' ? 'user' : 'bot'}`;
    div.textContent = content;
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    if (save) {
      this.history.push({ role, content });
      window.Storage?.setChatHistory?.(this.history);
    }
  },

  showTyping() {
    if (document.getElementById('typingIndicator')) return;
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'typingIndicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  },

  removeTyping() {
    document.getElementById('typingIndicator')?.remove();
  },

  async send(text) {
    const value = (text ?? this.inputEl?.value ?? '').trim();
    if (!value) return;

    this.appendMessage('user', value);
    if (this.inputEl) { this.inputEl.value = ''; this.autoResize(); }

    this.showTyping();
    const messages = this.history.map((m) => ({ role: m.role, content: m.content }));
    messages.unshift({
      role: 'system',
      content: 'Você é o assistente virtual do programa de estágio do IFRO Campus Ariquemes, para ajudar estagiários iniciantes de informática. Responda em português do Brasil, claro e prático.',
    });

    try {
      const reply = await (window.Api?.sendMessage?.(messages) ?? Promise.resolve('...'));
      this.removeTyping();
      this.appendMessage('bot', reply);
    } catch (e) {
      this.removeTyping();
      this.appendMessage('bot', 'Desculpe, ocorreu um erro ao gerar a resposta. Tente novamente.');
    }
  },

  reset() {
    this.history = [];
    window.Storage?.clearChatHistory?.();
    this.messagesEl.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
        <h3>Como posso ajudar?</h3>
        <p>Faça uma pergunta ou use um dos atalhos ao lado.</p>
      </div>`;
  },
};

document.addEventListener('DOMContentLoaded', () => window.Chat?.init());
