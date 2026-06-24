const DATA = {
  'ibps-so': {
    label: 'IBPS SO — IT Officer',
    subjects: [
      'Data Structure','Operating System','Database Management Systems',
      'Computer Network','Object-Oriented Programming','Compiler Design',
      'Computer Organization','Microprocessor and Computer Hardware',
      'Software Engineering','Web Technology',
      'Data Warehousing and Data Mining','Computer and Network Security',
    ],
    files: {
      notes:     s => `ibps so/${s}/IBPS_SO_IT_Complete_Notes.pdf`,
      oneliners: s => `ibps so/${s}/IBPS_SO_IT_One_Liners.pdf`,
      quiz:      s => `ibps so/${s}/quiz.json`,
    }
  },
  'cil-mt': {
    label: 'CIL MT — Management Trainee',
    subjects: [
      'Algorithms','Compiler Design','Computer Networks',
      'Computer Organization and Architecture','Databases','Digital Logic',
      'Engineering Mathematics','Operating System',
      'Programming and Data Structures','Theory of Computation',
    ],
    files: {
      notes:     s => `cil mt/${s}/CIL_MT_Systems_Complete_Notes.pdf`,
      oneliners: s => `cil mt/${s}/CIL_MT_Systems_One_Liners.pdf`,
      quiz:      s => `cil mt/${s}/quiz.json`,
    }
  }
};

const QUIZ_SIZE = 50; // questions per quiz set

