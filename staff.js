const ME = 'Marcus Rivera';

let tickets = Store.get();
let selected = null;
let filter = 'all';

const FLOW = [
  ['Acknowledged', 'dispatched'],
  ['In Progress', 'progress'],
  ['Awaiting Parts', 'parts'],
  ['Mark Resolved', 'resolved'],
];

const QUEUE_FILTERS = {
  all: () => true,
  emergency: (t) => t.pri === 'emergency',
  high: (t) => t.pri === 'high',
};

const myQueue = () =>
  tickets.filter((t) => t.status !== 'resolved' && (t.tech === ME || !t.tech));

const findSelected = () => tickets.find((t) => t.id === selected);

function save() {
  Store.set(tickets);
  render();
}

function kpiCard(label, value, sub) {
  return `
    <div class="card kpi">
      <div class="small mute">${label}</div>
      <div class="n">${value}</div>
      <div class="small mute">${sub}</div>
    </div>`;
}

function renderKpis() {
  const assigned = tickets.filter((t) => t.tech === ME);
  const done = assigned.filter((t) => t.status === 'resolved').length;
  const queue = myQueue();
  const highCount = queue.filter((t) => t.pri === 'high').length;
  const emergencyCount = queue.filter((t) => t.pri === 'emergency').length;
  const completion = assigned.length ? Math.round((done / assigned.length) * 100) + '%' : '0%';

  $('#kpis').innerHTML =
    kpiCard('ASSIGNED QUEUE', queue.length, `${highCount} high priority`) +
    kpiCard('ACTION REQUIRED', emergencyCount, 'Emergency tickets') +
    kpiCard('SHIFT COMPLETION', completion, `${done} of ${assigned.length} tasks`) +
    kpiCard('AVG RESPONSE TIME', '14.2<span class="small mute">min</span>', 'Faster than benchmark');
}

function queueCard(ticket) {
  return `
    <div class="card hover ticket p-${ticket.pri} ${ticket.id === selected ? 'sel' : ''}" data-id="${ticket.id}">
      <div class="row">
        <span class="mono mute">#${ticket.id}</span>
        <span class="right">${priBadge(ticket.pri)}</span>
      </div>
      <h3 style="margin:6px 0">${esc(ticket.title)}</h3>
      <div class="small mute">${esc(ticket.loc)}</div>
      <div class="small" style="margin-top:6px">Progress: ${ticket.progress}%</div>
    </div>`;
}

function renderQueue() {
  const queue = myQueue();

  $('#tabs').innerHTML = Object.keys(QUEUE_FILTERS)
    .map((key) => {
      const label = key[0].toUpperCase() + key.slice(1);
      const count = queue.filter(QUEUE_FILTERS[key]).length;
      const active = key === filter ? 'on' : '';
      return `<button class="tab ${active}" data-f="${key}">${label} (${count})</button>`;
    })
    .join('');

  $('#queue').innerHTML =
    queue.filter(QUEUE_FILTERS[filter]).map(queueCard).join('') ||
    '<div class="mute">Queue is clear.</div>';
}

function headerCard(ticket) {
  return `
    <div class="card">
      <div class="row wrap">${priBadge(ticket.pri)}${statusBadge(ticket.status)}</div>
      <div class="mono mute" style="margin-top:12px">TICKET #${ticket.id}</div>
      <h1>${esc(ticket.title)}</h1>
      <div class="mute">${esc(ticket.loc)}</div>
    </div>`;
}

function reporterCard(ticket) {
  return `
    <div class="card row">
      <div class="avatar" style="width:48px;height:48px">${initials(ticket.reporter)}</div>
      <div>
        <b>${esc(ticket.reporter)}</b>
        <div class="small mute">Reporter</div>
      </div>
    </div>`;
}

function workflowCard(ticket) {
  const buttons = FLOW.map(
    ([label, status]) =>
      `<button class="btn ${ticket.status === status ? 'on' : ''}" data-s="${status}">${label}</button>`
  ).join('');

  return `
    <div class="card">
      <h2>Execution Workflow</h2>
      <div class="flow" style="margin:16px 0">${buttons}</div>
      <div class="row small">
        <b>Task Completion</b>
        <b class="right" style="color:var(--sky)" id="pct">${ticket.progress}% Complete</b>
      </div>
      <input type="range" id="range" min="0" max="100" step="5" value="${ticket.progress}" style="width:100%;margin-top:8px">
    </div>`;
}

