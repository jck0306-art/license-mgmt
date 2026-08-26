import { appData, saveState } from './firebase.js';
import { escapeHTML } from './security.js';

export function renderSubjectDetailPage(cert, subId) {
  const sub = cert.subjects.find(s => s.id === subId);
  if (!sub) return;
  if (!sub.notes) sub.notes = [];

  const mainEl = document.getElementById('main-content');
  if (!mainEl) return;

  mainEl.innerHTML = `
    <div class="mb-6 flex justify-between items-center">
      <div>
        <button onclick="window.selectCert('${escapeHTML(cert.id)}')" class="text-xs text-indigo-400 hover:underline flex items-center gap-1 mb-2">
          <i class="fa-solid fa-arrow-left"></i> ${escapeHTML(cert.name)} 종합 대시보드로 돌아가기
        </button>
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-book-open text-amber-400"></i> ${escapeHTML(sub.name)}
          </h2>
          <button onclick="window.editSubjectNamePrompt('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}')" class="text-xs text-slate-400 hover:text-amber-300 border border-slate-700 px-2.5 py-1 rounded bg-slate-800 transition">
            <i class="fa-solid fa-pen"></i> 과목명 수정
          </button>
        </div>
        <p class="text-xs text-slate-400 mt-1">과목별 핵심 키워드, 법조문, 두문자 암기 사항을 정리하고 체크하세요.</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <span class="text-slate-400">과목 회독수:</span>
          <span class="font-bold text-indigo-400 font-mono">${Number(sub.count) || 0}회</span>
          <button onclick="window.updateCount('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}', 1)" class="ml-1 px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold">+</button>
          <button onclick="window.updateCount('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}', -1)" class="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold">-</button>
        </div>
      </div>
    </div>

    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6 shadow-lg">
      <h3 class="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
        <i class="fa-solid fa-plus-circle text-amber-400"></i> 새로운 암기 카드 등록
      </h3>
      <div class="space-y-3">
        <input id="note-title-input" type="text" placeholder="암기 키워드 / 법조문 / 핵심 제목" maxlength="100"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" />
        <textarea id="note-body-input" rows="3" placeholder="상세 암기 내용 (두문자, 요약 정리, 풀이 팁 등)" maxlength="2000"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-400"></textarea>
        <div class="flex justify-end">
          <button onclick="window.addSubjectNoteInline('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-lg transition flex items-center gap-1.5">
            <i class="fa-solid fa-floppy-disk"></i> 암기 카드 등록
          </button>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">암기 카드 리스트 (${sub.notes.length})</h3>
        <span class="text-xs text-slate-500">체크박스를 누르면 암기 완료 상태로 바뀝니다.</span>
      </div>
      ${sub.notes.length === 0 ? `
        <div class="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl bg-slate-800/40">
          등록된 암기 내용이 없습니다. 위 작성란에서 첫 번째 암기 카드를 추가해 보세요!
        </div>
      ` : sub.notes.map(note => `
        <div class="p-4 rounded-xl bg-slate-800 border ${note.done ? 'border-emerald-500/40 bg-slate-800/50' : 'border-slate-700'} transition group shadow-md space-y-2">
          <div class="flex items-start justify-between gap-3">
            <label class="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" ${note.done ? 'checked' : ''} onchange="window.toggleNoteDoneInline('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}', '${escapeHTML(note.id)}')" class="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 focus:ring-0">
              <span class="font-bold text-sm ${note.done ? 'line-through text-slate-500' : 'text-amber-300'}">${escapeHTML(note.title)}</span>
            </label>
            <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100">
              <button onclick="window.editSubjectNoteInline('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}', '${escapeHTML(note.id)}')" class="text-slate-400 hover:text-amber-300 p-1.5 rounded hover:bg-slate-700 text-xs" title="수정">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button onclick="window.deleteSubjectNoteInline('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}', '${escapeHTML(note.id)}')" class="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-700 text-xs" title="삭제">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-300 whitespace-pre-wrap pl-6 leading-relaxed ${note.done ? 'text-slate-500' : ''}">${escapeHTML(note.body || '')}</p>
        </div>
      `).join('')}
    </div>
  `;
}

export function editSubjectNamePrompt(certId, subId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sub = cert?.subjects.find(s => s.id === subId);
  if (!sub) return;
  const newName = prompt('변경할 과목명을 입력하세요:', sub.name);
  if (newName !== null && newName.trim() !== '') {
    sub.name = newName.trim().slice(0, 50);
    saveState();
    if (onRender) onRender();
  }
}

export function addSubjectNoteInline(certId, subId, onRender) {
  const titleInput = document.getElementById('note-title-input');
  const bodyInput = document.getElementById('note-body-input');
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) return alert('암기 키워드/제목을 입력하세요.');

  const cert = appData.certs.find(c => c.id === certId);
  const sub = cert?.subjects.find(s => s.id === subId);
  if (!sub) return;
  if (!sub.notes) sub.notes = [];

  sub.notes.unshift({ id: 'n_' + Date.now(), title: title.slice(0, 100), body: body.slice(0, 2000), done: false });
  titleInput.value = '';
  bodyInput.value = '';
  saveState();
  if (onRender) onRender();
}

export function toggleNoteDoneInline(certId, subId, noteId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sub = cert?.subjects.find(s => s.id === subId);
  const note = sub?.notes.find(n => n.id === noteId);
  if (note) {
    note.done = !note.done;
    saveState();
    if (onRender) onRender();
  }
}

export function editSubjectNoteInline(certId, subId, noteId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sub = cert?.subjects.find(s => s.id === subId);
  const note = sub?.notes.find(n => n.id === noteId);
  if (!note) return;

  const newTitle = prompt('암기 키워드/제목 수정:', note.title);
  if (newTitle === null) return;
  const newBody = prompt('암기 상세 내용 수정:', note.body || '');
  if (newBody === null) return;

  note.title = newTitle.trim().slice(0, 100) || note.title;
  note.body = newBody.trim().slice(0, 2000);
  saveState();
  if (onRender) onRender();
}

export function deleteSubjectNoteInline(certId, subId, noteId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sub = cert?.subjects.find(s => s.id === subId);
  if (sub) {
    sub.notes = sub.notes.filter(n => n.id !== noteId);
    saveState();
    if (onRender) onRender();
  }
}