const App = (() => {
  let exam = '', mode = '', subject = '';
  let allQuestions = [], quizQuestions = [], quizIndex = 0;
  let currentQuizNum = 0, score = 0, answered = [];

  /* ── Navigation ─────────────────────────────────────────── */
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('banners').style.display =
      id === 's-quiz' ? 'none' : '';
    window.scrollTo(0, 0);
  }

  function back(target) {
    if (target === 's-viewer') document.getElementById('pdf-frame').src = '';
    show(target);
  }

  function backFromQuiz() { show('s-quiz-list'); }

  /* ── Exam / Mode / Subject ───────────────────────────────── */
  function pickExam(e) {
    exam = e;
    document.getElementById('exam-label').textContent = DATA[e].label;
    document.getElementById('mode-title').textContent = DATA[e].label;
    show('s-mode');
  }

  function pickMode(m) {
    mode = m;
    const modeNames = { notes: 'Complete Notes', oneliners: 'One-Liners', quiz: 'Quiz' };
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
    subject = s;
    if (mode === 'quiz') {
      showQuizList(s);
    } else {
      const raw = DATA[exam].files[mode](s);
      const path = raw.split('/').map(encodeURIComponent).join('/');
      document.getElementById('viewer-label').textContent = s;
      document.getElementById('pdf-frame').src = path;
      show('s-viewer');
    }
  }

  /* ── Quiz List ───────────────────────────────────────────── */
  async function showQuizList(s) {
    document.getElementById('quiz-list-label').textContent =
      DATA[exam].label + '  ›  Quiz  ›  ' + s;
    document.getElementById('quiz-list-title').textContent = s;

    const raw = DATA[exam].files.quiz(s);
    const path = raw.split('/').map(encodeURIComponent).join('/');

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('not found');
      allQuestions = await res.json();
    } catch {
      allQuestions = [];
    }

    const total = allQuestions.length;
    const grid = document.getElementById('quiz-list-grid');
    grid.innerHTML = '';

    if (total === 0) {
      grid.innerHTML = '<p style="color:var(--slate);padding:1rem;">No quiz available for this subject yet.</p>';
      show('s-quiz-list');
      return;
    }

    const numSets = Math.ceil(total / QUIZ_SIZE);
    for (let i = 1; i <= numSets; i++) {
      const start = (i - 1) * QUIZ_SIZE + 1;
      const end   = Math.min(i * QUIZ_SIZE, total);
      const btn = document.createElement('button');
      btn.className = 'quiz-set-btn';
      btn.innerHTML = `
        <span class="qs-num">${s} Quiz ${i}</span>
        <span class="qs-range">Q${start} – Q${end}</span>
      `;
      const quizNum = i;
      btn.onclick = () => startQuiz(quizNum);
      grid.appendChild(btn);
    }
    show('s-quiz-list');
  }

  /* ── Quiz Player ─────────────────────────────────────────── */
  function startQuiz(num) {
    currentQuizNum = num;
    const start = (num - 1) * QUIZ_SIZE;
    quizQuestions = allQuestions.slice(start, start + QUIZ_SIZE);
    quizIndex = 0;
    score = 0;
    answered = new Array(quizQuestions.length).fill(null); // null = unattempted

    document.getElementById('quiz-player-label').textContent =
      subject + '  ›  Quiz ' + num;

    buildPalette();
    renderQuestion();
    show('s-quiz');
  }

  function buildPalette() {
    const grid = document.getElementById('palette-grid');
    grid.innerHTML = '';
    quizQuestions.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'palette-btn unattempted';
      btn.id = `pal-${i}`;
      btn.textContent = i + 1;
      btn.onclick = () => jumpToQuestion(i);
      grid.appendChild(btn);
    });
  }

  function updatePalette(index, state) {
    const btn = document.getElementById(`pal-${index}`);
    if (btn) btn.className = `palette-btn ${state}`;
  }

  function renderQuestion() {
    const q = quizQuestions[quizIndex];
    document.getElementById('q-counter').textContent =
      `Question ${quizIndex + 1} / ${quizQuestions.length}`;
    document.getElementById('q-score').textContent = `Score: ${score}`;
    document.getElementById('q-text').textContent = q.q;

    const expEl = document.getElementById('q-explanation');
    expEl.classList.add('hidden');
    document.getElementById('q-next').classList.add('hidden');

    const opts = document.getElementById('q-options');
    opts.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.innerHTML = `<span class="opt-label">${String.fromCharCode(65+i)}</span>${opt}`;

      // if already answered (palette jump), restore state
      if (answered[quizIndex] !== null) {
        applyAnswerState(btn, i, q.answer, answered[quizIndex]);
        expEl.classList.remove('hidden');
        document.getElementById('exp-text').textContent = q.explanation;
        document.getElementById('q-next').classList.remove('hidden');
      } else {
        btn.onclick = () => selectOption(i);
      }
      opts.appendChild(btn);
    });
  }

  function selectOption(chosen) {
    if (answered[quizIndex] !== null) return;
    const q = quizQuestions[quizIndex];
    answered[quizIndex] = chosen;

    const isCorrect = chosen === q.answer;
    if (isCorrect) score++;

    // update palette
    updatePalette(quizIndex, isCorrect ? 'correct' : 'wrong');

    // style all option buttons
    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach((btn, i) => {
      applyAnswerState(btn, i, q.answer, chosen);
    });

    // show explanation
    document.getElementById('exp-text').textContent = q.explanation;
    document.getElementById('q-explanation').classList.remove('hidden');
    document.getElementById('q-score').textContent = `Score: ${score}`;

    // show next / finish
    const nextBtn = document.getElementById('q-next');
    nextBtn.textContent = quizIndex === quizQuestions.length - 1 ? 'Finish Quiz ✓' : 'Next →';
    nextBtn.classList.remove('hidden');
  }

  function applyAnswerState(btn, btnIndex, correct, chosen) {
    btn.disabled = true;
    if (btnIndex === correct) btn.classList.add('opt-correct');
    else if (btnIndex === chosen) btn.classList.add('opt-wrong');
    btn.onclick = null;
  }

  function nextQuestion() {
    if (quizIndex === quizQuestions.length - 1) {
      showResult();
    } else {
      quizIndex++;
      renderQuestion();
      window.scrollTo(0, 0);
    }
  }

  function jumpToQuestion(i) {
    quizIndex = i;
    renderQuestion();
    window.scrollTo(0, 0);
  }

  /* ── Result ──────────────────────────────────────────────── */
  function showResult() {
    const total = quizQuestions.length;
    const pct = Math.round((score / total) * 100);
    document.getElementById('result-label').textContent =
      subject + '  ›  Quiz ' + currentQuizNum + '  ›  Result';
    document.getElementById('result-score').textContent = `${score} / ${total}`;
    document.getElementById('result-msg').textContent =
      pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good work!' : '📚 Keep practicing!';
    const wrong = answered.filter((a, i) => a !== null && a !== quizQuestions[i].answer).length;
    document.getElementById('result-stats').innerHTML =
      `<span class="stat correct">✓ ${score} Correct</span>
       <span class="stat wrong">✗ ${wrong} Wrong</span>
       <span class="stat skip">— ${total - score - wrong} Skipped</span>`;
    show('s-result');
  }

  function retryQuiz() { startQuiz(currentQuizNum); show('s-quiz'); }

  return { pickExam, pickMode, back, backFromQuiz, nextQuestion, retryQuiz };
})();
