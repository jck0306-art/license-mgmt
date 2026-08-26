import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQ0zSJleSHBjmecj1Qe-kmhLu-GDYXWE8",
  authDomain: "license-mgmt-157ed.firebaseapp.com",
  projectId: "license-mgmt-157ed",
  storageBucket: "license-mgmt-157ed.firebasestorage.app",
  messagingSenderId: "20449962943",
  appId: "1:20449962943:web:35d36af2eb555d23760f0a"
};

export const DEFAULT_DATA = {
  selectedCertId: 'cert_1',
  selectedSubId: null,
  currentView: 'cert', // 'cert' | 'sheet' | 'achieved'
  achievedCerts: [
    { id: 'ach_1', name: '정보처리기사', issueDate: '2024-06-15', issuer: '한국산업인력공단', certNo: '24-20-123456', memo: '국가기술자격' }
  ],
  certs: [
    {
      id: 'cert_1',
      name: '산업보안관리사',
      googleSheetUrl: '',
      schedules: [
        { id: 'sch_1', name: '2026년 정기 시험', date: '2026-10-17', applied: '접수완료', result: '대기' }
      ],
      memos: [
        { id: 'm1', content: '산업기술유출방지법 및 영업비밀보호법 주요 판례 숙지' }
      ],
      subjects: [
        { id: 's1', name: '1과목: 관리적보안 (25문항)', count: 0, notes: [{ id: 'n1', title: '보안정책 수립 절차', body: '계획 수립 -> 위험평가 -> 정책 작성 -> 승인/공표 -> 교육 및 시행', done: false }] },
        { id: 's2', name: '2과목: 물리적보안 (25문항)', count: 0, notes: [] },
        { id: 's3', name: '3과목: 기술적보안 (25문항)', count: 0, notes: [] },
        { id: 's4', name: '4과목: 보안사고대응 (25문항)', count: 0, notes: [] },
        { id: 's5', name: '5과목: 보안지식경영 (25문항)', count: 0, notes: [] }
      ]
    },
    {
      id: 'cert_2',
      name: 'ISMS-P 실기',
      googleSheetUrl: '',
      schedules: [
        { id: 'sch_1', name: '2026년 실기 시험', date: '2026-10-24', applied: '접수예정', result: '대기' }
      ],
      memos: [
        { id: 'm1', content: '결함 보고서 작성 시 기준번호와 근거조항 정확히 매핑하기' }
      ],
      subjects: [
        { id: 's1', name: '1. 관리체계 수립 및 운영', count: 0, notes: [] },
        { id: 's2', name: '2. 보호대책 요구사항', count: 0, notes: [] },
        { id: 's3', name: '3. 개인정보 처리단계별 요구사항', count: 0, notes: [] },
        { id: 's4', name: '인증기준 결함사례 판단 연습', count: 0, notes: [] }
      ]
    },
    {
      id: 'cert_3',
      name: '정보보안기사 실기',
      googleSheetUrl: '',
      schedules: [
        { id: 'sch_1', name: '2026년 제3회 실기', date: '2026-11-14', applied: '접수예정', result: '대기' }
      ],
      memos: [
        { id: 'm1', content: 'Snort 룰 문법 및 iptables 명령줄 작성법 숙지' }
      ],
      subjects: [
        { id: 's1', name: '시스템 보안', count: 0, notes: [] },
        { id: 's2', name: '네트워크 보안', count: 0, notes: [] },
        { id: 's3', name: '애플리케이션 보안', count: 0, notes: [] },
        { id: 's4', name: '정보보안 일반 & 관리/법규', count: 0, notes: [] },
        { id: 's5', name: '실기 서술형/실무형 기출 풀이', count: 0, notes: [] }
      ]
    },
    {
      id: 'cert_4',
      name: 'CPPG (개인정보관리사)',
      googleSheetUrl: '',
      schedules: [
        { id: 'sch_1', name: '2026년 제37회 시험', date: '2026-12-06', applied: '접수예정', result: '대기' }
      ],
      memos: [
        { id: 'm1', content: '개인정보보호법 개정사항 및 가명정보 처리 가이드라인 확인' }
      ],
      subjects: [
        { id: 's1', name: '1영역: 개인정보 보호의 이해', count: 0, notes: [] },
        { id: 's2', name: '2영역: 개인정보 보호 법령 및 제도', count: 0, notes: [] },
        { id: 's3', name: '3영역: 라이프사이클 관리', count: 0, notes: [] },
        { id: 's4', name: '4영역: 개인정보 보호조치', count: 0, notes: [] },
        { id: 's5', name: '5영역: 관리체계 및 거버넌스', count: 0, notes: [] }
      ]
    }
  ]
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, "study_dashboard", "user_data");

export let appData = null;

export function initFirebase(onDataUpdate) {
  onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      appData = docSnap.data();
      if (!appData.currentView) appData.currentView = 'cert';
      if (!appData.achievedCerts) appData.achievedCerts = [];
      appData.certs.forEach(c => {
        if (!c.memos) c.memos = [];
        if (c.googleSheetUrl === undefined) c.googleSheetUrl = '';
        if (!c.schedules || c.schedules.length === 0) {
          const defaultDate = c.targetDate || '2026-10-17';
          c.schedules = [{ id: 'sch_' + Date.now(), name: '2026년 정기 시험', date: defaultDate, applied: '접수예정', result: '대기' }];
        }
        c.subjects.forEach(s => { if (!s.notes) s.notes = []; });
      });
    } else {
      appData = DEFAULT_DATA;
      await setDoc(docRef, DEFAULT_DATA);
    }
    const statusEl = document.getElementById('sync-status');
    if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-cloud text-emerald-400"></i> 클라우드 동기화 완료';
    onDataUpdate();
  }, (error) => {
    console.error("Snapshot error:", error);
    const statusEl = document.getElementById('sync-status');
    if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-circle-exclamation text-rose-400"></i> DB 연결 오류';
  });
}

export async function saveState() {
  if (!appData) return;
  const statusEl = document.getElementById('sync-status');
  if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-arrows-rotate animate-spin text-amber-400"></i> 동기화 중...';
  try {
    await setDoc(docRef, appData);
    if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-cloud text-emerald-400"></i> 클라우드 저장됨';
  } catch (e) {
    console.error("Save error:", e);
    if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-400"></i> 저장 오류';
  }
}
