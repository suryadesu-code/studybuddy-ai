# 🧠 StudyBuddy AI — Asisten Belajar Cerdas

**StudyBuddy AI** adalah chatbot berbasis AI yang dirancang sebagai teman belajar interaktif. Dibangun menggunakan **Google Gemini API** untuk memproses bahasa alami dan memberikan respons edukatif yang relevan, engaging, dan mudah dipahami.

---

## ✨ Fitur Utama

### 🎯 3 Mode Belajar
| Mode | Fungsi |
|------|--------|
| 📖 **Explain** | Menjelaskan konsep dengan analogi & contoh nyata |
| 📝 **Quiz** | Membuat soal latihan & memberikan koreksi |
| 📋 **Summarize** | Merangkum materi menjadi poin-poin penting |

### 🧩 Parameter Kreatif
- **Gaya Bahasa**: Santai tapi edukatif — seperti teman belajar yang pintar
- **Domain**: Multi-disiplin (Sains, Matematika, Bahasa, Sejarah, dll.)
- **Personality**: Supportive, sabar, dan encouraging
- **Memory**: Menyimpan konteks percakapan dalam sesi (conversation history)
- **Emoji & Visual**: Respons dilengkapi emoji untuk engagement
- **Markdown Rendering**: Support bold, italic, code blocks, tables, lists

### 🎨 Desain UI
- 🌙 Dark mode dengan ambient glow
- 🔮 Glassmorphism effects
- ✨ Micro-animations (typing indicator, message transitions, floating avatar)
- 📱 Responsive design (mobile-friendly)

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, Vanilla CSS, JavaScript (ES6+) |
| AI Engine | Google Gemini API (`gemini-2.0-flash`) |
| Fonts | Google Fonts (Inter) |
| Storage | LocalStorage (API key) |
| Deployment | Static files (GitHub Pages compatible) |

---

## 🚀 Cara Penggunaan

### 1. Dapatkan API Key (Gratis)
1. Kunjungi [Google AI Studio](https://aistudio.google.com/apikey)
2. Login dengan akun Google
3. Klik **"Create API Key"**
4. Copy API Key yang dihasilkan

### 2. Jalankan Aplikasi
1. Clone repository ini
   ```bash
   git clone https://github.com/username/studybuddy-ai.git
   cd studybuddy-ai
   ```
2. Buka `index.html` di browser, atau jalankan dengan live server:
   ```bash
   npx serve .
   ```
3. Masukkan API Key di modal pengaturan yang muncul
4. Pilih mode belajar dan mulai bertanya!

### 3. Tips Penggunaan
- **Mode Explain**: Tanyakan konsep apapun, contoh: *"Jelaskan tentang fotosintesis"*
- **Mode Quiz**: Minta soal latihan, contoh: *"Buatkan 5 soal quiz tentang PPKN"*
- **Mode Summarize**: Berikan teks untuk dirangkum, atau minta rangkuman topik tertentu

---

## 📁 Struktur Project

```
studybuddy-ai/
├── index.html      # Struktur HTML utama
├── style.css       # Design system & styling
├── app.js          # Logika aplikasi & integrasi AI
└── README.md       # Dokumentasi
```

---

## 📸 Screenshots

> *Screenshots dapat ditambahkan di sini setelah deploy*

---

## 📄 Lisensi

MIT License — Bebas digunakan untuk keperluan edukasi.
