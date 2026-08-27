import { appData, saveState } from './firebase.js';
import { calculateDDay, getNearestSchedule } from './sidebar.js';
import { escapeHTML } from './security.js';

export function renderCertDashboard(cert) {
  if (!cert.memos) cert.memos = [];
  if (!cert.schedules) cert.schedules = [];

  const nearest = getNearestSchedule(cert);
  const topDday = nearest ? calculateDDay(nearest.date) : '-';
  const mainEl = document.getElementById('main-content');
  if (!mainEl) return;

  mainEl.innerHTML = `
    <div class="flex justify-between items-start mb-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            ${escapeHTML(cert.name)}
          </h2>
          <button onclick="window.editCertNamePrompt('${escapeHTML(cert.id)}')" class="text-xs text-slate-400 hover:text-amber-300 border border-slate-700 px-2 py-1 rounded bg-slate-800 transition flex items-center gap-1" title="자격증명 수정">
            <i class="fa-solid fa-pen"></i> 수정
          </button>
          <span class="text-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-mono font-semibold">
            ${topDday}
          </span>
        </div>
        <p class="text-sm text-slate-400">2026년 시험 일정 및 전용 구글 시트를 관리하세요.</p>
      </div>
      <button onclick="window.deleteCert('${escapeHTML(cert.id)}')" class="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded transition hover:bg-rose-500/10">자격증 삭제</button>
    </div>

    <!-- 📌 시험 일정 테이블 (발표일자 & 자동 합격 등록 지원) -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6 shadow-lg">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold text-white text-sm flex items-center gap-2">
          <i class="fa-solid fa-calendar-check text-indigo-400"></i> 시험 일정 & 응시 / 합불 관리
        </h3>
        <button onclick="window.addSchedulePrompt('${escapeHTML(cert.id)}')" class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded transition flex items-center gap-1 font-semibold">
          <i class="fa-solid fa-plus"></i> 시험 일정 추가
        </button>
      </div> 

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-900/80 text-slate-400 border-b border-slate-700 uppercase font-semibold">
            <tr>
              <th class="p-2.5">회차/구분</th>
              <th class="p-2.5">시험일자 (D-Day)</th>
              <th class="p-2.5">합격 발표일</th>
              <th class="p-2.5">응시 여부</th>
              <th class="p-2.5">합격 여부</th>
              <th class="p-2.5 text-right">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/60">
            ${cert.schedules.length === 0 ? `
              <tr><td colspan="6" class="p-4 text-center text-slate-500">등록된 시험 일정이 없습니다. 일정을 추가해보세요.</td></tr>
            ` : cert.schedules.map(sch => {
              const dday = calculateDDay(sch.date);
              const resultDday = sch.resultDate ? calculateDDay(sch.resultDate) : '';
              return `
                <tr class="hover:bg-slate-900/40">
                  <td class="p-2.5 font-medium text-slate-200">
                    <div class="flex items-center gap-1.5">
                      <span>${escapeHTML(sch.name)}</span>
                      <button onclick="window.editScheduleNamePrompt('${escapeHTML(cert.id)}', '${escapeHTML(sch.id)}')" class="text-slate-500 hover:text-amber-300 text-xs p-1" title="회차명 수정">
                        <i class="fa-solid fa-pen"></i>
                      </button>
                    </div>
                  </td>
                  <td class="p-2.5 font-mono">
                    <div class="flex items-center gap-1.5">
                      <input type="date" value="${sch.date || ''}" onchange="window.updateScheduleDate('${escapeHTML(cert.id)}', '${escapeHTML(sch.id)}', this.value)" class="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                      <span class="text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-400 font-bold">${dday}</span>
                    </div>
                  </td>
                  <td class="p-2.5 font-mono">
                    <div class="flex items-center gap-1.5">
                      <input type="date" value="${sch.resultDate || ''}" onchange="window.updateScheduleResultDate('${escapeHTML(cert.id)}', '${escapeHTML(sch.id)}', this.value)" class="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                      ${resultDday ? `<span class="text-[10px] px-1 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700 font-bold">${resultDday}</span>` : ''}
                    </div>
                  </td>
                  <td class="p-2.5">
                    <select onchange="window.updateScheduleStatus('${escapeHTML(cert.id)}', '${escapeHTML(sch.id)}', 'applied', this.value)" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
                      <option value="접수예정" ${sch.applied === '접수예정' ? 'selected' : ''}>접수예정</option>
                      <option value="접수완료" ${sch.applied === '접수완료' ? 'selected' : ''}>접수완료</option>
                      <option value="응시완료" ${sch.applied === '응시완료' ? 'selected' : ''}>응시완료</option>
                      <option value="미응시" ${sch.applied === '미응시' ? 'selected' : ''}>미응시</option>
                    </select>
                  </td>
                  <td class="p-2.5">
                    <select onchange="window.updateScheduleStatus('${escapeHTML(cert.id)}', '${escapeHTML(sch.id)}', 'result', this.value)" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold ${sch.result === '합격' ? 'text-amber-300' : ''}">
                      <option value="대기" ${sch.result === '대기' ? 'selected' : ''}>결과대기</option>
                      <option value="합격" ${sch.result === '합격' ? 'selected' : ''}>🎉 합격</option>
                      <option value="불합격" ${sch.result === '불합격' ? 'selected' : ''}>불합격</option>
                    </select>
                  </td>
                  <td class="p-2.5 text-right">
                    <button onclick="window.deleteSchedule('${escapeHTML(cert.id)}', '${escapeHTML(sch.id)}')" class="text-slate-500 hover:text-rose-400 p-1" title="일정 삭제"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 구글 시트 링크 카드 -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-lg">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <i class="fa-solid fa-file-excel text-lg"></i>
        </div>
        <div>
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            ${escapeHTML(cert.name)} 전용 구글 시트
            <span class="text-[10px] px-2 py-0.5 rounded ${cert.googleSheetUrl ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'} font-normal">
              ${cert.googleSheetUrl ? '연동됨' : '미등록'}
            </span>
          </h4>
          <p class="text-xs text-slate-400">${cert.googleSheetUrl ? '등록된 스프레드시트를 대시보드 안에서 바로 열고 편집할 수 있습니다.' : '이 자격증에 사용할 구글 시트 링크를 등록해 보세요.'}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="window.setCertGoogleSheetUrlPrompt('${escapeHTML(cert.id)}')" class="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg transition font-medium">
          <i class="fa-solid fa-link"></i> 링크 설정
        </button>
        <button onclick="window.openGoogleSheetView()" class="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 font-semibold">
          <i class="fa-solid fa-table-cells"></i> 시트 열기
        </button>
      </div>
    </div>

    <!-- MEMO 섹션 -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6 shadow-lg">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold text-white text-sm flex items-center gap-2">
          <i class="fa-regular fa-note-sticky text-amber-400"></i> MEMO
        </h3>
        <span class="text-xs text-slate-400 font-mono">${cert.memos.length}개의 메모</span>
      </div>
      <div class="flex gap-2 mb-4">
        <input id="memo-input" type="text" placeholder="자격증과 관련된 메모를 입력하세요..." 
          class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" 
          onkeydown="if(event.key === 'Enter') window.addMemo('${escapeHTML(cert.id)}')" />
        <button onclick="window.addMemo('${escapeHTML(cert.id)}')" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 whitespace-nowrap">
          <i class="fa-solid fa-plus"></i> 메모 추가
        </button>
      </div>
      <div class="space-y-2">
        ${cert.memos.length === 0 ? `
          <div class="text-xs text-slate-500 py-3 text-center bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
            등록된 메모가 없습니다.
          </div>
        ` : cert.memos.map(memo => `
          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 transition group">
            <div class="flex items-start gap-2 flex-1 mr-3">
              <i class="fa-solid fa-thumbtack text-indigo-400 text-xs mt-1"></i>
              <p class="text-sm text-slate-200 leading-relaxed break-all">${escapeHTML(memo.content)}</p>
            </div>
            <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
              <button onclick="window.editMemoPrompt('${escapeHTML(cert.id)}', '${escapeHTML(memo.id)}')" class="text-slate-400 hover:text-amber-300 p-1.5 rounded hover:bg-slate-800 text-xs"><i class="fa-solid fa-pen"></i></button>
              <button onclick="window.deleteMemo('${escapeHTML(cert.id)}', '${escapeHTML(memo.id)}')" class="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 text-xs"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 과목 목록 및 회독 관리 -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-white text-sm">과목 목록 및 회독 관리</h3>
        <button onclick="window.addSubjectPrompt('${escapeHTML(cert.id)}')" class="text-xs text-indigo-400 hover:underline">+ 과목 추가</button>
      </div>
      <div class="space-y-3">
        ${cert.subjects.map(sub => `
          <div class="flex items-center justify-between p-3.5 rounded-lg bg-slate-900 border border-slate-700/60">
            <div class="flex items-center gap-3 flex-1 cursor-pointer" onclick="window.selectSubject('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}')">
              <span class="text-sm font-medium text-slate-200 hover:text-indigo-400 transition">${escapeHTML(sub.name)}</span>
              <span class="text-xs text-amber-400/80 ml-2 font-mono">암기카드 ${(sub.notes || []).length}개</span>
            </div>
            <div class="flex items-center gap-3">
              <button onclick="window.editSubjectNamePrompt('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}')" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded transition" title="과목명 수정">
                <i class="fa-solid fa-pen"></i> 수정
              </button>
              <div class="flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
                <span class="text-slate-400">회독:</span>
                <span class="font-semibold text-indigo-400 font-mono">${sub.count || 0}회</span>
                <button onclick="window.updateCount('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}', 1)" class="ml-1 px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold">+</button>
                <button onclick="window.updateCount('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}', -1)" class="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold">-</button>
              </div>
              <button onclick="window.deleteSubject('${escapeHTML(cert.id)}', '${escapeHTML(sub.id)}')" class="text-slate-500 hover:text-rose-400 text-xs ml-1"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 📌 목표 자격증명 수정 함수
export function editCertNamePrompt(certId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  if (!cert) return;
  const newName = prompt('변경할 자격증 명칭을 입력하세요:', cert.name);
  if (newName !== null && newName.trim() !== '') {
    cert.name = newName.trim().slice(0, 50);
    saveState();
    if (onRender) onRender();
  }
}

export function addSchedulePrompt(certId, onRender) {
  const name = prompt('시험 명칭/회차를 입력하세요 (예: 2026년 2회차):', '2026년 추가 시험');
  if (!name) return;
  const date = prompt('시험 날짜를 입력하세요 (YYYY-MM-DD):', '2026-10-17');
  if (!date) return;
  const resultDate = prompt('합격 발표일을 입력하세요 (선택, YYYY-MM-DD):', '') || '';

  const cert = appData.certs.find(c => c.id === certId);
  if (!cert.schedules) cert.schedules = [];
  cert.schedules.push({
    id: 'sch_' + Date.now(),
    name,
    date,
    resultDate,
    applied: '접수예정',
    result: '대기'
  });
  cert.schedules.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  if (onRender) onRender();
}

export function editScheduleNamePrompt(certId, schId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sch = cert?.schedules.find(s => s.id === schId);
  if (!sch) return;
  const newName = prompt('시험 회차/명칭을 수정하세요:', sch.name);
  if (newName !== null && newName.trim() !== '') {
    sch.name = newName.trim();
    saveState();
    if (onRender) onRender();
  }
}

export function updateScheduleDate(certId, schId, newDate, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sch = cert?.schedules.find(s => s.id === schId);
  if (sch && newDate) {
    sch.date = newDate;
    cert.schedules.sort((a, b) => a.date.localeCompare(b.date));
    saveState();
    if (onRender) onRender();
  }
}

export function updateScheduleResultDate(certId, schId, newResultDate, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sch = cert?.schedules.find(s => s.id === schId);
  if (sch) {
    sch.resultDate = newResultDate;
    saveState();
    if (onRender) onRender();
  }
}

export function updateScheduleStatus(certId, schId, field, val, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sch = cert?.schedules.find(s => s.id === schId);
  if (!sch) return;

  sch[field] = val;

  // 🎉 합격 선택 시 취득 자격증 보관함 자동 등록
  if (field === 'result' && val === '합격') {
    if (!appData.achievedCerts) appData.achievedCerts = [];
    
    const alreadyExists = appData.achievedCerts.some(a => a.name === cert.name);
    if (!alreadyExists) {
      const issueDate = sch.resultDate || sch.date || new Date().toISOString().slice(0, 10);
      appData.achievedCerts.unshift({
        id: 'ach_' + Date.now(),
        name: cert.name,
        issueDate: issueDate,
        issuer: '',
        certNo: '',
        memo: `${sch.name} 합격으로 자동 등록됨`
      });
      alert(`🎉 축하합니다! [${cert.name}]이(가) '취득 자격증 보관함'에 자동으로 등록되었습니다.`);
    }
  }

  saveState();
  if (onRender) onRender();
}

export function deleteSchedule(certId, schId, onRender) {
  if (!confirm('이 시험 일정을 삭제하시겠습니까?')) return;
  const cert = appData.certs.find(c => c.id === certId);
  cert.schedules = cert.schedules.filter(s => s.id !== schId);
  saveState();
  if (onRender) onRender();
}

export function addMemo(certId, onRender) {
  const input = document.getElementById('memo-input');
  const content = input.value.trim();
  if (!content) return;
  const cert = appData.certs.find(c => c.id === certId);
  if (!cert.memos) cert.memos = [];
  cert.memos.unshift({ id: 'm_' + Date.now(), content });
  input.value = '';
  saveState();
  if (onRender) onRender();
}

export function editMemoPrompt(certId, memoId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const memo = cert?.memos.find(m => m.id === memoId);
  if (!memo) return;
  const updated = prompt('메모를 수정하세요:', memo.content);
  if (updated !== null && updated.trim() !== '') {
    memo.content = updated.trim();
    saveState();
    if (onRender) onRender();
  }
}

export function deleteMemo(certId, memoId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  cert.memos = cert.memos.filter(m => m.id !== memoId);
  saveState();
  if (onRender) onRender();
}

export function updateCount(certId, subId, delta, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  const sub = cert?.subjects.find(s => s.id === subId);
  if (sub) {
    sub.count = Math.max(0, (sub.count || 0) + delta);
    saveState();
    if (onRender) onRender();
  }
}

export function addSubjectPrompt(certId, onRender) {
  const name = prompt('추가할 과목명을 입력하세요:');
  if (!name) return;
  const cert = appData.certs.find(c => c.id === certId);
  cert.subjects.push({ id: 's_' + Date.now(), name, count: 0, notes: [] });
  saveState();
  if (onRender) onRender();
}

export function deleteSubject(certId, subId, onRender) {
  const cert = appData.certs.find(c => c.id === certId);
  cert.subjects = cert.subjects.filter(s => s.id !== subId);
  if (appData.selectedSubId === subId) appData.selectedSubId = null;
  saveState();
  if (onRender) onRender();
}

export function deleteCert(certId, onRender) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  appData.certs = appData.certs.filter(c => c.id !== certId);
  if (appData.certs.length > 0) {
    appData.selectedCertId = appData.certs[0].id;
    appData.selectedSubId = null;
  }
  saveState();
  if (onRender) onRender();
}
