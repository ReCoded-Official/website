/* Re:Coded — site behaviour. Plain JavaScript, no dependencies. */
(function () {
  'use strict';

  // ---- Settings -----------------------------------------------------------
  // Where contact and fellowship forms are sent (FormSubmit, no account needed).
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/ali@re-coded.com';
  // Turn on only when the site uses analytics or marketing cookies.
  var COOKIE_BANNER = false;

  var BASE = (document.currentScript && document.currentScript.src || '').replace(/assets\/js\/site\.js.*$/, '');
  var page = document.body.getAttribute('data-page');
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var show = function (el, on) { if (el) el.classList.toggle('rc-off', !on); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pill buttons: selected = dark fill, otherwise outline.
  function pill(btn, on, offBg, attr) {
    btn.setAttribute(attr || 'aria-pressed', on ? 'true' : 'false');
    btn.style.background = on ? '#1C1428' : offBg;
    btn.style.color = on ? '#FFFFFF' : '#1C1428';
    btn.style.borderColor = on ? '#1C1428' : '#CFC9D4';
  }

  // ---- Count-up numbers -----------------------------------------------------
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var run = function (el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
      var t0 = performance.now(), d = 1600;
      var step = function (t) {
        var p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(to * e) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); run(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) {
      el.textContent = (el.getAttribute('data-pre') || '') + '0' + (el.getAttribute('data-suf') || '');
      io.observe(el);
    });
  }

  // ---- Statements that fill in as you scroll --------------------------------
  // Grey words darken one by one while the paragraph moves up the screen.
  $$('[data-fill]').forEach(function (p) {
    if (reduceMotion) return;
    var words = [];
    $$('span', p).forEach(function (span) {
      var parts = span.textContent.split(/(\s+)/);
      span.textContent = '';
      parts.forEach(function (t) {
        if (!t) return;
        if (/^\s+$/.test(t)) { span.appendChild(document.createTextNode(t)); return; }
        var w = document.createElement('span');
        w.textContent = t;
        w.style.transition = 'color 0.35s ease';
        w.style.color = '#C9C3CD';
        span.appendChild(w); words.push(w);
      });
    });
    if (!words.length) return;
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = p.getBoundingClientRect(), vh = window.innerHeight;
      // 0 when the top of the paragraph reaches 85% down the screen, 1 when its bottom reaches 45%
      var start = vh * 0.85, end = vh * 0.45;
      var progress = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height)));
      var n = Math.round(progress * words.length);
      words.forEach(function (w, i) { w.style.color = i < n ? '#1C1428' : '#C9C3CD'; });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  });

  // ---- FAQs (one open at a time) -------------------------------------------
  var faqButtons = $$('[data-action="q.toggle"]');
  function setFaq(btn, open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    var icon = $('[data-bind="q.icon"]', btn);
    if (icon) icon.textContent = open ? '−' : '+';
    show($('[data-if="q.open"]', btn.parentNode), open);
  }
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      faqButtons.forEach(function (b) { setFaq(b, false); });
      if (open) setFaq(btn, true);
    });
  });

  // ---- Forms (Contact, Fellowship) -------------------------------------------
  function wireForm(form, onDone) {
    var honey = document.createElement('input');
    honey.type = 'text'; honey.name = '_honey'; honey.tabIndex = -1; honey.autocomplete = 'off';
    honey.setAttribute('aria-hidden', 'true'); honey.style.display = 'none';
    form.appendChild(honey);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('button[type="submit"]', form);
      var err = $('.rc-form-error', form);
      if (err) err.remove();
      if (btn) { btn.disabled = true; btn.dataset.label = btn.dataset.label || btn.innerHTML; btn.textContent = 'Sending…'; }
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'Send failed'); }); })
        .then(function () { form.reset(); onDone(); })
        .catch(function () {
          var p = document.createElement('p');
          p.className = 'rc-form-error'; p.setAttribute('role', 'alert');
          p.innerHTML = 'Sorry, your message didn’t send. Please try again, or email us at <a href="mailto:ali@re-coded.com">ali@re-coded.com</a>.';
          (btn ? btn.parentNode : form).insertBefore(p, btn || null);
        })
        .then(function () { if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; } });
    });
  }

  if (page === 'Contact') {
    var PROMPTS = {
      'Prospective learner': 'Which program are you interested in, and what would you like to know?',
      'Partner or funder': 'What would you like to build or support together?',
      'Employer': 'What roles are you hiring for?',
      'Press': 'What’s your story and deadline?',
      'Something else': 'How can we help?'
    };
    var roleInput = $('input[name="role"]');
    var roles = $$('[data-role]');
    var pickRole = function (r) {
      roles.forEach(function (b) { pill(b, b.getAttribute('data-role') === r, '#FFFFFF'); });
      if (roleInput) roleInput.value = r;
      var pr = $('[data-bind="prompt"]');
      if (pr) pr.textContent = PROMPTS[r];
    };
    roles.forEach(function (b) { b.addEventListener('click', function () { pickRole(b.getAttribute('data-role')); }); });
    var params = new URLSearchParams(location.search);
    if (params.get('role') && PROMPTS[params.get('role')]) pickRole(params.get('role'));
    var cf = $('form[data-submit="send"]');
    if (cf) wireForm(cf, function () { show($('[data-if="notSent"]'), false); show($('[data-if="sent"]'), true); });
    $$('[data-action="reset"]').forEach(function (b) {
      b.addEventListener('click', function () { show($('[data-if="sent"]'), false); show($('[data-if="notSent"]'), true); });
    });
  }

  if (page === 'Fellowship') {
    var nf = $('form[data-submit="notify"]');
    if (nf) wireForm(nf, function () { show($('[data-if="notNotified"]'), false); show($('[data-if="notified"]'), true); });
  }

  // ---- Blog filters ---------------------------------------------------------
  if (page === 'Blog') {
    var cards = $$('[data-idx]');
    var filters = $$('[data-filter]');
    var applyFilter = function (f) {
      filters.forEach(function (b) { pill(b, b.getAttribute('data-filter') === f, 'transparent'); });
      cards.forEach(function (c) {
        var on = f === 'All' ? c.getAttribute('data-idx') !== '0' : c.getAttribute('data-cat') === f;
        c.hidden = !on;
      });
      show($('[data-if="showFeatured"]'), f === 'All' || f === 'Insights');
    };
    filters.forEach(function (b) { b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); }); });
    applyFilter('All');
  }

  // ---- Donate -----------------------------------------------------------------
  if (page === 'Donate' && window.RC_DONATE) {
    var D = window.RC_DONATE, PRESETS = [25, 50, 100, 250];
    var st = { freq: 'monthly', amount: 50 };
    var other = $('#d-other');
    var paint = function () {
      $$('[data-freq]').forEach(function (b) {
        var on = (b.getAttribute('data-freq') === 'Monthly') === (st.freq === 'monthly');
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.style.background = on ? '#FFFFFF' : 'transparent';
      });
      $$('[data-amount]').forEach(function (b) { pill(b, b.getAttribute('data-amount') === '$' + st.amount, '#FFFFFF'); });
      show($('[data-if="showCustom"]'), st.freq === 'once');
      show($('[data-if="showOnceNote"]'), st.freq === 'once');
      var amt = st.amount || 0;
      $('[data-bind="impact"]').textContent = D.impact[amt] || (amt ? 'Every dollar goes where it’s needed most across our programs.' : 'Choose or enter an amount.');
      $('[data-bind="cta"]').textContent = amt ? 'Give $' + amt + (st.freq === 'monthly' ? ' a month' : '') : 'Give';
    };
    var thanks = function (returned) {
      $('[data-bind="thanksText"]').textContent = returned
        ? 'Your gift is confirmed. Stripe will email you a receipt for your records, and every dollar goes where it’s needed most across our programs.'
        : 'Stripe’s secure checkout has opened in a new tab. Finish your gift there, and Stripe will email you a receipt.';
      show($('[data-if="notGiven"]'), false); show($('[data-if="given"]'), true);
    };
    $$('[data-freq]').forEach(function (b) {
      b.addEventListener('click', function () {
        st.freq = b.getAttribute('data-freq') === 'Monthly' ? 'monthly' : 'once';
        if (st.freq === 'monthly' && PRESETS.indexOf(st.amount) < 0) { st.amount = 50; if (other) other.value = ''; }
        paint();
      });
    });
    $$('[data-amount]').forEach(function (b) {
      b.addEventListener('click', function () { st.amount = parseInt(b.getAttribute('data-amount').slice(1), 10); if (other) other.value = ''; paint(); });
    });
    if (other) other.addEventListener('input', function () { var v = parseInt(other.value, 10); st.amount = v > 0 ? v : 0; paint(); });
    var df = $('form[data-submit="give"]');
    if (df) df.addEventListener('submit', function (e) {
      e.preventDefault();
      var amt = st.amount;
      if (!amt) return;
      var url = st.freq === 'monthly' ? D.stripe[amt] : D.stripe.once;
      if (!url) return;
      window.open(url, '_blank', 'noopener');
      thanks(false);
    });
    $$('[data-action="reset"]').forEach(function (b) {
      b.addEventListener('click', function () { show($('[data-if="given"]'), false); show($('[data-if="notGiven"]'), true); });
    });
    paint();
    if (/[?&]thanks=1/.test(location.search)) thanks(true);
  }

  // ---- Policies (tabs + expandable sections) --------------------------------
  if (page === 'Legal' && window.RC_POLICIES) {
    var KEYS = Object.keys(window.RC_POLICIES);
    var setSection = function (wrap, open) {
      var btn = $('[data-action="s.toggle"]', wrap);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var icon = $('[data-bind="s.icon"]', btn);
      if (icon) icon.textContent = open ? '−' : '+';
      show($('[data-if="s.open"]', wrap), open);
    };
    var sectionsOf = function (panel) { return $$('[data-action="s.toggle"]', panel).map(function (b) { return b.parentNode; }); };
    var setAllLabel = function (panel, all) { var l = $('[data-bind="allLabel"]', panel); if (l) l.textContent = all ? 'Collapse all' : 'Expand all'; };
    var selectTab = function (k, openId) {
      var meta = window.RC_POLICIES[k];
      $$('[data-tab]').forEach(function (b) { pill(b, b.getAttribute('data-tab').toLowerCase() === k, 'transparent', 'aria-selected'); });
      $$('[data-tabpanel]').forEach(function (p) {
        var on = p.getAttribute('data-tabpanel') === k;
        p.hidden = !on;
        if (on) { sectionsOf(p).forEach(function (w) { setSection(w, w.id === (openId || k + '-0')); }); setAllLabel(p, false); }
      });
      ['title', 'intro', 'updated'].forEach(function (f) { var el = $('[data-bind="doc.' + f + '"]'); if (el) el.innerHTML = meta[f]; });
      document.title = 'Re:Coded — ' + meta.title;
    };
    var fromHash = function () {
      var h = (location.hash || '').replace('#', '').toLowerCase();
      var k = h.split('-')[0];
      if (KEYS.indexOf(k) < 0) return;
      selectTab(k, /-\d+$/.test(h) ? h : null);
      if (/-\d+$/.test(h)) { var t = document.getElementById(h); if (t) t.scrollIntoView(); }
    };
    $$('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-tab').toLowerCase();
        try { history.replaceState(null, '', '#' + k); } catch (e) {}
        selectTab(k);
      });
    });
    $$('[data-tabpanel]').forEach(function (panel) {
      sectionsOf(panel).forEach(function (w) {
        $('[data-action="s.toggle"]', w).addEventListener('click', function () {
          setSection(w, $('[data-action="s.toggle"]', w).getAttribute('aria-expanded') !== 'true');
        });
      });
      $$('[data-action="toggleAll"]', panel).forEach(function (b) {
        b.addEventListener('click', function () {
          var all = $('[data-bind="allLabel"]', b).textContent.indexOf('Expand') === 0;
          sectionsOf(panel).forEach(function (w) { setSection(w, all); });
          setAllLabel(panel, all);
        });
      });
      $$('[data-action="s.reveal"]', panel).forEach(function (a) {
        a.addEventListener('click', function () { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) setSection(t, true); });
      });
    });
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  // ---- Homepage stories carousel --------------------------------------------
  if (page === 'Reordered') {
    var track = $('[data-track]');
    var prev = $('[data-action="prev"]'), next = $('[data-action="next"]');
    if (track && prev && next) {
      var i = 0, max = track.children.length - 1;
      var move = function () {
        track.style.transform = 'translateX(calc(' + (-i) + ' * (min(780px, 84vw) + 24px)))';
        prev.disabled = i === 0; next.disabled = i === max;
        prev.style.opacity = i === 0 ? 0.45 : 1; next.style.opacity = i === max ? 0.45 : 1;
      };
      prev.addEventListener('click', function () { i = Math.max(0, i - 1); move(); });
      next.addEventListener('click', function () { i = Math.min(max, i + 1); move(); });
      move();
    }
  }

  // ---- Cookie banner ----------------------------------------------------------
  var CONSENT_KEY = 'rc-consent';
  window.rcConsent = function () { try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (e) { return null; } };
  if (COOKIE_BANNER && !window.rcConsent()) {
    var holder = document.createElement('div');
    holder.innerHTML = "<section role=\"dialog\" aria-label=\"Cookie preferences\" style=\"position: absolute; left: 24px; bottom: 24px; width: min(520px, 100% - 48px); box-sizing: border-box; background: rgb(255, 255, 255); border-radius: 24px; padding: 32px; display: flex; flex-direction: column; gap: 20px; box-shadow: rgba(28, 20, 40, 0.25) 0px 20px 60px;\"><div style=\"display: flex; flex-direction: column; gap: 10px;\"><h2 style=\"margin: 0px; font-family: Sentient, Georgia, serif; font-weight: 300; font-size: 30px; letter-spacing: -0.6px;\">We use cookies</h2><p style=\"margin: 0px; font-size: 16px; line-height: 1.55; color: rgb(62, 54, 72);\">Essential cookies keep this site working. With your permission, we also use analytics cookies to understand how people find and use the site. Read our <a href=\"__BASE__policies/#cookies\">cookies policy</a>.</p></div><div data-if=\"manage\" style=\"display:contents\" class=\"rc-off\"><div style=\"display: flex; flex-direction: column;\"><div style=\"display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 16px 0px; border-top: 1px solid rgb(220, 215, 210);\"><div style=\"display: flex; flex-direction: column; gap: 4px;\"><span style=\"font-size: 17px; font-weight: 500;\">Essential</span><span style=\"font-size: 15px; line-height: 1.5; color: rgb(95, 88, 104);\">Needed for the site to work, such as remembering your choices.</span></div><span style=\"flex: 0 0 auto; font-size: 14px; color: rgb(95, 88, 104); padding: 6px 12px; border-radius: 8px; background: rgb(237, 235, 233);\">Always on</span></div><div style=\"display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 16px 0px; border-top: 1px solid rgb(220, 215, 210);\"><div style=\"display: flex; flex-direction: column; gap: 4px;\"><span style=\"font-size: 17px; font-weight: 500;\">Analytics</span><span style=\"font-size: 15px; line-height: 1.5; color: rgb(95, 88, 104);\">Anonymous statistics about which pages are visited.</span></div><button type=\"button\" role=\"switch\" aria-checked=\"false\" aria-label=\"Analytics\" data-action=\"ana.flip\" style=\"flex: 0 0 auto; width: 52px; height: 30px; border-radius: 30px; border: none; padding: 3px; background: rgb(207, 201, 212); cursor: pointer; display: flex; justify-content: flex-start;\"><span style=\"width: 24px; height: 24px; border-radius: 50%; background: rgb(255, 255, 255); display: block;\"></span></button></div><div style=\"display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 16px 0px; border-top: 1px solid rgb(220, 215, 210);\"><div style=\"display: flex; flex-direction: column; gap: 4px;\"><span style=\"font-size: 17px; font-weight: 500;\">Marketing</span><span style=\"font-size: 15px; line-height: 1.5; color: rgb(95, 88, 104);\">Measures our campaigns on social media.</span></div><button type=\"button\" role=\"switch\" aria-checked=\"false\" aria-label=\"Marketing\" data-action=\"mkt.flip\" style=\"flex: 0 0 auto; width: 52px; height: 30px; border-radius: 30px; border: none; padding: 3px; background: rgb(207, 201, 212); cursor: pointer; display: flex; justify-content: flex-start;\"><span style=\"width: 24px; height: 24px; border-radius: 50%; background: rgb(255, 255, 255); display: block;\"></span></button></div></div></div><div style=\"display: flex; flex-wrap: wrap; gap: 10px;\"><button type=\"button\" data-action=\"acceptAll\" style=\"min-height: 48px; padding: 0px 22px; border-radius: 32px; font-family: inherit; font-size: 16px; cursor: pointer; border: none; background: rgb(47, 72, 190); color: rgb(255, 255, 255);\">Accept all</button><button type=\"button\" data-action=\"rejectAll\" style=\"min-height: 48px; padding: 0px 22px; border-radius: 32px; font-family: inherit; font-size: 16px; cursor: pointer; border: none; background: rgb(229, 227, 225); color: rgb(28, 20, 40);\">Reject non-essential</button><button type=\"button\" data-action=\"secondary\" style=\"min-height: 48px; padding: 0px 22px; border-radius: 32px; font-family: inherit; font-size: 16px; cursor: pointer; border: 1px solid rgb(207, 201, 212); background: rgb(255, 255, 255); color: rgb(28, 20, 40);\"><span data-bind=\"secondaryLabel\">Manage</span></button></div></section><div role=\"status\" style=\"position: absolute; left: 24px; bottom: 24px; display: flex; align-items: center; gap: 16px; background: rgb(255, 255, 255); border-radius: 32px; padding: 12px 12px 12px 24px; font-size: 16px;\"><span data-bind=\"savedText\"></span><button type=\"button\" data-action=\"reopen\" style=\"min-height: 48px; padding: 0px 22px; border-radius: 32px; font-family: inherit; font-size: 16px; cursor: pointer; border: none; background: rgb(229, 227, 225); color: rgb(28, 20, 40);\">Show banner again</button></div>".replace(/__BASE__/g, BASE);
    var dialog = $('section[role="dialog"]', holder);
    var status = $('[role="status"]', holder);
    [dialog, status].forEach(function (el) { if (el) { el.classList.add('rc-cookie'); document.body.appendChild(el); } });
    if (status) { show(status, false); var again = $('button', status); if (again) again.remove(); }
    var choice = { analytics: false, marketing: false };
    var save = function (msg) {
      try { localStorage.setItem(CONSENT_KEY, JSON.stringify(choice)); } catch (e) {}
      dialog.remove();
      if (status) {
        var t = $('[data-bind="savedText"]', status); if (t) t.textContent = msg;
        show(status, true); setTimeout(function () { status.remove(); }, 3000);
      }
      document.dispatchEvent(new CustomEvent('rc:consent', { detail: choice }));
    };
    $$('[role="switch"]', dialog).forEach(function (sw) {
      sw.addEventListener('click', function () {
        var k = sw.getAttribute('aria-label').toLowerCase(), on = !choice[k];
        choice[k] = on;
        sw.setAttribute('aria-checked', on ? 'true' : 'false');
        sw.style.background = on ? '#2F48BE' : '#CFC9D4';
        sw.style.justifyContent = on ? 'flex-end' : 'flex-start';
      });
    });
    $('[data-action="acceptAll"]', dialog).addEventListener('click', function () { choice = { analytics: true, marketing: true }; save('All cookies accepted.'); });
    $('[data-action="rejectAll"]', dialog).addEventListener('click', function () { choice = { analytics: false, marketing: false }; save('Only essential cookies are on.'); });
    var sec = $('[data-action="secondary"]', dialog);
    sec.addEventListener('click', function () {
      var manage = $('[data-if="manage"]', dialog);
      if (manage.classList.contains('rc-off')) { show(manage, true); $('[data-bind="secondaryLabel"]', sec).textContent = 'Save choices'; }
      else save('Your choices are saved.');
    });
  }
})();
