import { appData, saveState } from './firebase.js';

export function renderGoogleSheetView(cert) {
  const url = cert.googleSheetUrl || '';
  const mainEl = document.getElementById('main-content');
  if (!mainEl) return;

  mainEl.innerHTML = `
    <div class="h-full flex flex-col">
      <div class="mb-4 flex flex-wrap justify-between items-center gap-2">
        <div>
          <button onclick="window.selectCert('${cert.id}')" class="text-xs text-indigo-400 hover:underline flex items-center gap-1 mb-1.5">
            <i class="fa-solid fa-arrow-left"></i> ${cert.name} 대시보드로 돌아가기
          </button>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-table-cells text-emerald-400"></i> ${cert.name} 전용 스프레드시트
          </h2>
        </div>
        <div class="flex gap-2">
          <button onclick="window.setCertGoogleSheetUrlPrompt('${cert.id}')" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded transition">
            <i class="fa-solid fa-link"></i> 시트 링크 수정
          </button>
          ${url ? `
            <a href="${url}" target="_blank" class="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition flex items-center gap-1 font-semibold">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> 새 창에서 열기
            </a>
          ` : ''}
        </div>
      </div>

      ${!url ? `
        <div class="flex-1 flex flex-col items-center justify-center p-10 bg-slate-800 rounded-xl border border-dashed border-slate-700 text-center">
          <i class="fa-regular fa-file-excel text-4xl text-emerald-500/60 mb-3"></i>
          <h3 class="text-base font-bold text-white mb-1">[${cert.name}]에 등록된 구글 시트가 없습니다</h3>
          <p class="text-xs text-slate-400 mb-4">이 자격증 공부에 사용하는 구글 스프레드시트의 공유 URL을 등록해 주세요.</p>
          <button onclick="window.setCertGoogleSheetUrlPrompt('${cert.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-semibold transition">
            구글 시트 URL 등록하기
          </button>
        </div>
      ` : `
        <div class="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl min-h-[calc(100vh-180px)]">
          <iframe src="${url}" class="w-full h-full min-h-[600px] border-0" allow="clipboard-write"></iframe>
        </div>
      `}
    </div>
  `;
}

export function setCertGoogleSheetUrlPrompt(certId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  if (!cert) return;
  const current = cert.googleSheetUrl || '';
  const input = prompt(`[${cert.name}]에 연동할 구글 스프레드시트 공유 URL을 입력하세요:`, current);
  if (input !== null) {
    cert.googleSheetUrl = input.trim();
    saveState();
    if (onRender) onRender();
  }
}
