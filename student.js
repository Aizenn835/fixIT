const ROOMS = {
  'Science & Technology Center': ['Lab 302 — Computer Systems', 'Lab 305 — BioClean', 'Room 101'],
  'Baker Hall': ['Lecture Room 105', 'Lecture Hall B', 'Room 210'],
  'Student Union Center': ['North Vestibule', 'Food Court', 'Lounge'],
  'Engineering Hall': ['ENG 102', 'ENG 204', 'Robotics Lab'],
};

const ME = 'Alex Chen';
const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

let tickets = Store.get();
let category = 'hvac';
let filter = 'all';
let files = [];

const catsEl = $('#cats');
const buildingSelect = $('#building');
const roomSelect = $('#room');
const fileInput = $('#file');
const dropZone = $('#drop');

function renderCats() {
  catsEl.innerHTML = Object.entries(CATS)
    .map(
      ([key, [label, icon, hint]]) => `
        <div class="cat ${key === category ? 'on' : ''}" data-k="${key}">
          <span class="icon">${icon}</span>
          <b>${label}</b>
          <div class="small mute">${hint}</div>
        </div>`
    )
    .join('');
}

function renderBuildings() {
  buildingSelect.innerHTML = Object.keys(ROOMS)
    .map((building) => `<option>${building}</option>`)
    .join('');
}

function renderRooms() {
  roomSelect.innerHTML = ROOMS[buildingSelect.value]
    .map((room) => `<option>${room}</option>`)
    .join('');
}

function renderFiles() {
  $('#files').innerHTML = files
    .map(
      (file, i) =>
        `<span class="chip">${esc(file.name)}<button type="button" data-i="${i}">✕</button></span>`
    )
    .join('');
}

function addFiles(list) {
  for (const file of list) {
    if (files.length >= MAX_FILES) {
      toast('Maximum 3 files');
      break;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast(file.name + ' is over 10MB');
      continue;
    }
    files.push(file);
  }
  renderFiles();
}

function requestCard(ticket) {
  const progressBar =
    ticket.status === 'progress'
      ? `<div class="bar" style="margin-top:12px"><i style="width:${ticket.progress}%"></i></div>`
      : '';

  const techLine = ticket.tech
    ? `<div class="small" style="margin-top:10px">Assigned to <b>${esc(ticket.tech)}</b></div>`
    : '';

  return `
    <div class="card hover ticket p-${ticket.pri}">
      <div class="row">
        <span class="mono mute">#${ticket.id}</span>
        <span class="right">${statusBadge(ticket.status)}</span>
      </div>
      <h3 style="margin:6px 0">${esc(ticket.title)}</h3>
      <div class="small mute">${esc(ticket.loc)}</div>
      ${progressBar}
      ${techLine}
    </div>`;
}

function renderList() {
  const mine = tickets.filter((t) => t.reporter === ME);

  const counts = {
    all: mine.length,
    progress: mine.filter((t) => t.status !== 'resolved').length,
    resolved: mine.filter((t) => t.status === 'resolved').length,
  };

  const tabs = [
    ['all', 'All'],
    ['progress', 'In Progress'],
    ['resolved', 'Resolved'],
  ];

  $('#tabs').innerHTML = tabs
    .map(([key, label]) => {
      const active = key === filter ? 'on' : '';
      return `<button class="tab ${active}" data-f="${key}">${label} (${counts[key]})</button>`;
    })
    .join('');

  const shown = mine.filter(
    (t) => filter === 'all' || (filter === 'resolved') === (t.status === 'resolved')
  );

  $('#list').innerHTML =
    shown.map(requestCard).join('') || '<div class="card mute">No requests here.</div>';
}

function createTicket(title) {
  return {
    id: nextId(tickets),
    title,
    cat: category,
    loc: `${buildingSelect.value} • ${roomSelect.value}`,
    pri: $('input[name=pri]:checked').value,
    status: 'review',
    progress: 0,
    tech: '',
    reporter: ME,
    parts: [],
    notes: [
      {
        who: ME + ' (Reporter)',
        time: 'just now',
        text: $('#desc').value.trim() || 'Created work order via portal.',
      },
    ],
  };
}

catsEl.addEventListener('click', (e) => {
  const card = e.target.closest('.cat');
  if (!card) return;
  category = card.dataset.k;
  renderCats();
});

buildingSelect.onchange = renderRooms;

dropZone.onclick = () => fileInput.click();

fileInput.onchange = () => {
  addFiles(fileInput.files);
  fileInput.value = '';
};

dropZone.ondragover = (e) => {
  e.preventDefault();
  dropZone.classList.add('over');
};

dropZone.ondragleave = () => dropZone.classList.remove('over');

dropZone.ondrop = (e) => {
  e.preventDefault();
  dropZone.classList.remove('over');
  addFiles(e.dataTransfer.files);
};

$('#files').onclick = (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  files.splice(+button.dataset.i, 1);
  renderFiles();
};

$('#tabs').onclick = (e) => {
  const button = e.target.closest('.tab');
  if (!button) return;
  filter = button.dataset.f;
  renderList();
};

$('#form').onsubmit = (e) => {
  e.preventDefault();

  const titleInput = $('#title');
  const title = titleInput.value.trim();
  titleInput.classList.toggle('err', !title);

  if (!title) {
    titleInput.focus();
    return;
  }

  tickets.unshift(createTicket(title));
  Store.set(tickets);

  e.target.reset();
  renderRooms();
  files = [];
  renderFiles();
  filter = 'all';
  renderList();
  toast('Request submitted to dispatch');
};

$('#draft').onclick = () => toast('Draft saved');

renderCats();
renderBuildings();
renderRooms();
renderList();