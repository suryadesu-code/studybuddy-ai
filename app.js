/* ===================================================
   StudyBuddy AI — Application Logic
   =================================================== */

// ─── Configuration ───────────────────────────────────
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

const SYSTEM_PROMPTS = {
  explain: `Kamu adalah "StudyBuddy", asisten belajar AI yang ramah, sabar, dan sangat membantu. 
Gaya bahasamu santai tapi tetap edukatif, seperti teman belajar yang pintar.

ATURAN:
- Gunakan bahasa Indonesia yang mudah dipahami
- Jelaskan konsep dengan analogi dan contoh nyata dari kehidupan sehari-hari
- Gunakan emoji untuk membuat penjelasan lebih menarik dan engaging
- Jika topiknya kompleks, pecah menjadi poin-poin yang mudah dicerna
- Berikan contoh soal sederhana di akhir penjelasan jika relevan
- Selalu encourage user untuk bertanya lebih lanjut
- Jika user bertanya di luar konteks belajar, tetap jawab dengan ramah tapi arahkan kembali ke topik pembelajaran
- Format jawaban dengan markdown (bold, italic, list, code block jika perlu)`,

  quiz: `Kamu adalah "StudyBuddy" dalam mode Quiz Master. Tugasmu adalah membuat soal-soal latihan yang menantang tapi fair.

ATURAN:
- Gunakan bahasa Indonesia
- Buat soal sesuai topik yang diminta user
- Format soal bisa berupa: pilihan ganda (A/B/C/D), isian singkat, atau essay pendek
- Berikan 3-5 soal per request
- Setelah user menjawab, berikan koreksi dan penjelasan untuk setiap jawaban
- Jika user belum menjawab, JANGAN berikan jawaban langsung — tunggu mereka mencoba dulu
- Berikan skor dan feedback yang memotivasi di akhir
- Gunakan emoji untuk membuat quiz lebih fun (✅ ❌ 🎯 💯 🌟)
- Format dengan markdown agar rapi`,

  summarize: `Kamu adalah "StudyBuddy" dalam mode Summarizer. Tugasmu adalah merangkum materi atau teks yang diberikan user.

ATURAN:
- Gunakan bahasa Indonesia
- Buat rangkuman yang padat, jelas, dan terstruktur
- Gunakan bullet points atau numbered list
- Highlight kata kunci penting dengan **bold**
- Jika user memberikan teks panjang, rangkum menjadi 5-7 poin utama
- Jika user minta rangkum topik tertentu (bukan teks), berikan rangkuman komprehensif tentang topik tersebut
- Tambahkan bagian "💡 Poin Penting" di akhir rangkuman
- Gunakan emoji untuk visual appeal
- Format dengan markdown`
};

// ─── State ───────────────────────────────────────────
let currentMode = 'explain';
let conversationHistory = [];
let isGenerating = false;

// ─── DOM Elements ────────────────────────────────────
const chatArea = document.getElementById('chat-area');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const btnClear = document.getElementById('btn-clear');
const btnSettings = document.getElementById('btn-settings');
const settingsModal = document.getElementById('settings-modal');
const modalClose = document.getElementById('modal-close');
const apiKeyInput = document.getElementById('api-key-input');
const btnSaveKey = document.getElementById('btn-save-key');
const btnRemoveKey = document.getElementById('btn-remove-key');
const apiStatusContainer = document.getElementById('api-status-container');
const welcomeScreen = document.getElementById('welcome-screen');
const toastEl = document.getElementById('toast');
const modeBtns = document.querySelectorAll('.mode-btn');
const welcomeChips = document.querySelectorAll('.welcome-chip');

// ─── API Key Management ─────────────────────────────
function getApiKey() {
  return localStorage.getItem('studybuddy_api_key') || '';
}

function setApiKey(key) {
  localStorage.setItem('studybuddy_api_key', key.trim());
}

function removeApiKey() {
  localStorage.removeItem('studybuddy_api_key');
}

function updateApiStatus() {
  const key = getApiKey();
  if (key) {
    apiStatusContainer.innerHTML = `
      <div class="api-status connected">
        <span class="api-status-dot"></span>
        API Key tersimpan — Siap digunakan
      </div>`;
    apiKeyInput.value = key;
  } else {
    apiStatusContainer.innerHTML = `
      <div class="api-status disconnected">
        <span class="api-status-dot"></span>
        Belum ada API Key
      </div>`;
    apiKeyInput.value = '';
  }
}

// ─── Toast Notifications ────────────────────────────
function showToast(message, type = '') {
  toastEl.textContent = message;
  toastEl.className = 'toast show ' + type;
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

// ─── Markdown Parser (Lightweight) ──────────────────
function parseMarkdown(text) {
  let html = text;

  // Escape HTML first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code (`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Unordered list
  html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[\s\-\|:]+\|)\n((?:\|.+\|\n?)+)/gm, (_, headerRow, separator, bodyRows) => {
    const headers = headerRow.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Line breaks (double newline = paragraph, single = br)
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return html;
}

// ─── Chat UI ─────────────────────────────────────────
function hideWelcome() {
  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden');
  }
}

function addMessage(content, role) {
  hideWelcome();

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'ai' ? '🧠' : '👤';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  if (role === 'ai') {
    contentDiv.innerHTML = parseMarkdown(content);
  } else {
    contentDiv.textContent = content;
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  chatArea.appendChild(messageDiv);

  scrollToBottom();
}

function showTyping() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="message-avatar">🧠</div>
    <div class="typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  chatArea.appendChild(typingDiv);
  scrollToBottom();
}

function removeTyping() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

