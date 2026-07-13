// Utilitários de armazenamento local (localStorage)
// Usado para tema, histórico do chat e preferências do usuário.
// Exposto como global: window.Storage

window.Storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(`ifro_${key}`);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      console.warn('Erro ao ler do storage:', e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`ifro_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Erro ao salvar no storage:', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`ifro_${key}`);
      return true;
    } catch (e) {
      return false;
    }
  },

  getChatHistory() {
    return this.get('chat_history', []);
  },

  setChatHistory(history) {
    const trimmed = history.slice(-50);
    return this.set('chat_history', trimmed);
  },

  clearChatHistory() {
    return this.remove('chat_history');
  },
};
