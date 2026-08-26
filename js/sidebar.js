import { appData } from './firebase.js';

export function calculateDDay(dateString) {
  if (!dateString) return '-';
  const target = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'D-Day';
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

export function getNearestSchedule(cert) {
  if (!cert.schedules || cert.schedules.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = cert.schedules.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  return upcoming.length > 0 ? upcoming[0] : cert.schedules[0];
}

export function renderSidebar() {
  const listEl = document.getElementById('cert-list');
  if (!appData || !appData.certs || !listEl) return;
  
  const currentCert = appData.certs.find(c => c.id === appData.selectedCertId) || appData.certs[0];
  const sheetBtnText = document.getElementById('sheet-btn-label');
  if (sheetBtnText && currentCert) {
    sheetBtnText.innerText = `${currentCert.name} 시트 열기`;
  }

  // 취득 자격증 보관함 활성화 상태
  const achievedBtn = document.getElementById('achieved-menu-btn');
  if (achievedBtn) {
    if (appData.currentView === 'achieved') {
      achievedBtn.className = "w-full text-left p-2.5 rounded-lg flex items-center justify-between text-sm transition bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 mb-3 shadow";
    } else {
      achievedBtn.className = "w-full text-left p-2.5 rounded-lg flex items-center justify-between text-sm transition text-slate-300 hover:bg-slate-700/50 mb-3 border border-slate-700/80";
    }
  }
  const achievedCountBadge = document.getElementById('achieved-count-badge');
  if (achievedCountBadge) {
    achievedCountBadge.innerText = (appData.achievedCerts || []).length;
  }

  listEl.innerHTML = appData.certs.map(cert => {
    const isCertSelected = appData.currentView === 'cert' && cert.id === appData.selectedCertId;
    const nearest = getNearestSchedule(cert);
    const ddayText = nearest ? calculateDDay(nearest.date) : '-';

    return `
      <li class="space-y-1">
        <button onclick="window.selectCert('${cert.id}')" class="w-full text-left p-2.5 rounded-lg flex items-center justify-between text-sm transition ${
          isCertSelected && !appData.selectedSubId ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-slate-300 hover:bg-slate-700/50'
        }">
          <div class="flex items-center gap-2 truncate">
            <i class="fa-solid ${isCertSelected ? 'fa-folder-open text-indigo-400' : 'fa-folder text-slate-400'} text-xs"></i>
            <span class="truncate">${cert.name}</span>
          </div>
          <span class="text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-300 font-mono font-semibold">${ddayText}</span>
        </button>

        ${isCertSelected ? `
          <ul class="pl-3 pr-1 py-1 space-y-1 border-l border-slate-700/70 ml-3">
            ${cert.subjects.map(sub => {
              const isSubSelected = isCertSelected && appData.selectedSubId === sub.id;
              const noteCount = (sub.notes || []).length;
              return `
                <li>
                  <button onclick="window.selectSubject('${cert.id}', '${sub.id}')" class="w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition ${
                    isSubSelected ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }">
                    <span class="truncate flex items-center gap-1.5">
                      <i class="fa-solid fa-book-bookmark text-slate-500 text-[10px]"></i>
                      ${sub.name}
                    </span>
                    <span class="text-[10px] text-slate-500 font-mono">(${noteCount})</span>
                  </button>
                </li>
              `;
            }).join('')}
          </ul>
        ` : ''}
      </li>
    `;
  }).join('');
}
