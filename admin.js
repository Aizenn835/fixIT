let tickets = Store.get();
let filter = 'all';

const FILTERS = {
  all: () => true,
  emergency: (t) => t.pri === 'emergency',
  unassigned: (t) => !t.tech,
  progress: (t) => t.status === 'progress',
  resolved: (t) => t.status === 'resolved',
};

const LABEL = {
  all: 'All',
  emergency: 'Emergency',
  unassigned: 'Unassigned',
  progress: 'In Progress',
  resolved: 'Resolved',
};

const COLORS = ['#0369a1', '#0f275c', '#5bb8fe', '#485c94', '#cbd5e1'];

function save() {
  Store.set(tickets);
  render();
}

function kpiCard(label, value, sub, color) {
  return `
    <div class="card kpi" style="border-left-color:${color}">
      <div class="small mute">${label}</div>
      <div class="n">${value}</div>
      <div class="small mute">${sub}</div>
    </div>`;
}

function renderKpis() {
  const open = tickets.filter((t) => t.status !== 'resolved');
  const pending = tickets.filter((t) => t.status === 'review').length;
  const urgent = open.filter((t) => t.pri === 'emergency').length;
  const activeTechs = new Set(open.map((t) => t.tech).filter(Boolean)).size;

  $('#kpis').innerHTML =
    kpiCard('TOTAL OPEN TICKETS', open.length, `${urgent} emergency`, '#0f275c') +
    kpiCard('PENDING TRIAGE', pending, 'Awaiting review', '#f59e0b') +
    kpiCard(
      'ACTIVE IN-FIELD STAFF',
      `${activeTechs}<span class="small mute"> / ${TECHS.length}</span>`,
      'Techs with open work',
      '#10b981'
    ) +
    kpiCard('AVG SLA RESOLUTION', '3.4<span class="small mute">hrs</span>', 'Target: 4.0 hrs', '#0f275c');
}

function assignCell(ticket) {
  if (ticket.status === 'resolved') return esc(ticket.tech);

  const options = TECHS.map(
    (name) => `<option ${name === ticket.tech ? 'selected' : ''}>${name}</option>`
  ).join('');

  return `
    <select data-id="${ticket.id}" class="assign">
      <option value="">+ Assign Tech</option>
      ${options}
    </select>`;
}

function ticketRow(ticket) {
  return `
    <tr class="p-${ticket.pri}">
      <td>
        <div class="mono">${ticket.id}</div>
        ${priBadge(ticket.pri)}
      </td>
      <td>
        <b>${esc(ticket.title)}</b>
        <div class="small mute">${esc(CATS[ticket.cat][0])} • ${esc(ticket.reporter)}</div>
      </td>
      <td class="small">${esc(ticket.loc)}</td>
      <td>${assignCell(ticket)}</td>
      <td>${statusBadge(ticket.status)}</td>
    </tr>`;
}

function renderRows() {
  $('#tabs').innerHTML = Object.keys(FILTERS)
    .map((key) => {
      const count = tickets.filter(FILTERS[key]).length;
      const active = key === filter ? 'on' : '';
      return `<button class="tab ${active}" data-f="${key}">${LABEL[key]} (${count})</button>`;
    })
    .join('');

  const visible = tickets.filter(FILTERS[filter]);

  $('#rows').innerHTML =
    visible.map(ticketRow).join('') ||
    '<tr><td colspan="5" class="mute">No tickets match.</td></tr>';
}

function renderDist() {
  const counts = Object.keys(CATS)
    .map((key) => [CATS[key][0], tickets.filter((t) => t.cat === key).length])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const total = counts.reduce((sum, item) => sum + item[1], 0) || 1;

  $('#dist').innerHTML = counts
    .map(
      ([, count], i) =>
        `<div style="flex:${count || 0.01};background:${COLORS[i]};height:100%;border-radius:4px"></div>`
    )
    .join('');

  $('#legend').innerHTML = counts
    .map(
      ([name, count], i) => `
        <div class="small">
          <i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COLORS[i]}"></i>
          <b>${name}</b> ${Math.round((count / total) * 100)}% (${count})
        </div>`
    )
    .join('');
}

function renderRoster() {
  $('#roster').innerHTML = TECHS.map((name) => {
    const jobs = tickets.filter((t) => t.tech === name && t.status !== 'resolved').length;
    const label = jobs ? 'Dispatched' : 'Available';
    const color = jobs ? 'purple' : 'green';

    return `
      <div class="row">
        <div class="avatar">${initials(name)}</div>
        <div>
          <b>${name}</b>
          <div class="small mute">${jobs} active job${jobs === 1 ? '' : 's'}</div>
        </div>
        <span class="right">${badge(label, color)}</span>
      </div>`;
  }).join('');
}

function renderLedger() {
  $('#ledger').innerHTML = tickets
    .filter((t) => t.notes.length)
    .slice(0, 4)
    .map(
      (t) => `
        <div class="note">
          <b>${esc(t.notes[0].who)}</b>
          <div class="small">${esc(t.notes[0].text)}</div>
          <div class="small mute">${esc(t.notes[0].time)} • ${t.id}</div>
        </div>`
    )
    .join('');
}

function render() {
  renderKpis();
  renderRows();
  renderDist();
  renderRoster();
  renderLedger();

  const openCount = tickets.filter((t) => t.status !== 'resolved').length;
  $('#side').innerHTML = sidebar('Dashboard', 'Dr. Alan Vance', 'Facilities Director', openCount);
}

$('#tabs').onclick = (e) => {
  const button = e.target.closest('.tab');
  if (!button) return;
  filter = button.dataset.f;
  renderRows();
};

$('#rows').onchange = (e) => {
  if (!e.target.classList.contains('assign')) return;

  const ticket = tickets.find((t) => t.id === e.target.dataset.id);
  ticket.tech = e.target.value;

  if (ticket.tech && ticket.status === 'review') ticket.status = 'dispatched';
  if (!ticket.tech && ticket.status === 'dispatched') ticket.status = 'review';

  save();
  toast(ticket.tech ? `${ticket.id} assigned to ${ticket.tech}` : `${ticket.id} unassigned`);
};

$('#export').onclick = () => {
  const header = ['id', 'title', 'location', 'priority', 'status', 'tech'];
  const body = tickets.map((t) => [t.id, t.title, t.loc, t.pri, t.status, t.tech]);

  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = 'fixit-report.csv';
  link.click();
  URL.revokeObjectURL(link.href);
};

render();