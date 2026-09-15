import { appData, saveState } from './firebase.js';

let activeSearch = '';
let chatHistory = [];

export function updateNotesCountBadge() {
  const badge = document.getElementById('notes-count-badge');
  if (badge && appData.studyNotes) {
    badge.innerText = appData.studyNotes.length;
  }
}

// 📝 필기 노트 화면 렌더링
export function renderNotesView() {
  const mainContent = document.getElementById('main-content');
  const notesView = document.getElementById('notes-view-content');
  const container = document.getElementById('notes-grid-container');
  const headerTitle = document.getElementById('header-view-title');

  if (mainContent) mainContent.classList.add('hidden');
  if (notesView) notesView.classList.remove('hidden');
  if (headerTitle) {
    headerTitle.innerHTML = `<i class="fa-solid fa-book-bookmark text-cyan-400 text-xs"></i> 필기 요약 노트 보관함`;
  }

  updateNotesCountBadge();
  populateSubjectDatalist();

  const notes = appData.studyNotes || [];
  const q = activeSearch.toLowerCase().trim();

  const filtered = notes.filter(n => {
    if (!q) return true;
    return (n.title && n.title.toLowerCase().includes(q)) ||
           (n.subject && n.subject.toLowerCase().includes(q)) ||
           (n.content && n.content.toLowerCase().includes(q)) ||
           (n.tags && n.tags.some(t => t.toLowerCase().includes(q)));
  });

  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-slate-800/40 rounded-3xl border border-dashed border-slate-700 text-slate-500">
        <i class="fa-solid fa-book-open text-3xl mb-2 block text-cyan-500/40"></i>
        ${q ? '검색된 노트가 없습니다.' : '등록된 필기 노트가 없습니다. 새 노트를 작성해 보세요!'}
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(note => `
    <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl hover:border-cyan-500/50 transition flex flex-col justify-between space-y-3 group">
      <div class="space-y-2.5">
        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 block w-fit mb-1">
              ${escapeHTML(note.subject || '공통')}
            </span>
            <h3 class="text-sm font-bold text-white group-hover:text-cyan-300 transition">${escapeHTML(note.title)}</h3>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button onclick="window.openNoteModal('${escapeHTML(note.id)}')" class="p-1.5 text-slate-400 hover:text-cyan-400 text-xs transition" title="수정">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button onclick="window.deleteNoteItem('${escapeHTML(note.id)}')" class="p-1.5 text-slate-400 hover:text-rose-400 text-xs transition" title="삭제">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <p class="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-mono">
          ${escapeHTML(note.content)}
        </p>

        ${note.tags && note.tags.length > 0 ? `
          <div class="flex flex-wrap gap-1 pt-1">
            ${note.tags.map(t => `<span class="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700/80">#${escapeHTML(t)}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-700/80 text-[10px] text-slate-500">
        <span><i class="fa-regular fa-clock mr-1"></i>${note.updatedAt || '기록됨'}</span>
        <button onclick="window.askAiAboutNote('${escapeHTML(note.id)}')" class="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1">
          <i class="fa-solid fa-wand-magic-sparkles text-[9px]"></i> 이 개념 질문하기
        </button>
      </div>
    </div>
  `).join('');
}

export function filterNotes() {
  const input = document.getElementById('note-search-input');
  activeSearch = input ? input.value : '';
  renderNotesView();
}

function populateSubjectDatalist() {
  const datalist = document.getElementById('cert-subject-datalist');
  if (!datalist || !appData.certs) return;
  const list = [];
  appData.certs.forEach(c => {
    list.push(c.name);
    (c.subjects || []).forEach(s => list.push(`${c.name} - ${s.name}`));
  });
  datalist.innerHTML = Array.from(new Set(list)).map(v => `<option value="${escapeHTML(v)}"></option>`).join('');
}

// 📝 노트 모달 제어
export function openNoteModal(id = null) {
  const modal = document.getElementById('note-modal');
  const title = document.getElementById('note-modal-title');
  const formId = document.getElementById('form-note-id');

  populateSubjectDatalist();

  if (id) {
    const note = (appData.studyNotes || []).find(n => n.id === id);
    if (!note) return;
    title.innerHTML = `<i class="fa-solid fa-pen text-cyan-400"></i> 필기 노트 수정`;
    formId.value = note.id;
    document.getElementById('form-note-subject').value = note.subject || '';
    document.getElementById('form-note-title').value = note.title || '';
    document.getElementById('form-note-tags').value = Array.isArray(note.tags) ? note.tags.join(', ') : '';
    document.getElementById('form-note-content').value = note.content || '';
  } else {
    title.innerHTML = `<i class="fa-solid fa-book-bookmark text-cyan-400"></i> 새 필기 노트 작성`;
    formId.value = '';
    document.getElementById('form-note-subject').value = '';
    document.getElementById('form-note-title').value = '';
    document.getElementById('form-note-tags').value = '';
    document.getElementById('form-note-content').value = '';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

export function closeNoteModal() {
  const modal = document.getElementById('note-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

export function saveNoteItem(onRender) {
  const editId = document.getElementById('form-note-id').value;
  const subject = document.getElementById('form-note-subject').value.trim();
  const title = document.getElementById('form-note-title').value.trim();
  const tagsRaw = document.getElementById('form-note-tags').value.trim();
  const content = document.getElementById('form-note-content').value.trim();

  if (!subject || !title || !content) {
    return alert('과목, 제목, 본문 내용을 모두 입력해 주세요.');
  }

  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const todayStr = new Date().toISOString().slice(0, 10);

  if (!appData.studyNotes) appData.studyNotes = [];

  if (editId) {
    const idx = appData.studyNotes.findIndex(n => n.id === editId);
    if (idx !== -1) {
      appData.studyNotes[idx] = { ...appData.studyNotes[idx], subject, title, tags, content, updatedAt: todayStr };
    }
  } else {
    appData.studyNotes.unshift({
      id: 'note_' + Date.now(),
      subject, title, tags, content, updatedAt: todayStr
    });
  }

  closeNoteModal();
  saveState().then(() => {
    if (onRender) onRender();
  });
}

export function deleteNoteItem(id, onRender) {
  if (!confirm('이 필기 노트를 삭제하시겠습니까?')) return;
  appData.studyNotes = (appData.studyNotes || []).filter(n => n.id !== id);
  saveState().then(() => {
    if (onRender) onRender();
  });
}

// ================= 🤖 RAG 기반 Gemini AI 튜터 챗봇 ================= //

export function toggleAiTutorDrawer(forceOpen = null) {
  const drawer = document.getElementById('ai-tutor-drawer');
  if (!drawer) return;
  const isClosed = drawer.classList.contains('translate-x-full');
  const shouldOpen = (forceOpen !== null) ? forceOpen : isClosed;

  if (shouldOpen) {
    drawer.classList.remove('translate-x-full');
    checkApiKeyStatus();
    document.getElementById('chat-input')?.focus();
  } else {
    drawer.classList.add('translate-x-full');
  }
}

export function checkApiKeyStatus() {
  const key = localStorage.getItem('gemini_api_key') || '';
  const indicator = document.getElementById('api-key-indicator');
  if (indicator) {
    if (key) {
      indicator.innerHTML = '<span class="text-emerald-400 font-bold">● API 키 설정됨</span>';
    } else {
      indicator.innerHTML = '<span class="text-rose-400 font-bold cursor-pointer" onclick="window.openGeminiKeyModal()">⚠️ API 키 등록 필요</span>';
    }
  }
}

export function openGeminiKeyModal() {
  const modal = document.getElementById('gemini-key-modal');
  const input = document.getElementById('input-gemini-key');
  input.value = localStorage.getItem('gemini_api_key') || '';
  modal.classList.replace('hidden', 'flex');
}

export function closeGeminiKeyModal() {
  document.getElementById('gemini-key-modal').classList.replace('flex', 'hidden');
}

export function saveGeminiKey() {
  const key = document.getElementById('input-gemini-key').value.trim();
  if (!key) {
    localStorage.removeItem('gemini_api_key');
    alert('API 키가 삭제되었습니다.');
  } else {
    localStorage.setItem('gemini_api_key', key);
    alert('Gemini API 키가 안전하게 저장되었습니다.');
  }
  closeGeminiKeyModal();
  checkApiKeyStatus();
}

export function clearChatHistory() {
  chatHistory = [];
  const container = document.getElementById('chat-messages-container');
  if (container) {
    container.innerHTML = `
      <div class="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-2xl text-slate-300 space-y-1.5">
        <p class="font-bold text-indigo-300 flex items-center gap-1.5">
          <i class="fa-solid fa-wand-magic-sparkles text-xs"></i> 대화 기록이 초기화되었습니다.
        </p>
        <p class="text-slate-400 text-[11px]">새로운 자격증 질문을 입력해 주세요.</p>
      </div>
    `;
  }
}

// 🌟 RAG 검색 엔진: 질문과 가장 연관도 높은 내 노트 Top 3 추출
function retrieveRelevantNotes(query) {
  const notes = appData.studyNotes || [];
  if (notes.length === 0) return [];

  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  const scored = notes.map(note => {
    let score = 0;
    const title = (note.title || '').toLowerCase();
    const content = (note.content || '').toLowerCase();
    const subject = (note.subject || '').toLowerCase();
    const tags = (note.tags || []).join(' ').toLowerCase();

    tokens.forEach(token => {
      if (title.includes(token)) score += 10;
      if (tags.includes(token)) score += 6;
      if (content.includes(token)) score += 3;
      if (subject.includes(token)) score += 2;
    });

    return { note, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.note);
}

// 💬 메시지 전송 및 Gemini 호출
export async function handleSendChatMessage() {
  const inputEl = document.getElementById('chat-input');
  const message = inputEl.value.trim();
  if (!message) return;

  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    alert('AI 튜터를 사용하려면 먼저 Gemini API 키를 등록해야 합니다.');
    openGeminiKeyModal();
    return;
  }

  const container = document.getElementById('chat-messages-container');
  const useNotes = document.getElementById('chk-use-notes').checked;

  // 1. 사용자 메시지 말풍선 추가
  appendMessageUI('user', message);
  inputEl.value = '';

  // 2. RAG 지식 검색 수행
  let matchedNotes = [];
  if (useNotes) {
    matchedNotes = retrieveRelevantNotes(message);
  }

  // 3. 로딩 상태 표시
  const loadingId = 'loading-' + Date.now();
  const loadingEl = document.createElement('div');
  loadingEl.id = loadingId;
  loadingEl.className = 'flex items-center gap-2 text-slate-400 text-xs p-3 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse';
  loadingEl.innerHTML = `
    <i class="fa-solid fa-circle-notch animate-spin text-purple-400"></i>
    <span>${matchedNotes.length > 0 ? `내 필기 노트(${matchedNotes.length}건)를 분석하며 답변 작성 중...` : 'AI 튜터가 답변을 생성 중입니다...'}</span>
  `;
  container.appendChild(loadingEl);
  container.scrollTop = container.scrollHeight;

  // 4. Gemini 프롬프트 구성
  let systemPrompt = `당신은 대한민국 국가기술자격 및 전문자격증 수험생을 지도하는 친절하고 예리한 1:1 전문 AI 튜터입니다.\n간결하고 핵심을 찌르는 어조로 설명하세요.`;
  
  let userPrompt = message;
  if (useNotes && matchedNotes.length > 0) {
    const contextText = matchedNotes.map((n, i) => `[참고노트 ${i+1}: ${n.subject} - ${n.title}]\n${n.content}`).join('\n\n');
    userPrompt = `[수험생이 직접 정리한 필기 노트 자료]:\n${contextText}\n\n위 노트의 내용을 최우선 근거로 활용하여 아래 수험생의 질문에 정확히 답변해 주세요.\n질문: ${message}`;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000
        }
      })
    });

    const data = await response.json();
    document.getElementById(loadingId)?.remove();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const answerText = data.candidates[0].content.parts[0].text;
      appendMessageUI('ai', answerText, matchedNotes);
    } else if (data.error) {
      appendMessageUI('error', `API 오류 (${data.error.code}): ${data.error.message}`);
    } else {
      appendMessageUI('error', '답변을 생성하지 못했습니다. 다시 시도해 주세요.');
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    document.getElementById(loadingId)?.remove();
    appendMessageUI('error', `네트워크 연결 오류: ${err.message}`);
  }
}

function appendMessageUI(role, text, sources = []) {
  const container = document.getElementById('chat-messages-container');
  const msgDiv = document.createElement('div');

  if (role === 'user') {
    msgDiv.className = 'flex justify-end';
    msgDiv.innerHTML = `
      <div class="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-md whitespace-pre-wrap leading-relaxed">
        ${escapeHTML(text)}
      </div>
    `;
  } else if (role === 'ai') {
    msgDiv.className = 'flex justify-start';
    msgDiv.innerHTML = `
      <div class="bg-slate-900 border border-slate-700/80 text-slate-200 p-3.5 rounded-2xl rounded-tl-none max-w-[92%] shadow-lg space-y-2.5">
        <div class="flex items-center gap-1.5 text-[11px] font-bold text-purple-400">
          <i class="fa-solid fa-robot"></i> PassTrack AI 튜터
        </div>
        <div class="whitespace-pre-wrap leading-relaxed font-sans text-xs">
          ${escapeHTML(text)}
        </div>
        ${sources.length > 0 ? `
          <div class="pt-2 border-t border-slate-800 space-y-1">
            <span class="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
              <i class="fa-solid fa-link text-[9px] text-cyan-400"></i> 답변에 참조한 내 필기 노트:
            </span>
            <div class="flex flex-wrap gap-1.5">
              ${sources.map(s => `
                <span class="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded-lg border border-slate-700 font-medium cursor-pointer" onclick="window.openNoteModal('${escapeHTML(s.id)}')">
                  📝 ${escapeHTML(s.title)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    msgDiv.className = 'flex justify-start';
    msgDiv.innerHTML = `
      <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs max-w-[90%]">
        <i class="fa-solid fa-triangle-exclamation mr-1"></i> ${escapeHTML(text)}
      </div>
    `;
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

export function askAiAboutNote(noteId) {
  const note = (appData.studyNotes || []).find(n => n.id === noteId);
  if (!note) return;
  toggleAiTutorDrawer(true);
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = `'${note.title}' 개념의 핵심 요약과 예상 출제 포인트를 알려줘.`;
    input.focus();
  }
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
