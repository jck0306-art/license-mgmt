import { appData, saveState } from './firebase.js';

export function renderAchievedCertsView() {
  const list = appData.achievedCerts || [];
  const mainEl = document.getElementById('main-content');
  if (!mainEl) return;

  mainEl.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center gap-2.5">
            <i class="fa-solid fa-award text-amber-400"></i> 취득 자격증 보관함
          </h2>
          <p class="text-xs text-slate-400 mt-1">내가 취득한 자격증의 취득일자, 발급기관, 자격증 번호를 관리하세요.</p>
        </div>
        <button onclick="window.openAchievedModal()" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow">
          <i class="fa-solid fa-plus"></i> 취득 자격증 등록
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${list.length === 0 ? `
          <div class="col-span-full py-16 text-center bg-slate-800 rounded-xl border border-dashed border-slate-700 text-slate-400 text-sm">
            <i class="fa-solid fa-certificate text-3xl text-slate-600 mb-2 block"></i>
            등록된 취득 자격증이 없습니다. 새로운 취득 자격증을 추가해 보세요!
          </div>
        ` : list.map(item => `
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg relative group hover:border-slate-600 transition">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <i class="fa-solid fa-award"></i>
                </div>
                <div>
                  <h3 class="font-bold text-white text-base">${item.name}</h3>
                  <span class="text-[11px] text-indigo-400 font-medium">${item.issuer || '주관사 미기재'}</span>
                </div>
              </div>
              <div class="flex gap-1">
                <button onclick="window.openAchievedModal('${item.id}')" class="text-slate-400 hover:text-amber-300 p-1.5 rounded hover:bg-slate-700 text-xs" title="수정">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="window.deleteAchievedCert('${item.id}')" class="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-700 text-xs" title="삭제">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
              <div class="flex justify-between">
                <span class="text-slate-500">취득 일자:</span>
                <span class="font-mono font-semibold text-slate-200">${item.issueDate || '-'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">자격증 번호:</span>
                <span class="font-mono font-semibold text-amber-300">${item.certNo || '-'}</span>
              </div>
              ${item.memo ? `
                <div class="pt-1.5 border-t border-slate-700/60 text-slate-400 text-[11px]">
                  ${item.memo}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function openAchievedModal(id = null) {
  const modal = document.getElementById('achieved-modal');
  const titleEl = document.getElementById('achieved-modal-title');
  const editIdInput = document.getElementById('achieved-edit-id');

  if (id) {
    const item = appData.achievedCerts.find(c => c.id === id);
    if (!item) return;
    titleEl.innerText = '취득 자격증 수정';
    editIdInput.value = item.id;
    document.getElementById('achieved-name').value = item.name || '';
    document.getElementById('achieved-date').value = item.issueDate || '';
    document.getElementById('achieved-issuer').value = item.issuer || '';
    document.getElementById('achieved-no').value = item.certNo || '';
    document.getElementById('achieved-memo').value = item.memo || '';
  } else {
    titleEl.innerText = '취득 자격증 등록';
    editIdInput.value = '';
    document.getElementById('achieved-name').value = '';
    document.getElementById('achieved-date').value = '';
    document.getElementById('achieved-issuer').value = '';
    document.getElementById('achieved-no').value = '';
    document.getElementById('achieved-memo').value = '';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

export function closeAchievedModal() {
  const modal = document.getElementById('achieved-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

export function saveAchievedCert(onRender) {
  const editId = document.getElementById('achieved-edit-id').value;
  const name = document.getElementById('achieved-name').value.trim();
  const issueDate = document.getElementById('achieved-date').value;
  const issuer = document.getElementById('achieved-issuer').value.trim();
  const certNo = document.getElementById('achieved-no').value.trim();
  const memo = document.getElementById('achieved-memo').value.trim();

  if (!name) return alert('자격증 명칭을 입력하세요.');
  if (!appData.achievedCerts) appData.achievedCerts = [];

  if (editId) {
    const item = appData.achievedCerts.find(c => c.id === editId);
    if (item) {
      item.name = name;
      item.issueDate = issueDate;
      item.issuer = issuer;
      item.certNo = certNo;
      item.memo = memo;
    }
  } else {
    appData.achievedCerts.unshift({
      id: 'ach_' + Date.now(),
      name,
      issueDate,
      issuer,
      certNo,
      memo
    });
  }

  closeAchievedModal();
  saveState();
  if (onRender) onRender();
}

export function deleteAchievedCert(id, onRender) {
  if (!confirm('이 취득 자격증을 삭제하시겠습니까?')) return;
  appData.achievedCerts = appData.achievedCerts.filter(c => c.id !== id);
  saveState();
  if (onRender) onRender();
}