function clearChat() {
  conversationHistory = [];
  chatArea.innerHTML = '';
  
  // Re-add welcome screen
  const welcome = document.createElement('div');
  welcome.className = 'welcome-screen';
  welcome.id = 'welcome-screen';
  welcome.innerHTML = `
    <div class="welcome-avatar">🧠</div>
    <h1 class="welcome-title">Halo! Aku StudyBuddy 👋</h1>
    <p class="welcome-desc">
      Aku asisten belajar AI-mu. Pilih mode di atas lalu tanyakan apapun — aku siap bantu kamu belajar dengan cara yang seru dan mudah dipahami!
    </p>
    <div class="welcome-chips">
      <button class="welcome-chip" data-prompt="Jelaskan tentang fotosintesis dengan analogi sederhana">📖 Jelaskan fotosintesis</button>
      <button class="welcome-chip" data-prompt="Buatkan 5 soal quiz tentang sejarah kemerdekaan Indonesia">📝 Quiz sejarah Indonesia</button>
      <button class="welcome-chip" data-prompt="Rangkum konsep dasar machine learning dalam 5 poin">📋 Rangkum machine learning</button>
      <button class="welcome-chip" data-prompt="Jelaskan rumus pythagoras dan berikan contoh soal">📖 Rumus Pythagoras</button>
    </div>
  `;
  chatArea.appendChild(welcome);
  
  // Re-bind chip events
  welcome.querySelectorAll('.welcome-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      chatInput.value = prompt;
      sendMessage();
    });
  });

  showToast('💬 Chat dibersihkan', 'success');
}

// ─── Gemini API ──────────────────────────────────────
async function callGeminiAPI(userMessage) {
  const apiKey = getApiKey();
  if (!apiKey) {
    showToast('⚠️ Masukkan API Key terlebih dahulu', 'error');
    settingsModal.classList.add('active');
    return null;
  }

  // Build conversation context
  const systemInstruction = SYSTEM_PROMPTS[currentMode];

  const contents = [];

  // Add conversation history (max 20 messages for context window)
  const recentHistory = conversationHistory.slice(-20);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: contents,
    generationConfig: {
      temperature: currentMode === 'quiz' ? 0.9 : 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    }
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 400) {
        throw new Error('API Key tidak valid. Periksa kembali di pengaturan.');
      } else if (response.status === 429) {
        throw new Error('Rate limit tercapai. Tunggu sebentar lalu coba lagi.');
      } else {
        throw new Error(error?.error?.message || `API Error: ${response.status}`);
      }
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Tidak ada respons dari AI. Coba lagi.');
    }

    return text;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Gagal terhubung ke server. Periksa koneksi internet kamu.');
    }
    throw error;
  }
}

// ─── Send Message ────────────────────────────────────
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message || isGenerating) return;

  // Check API key
  if (!getApiKey()) {
    showToast('⚠️ Masukkan API Key terlebih dahulu', 'error');
    settingsModal.classList.add('active');
    return;
  }

  isGenerating = true;
  btnSend.disabled = true;
  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Add user message
  addMessage(message, 'user');
  conversationHistory.push({ role: 'user', content: message });

  // Show typing
  showTyping();

  try {
    const response = await callGeminiAPI(message);
    removeTyping();

    if (response) {
      addMessage(response, 'ai');
      conversationHistory.push({ role: 'ai', content: response });
    }
  } catch (error) {
    removeTyping();
    showToast(`❌ ${error.message}`, 'error');
    // Add error message in chat
    addMessage(`⚠️ Maaf, terjadi error: ${error.message}`, 'ai');
  } finally {
    isGenerating = false;
    btnSend.disabled = false;
    chatInput.focus();
  }
}

// ─── Mode Switching ──────────────────────────────────
function switchMode(mode) {
  currentMode = mode;
  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const modeLabels = {
    explain: '📖 Mode Explain aktif',
    quiz: '📝 Mode Quiz aktif',
    summarize: '📋 Mode Summarize aktif'
  };

  showToast(modeLabels[mode], 'success');
}

// ─── Auto-resize Textarea ───────────────────────────
function autoResize() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
}

// ─── Event Listeners ────────────────────────────────
// Send button
btnSend.addEventListener('click', sendMessage);

// Enter to send, Shift+Enter for new line
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
chatInput.addEventListener('input', autoResize);

// Mode buttons
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

// Welcome chips
welcomeChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt;
    chatInput.value = prompt;
    sendMessage();
  });
});

// Clear chat
btnClear.addEventListener('click', () => {
  if (conversationHistory.length === 0) {
    showToast('Chat sudah kosong', '');
    return;
  }
  clearChat();
});

// Settings modal
btnSettings.addEventListener('click', () => {
  updateApiStatus();
  settingsModal.classList.add('active');
});

modalClose.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('active');
  }
});

// Save API key
btnSaveKey.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showToast('⚠️ Masukkan API Key terlebih dahulu', 'error');
    return;
  }
  setApiKey(key);
  updateApiStatus();
  showToast('✅ API Key berhasil disimpan!', 'success');
  setTimeout(() => settingsModal.classList.remove('active'), 800);
});

// Remove API key
btnRemoveKey.addEventListener('click', () => {
  removeApiKey();
  apiKeyInput.value = '';
  updateApiStatus();
  showToast('🗑️ API Key dihapus', '');
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsModal.classList.contains('active')) {
    settingsModal.classList.remove('active');
  }
});

// ─── Initialization ─────────────────────────────────
function init() {
  updateApiStatus();

  // Show settings modal if no API key
  if (!getApiKey()) {
    setTimeout(() => {
      settingsModal.classList.add('active');
    }, 800);
  }

  // Focus input
  chatInput.focus();
}

// Run
init();
