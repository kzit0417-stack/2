// DOM 요소
const addForm = document.getElementById('addForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const dateDisplay = document.getElementById('dateDisplay');
const remainingCount = document.getElementById('remainingCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('themeToggle');

// 상태
let tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
let currentFilter = 'all';

// 테마 (기본: 다크 모드)
function initTheme() {
  const saved = localStorage.getItem('todoTheme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const theme = saved || (prefersLight ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('todoTheme', next);
}

themeToggle.addEventListener('click', toggleTheme);

// 오늘 날짜 표시
function updateDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  dateDisplay.textContent = now.toLocaleDateString('ko-KR', options);
}

// 로컬 스토리지 저장
function saveTasks() {
  localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// 태스크 렌더링
function renderTasks() {
  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    const emptyMessage = {
      all: '할일이 없습니다. 새로운 할일을 추가해보세요!',
      active: '진행중인 할일이 없습니다.',
      completed: '완료된 할일이 없습니다.'
    };
    taskList.innerHTML = `
      <li class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>${emptyMessage[currentFilter]}</p>
      </li>
    `;
  } else {
    taskList.innerHTML = filteredTasks
      .map(
        (task, index) => `
      <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${task.completed ? 'checked' : ''}
          aria-label="완료"
        >
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button type="button" class="task-delete" aria-label="삭제">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </li>
    `
      )
      .join('');
  }

  // 이벤트 바인딩
  taskList.querySelectorAll('.task-item:not(.empty-state)').forEach(item => {
    const checkbox = item.querySelector('.task-checkbox');
    const deleteBtn = item.querySelector('.task-delete');

    checkbox.addEventListener('change', () => toggleTask(item.dataset.id));
    deleteBtn.addEventListener('click', () => deleteTask(item.dataset.id));
  });

  updateStats();
}

// XSS 방지
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 통계 업데이트
function updateStats() {
  const remaining = tasks.filter(t => !t.completed).length;
  remainingCount.textContent = remaining;
}

// 할일 추가
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const newTask = {
    id: Date.now().toString(),
    text: trimmed,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  taskInput.value = '';
  taskInput.focus();
}

// 할일 완료 토글
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

// 할일 삭제
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

// 완료 항목 전체 삭제
function clearCompleted() {
  const completedCount = tasks.filter(t => t.completed).length;
  if (completedCount === 0) return;
  if (confirm(`완료된 ${completedCount}개 항목을 삭제하시겠습니까?`)) {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
  }
}

// 필터 변경
function setFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTasks();
}

// 이벤트 리스너
addForm.addEventListener('submit', e => {
  e.preventDefault();
  addTask(taskInput.value);
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// 초기화
initTheme();
updateDate();
renderTasks();
