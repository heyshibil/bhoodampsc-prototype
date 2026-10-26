/* Inline SVG icons: outline, 24px grid, 1.75 stroke, round caps (docs/DESIGN_SYSTEM.md §4).
   Drawn in the Lucide/Feather style; a few paths are adapted from those ISC/MIT-licensed sets. */
(function () {
  const BP = (window.BP = window.BP || {});

  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M17 21a8 8 0 0 0-16 0"/><path d="M16 3.1a4 4 0 0 1 0 7.8M23 21a8 8 0 0 0-5-7.4"/>',
    'user-check': '<circle cx="9" cy="8" r="4"/><path d="M17 21a8 8 0 0 0-16 0"/><path d="m16 11 2 2 4-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'arrow-down': '<path d="M12 5v14M18 13l-6 6-6-6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
    'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>',
    'alert-triangle': '<path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/>',
    'help-circle': '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-1"/>',
    crown: '<path d="M2.5 7.5 7 11l5-7 5 7 4.5-3.5L19 18H5L2.5 7.5Z"/><path d="M5 21h14"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    pencil: '<path d="M16.9 3.6a2.1 2.1 0 0 1 3 3L8 18.5l-4.5 2 2-4.5L16.9 3.6Z"/><path d="m15 5.5 3.5 3.5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.3M6.6 6.6A16 16 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    dashboard: '<circle cx="7" cy="7" r="3.5"/><circle cx="17" cy="7" r="3.5"/><circle cx="7" cy="17" r="3.5"/><circle cx="17" cy="17" r="3.5"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M9 21V9"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5v-2Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
    'book-open': '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2V4Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7V4Z"/>',
    'book-marked': '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5v-2Z"/><path d="M10 3v7l2.5-1.5L15 10V3"/>',
    'graduation-cap': '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/>',
    landmark: '<path d="M3 21h18M5 21V11M19 21V11M9.5 21V11M14.5 21V11"/><path d="M12 3 3 8h18l-9-5Z"/>',
    'file-text': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    download: '<path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/>',
    upload: '<path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>',
    newspaper: '<path d="M4 4h13a1 1 0 0 1 1 1v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Z"/><path d="M18 9h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2"/><path d="M8 8h6M8 12h6M8 16h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4M12 2v3"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.9 7 22l5-3 5 3-1.5-8.1"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
    lightbulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h.01M12 18h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    map: '<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Z"/><path d="M9 4v13.5M15 6.5V20"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14"/><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7ZM19 7l-3 7a3.5 3.5 0 0 0 6 0l-3-7Z"/>',
    languages: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1"/><path d="m22 22-5-10-5 10M14 18h6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    'list-checks': '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    'clipboard-check': '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z"/>',
    library: '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4-4L5 21"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    'external-link': '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'shield-check': '<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    smartphone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
    'wifi-off': '<path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-2.3-1.6M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8A15 15 0 0 0 10.7 5M12 20h.01"/>',
    refresh: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13"/>',
    palette: '<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 3.5-4 3.5h-1.5a1.5 1.5 0 0 0-1 2.6A1.5 1.5 0 0 1 12 22Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/>',
    flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>',
    save: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7 3v5h8M7 21v-7h10v7"/>',
    'more-vertical': '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    filter: '<path d="M3 5h18l-7 8.5V20l-4-2v-4.5L3 5Z"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4l-8.7-8.7Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    receipt: '<path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2-3-2Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
    ghost: '<path d="M5 21V11a7 7 0 0 1 14 0v10l-2.3-1.6-2.4 1.6-2.3-1.6-2.3 1.6-2.4-1.6L5 21Z"/><path d="M9.5 11h.01M14.5 11h.01"/>',
    terminal: '<path d="m4 17 6-5-6-5M12 19h8"/>',
    eraser: '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 21"/><path d="M22 21H7M5.5 11.5l7 7"/>',
    /* Stopwatch faces for review speed indicators */
    'speed-fast': '<circle cx="12" cy="13.5" r="7.5"/><path d="M10 2.5h4M12 2.5V6M18.5 6.5 17 8M9.5 12h.01M14.5 12h.01M9 15q3 3 6 0"/>',
    'speed-ontime': '<circle cx="12" cy="13.5" r="7.5"/><path d="M10 2.5h4M12 2.5V6M18.5 6.5 17 8M9.5 12h.01M14.5 12h.01M9.8 15.6q2.2 1.6 4.4 0"/>',
    'speed-slow': '<circle cx="12" cy="13.5" r="7.5"/><path d="M10 2.5h4M12 2.5V6M18.5 6.5 17 8M9.5 12h.01M14.5 12h.01M9.6 17q2.4-2 4.8 0"/>',
    'speed-wrong': '<circle cx="12" cy="13.5" r="7.5"/><path d="M10 2.5h4M12 2.5V6M18.5 6.5 17 8M9.5 12h.01M14.5 12h.01M9.8 16.2h4.4"/>',
  };

  /** Icon names offered in the Admin card icon picker (exam-relevant only). */
  BP.ICON_CHOICES = [
    'book', 'book-open', 'book-marked', 'graduation-cap', 'landmark', 'file-text', 'layers', 'layout',
    'target', 'award', 'star', 'bell', 'download', 'newspaper', 'calendar', 'clock', 'scale', 'flask',
    'globe', 'map', 'calculator', 'languages', 'pencil', 'list', 'folder', 'archive', 'lightbulb', 'megaphone',
  ];

  BP.icon = function (name, cls) {
    const body = P[name] || P.circle;
    return '<svg class="' + (cls || '') + '" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  };
  BP.hasIcon = (name) => Object.prototype.hasOwnProperty.call(P, name);

  /**
   * Clock-face SVG illustrations for speed indicators on review screens.
   * Each clock shows a different hand position to visually represent time spent.
   * color: the accent color for the clock hands and border highlight.
   */
  BP.clockFace = function (speed) {
    const configs = {
      superfast: { color: '#15803D', handAngle: 30, label: '⚡' },
      'on-time': { color: '#0A4FDC', handAngle: 90, label: '' },
      slow: { color: '#B45309', handAngle: 240, label: '' },
      'on-time-incorrect': { color: '#C62828', handAngle: 90, label: '✕' },
    };
    const cfg = configs[speed] || configs['on-time'];
    const r = 15; // clock radius
    const cx = 18, cy = 18;
    // Convert angle to radians (12 o'clock = 0 deg, clockwise)
    const rad = ((cfg.handAngle - 90) * Math.PI) / 180;
    const hx = cx + r * 0.6 * Math.cos(rad);
    const hy = cy + r * 0.6 * Math.sin(rad);
    // Minute hand (shorter)
    const mrad = ((cfg.handAngle * 3 - 90) * Math.PI) / 180;
    const mx = cx + r * 0.4 * Math.cos(mrad);
    const my = cy + r * 0.4 * Math.sin(mrad);
    // Tick marks
    let ticks = '';
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 - 90) * Math.PI / 180;
      const x1 = cx + (r - 2) * Math.cos(a);
      const y1 = cy + (r - 2) * Math.sin(a);
      const x2 = cx + (r - (i % 3 === 0 ? 5 : 3.5)) * Math.cos(a);
      const y2 = cy + (r - (i % 3 === 0 ? 5 : 3.5)) * Math.sin(a);
      ticks += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (i % 3 === 0 ? '#4A4E55' : '#D3D6DB') + '" stroke-width="' + (i % 3 === 0 ? '1.5' : '1') + '" stroke-linecap="round"/>';
    }
    return '<svg class="clock-face" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="' + cfg.color + '" stroke-width="2"/>' +
      ticks +
      '<line x1="' + cx + '" y1="' + cy + '" x2="' + hx + '" y2="' + hy + '" stroke="' + cfg.color + '" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="' + cx + '" y1="' + cy + '" x2="' + mx + '" y2="' + my + '" stroke="' + cfg.color + '" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="2" fill="' + cfg.color + '"/>' +
      (speed === 'on-time-incorrect' ? '<text x="' + cx + '" y="' + (cy + 8) + '" text-anchor="middle" fill="' + cfg.color + '" font-size="7" font-weight="700">✕</text>' : '') +
      '</svg>';
  };

  /* ---------- Brand: the Boodham ghost ----------
     "Boodham" (ഭൂതം) means ghost. A friendly ghost with a scalloped hem, tilted slightly,
     on a blue-to-violet tile. Uses CSS variables so it follows the tokens. */
  let gid = 0;
  BP.logoMark = function (cls) {
    const id = 'bpg' + ++gid;
    return (
      '<svg class="logo-mark ' + (cls || '') + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + '" x1="4" y1="2" x2="46" y2="48" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" style="stop-color:var(--c-brand-light)"/><stop offset=".5" style="stop-color:var(--c-primary)"/><stop offset="1" style="stop-color:var(--c-accent)"/>' +
      '</linearGradient></defs>' +
      '<rect width="48" height="48" rx="14" fill="url(#' + id + ')"/>' +
      '<g transform="rotate(-8 24 24)">' +
      '<path d="M12 19.5a12 12 0 0 1 24 0V35a4 4 0 0 1-8 0 4 4 0 0 1-8 0 4 4 0 0 1-8 0Z" style="fill:var(--c-white)"/>' +
      '<ellipse cx="19.6" cy="21" rx="2.3" ry="3.1" style="fill:var(--c-ink)"/>' +
      '<ellipse cx="28.4" cy="21" rx="2.3" ry="3.1" style="fill:var(--c-ink)"/>' +
      '<circle cx="20.4" cy="19.8" r=".8" style="fill:var(--c-white)"/><circle cx="29.2" cy="19.8" r=".8" style="fill:var(--c-white)"/>' +
      '<path d="M21.5 27.2q2.5 2 5 0" fill="none" style="stroke:var(--c-ink)" stroke-width="1.6" stroke-linecap="round"/>' +
      '</g></svg>'
    );
  };
  BP.logo = function (opts) {
    opts = opts || {};
    const tag = opts.href ? 'a' : 'span';
    const href = opts.href ? ' href="' + opts.href + '" aria-label="BoodhamPSC home"' : '';
    return '<' + tag + ' class="logo ' + (opts.cls || '') + '"' + href + '>' +
      BP.logoMark() + '<span class="logo-word">Boodham<b>PSC</b></span></' + tag + '>';
  };
})();
