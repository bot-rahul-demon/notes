const DATA = {
  'ibps-so': {
    label: 'IBPS SO — IT Officer',
    telegram: 'https://t.me/IBPSSOSBISOITQUIZ',
      'Operating System',
      'Database Management Systems',
      'Computer Network',
      'Object-Oriented Programming',
      'Compiler Design',
      'Computer Organization',
      'Microprocessor and Computer Hardware',
      'Software Engineering',
      'Web Technology',
      'Data Warehousing and Data Mining',
      'Computer and Network Security',
    ],
    // PDF filenames per mode (relative to repo root)
    files: {
      notes:     s => `ibps so/${s}/IBPS_SO_IT_Complete_Notes.pdf`,
      oneliners: s => `ibps so/${s}/IBPS_SO_IT_One_Liners.pdf`,
    }
  },
  'cil-mt': {
    label: 'CIL MT — Management Trainee',
    telegram: 'https://t.me/IBPSSOSBISOITQUIZ',
      'Compiler Design',
      'Computer Networks',
      'Computer Organization and Architecture',
      'Databases',
      'Digital Logic',
      'Engineering Mathematics',
      'Operating System',
      'Programming and Data Structures',
      'Theory of Computation',
    ],
    files: {
      notes:     s => `cil mt/${s}/CIL_MT_Systems_Complete_Notes.pdf`,
      oneliners: s => `cil mt/${s}/CIL_MT_Systems_One_Liners.pdf`,
    }
  }
};

const App = (() => {
  let exam = '', mode = '';

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  function pickExam(e) {
    exam = e;
    document.getElementById('exam-label').textContent = DATA[e].label;
    document.getElementById('mode-title').textContent = DATA[e].label;
    show('s-mode');
  }

  function pickMode(m) {
    if (m === 'quiz') {
      window.open(DATA[exam].telegram, '_blank');
      return;
    }
    mode = m;
    const modeNames = { notes: 'Complete Notes', oneliners: 'One-Liners' };
    document.getElementById('mode-label').textContent =
      DATA[exam].label + '  ›  ' + modeNames[m];

    const grid = document.getElementById('subject-grid');
    grid.innerHTML = '';
    DATA[exam].subjects.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.className = 'subj-btn';
      btn.innerHTML = `<span class="subj-num">SUBJECT ${String(i+1).padStart(2,'0')}</span>${s}`;
      btn.onclick = () => pickSubject(s);
      grid.appendChild(btn);
    });
    show('s-subject');
  }

  function pickSubject(s) {
    const raw = DATA[exam].files[mode](s);
    const path = raw.split('/').map(encodeURIComponent).join('/');
    document.getElementById('viewer-label').textContent = s;
    document.getElementById('pdf-frame').src = path;
    show('s-viewer');
  }

  function back(target) {
    if (target === 's-viewer') { document.getElementById('pdf-frame').src = ''; }
    show(target);
  }

  return { pickExam, pickMode, back };
})();
