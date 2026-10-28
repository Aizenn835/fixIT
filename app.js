const TECHS = ['Jordan Miller', 'Marcus Rivera', 'Derek Hayes', 'Sonia Lee', 'Elena Ramos'];

const CATS = {
  elec: ['Electrical', 'bolt', 'Outlets, lighting'],
  hvac: ['AC & Climate', 'mode_fan', 'HVAC, heating'],
  plumb: ['Computer', 'computer', 'booting, blue screen, freezing'],
  furn: ['Furniture', 'chair', 'Desks, locks, doors'],
  wifi: ['Wi-Fi & AV', 'wifi', 'Projectors, network'],
  struct: ['Structural', 'foundation', 'Windows, ceiling, floor'],
};

const STATUS = {
  review: ['Under Review', 'amber'],
  dispatched: ['Dispatched', 'purple'],
  progress: ['In Progress', 'blue'],
  parts: ['Awaiting Parts', 'amber'],
  resolved: ['Resolved', 'green'],
};

const PRI = {
  emergency: ['Emergency', 'rose'],
  high: ['High Priority', 'amber'],
  medium: ['Medium', 'slate'],
  low: ['Low', 'slate'],
};

const SEED = [
  {
    id: 'FIX-2026-0045',
    title: 'Main Electrical Panel Sparking',
    cat: 'elec',
    loc: 'Engineering Quad • ENG 102',
    pri: 'emergency',
    status: 'dispatched',
    progress: 10,
    tech: 'Marcus Rivera',
    reporter: 'Prof. Chen',
    parts: [],
    notes: [
      {
        who: 'Dispatch System',
        time: '48 mins ago',
        text: 'Emergency ticket acknowledged. Central Dispatch issued radio recall.',
      },
    ],
  },
  {
    id: 'FIX-2026-0042',
    title: 'HVAC Leaking Chilled Water',
    cat: 'hvac',
    loc: 'Science & Technology Center • Lab 302',
    pri: 'high',
    status: 'progress',
    progress: 70,
    tech: 'Marcus Rivera',
    reporter: 'Alex Chen',
    parts: [
      { name: 'Standard M6 Pivot Bolt', sku: 'BLT-M6-0091', qty: 2, state: 'Installed' },
      { name: '454-B High CFM Filter', sku: 'FLT-AHU-454', qty: 1, state: 'Awaiting Courier' },
    ],
    notes: [
      {
        who: 'Marcus Rivera',
        time: '18 mins ago',
        text: 'Isolated drain valve. Humidity trending downward.',
      },
      {
        who: 'Alex Chen (Reporter)',
        time: '56 mins ago',
        text: 'Created work order via Faculty Mobile Portal.',
      },
    ],
  },
  {
    id: 'FIX-2026-0040',
    title: 'Broken Classroom Desk Row 3',
    cat: 'furn',
    loc: 'Baker Hall • Lecture Hall B',
    pri: 'low',
    status: 'dispatched',
    progress: 0,
    tech: 'Marcus Rivera',
    reporter: 'Dept. Office',
    parts: [],
    notes: [],
  },
  {
    id: 'FIX-2026-0038',
    title: 'Projector Power Failure',
    cat: 'wifi',
    loc: 'Baker Hall • Lecture Room 105',
    pri: 'medium',
    status: 'review',
    progress: 0,
    tech: '',
    reporter: 'Alex Chen',
    parts: [],
    notes: [
      {
        who: 'Dr. Alan Vance (AV Coordinator)',
        time: 'Yesterday',
        text: 'Replacement bulb requisitioned from central storehouse.',
      },
    ],
  },
  {
    id: 'FIX-2026-0029',
    title: 'Glass Door Stalling',
    cat: 'struct',
    loc: 'Student Union Center • North Vestibule',
    pri: 'medium',
    status: 'resolved',
    progress: 100,
    tech: 'Elena Ramos',
    reporter: 'Alex Chen',
    parts: [],
    notes: [
      {
        who: 'Elena Ramos',
        time: 'Oct 12',
        text: 'Optical sensor recalibrated and safety bumper tested.',
      },
    ],
  },
];

const Store = {
  get() {
    try {
      const raw = localStorage.getItem('fixit.tickets');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return JSON.parse(JSON.stringify(SEED));
  },
  set(tickets) {
    try {
      localStorage.setItem('fixit.tickets', JSON.stringify(tickets));
    } catch (e) {}
  },
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const esc = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const badge = (text, color) => `<span class="badge ${color}">${esc(text)}</span>`;
const statusBadge = (status) => badge(...STATUS[status]);
const priBadge = (priority) => badge(...PRI[priority]);

const initials = (name) =>
  name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('');

const nextId = (tickets) =>
  'FIX-2026-' +
  String(Math.max(...tickets.map((t) => +t.id.slice(-4))) + 1).padStart(4, '0');

function toast(message) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function sidebar(active, name, role, count) {
  const items = [
    ['admin.html', 'dashboard', 'Dashboard'],
    ['staff.html', 'build', 'Work Orders'],
    ['index.html', 'add_circle', 'Submit Request'],
    ['#', 'map', 'Campus Map'],
    ['#', 'bar_chart', 'Analytics'],
  ];

  const links = items
    .map(([href, icon, label]) => {
      const isActive = label === active ? 'on' : '';
      const badgeHtml =
        label === 'Work Orders' && count ? `<span class="count">${count}</span>` : '';
      return `<a class="item ${isActive}" href="${href}"><span class="icon">${icon}</span>${label}${badgeHtml}</a>`;
    })
    .join('');

  return (
    `<div class="logo"><span class="icon">construction</span>FixIt</div>` +
    `<div class="small mute" style="margin-bottom:12px">Campus Facilities</div>` +
    links +
    `<div class="user"><div class="avatar">${initials(name)}</div><div><b>${name}</b><div class="small mute">${role}</div></div></div>`
  );
}