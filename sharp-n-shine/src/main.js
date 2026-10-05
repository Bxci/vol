// תפריט נייד, סינון גלריה, מציג תמונות והטופס. ללא תלויות חיצוניות.
(function () {
  var cfg = window.SNS || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // --- תפריט ---
  var toggle = $('.nav-toggle'), nav = $('#site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }

  // --- סינון גלריה ---
  var chips = $$('.chip[data-filter]');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      var f = chip.getAttribute('data-filter'), shown = 0;
      $$('.project').forEach(function (p) {
        var ok = f === 'all' || p.getAttribute('data-service') === f;
        p.hidden = !ok; if (ok) shown++;
      });
      var live = $('#gallery-count');
      if (live) live.textContent = shown + ' פרויקטים מוצגים';
    });
  });

  // --- מציג תמונות ---
  var dlg = $('#lightbox');
  if (dlg && dlg.showModal) {
    var body = $('.lb-media', dlg), cap = $('.lb-cap', dlg), last = null;
    $$('.thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        last = t;
        var media = t.querySelector('img,svg').cloneNode(true);
        media.removeAttribute('width'); media.removeAttribute('height');
        body.replaceChildren(media);
        cap.textContent = t.getAttribute('data-caption') || '';
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    $('.lb-close', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { if (last) last.focus(); });
  }

  // --- טופס יצירת קשר ---
  var form = $('#contact-form');
  if (!form) return;
  var summary = $('#error-summary'), status = $('#form-status');

  var phoneOk = function (v) {
    var d = v.replace(/[\s\-().]/g, '');
    return /^(\+?972|0)5\d{8}$/.test(d) || /^(\+?972|0)[2-4689]\d{7}$/.test(d);
  };
  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'נא להזין שם (לפחות 2 תווים).'; },
    phone: function (v) { return !v.trim() ? 'נא להזין מספר טלפון.' : phoneOk(v) ? '' : 'מספר הטלפון אינו תקין, לדוגמה: 051-220-5703.'; },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'כתובת האימייל אינה תקינה.'; },
    vehicle: function (v) { return v.trim().length >= 2 ? '' : 'נא להזין יצרן, דגם ושנתון.'; },
    service: function (v) { return v ? '' : 'נא לבחור שירות (או "לא בטוח/ה").'; },
    message: function () { return ''; },
    consent: function (v, el) { return el.checked ? '' : 'יש לאשר את הסכמתך לשימוש בפרטים לצורך חזרה אליך.'; },
  };

  function validateField(el) {
    var rule = rules[el.name]; if (!rule) return '';
    var msg = rule(el.value, el);
    var box = document.getElementById(el.id + '-err');
    if (box) box.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return msg;
  }
  var fields = $$('input[name],select[name],textarea[name]', form).filter(function (e) { return rules[e.name]; });
  fields.forEach(function (el) {
    el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid')) validateField(el); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) validateField(el); });
  });

  function buildText() {
    var v = function (n) { return form.elements[n].value.trim(); };
    var svc = form.elements.service.selectedOptions[0].textContent;
    var lines = [
      'שלום חזי, אשמח לייעוץ והצעה.',
      'שם: ' + v('name'),
      'טלפון: ' + v('phone'),
      v('email') ? 'אימייל: ' + v('email') : '',
      'רכב: ' + v('vehicle'),
      'שירות: ' + svc,
      v('message') ? 'פרטים: ' + v('message') : '',
    ].filter(Boolean);
    return lines.join('\n');
  }

  function submitVia(channel) {
    status.textContent = '';
    var errors = [], first = null;
    fields.forEach(function (el) {
      var m = validateField(el);
      if (m) { errors.push({ el: el, m: m }); if (!first) first = el; }
    });
    if (errors.length) {
      summary.innerHTML = '';
      var h = document.createElement('strong'); h.textContent = 'יש לתקן ' + errors.length + ' שדות:'; summary.appendChild(h);
      var ul = document.createElement('ul');
      errors.forEach(function (e) {
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = '#' + e.el.id; a.textContent = e.m;
        a.addEventListener('click', function (ev) { ev.preventDefault(); e.el.focus(); });
        li.appendChild(a); ul.appendChild(li);
      });
      summary.appendChild(ul);
      summary.setAttribute('tabindex', '-1'); summary.focus();
      return;
    }
    summary.innerHTML = '';
    var text = buildText();
    if (channel === 'email') {
      window.location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent('בקשת ייעוץ מהאתר') + '&body=' + encodeURIComponent(text);
      status.textContent = 'נפתחה טיוטת אימייל באפליקציית הדואר שלך. ההודעה תישלח רק אחרי שתלחץ/י "שליחה" שם.';
    } else {
      window.open(cfg.whatsappBase + '&text=' + encodeURIComponent(text), '_blank', 'noopener');
      status.textContent = 'נפתח וואטסאפ עם הודעה מוכנה. ההודעה תישלח רק אחרי שתלחץ/י "שליחה" באפליקציה.';
    }
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); submitVia('whatsapp'); });
  var emailBtn = $('#send-email', form);
  if (emailBtn) emailBtn.addEventListener('click', function () { submitVia('email'); });

  // תמיכה בשירות מוגדר מראש דרך ?service=slug
  var pre = new URLSearchParams(location.search).get('service');
  if (pre && form.elements.service) form.elements.service.value = pre;
})();