function partRow(part) {
  const color = part.state === 'Installed' ? 'green' : 'amber';
  return `
    <tr>
      <td><b>${esc(part.name)}</b></td>
      <td class="mono">${esc(part.sku)}</td>
      <td>${part.qty}</td>
      <td>${badge(part.state, color)}</td>
    </tr>`;
}

function partsCard(ticket) {
  const rows =
    ticket.parts.map(partRow).join('') ||
    '<tr><td colspan="4" class="mute">No parts logged.</td></tr>';

  return `
    <div class="card">
      <div class="row">
        <h2>Parts & Materials</h2>
        <button class="btn sm right" id="addPart">+ Request Inventory</button>
      </div>
      <table style="margin-top:12px">
        <thead>
          <tr><th>Part</th><th>SKU</th><th>Qty</th><th>Status</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function notesCard(ticket) {
  const notes = ticket.notes
    .map(
      (n) => `
        <div class="note">
          <b>${esc(n.who)}</b>
          <span class="small mute right">${esc(n.time)}</span>
          <div>${esc(n.text)}</div>
        </div>`
    )
    .join('');

  return `
    <div class="card">
      <h2>Audit Trail & Work Notes</h2>
      <textarea id="note" rows="3" placeholder="Diagnosis, measurements, next steps..." style="margin:12px 0"></textarea>
      <button class="btn primary" id="post">Post Entry</button>
      <div style="margin-top:20px">${notes}</div>
    </div>`;
}

function renderDetail() {
  const ticket = findSelected();

  if (!ticket) {
    $('#detail').innerHTML = '<div class="card mute">Select a work order from the queue.</div>';
    return;
  }

  $('#detail').innerHTML =
    headerCard(ticket) +
    reporterCard(ticket) +
    workflowCard(ticket) +
    partsCard(ticket) +
    notesCard(ticket);
}

function render() {
  renderKpis();
  renderQueue();
  renderDetail();
  $('#side').innerHTML = sidebar('Work Orders', ME, 'Field Tech • Fleet #08', myQueue().length);
}

function addNote(ticket, text) {
  ticket.notes.unshift({ who: ME + ' (Field Tech)', time: 'just now', text });
}

$('#tabs').onclick = (e) => {
  const button = e.target.closest('.tab');
  if (!button) return;
  filter = button.dataset.f;
  renderQueue();
};

$('#queue').onclick = (e) => {
  const card = e.target.closest('.ticket');
  if (!card) return;
  selected = card.dataset.id;
  renderQueue();
  renderDetail();
};

$('#detail').onclick = (e) => {
  const ticket = findSelected();
  if (!ticket) return;

  const statusButton = e.target.closest('[data-s]');
  if (statusButton) {
    ticket.status = statusButton.dataset.s;
    if (!ticket.tech) ticket.tech = ME;
    if (ticket.status === 'resolved') ticket.progress = 100;
    addNote(ticket, 'Status set to ' + STATUS[ticket.status][0] + '.');
    save();
    toast('Status updated');
  }

  if (e.target.id === 'post') {
    const text = $('#note').value.trim();
    if (!text) {
      $('#note').classList.add('err');
      return;
    }
    addNote(ticket, text);
    save();
    toast('Entry posted');
  }

  if (e.target.id === 'addPart') {
    const name = prompt('Part description');
    if (name) {
      ticket.parts.push({ name, sku: 'PENDING', qty: 1, state: 'Awaiting Courier' });
      save();
    }
  }
};

$('#detail').oninput = (e) => {
  if (e.target.id === 'range') {
    $('#pct').textContent = e.target.value + '% Complete';
  }
};

$('#detail').onchange = (e) => {
  if (e.target.id !== 'range') return;
  const ticket = findSelected();
  ticket.progress = +e.target.value;
  save();
};

selected = (myQueue()[0] || {}).id || null;
render();