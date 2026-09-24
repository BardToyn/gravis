(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const money = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
  const round100 = (n) => Math.round(n / 100) * 100;

  /* ---------- Данные ---------- */
  const MATERIALS = [
    { id: 'gray',   name: 'Карельский гранит', mult: 1,    stone: 'stone-gray' },
    { id: 'gabbro', name: 'Габбро-диабаз',     mult: 1.2,  stone: 'stone-gabbro' },
    { id: 'red',    name: 'Красный гранит',    mult: 1.3,  stone: 'stone-red' },
    { id: 'marble', name: 'Белый мрамор',      mult: 1.15, stone: 'stone-marble' },
  ];
  const SIZES = [
    { id: 's', name: '80×40 см',  mult: 1 },
    { id: 'm', name: '100×50 см', mult: 1.25 },
    { id: 'l', name: '120×60 см', mult: 1.55 },
  ];
  const SHAPES = [
    { id: 'rect',   name: 'Прямая',   price: 0,    cls: '' },
    { id: 'arch',   name: 'Арка',     price: 2500, cls: 'ph--arch' },
    { id: 'figure', name: 'Фигурная', price: 6500, cls: 'ph--figure' },
  ];
  const CHAR_PRICE = 60;
  const PORTRAIT_PRICE = 8500;
  const GOLD_PRICE = 3500;

  const sizeSet = (a, b, c) => [
    { id: 's', name: a, mult: 1 },
    { id: 'm', name: b, mult: 1.25 },
    { id: 'l', name: c, mult: 1.55 },
  ];

  // base — цена при коэффициенте материала 1 и минимальном размере
  const PRODUCTS = {
    klassika: { name: 'Вертикальный памятник «Классика»', base: 18900, material: 'gray',   shape: 'rect' },
    tishina:  { name: 'Памятник-арка «Тишина»',           base: 18350, material: 'gabbro', shape: 'arch' },
    vmeste:   { name: 'Двойной памятник «Вместе»',        base: 32400, material: 'gabbro', fixed: 'ph--double', sizes: sizeSet('100×80 см', '120×100 см', '140×110 см') },
    svet:     { name: 'Памятник «Светлая память»',        base: 23800, material: 'marble', shape: 'arch' },
    rodnye:   { name: 'Семейный комплекс «Родные»',       base: 74000, material: 'gray',   fixed: 'ph--family', sizes: sizeSet('180×120 см', '200×150 см', '240×180 см') },
    angel:    { name: 'Детский памятник «Ангел»',         base: 14700, material: 'marble', fixed: 'ph--child', sizes: sizeSet('60×40 см', '80×40 см', '100×50 см') },
  };

  const byId = (list, id) => list.find((x) => x.id === id);
  const sizesOf = (p) => p.sizes || SIZES;

  function productPrice(p, cfg) {
    const mat = byId(MATERIALS, cfg.material);
    const size = byId(sizesOf(p), cfg.size);
    const shape = p.fixed ? { price: 0 } : byId(SHAPES, cfg.shape);
    const chars = (cfg.text || '').replace(/\s/g, '').length;
    return round100(p.base * mat.mult * size.mult)
      + shape.price
      + chars * CHAR_PRICE
      + (cfg.portrait ? PORTRAIT_PRICE : 0)
      + (cfg.gold ? GOLD_PRICE : 0);
  }

  function visualClass(p, cfg) {
    const mat = byId(MATERIALS, cfg.material);
    const shapeCls = p.fixed || byId(SHAPES, cfg.shape).cls;
    return ['ph', shapeCls, mat.stone].filter(Boolean).join(' ');
  }

  /* ---------- Уведомления ---------- */
  const toastsEl = $('[data-toasts]');
  function toast(title, text = '') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<svg class="i"><use href="#i-check"/></svg><div><strong></strong><span></span></div>`;
    el.querySelector('strong').textContent = title;
    el.querySelector('span').textContent = text;
    toastsEl.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 3800);
  }

  /* ---------- Шапка ---------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Панели, модалки, оверлей ---------- */
  const overlay = $('[data-overlay]');
  let openDrawer = null;
  let lastFocus = null;

  function lock(state) { document.body.classList.toggle('is-locked', state); }

  function showDrawer(el) {
    closeDrawer();
    lastFocus = document.activeElement;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    overlay.hidden = false;
    openDrawer = el;
    lock(true);
    if (el.id === 'mobileMenu') $('[data-menu-open]').setAttribute('aria-expanded', 'true');
    setTimeout(() => el.querySelector('button, a')?.focus(), 50);
  }
  function closeDrawer() {
    if (!openDrawer) return;
    openDrawer.classList.remove('is-open');
    openDrawer.setAttribute('aria-hidden', 'true');
    if (openDrawer.id === 'mobileMenu') $('[data-menu-open]').setAttribute('aria-expanded', 'false');
    openDrawer = null;
    overlay.hidden = true;
    lock(false);
    lastFocus?.focus?.({ preventScroll: true });
  }

  let openModalEl = null;
  function openModal(el) {
    closeDrawer();
    lastFocus = document.activeElement;
    el.hidden = false;
    openModalEl = el;
    lock(true);
    setTimeout(() => el.querySelector('input, button:not(.modal__close)')?.focus(), 60);
  }
  function closeModal() {
    if (!openModalEl) return;
    openModalEl.hidden = true;
    openModalEl = null;
    lock(false);
    lastFocus?.focus?.({ preventScroll: true });
  }

  $('[data-menu-open]').addEventListener('click', () => showDrawer($('#mobileMenu')));
  $$('[data-menu-close]').forEach((b) => b.addEventListener('click', closeDrawer));
  $('[data-cart-open]').addEventListener('click', () => showDrawer($('#cart')));
  $$('[data-cart-close]').forEach((b) => b.addEventListener('click', closeDrawer));
  overlay.addEventListener('click', closeDrawer);
  $$('[data-modal-close]').forEach((b) => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    openModalEl ? closeModal() : closeDrawer();
  });
  window.matchMedia('(min-width: 1100px)').addEventListener('change', (e) => {
    if (e.matches && openDrawer?.id === 'mobileMenu') closeDrawer();
  });

  /* ---------- Корзина ---------- */
  const CART_KEY = 'gravis-cart';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { cart = []; }

  const cartList = $('[data-cart-list]');
  const cartFoot = $('[data-cart-foot]');

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* приватный режим */ }
  }

  function renderCart() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.classList.add('is-bump');
      setTimeout(() => el.classList.remove('is-bump'), 250);
    });
    $('[data-cart-total]').textContent = money(total);
    cartFoot.hidden = cart.length === 0;

    cartList.innerHTML = '';
    cart.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="${item.visual}"></div>
        <div>
          <p class="cart-item__name"></p>
          <p class="cart-item__desc"></p>
        </div>
        <p class="cart-item__price"></p>
        <div class="cart-item__row">
          <div class="qty">
            <button type="button" data-dec aria-label="Уменьшить"><svg class="i"><use href="#i-minus"/></svg></button>
            <span>${item.qty}</span>
            <button type="button" data-inc aria-label="Увеличить"><svg class="i"><use href="#i-plus"/></svg></button>
          </div>
          <button type="button" class="icon-btn cart-item__remove" data-remove aria-label="Удалить"><svg class="i"><use href="#i-trash"/></svg></button>
        </div>`;
      li.querySelector('.cart-item__name').textContent = item.name;
      li.querySelector('.cart-item__desc').textContent = item.desc;
      li.querySelector('.cart-item__price').textContent = money(item.price * item.qty);
      li.querySelector('[data-inc]').addEventListener('click', () => { item.qty++; saveCart(); renderCart(); });
      li.querySelector('[data-dec]').addEventListener('click', () => {
        item.qty--;
        if (item.qty <= 0) cart = cart.filter((x) => x !== item);
        saveCart(); renderCart();
      });
      li.querySelector('[data-remove]').addEventListener('click', () => {
        cart = cart.filter((x) => x !== item);
        saveCart(); renderCart();
      });
      cartList.appendChild(li);
    });
  }

  function addToCart(id, cfg) {
    const p = PRODUCTS[id];
    const mat = byId(MATERIALS, cfg.material);
    const size = byId(sizesOf(p), cfg.size);
    const parts = [mat.name, size.name];
    if (!p.fixed) parts.push(byId(SHAPES, cfg.shape).name.toLowerCase() + ' форма');
    if (cfg.text) parts.push(`надпись «${cfg.text}»`);
    if (cfg.portrait) parts.push('портрет');
    if (cfg.gold) parts.push('золочение');
    const desc = parts.join(' · ');
    const key = id + '|' + desc;
    const existing = cart.find((i) => i.key === key);
    if (existing) existing.qty++;
    else cart.push({ key, id, name: p.name, desc, price: productPrice(p, cfg), qty: 1, visual: visualClass(p, cfg) });
    saveCart();
    renderCart();
    toast('Добавлено в корзину', p.name);
  }

  const defaultCfg = (p) => ({ material: p.material, size: 's', shape: p.shape || 'rect', text: '', portrait: false, gold: false });

  $$('[data-add-cart]').forEach((btn) => btn.addEventListener('click', () => {
    const id = btn.dataset.addCart;
    addToCart(id, defaultCfg(PRODUCTS[id]));
  }));

  $('[data-cart-checkout]').addEventListener('click', () => {
    const summary = cart.map((i) => `${i.name} (${i.desc}) × ${i.qty}`).join('\n');
    openRequest('Оформить заявку', 'Состав заявки', summary);
  });

  renderCart();

  /* ---------- Быстрый просмотр ---------- */
  const qv = $('#quickView');
  const qvPh = $('[data-qv-ph]');
  const qvPrice = $('[data-qv-price]');
  const qvText = $('[data-qv-text]');
  const qvInput = $('[data-qv-input]');
  const qvPortrait = $('[data-qv-portrait]');
  const qvGold = $('[data-qv-gold]');
  let qvId = null;
  let qvCfg = null;

  function renderChips(container, list, current, onPick, withSwatch = false) {
    container.innerHTML = '';
    list.forEach((item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (item.id === current ? ' is-active' : '');
      b.setAttribute('aria-pressed', item.id === current);
      if (withSwatch) {
        const sw = document.createElement('span');
        sw.className = 'chip__swatch ' + item.stone;
        b.appendChild(sw);
      }
      b.append(item.name);
      b.addEventListener('click', () => onPick(item.id));
      container.appendChild(b);
    });
  }

  function updateQv() {
    const p = PRODUCTS[qvId];
    renderChips($('[data-qv-material]'), MATERIALS, qvCfg.material, (id) => { qvCfg.material = id; updateQv(); }, true);
    renderChips($('[data-qv-size]'), sizesOf(p), qvCfg.size, (id) => { qvCfg.size = id; updateQv(); });
    $('[data-qv-shape-group]').hidden = !!p.fixed;
    if (!p.fixed) renderChips($('[data-qv-shape]'), SHAPES, qvCfg.shape, (id) => { qvCfg.shape = id; updateQv(); });

    qvPh.className = visualClass(p, qvCfg);
    qvText.textContent = qvCfg.text;
    qvText.classList.toggle('is-dark', qvCfg.material === 'marble');
    qvText.classList.toggle('is-gold', qvCfg.gold);

    qvPrice.textContent = money(productPrice(p, qvCfg));
    qvPrice.classList.add('is-flash');
    clearTimeout(updateQv.t);
    updateQv.t = setTimeout(() => qvPrice.classList.remove('is-flash'), 300);
  }

  $$('[data-quick]').forEach((btn) => btn.addEventListener('click', () => {
    qvId = btn.dataset.quick;
    qvCfg = defaultCfg(PRODUCTS[qvId]);
    $('[data-qv-title]').textContent = PRODUCTS[qvId].name;
    qvInput.value = '';
    qvPortrait.checked = false;
    qvGold.checked = false;
    updateQv();
    openModal(qv);
  }));
  qvInput.addEventListener('input', () => { qvCfg.text = qvInput.value.trim(); updateQv(); });
  qvPortrait.addEventListener('change', () => { qvCfg.portrait = qvPortrait.checked; updateQv(); });
  qvGold.addEventListener('change', () => { qvCfg.gold = qvGold.checked; updateQv(); });
  $('[data-qv-add]').addEventListener('click', () => {
    addToCart(qvId, { ...qvCfg });
    closeModal();
  });

  /* ---------- Калькулятор ---------- */
  const calcForm = $('#calcForm');
  const steps = $$('.calc-step', calcForm);
  const progress = $$('[data-progress]');
  const btnPrev = $('[data-calc-prev]');
  const btnNext = $('[data-calc-next]');
  const btnSubmit = $('[data-calc-submit]');
  const LAST_INPUT_STEP = 5;
  let step = 1;

  function calcState() {
    const val = (name) => calcForm.querySelector(`input[name="${name}"]:checked`);
    const checked = (name) => $$(`input[name="${name}"]:checked`, calcForm);
    const type = val('type'), material = val('material'), size = val('size'), shape = val('shape'), engraving = val('engraving');
    const decor = checked('decor'), extra = checked('extra');
    const sumPrices = (list) => list.reduce((s, el) => s + Number(el.dataset.price), 0);

    const stone = Number(type.dataset.price) * Number(material.dataset.mult) * Number(size.dataset.mult) + Number(shape.dataset.price);
    const total = round100(stone + Number(engraving.dataset.price) + sumPrices(decor) + sumPrices(extra));

    return {
      total,
      rows: [
        ['Тип', type.value],
        ['Материал', material.value],
        ['Размер', `${size.value}, ${shape.value.toLowerCase()}`],
        ['Гравировка', engraving.value + (decor.length ? ' + декор' : '')],
        ['Дополнительно', extra.length ? extra.map((e) => e.value).join(', ') : 'нет'],
      ],
    };
  }

  function renderCalc() {
    const { total, rows } = calcState();
    const summary = $('[data-calc-summary]');
    summary.innerHTML = '';
    rows.slice(0, Math.min(step, LAST_INPUT_STEP)).forEach(([k, v]) => {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><b></b>';
      li.children[0].textContent = k;
      li.children[1].textContent = v;
      summary.appendChild(li);
    });
    $('[data-calc-total]').textContent = 'от ' + money(total);
    $('[data-calc-range]').textContent = `${money(round100(total * 0.95))} – ${money(round100(total * 1.1))}`;
  }

  function goStep(n) {
    step = Math.max(1, Math.min(n, steps.length));
    steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === step));
    progress.forEach((p) => {
      const i = Number(p.dataset.progress);
      p.classList.toggle('is-active', i === step);
      p.classList.toggle('is-done', i < step);
    });
    btnPrev.hidden = step === 1;
    btnNext.hidden = step > LAST_INPUT_STEP;
    btnSubmit.hidden = step <= LAST_INPUT_STEP;
    btnNext.firstChild.textContent = step === LAST_INPUT_STEP ? 'Показать стоимость' : 'Далее';
    renderCalc();
  }

  btnNext.addEventListener('click', () => {
    goStep(step + 1);
    const calcTop = $('#calc').getBoundingClientRect().top;
    if (calcTop < 0) $('#calc').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  btnPrev.addEventListener('click', () => goStep(step - 1));
  calcForm.addEventListener('change', renderCalc);
  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const phoneField = $('#calcPhone').closest('.field');
    if (!validPhone($('#calcPhone').value)) {
      phoneField.classList.add('is-invalid');
      $('#calcPhone').focus();
      return;
    }
    phoneField.classList.remove('is-invalid');
    toast('Спасибо, заявка принята', 'Специалист перезвонит и подготовит точный расчёт.');
    calcForm.reset();
    goStep(1);
  });
  goStep(1);

  /* ---------- Портфолио ---------- */
  const filters = { material: 'all', type: 'all', year: 'all' };
  const works = $$('[data-portfolio] .work');
  $$('[data-filter]').forEach((group) => {
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', group).forEach((c) => c.classList.toggle('is-active', c === chip));
      filters[group.dataset.filter] = chip.dataset.value;
      let visible = 0;
      works.forEach((w) => {
        const show = Object.entries(filters).every(([k, v]) => v === 'all' || w.dataset[k] === v);
        w.hidden = !show;
        if (show) visible++;
      });
      $('[data-portfolio-empty]').hidden = visible > 0;
    });
  });

  $$('[data-want]').forEach((btn) => btn.addEventListener('click', () => {
    openRequest('Хочу такой же памятник', 'Комментарий', `Хочу такой же: ${btn.dataset.want}`);
  }));

  /* ---------- Слайдеры ---------- */
  $$('[data-slider]').forEach((slider) => {
    const name = slider.dataset.slider;
    const track = $('.slider__track', slider);
    const prev = $(`[data-slider-prev="${name}"]`);
    const next = $(`[data-slider-next="${name}"]`);
    const stepSize = () => {
      const item = track.children[0];
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    };
    const update = () => {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -stepSize() }));
    next.addEventListener('click', () => track.scrollBy({ left: stepSize() }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- FAQ: открыт только один пункт ---------- */
  const accs = $$('.acc');
  accs.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) accs.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ---------- Видео-отзыв ---------- */
  $$('.play-btn').forEach((b) => b.addEventListener('click', () => toast('Видео-отзыв', 'Здесь откроется плеер с видео клиента.')));

  /* ---------- Формы ---------- */
  function validPhone(v) { return v.replace(/\D/g, '').length === 11; }

  function maskPhone(input) {
    input.addEventListener('input', () => {
      let d = input.value.replace(/\D/g, '');
      if (!d) { input.value = ''; return; }
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      let out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ')';
      if (d.length > 4) out += ' ' + d.slice(4, 7);
      if (d.length > 7) out += '-' + d.slice(7, 9);
      if (d.length > 9) out += '-' + d.slice(9, 11);
      input.value = out;
      if (validPhone(out)) input.closest('.field')?.classList.remove('is-invalid');
    });
    input.addEventListener('focus', () => { if (!input.value) input.value = '+7 '; });
    input.addEventListener('blur', () => { if (input.value.trim() === '+7') input.value = ''; });
  }
  $$('[data-phone]').forEach(maskPhone);

  const requestModal = $('#requestModal');
  const rqComment = $('#rqComment');
  function openRequest(title, commentLabel = 'Комментарий', commentValue = '') {
    $('[data-rq-title]').textContent = title;
    $('[data-rq-comment-label]').textContent = commentLabel;
    rqComment.value = commentValue;
    requestModal.dataset.source = title;
    openModal(requestModal);
  }
  $$('[data-request]').forEach((btn) => btn.addEventListener('click', () => {
    openRequest(btn.dataset.request, btn.dataset.requestComment || 'Комментарий');
  }));

  $$('[data-form]').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = form.querySelector('[data-phone]');
    const field = phone.closest('.field');
    if (!validPhone(phone.value)) {
      field.classList.add('is-invalid');
      phone.focus();
      return;
    }
    field.classList.remove('is-invalid');
    const consent = form.querySelector('[name="consent"]');
    if (consent && !consent.checked) {
      toast('Нужно ваше согласие', 'Отметьте согласие на обработку данных, пожалуйста.');
      return;
    }
    const isCartOrder = form.id === 'requestForm' && requestModal.dataset.source === 'Оформить заявку';
    if (isCartOrder) { cart = []; saveCart(); renderCart(); }
    form.reset();
    if (form.id === 'requestForm') closeModal();
    toast('Спасибо, заявка отправлена', 'Мы перезвоним вам в ближайшее время.');
  }));

  /* ---------- Год в подвале ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
