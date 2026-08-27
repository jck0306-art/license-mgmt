import { initFirebase, appData, saveState } from './firebase.js';
import { renderSidebar } from './sidebar.js';
import { renderAchievedCertsView, openAchievedModal, closeAchievedModal, saveAchievedCert, deleteAchievedCert } from './achieved.js';
import { renderGoogleSheetView, setCertGoogleSheetUrlPrompt } from './sheet.js';
import { renderSubjectDetailPage, editSubjectNamePrompt, addSubjectNoteInline, toggleNoteDoneInline, editSubjectNoteInline, deleteSubjectNoteInline } from './subject.js';
import { 
  renderCertDashboard, editCertNamePrompt, addSchedulePrompt, editScheduleNamePrompt, 
  updateScheduleDate, updateScheduleResultDate, updateScheduleStatus, deleteSchedule, 
  addMemo, editMemoPrompt, deleteMemo, 
  updateCount, addSubjectPrompt, deleteSubject, deleteCert 
} from './dashboard.js';

function render() {
  if (!appData) return;

  renderSidebar();

  // 1. 취득 자격증 보관함 뷰
  if (appData.currentView === 'achieved') {
    renderAchievedCertsView();
    return;
  }

  // 2. 자격증 선택 상태 확인
  const cert = appData.certs.find(c => c.id === appData.selectedCertId) || appData.certs[0];
  if (!cert) {
    document.getElementById('main-content').innerHTML = `<div class="text-slate-500">선택된 자격증이 없습니다.</div>`;
    return;
  }

  // 3. 구글 시트 뷰
  if (appData.currentView === 'sheet') {
    renderGoogleSheetView(cert);
    return;
  }

  // 4. 과목 상세 또는 종합 대시보드
  if (appData.selectedSubId) {
    renderSubjectDetailPage(cert, appData.selectedSubId);
  } else {
    renderCertDashboard(cert);
  }
}

// 뷰 전환 전역 바인딩
window.render = render;
window.selectCert = function(id) {
  appData.currentView = 'cert';
  appData.selectedCertId = id;
  appData.selectedSubId = null;
  render();
};
window.selectSubject = function(certId, subId) {
  appData.currentView = 'cert';
  appData.selectedCertId = certId;
  appData.selectedSubId = subId;
  render();
};
window.openGoogleSheetView = function() {
  appData.currentView = 'sheet';
  render();
};
window.openAchievedView = function() {
  appData.currentView = 'achieved';
  render();
};

// 취득 자격증 모달
window.openAchievedModal = id => openAchievedModal(id);
window.closeAchievedModal = closeAchievedModal;
window.saveAchievedCert = () => saveAchievedCert(render);
window.deleteAchievedCert = id => deleteAchievedCert(id, render);

// 구글 시트
window.setCertGoogleSheetUrlPrompt = certId => setCertGoogleSheetUrlPrompt(certId, render);

// 과목 및 암기카드
window.editSubjectNamePrompt = (certId, subId) => editSubjectNamePrompt(certId, subId, render);
window.addSubjectNoteInline = (certId, subId) => addSubjectNoteInline(certId, subId, render);
window.toggleNoteDoneInline = (certId, subId, noteId) => toggleNoteDoneInline(certId, subId, noteId, render);
window.editSubjectNoteInline = (certId, subId, noteId) => editSubjectNoteInline(certId, subId, noteId, render);
window.deleteSubjectNoteInline = (certId, subId, noteId) => deleteSubjectNoteInline(certId, subId, noteId, render);
window.updateCount = (certId, subId, delta) => updateCount(certId, subId, delta, render);
window.addSubjectPrompt = certId => addSubjectPrompt(certId, render);
window.deleteSubject = (certId, subId) => deleteSubject(certId, subId, render);

// 자격증명 수정, 일정 & 메모 & 자격증 삭제
window.editCertNamePrompt = certId => editCertNamePrompt(certId, render);
window.addSchedulePrompt = certId => addSchedulePrompt(certId, render);
window.editScheduleNamePrompt = (certId, schId) => editScheduleNamePrompt(certId, schId, render);
window.updateScheduleDate = (certId, schId, newDate) => updateScheduleDate(certId, schId, newDate, render);
window.updateScheduleResultDate = (certId, schId, newResultDate) => updateScheduleResultDate(certId, schId, newResultDate, render);
window.updateScheduleStatus = (certId, schId, field, val) => updateScheduleStatus(certId, schId, field, val, render);
window.deleteSchedule = (certId, schId) => deleteSchedule(certId, schId, render);
window.addMemo = certId => addMemo(certId, render);
window.editMemoPrompt = (certId, memoId) => editMemoPrompt(certId, memoId, render);
window.deleteMemo = (certId, memoId) => deleteMemo(certId, memoId, render);
window.deleteCert = certId => deleteCert(certId, render);

// 새 자격증 추가 모달
window.openAddModal = function() {
  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};
window.closeAddModal = function() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};
window.saveNewCert = function() {
  const name = document.getElementById('new-name').value.trim();
  const date = document.getElementById('new-date').value;
  const sheetUrl = document.getElementById('new-sheet-url').value.trim();
  const subs = document.getElementById('new-subjects').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!name) return alert('명칭을 입력하세요.');

  const newId = 'cert_' + Date.now();
  appData.certs.push({
    id: newId,
    name,
    googleSheetUrl: sheetUrl,
    schedules: date ? [{ id: 'sch_' + Date.now(), name: '2026년 1차', date: date, applied: '접수예정', result: '대기' }] : [],
    memos: [],
    subjects: subs.map((s, i) => ({ id: 's_' + i + '_' + Date.now(), name: s, count: 0, notes: [] }))
  });
  appData.currentView = 'cert';
  appData.selectedCertId = newId;
  appData.selectedSubId = null;
  window.closeAddModal();
  document.getElementById('new-name').value = '';
  document.getElementById('new-date').value = '';
  document.getElementById('new-sheet-url').value = '';
  document.getElementById('new-subjects').value = '';
  saveState();
  render();
};

window.addEventListener('DOMContentLoaded', () => {
  initFirebase(render);
});
