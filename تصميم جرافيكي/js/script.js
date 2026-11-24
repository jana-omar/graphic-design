/* ==========================================================================
   نملية — Namliyah | script.js
   كل التفاعلات تعمل داخل المتصفح فقط (عرض تجريبي) — لا يوجد Backend.
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   أدوات عامة
   -------------------------------------------------------------------------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CURRENCY = 'ر.س';

/** تنسيق السعر مع فصل الرقم عن اسم العملة — أو كلمة «قيد الإضافة» */
function priceHTML(n) {
  if (n === null || n === undefined || n === '') {
    return '<span class="price-tbd">قيد الإضافة</span>';
  }
  return `<span class="amt" dir="ltr">${Number(n).toFixed(2)}</span> <span class="cur">${CURRENCY}</span>`;
}

/** هل السعر متاح؟ */
function hasPrice(n) {
  return n !== null && n !== undefined && n !== '' && !Number.isNaN(Number(n));
}

/** إجمالي السطر: رقم عندما يتوفر السعر، وإلا «قيد الإضافة» */
function lineTotalHTML(item) {
  if (!hasPrice(item.price)) return '<span class="price-tbd">قيد الإضافة</span>';
  return priceHTML(item.qty * item.price);
}

/** هل تحتوي السلة على صنف بلا سعر؟ */
function cartHasUnpriced() {
  return Cart.items.some(i => !hasPrice(i.price));
}

/** توليد فترات الوقت من 5:30 مساءً إلى 3:00 صباحًا كل 30 دقيقة */
function timeSlots() {
  const slots = [];
  const start = 17 * 60 + 30; // 17:30
  const end = 27 * 60;        // 27:00 = 3:00 صباحًا
  for (let m = start; m <= end; m += 30) {
    const mm = m % (24 * 60);
    const h24 = Math.floor(mm / 60);
    const mi = mm % 60;
    const period = h24 < 12 ? 'ص' : 'م';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const value = `${String(h24).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
    const label = `${h12}:${String(mi).padStart(2, '0')} ${period}`;
    slots.push({ value, label });
  }
  return slots;
}

/** تعبئة قائمة اختر الوقت */
function fillTimeSlots(select) {
  if (!select) return;
  const frag = document.createDocumentFragment();
  timeSlots().forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.value;
    opt.textContent = s.label;
    frag.appendChild(opt);
  });
  select.appendChild(frag);
}

/* --------------------------------------------------------------------------
   رسائل Toast
   -------------------------------------------------------------------------- */
const Toast = {
  wrap: null,
  init() {
    this.wrap = $('#toastWrap');
    if (!this.wrap) {
      this.wrap = document.createElement('div');
      this.wrap.className = 'toast-wrap';
      this.wrap.id = 'toastWrap';
      this.wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.wrap);
    }
  },
  /** @param {string} html رسالة (تدعم HTML بسيط) */
  show(html, type = 'info', duration = 2600) {
    if (!this.wrap) this.init();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = html;
    this.wrap.appendChild(el);
    // إبقاء الحد الأقصى 3 رسائل
    while (this.wrap.children.length > 3) this.wrap.firstChild.remove();
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 320);
    }, duration);
  }
};

/* --------------------------------------------------------------------------
   السلة — تعمل عبر localStorage مع ذاكرة بديلة عند تعذّر التخزين
   -------------------------------------------------------------------------- */
const Cart = {
  key: 'namliyah_cart_v1',
  items: [], // { id, nameAr, nameEn, price, image, qty }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      this.items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(this.items)) this.items = [];
    } catch {
      this.items = [];
    }
  },

  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.items)); } catch { /* وضع الذاكرة فقط */ }
  },

  find(id) { return this.items.find(i => i.id === id); },

  qty(id) { const it = this.find(id); return it ? it.qty : 0; },

  count() { return this.items.reduce((s, i) => s + i.qty, 0); },

  total() { return this.items.reduce((s, i) => s + i.qty * Number(i.price || 0), 0); },

  add(item, qty = 1) {
    const found = this.find(item.id);
    if (found) found.qty += qty;
    else this.items.push({ ...item, qty });
    this.save();
  },

  /** عند الوصول إلى صفر أو أقل تُحذف السلعة */
  setQty(id, qty) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) return;
    if (qty <= 0) this.items.splice(idx, 1);
    else this.items[idx].qty = qty;
    this.save();
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  }
};

/* --------------------------------------------------------------------------
   التعامل مع الصور الناقصة (بدون صور بديلة من الخارج)
   -------------------------------------------------------------------------- */
document.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG') e.target.classList.add('is-missing');
}, true);

/** وسم الصور الناقصة بشكل صريح (لضمان إظهار البديل الأنيق) */
function markMissingImages(scope = document) {
  $$('img', scope).forEach(img => {
    if (img.complete && img.naturalWidth === 0) img.classList.add('is-missing');
  });
}

/* --------------------------------------------------------------------------
   قوالب العرض
   -------------------------------------------------------------------------- */

/** صورة متجاوبة: WebP بثلاثة مقاسات + الصورة الأصلية كخيار احتياطي */
function pictureHTML(item, opts = {}) {
  const meta = (typeof IMAGE_META !== 'undefined') ? IMAGE_META[item.image] : null;
  const sizes = opts.sizes || '(max-width: 600px) 100vw, 33vw';
  const loading = opts.eager ? 'eager' : 'lazy';
  const priority = opts.eager ? 'fetchpriority="high"' : '';
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const attrs = `${cls} src="${item.image}" width="${meta ? meta.w : 1400}" height="${meta ? meta.h : 933}" loading="${loading}" decoding="async" ${priority} alt="${item.nameAr}"`;

  if (!meta) return `<img ${attrs}>`;

  const srcset = [480, 900, 1400]
    .map(w => `images/optimized/${meta.slug}-${w}.webp ${w}w`)
    .join(', ');
  return `<picture><source type="image/webp" sizes="${sizes}" srcset="${srcset}"><img ${attrs}></picture>`;
}

function dishCardHTML(item) {
  return `
  <article class="dish-card reveal">
    <div class="media-frame">
      ${pictureHTML(item, { sizes: '(max-width: 600px) 100vw, 33vw' })}
    </div>
    <div class="dish-body">
      <h3 class="dish-name">${item.nameAr}</h3>
      <p class="en dish-en">${item.nameEn}</p>
      ${item.descAr ? `<p class="dish-desc">${item.descAr}</p>` : ''}
      <p class="dish-price">${priceHTML(item.price)}</p>
      <button type="button" class="btn btn-outline" data-add="${item.id}">إضافة إلى الطلب</button>
    </div>
  </article>`;
}

function orderCardHTML(item) {
  const qty = Cart.qty(item.id);
  return `
  <article class="product-card" data-product="${item.id}">
    <div class="product-media media-frame">
      ${pictureHTML(item, { sizes: '110px' })}
    </div>
    <div class="product-info">
      <h3>${item.nameAr}</h3>
      <p class="en">${item.nameEn}</p>
      <p class="product-price">${priceHTML(item.price)}</p>
      <div class="qty">
        <button type="button" class="qty-btn" data-dec="${item.id}" ${qty === 0 ? 'disabled' : ''} aria-label="تقليل الكمية">−</button>
        <span class="qty-value" data-qty="${item.id}">${qty}</span>
        <button type="button" class="qty-btn" data-inc="${item.id}" aria-label="زيادة الكمية">+</button>
      </div>
    </div>
    <button type="button" class="remove-btn" data-remove="${item.id}" ${qty === 0 ? 'hidden' : ''}>إزالة</button>
  </article>`;
}

/* --------------------------------------------------------------------------
   عرض القائمة في الصفحة الرئيسية (أطباق مميزة)
   -------------------------------------------------------------------------- */
function renderFeatured() {
  const grid = $('#featuredGrid');
  if (!grid) return;
  const empty = $('#featuredEmpty');
  const items = (typeof MENU_ITEMS !== 'undefined')
    ? MENU_ITEMS.filter(i => i.featured).slice(0, 4)
    : [];

  if (items.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  grid.innerHTML = items.map(dishCardHTML).join('');
  refreshReveal(grid);
}

/* --------------------------------------------------------------------------
   عرض قائمة الطعام + الفلاتر
   -------------------------------------------------------------------------- */
function renderMenu() {
  const container = $('#menuContainer');
  const bar = $('#filterBar');
  if (!container) return;

  const cats = (typeof CATEGORIES !== 'undefined') ? CATEGORIES : [];
  const items = (typeof MENU_ITEMS !== 'undefined') ? MENU_ITEMS : [];
  const empty = $('#menuEmpty');

  // أزرار الفئات
  if (bar) {
    bar.innerHTML = [`<button type="button" role="tab" aria-selected="true" aria-controls="menuContainer" class="filter-btn active" data-filter="all">الكل</button>`]
      .concat(cats.map(c => `<button type="button" role="tab" aria-selected="false" aria-controls="menuContainer" class="filter-btn" data-filter="${c.id}">${c.nameAr}</button>`))
      .join('');
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      const filter = btn.dataset.filter;
      $$('.filter-btn', bar).forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      $$('.menu-category', container).forEach(sec => {
        sec.classList.toggle('hidden', filter !== 'all' && sec.dataset.category !== filter);
      });
    });
  }

  if (items.length === 0) {
    container.innerHTML = '';
    if (empty) empty.style.display = 'block';
    if (bar) bar.style.display = 'none';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (bar) bar.style.display = 'flex';

  container.innerHTML = cats.map(cat => {
    const list = items.filter(i => i.category === cat.id);
    if (list.length === 0) return '';
    return `
    <section class="menu-category" data-category="${cat.id}">
      <div class="category-head">
        <h2>${cat.nameAr}</h2>
        <span class="en">${cat.nameEn}</span>
      </div>
      <div class="cards-grid">${list.map(dishCardHTML).join('')}</div>
    </section>`;
  }).join('');

  refreshReveal(container);
}

/* --------------------------------------------------------------------------
   عرض منتجات صفحة الطلب
   -------------------------------------------------------------------------- */
function renderOrderProducts() {
  const wrap = $('#orderProducts');
  if (!wrap) return;
  const items = (typeof MENU_ITEMS !== 'undefined') ? MENU_ITEMS : [];
  const emptySec = $('#orderEmptySection');

  if (items.length === 0) {
    wrap.innerHTML = '';
    if (emptySec) emptySec.style.display = 'block';
    return;
  }
  if (emptySec) emptySec.style.display = 'none';
  wrap.innerHTML = items.map(orderCardHTML).join('');
  refreshReveal(wrap);
}

/* --------------------------------------------------------------------------
   بكجات نملية — عرض مختلف في كل صفحة
   -------------------------------------------------------------------------- */
const getCombos = () => (typeof COMBOS !== 'undefined') ? COMBOS : [];

function comboComponentsHTML(combo) {
  return combo.components.map(c => `<li>${c.nameAr}</li>`).join('');
}

function comboDrinkOptions(combo, selected) {
  return combo.drinks.map(d =>
    `<option value="${d.nameAr}" ${d.nameAr === selected ? 'selected' : ''}>${d.nameAr}</option>`
  ).join('');
}

/** الرئيسية — بطاقتان مختصرتان */
function renderComboPromo() {
  const grid = $('#comboPromoGrid');
  if (!grid) return;
  grid.innerHTML = getCombos().map(c => `
    <article class="combo-promo-card reveal">
      <div class="media-frame">
        ${pictureHTML(c, { sizes: '132px' })}
      </div>
      <div class="combo-promo-body">
        <h3>${c.nameAr}</h3>
        <p class="en">${c.nameEn}</p>
        <p>${c.descAr}</p>
        <a class="btn btn-outline" href="menu.html#combos">اكتشف البكجات</a>
      </div>
    </article>`).join('');
  refreshReveal(grid);
}

/** القائمة — بطاقات كاملة بالمكونات والمشروبات والسعر */
function renderMenuCombos() {
  const wrap = $('#comboCards');
  if (!wrap) return;
  wrap.innerHTML = getCombos().map(c => `
    <article class="combo-card reveal">
      <div class="media-frame">
        ${pictureHTML(c, { sizes: '(max-width: 860px) 92vw, 45vw' })}
      </div>
      <div class="combo-card-head">
        <h3>${c.nameAr}</h3>
        <p class="en">${c.nameEn}</p>
      </div>
      <div class="combo-card-body">
        <p class="combo-card-label">المكوّنات</p>
        <ul class="combo-ingredients">${comboComponentsHTML(c)}</ul>
        <div class="combo-drinks">
          <span class="combo-drink-label">المشروبات المتاحة:</span>
          ${c.drinks.map(d => `<span class="combo-drink-pill">${d.nameAr}</span>`).join('')}
        </div>
        <div class="combo-price-row">
          <span>السعر</span>
          <span class="dish-price">${priceHTML(c.price)}</span>
        </div>
        <a class="btn btn-primary" href="order.html#combos">اطلب البكج</a>
      </div>
    </article>`).join('');
  refreshReveal(wrap);
}

/** الطلب — صفوف مختصرة مع اختيار المشروب قبل الإضافة */
function renderOrderCombos() {
  const wrap = $('#comboQuickList');
  if (!wrap) return;
  wrap.innerHTML = getCombos().map(c => `
    <article class="combo-quick-card reveal">
      <div class="media-frame combo-quick-media">
        ${pictureHTML(c, { sizes: '84px' })}
      </div>
      <div class="combo-quick-body">
        <h3>${c.nameAr}</h3>
        <p class="en">${c.nameEn}</p>
        <p class="combo-mini">${c.components.map(x => x.nameAr).join(' · ')}</p>
        <label class="combo-drink-field">
          المشروب:
          <select data-combo-drink="${c.id}" aria-label="اختيار المشروب لبكج ${c.nameAr}">
            ${comboDrinkOptions(c, c.drinks[0] && c.drinks[0].nameAr)}
          </select>
        </label>
      </div>
      <div class="combo-quick-action">
        <span class="dish-price">${priceHTML(c.price)}</span>
        <button type="button" class="btn btn-outline" data-add-combo="${c.id}">إضافة إلى السلة</button>
      </div>
    </article>`).join('');
  refreshReveal(wrap);
}

/* --------------------------------------------------------------------------
   عرض السلة
   -------------------------------------------------------------------------- */
function renderCart() {
  const wrap = $('#cartItems');
  if (!wrap) return;
  const empty = $('#cartEmpty');
  const totalEl = $('#cartTotal');

  if (Cart.items.length === 0) {
    wrap.innerHTML = '';
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
    wrap.innerHTML = Cart.items.map(i => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${i.nameAr}</div>
          ${i.isCombo
            ? `<div class="cart-item-components">${i.components.map(c => c.nameAr).join(' · ')}</div>
               <div class="cart-item-option">المشروب: ${i.drink}</div>`
            : ''}
          <div class="cart-item-meta">${i.qty} × ${priceHTML(i.price)}</div>
        </div>
        <div class="cart-item-end">
          <div class="cart-item-line">${lineTotalHTML(i)}</div>
          <div class="cart-item-actions">
            <button type="button" class="cart-mini" data-dec="${i.id}" aria-label="تقليل كمية ${i.nameAr}">−</button>
            <span class="qty-value">${i.qty}</span>
            <button type="button" class="cart-mini" data-inc="${i.id}" aria-label="زيادة كمية ${i.nameAr}">+</button>
            <button type="button" class="cart-remove" data-remove="${i.id}" aria-label="إزالة ${i.nameAr}">إزالة</button>
          </div>
        </div>
      </div>`).join('');
  }

  if (totalEl) {
    totalEl.innerHTML = cartHasUnpriced()
      ? '<span class="price-tbd">قيد الإضافة</span>'
      : `${Cart.total().toFixed(2)} ${CURRENCY}`;
  }
}

/** تحديث واجهة السلة بعد أي تغيير */
function onCartChange({ message = null, pop = false } = {}) {
  Cart.save();
  renderCart();
  renderOrderProducts();

  if (pop) {
    const qtyEl = $('.qty-value');
    const totalEl = $('#cartTotal');
    [qtyEl, totalEl].forEach(el => {
      if (!el) return;
      el.classList.remove('pop');
      void el.offsetWidth; // إعادة تشغيل الحركة
      el.classList.add('pop');
    });
  }

  if (message) Toast.show(message, 'success');
}

/* --------------------------------------------------------------------------
   أحداث السلة (إضافة / زيادة / تقليل / إزالة)
   -------------------------------------------------------------------------- */
document.addEventListener('click', (e) => {
  const items = (typeof MENU_ITEMS !== 'undefined') ? MENU_ITEMS : [];

  const addBtn = e.target.closest('[data-add]');
  if (addBtn) {
    const item = items.find(i => i.id === addBtn.dataset.add);
    if (!item) { Toast.show('لم يتم العثور على الصنف.', 'error'); return; }
    Cart.add(item, 1);
    onCartChange({ pop: true, message: `تمت إضافة «${item.nameAr}» إلى السلة. <a href="order.html">عرض الطلب</a>` });
    return;
  }

  const addComboBtn = e.target.closest('[data-add-combo]');
  if (addComboBtn) {
    const combo = getCombos().find(c => c.id === addComboBtn.dataset.addCombo);
    if (!combo) { Toast.show('لم يتم العثور على البكج.', 'error'); return; }

    // المشروب يُختار قبل الإضافة، ويدخل ضمن هوية العنصر في السلة
    const select = document.querySelector(`[data-combo-drink="${combo.id}"]`);
    const drink = select ? select.value : combo.drinks[0].nameAr;

    // البكج يُضاف كعنصر واحد: مكوّناته للعرض فقط ولا تُحسب كعناصر منفصلة
    const item = {
      id: `${combo.id}::${drink}`,
      nameAr: combo.nameAr,
      nameEn: combo.nameEn,
      price: combo.price,
      image: combo.image,
      isCombo: true,
      components: combo.components,
      drink: drink
    };
    Cart.add(item, 1);
    onCartChange({ pop: true, message: `تمت إضافة «${combo.nameAr}» إلى السلة. <a href="order.html#combos">عرض البكجات</a>` });
    return;
  }

  const incBtn = e.target.closest('[data-inc]');
  if (incBtn) {
    const id = incBtn.dataset.inc;
    // البكجات لها معرّف مركّب، لذلك نبحث في السلة أيضًا
    const item = items.find(i => i.id === id) || Cart.find(id);
    if (!item) return;
    // إذا لم يكن الصنف في السلة بعد، أضفه؛ وإلا زد الكمية
    if (Cart.qty(id) === 0) Cart.add(item, 1);
    else Cart.setQty(id, Cart.qty(id) + 1);
    onCartChange({ pop: true });
    return;
  }

  const decBtn = e.target.closest('[data-dec]');
  if (decBtn) {
    const id = decBtn.dataset.dec;
    const item = items.find(i => i.id === id) || Cart.find(id);
    const q = Cart.qty(id);
    if (q <= 1) {
      Cart.setQty(id, 0);
      onCartChange({ message: `تمت إزالة «${item ? item.nameAr : 'الصنف'}» من السلة.` });
    } else {
      Cart.setQty(id, q - 1);
      onCartChange({ pop: true });
    }
    return;
  }

  const remBtn = e.target.closest('[data-remove]');
  if (remBtn) {
    const id = remBtn.dataset.remove;
    const item = items.find(i => i.id === id);
    Cart.remove(id);
    onCartChange({ message: `تمت إزالة «${item ? item.nameAr : 'الصنف'}» من السلة.` });
  }
});

/* --------------------------------------------------------------------------
   روابط بديلة جاهزة (الخريطة / إنستغرام) — تُستبدل لاحقًا بالرابط الرسمي
   -------------------------------------------------------------------------- */
function initPlaceholders() {
  $$('[data-placeholder]').forEach(a => {
    a.addEventListener('click', (e) => {
      if (a.getAttribute('href') === '#') {
        e.preventDefault();
        const what = a.dataset.placeholder === 'maps' ? 'الخريطة' : 'حساب Instagram';
        Toast.show(`مكان جاهز — سيُضاف رابط ${what} الرسمي لاحقًا.`, 'info');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   التحقق من الحقول
   -------------------------------------------------------------------------- */
function setError(id, on) {
  const field = document.getElementById(id);
  const err = document.getElementById('err-' + id);
  if (field) field.classList.toggle('invalid', on);
  if (err) err.classList.toggle('show', on);
}

const validName  = v => v.trim().length >= 2;
const validPhone = v => /^[+\d][\d\s-]{7,15}$/.test(v.trim());

/* --------------------------------------------------------------------------
   نموذج الطلب
   -------------------------------------------------------------------------- */
function initOrderForm() {
  const form = $('#orderForm');
  if (!form) return;
  fillTimeSlots($('#orderTime'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameEl = $('#customerName');
    const phoneEl = $('#customerPhone');
    const timeEl = $('#orderTime');
    const pickup = form.querySelector('input[name="pickup"]:checked');

    const checks = [
      ['customerName', validName(nameEl.value)],
      ['customerPhone', validPhone(phoneEl.value)],
      ['orderTime', timeEl.value !== '']
    ];

    let firstBad = null;
    checks.forEach(([id, ok]) => {
      setError(id, !ok);
      if (!ok && !firstBad) firstBad = id;
    });

    let ok = firstBad === null && !!pickup;

    if (Cart.count() === 0) {
      Toast.show('سلتك فارغة — أضف منتجات من القائمة أولًا.', 'error');
      ok = false;
    }

    if (!ok) {
      if (firstBad) document.getElementById(firstBad).focus();
      Toast.show('يرجى استكمال الحقول المطلوبة.', 'error');
      return;
    }

    // بناء ملخص الطلب قبل تفريغ السلة
    const totalText = cartHasUnpriced()
      ? '<span class="price-tbd">قيد الإضافة</span>'
      : `${Cart.total().toFixed(2)} ${CURRENCY}`;
    const list = Cart.items.map(i =>
      `<li>${i.nameAr} × ${i.qty} — ${lineTotalHTML(i)}</li>`
    ).join('');

    const result = $('#orderResult');
    result.innerHTML = `
      <h3>
        <svg class="check-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>
        تم استلام طلبك (تجريبيًا)
      </h3>
      <span class="ref">NML-${Date.now().toString(36).toUpperCase()}</span>
      <ul>${list}</ul>
      <p>الإجمالي: <strong>${totalText}</strong></p>
      <p>وقت الاستلام: ${timeEl.options[timeEl.selectedIndex].text}</p>
      <p class="fine">هذا الطلب تجريبي ولم يُرسل إلى المطعم فعليًا، ولا يتضمن أي عملية دفع.</p>`;
    result.hidden = false;
    result.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });

    Toast.show('تم تأكيد طلبك تجريبيًا.', 'success');

    // تفريغ السلة بعد التأكيد
    Cart.clear();
    renderCart();
    renderOrderProducts();
    form.reset();
  });
}

/* --------------------------------------------------------------------------
   نموذج الحجز + الطاولات
   -------------------------------------------------------------------------- */
const TABLES = [
  { id: 't1', num: '1', cap: 2 },
  { id: 't2', num: '2', cap: 2 },
  { id: 't3', num: '3', cap: 4 },
  { id: 't4', num: '4', cap: 4 },
  { id: 't5', num: '5', cap: 4 },
  { id: 't6', num: '6', cap: 6 },
  { id: 't7', num: '7', cap: 6 },
  { id: 't8', num: '8', cap: 8 }
];
let selectedTable = null;

function renderTables() {
  const grid = $('#tableGrid');
  if (!grid) return;

  grid.innerHTML = TABLES.map(t => `
    <button type="button" class="table-option" role="radio" aria-checked="false" data-table="${t.id}">
      <span class="table-num">${t.num}</span>
      <span class="table-cap">${t.cap} أشخاص</span>
    </button>`).join('');

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.table-option');
    if (!btn) return;
    // منع اختيار أكثر من طاولة
    $$('.table-option', grid).forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-checked', 'true');
    selectedTable = TABLES.find(t => t.id === btn.dataset.table) || null;
    setError('table', false);
    updateSummary();
  });
}

function updateSummary() {
  const name = ($('#guestName') || {}).value || '—';
  const date = ($('#resDate') || {}).value || '—';
  const timeEl = $('#resTime');
  const time = timeEl && timeEl.value ? timeEl.options[timeEl.selectedIndex].text : '—';
  const guests = ($('#guests') || {}).value || '—';
  const table = selectedTable ? `طاولة ${selectedTable.num} (${selectedTable.cap} أشخاص)` : '—';

  const map = { sumName: name, sumDate: date, sumTime: time, sumGuests: guests, sumTable: table };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

function initReservationForm() {
  const form = $('#reservationForm');
  if (!form) return;

  fillTimeSlots($('#resTime'));
  renderTables();
  updateSummary();

  // حد أدنى للتاريخ = اليوم (بتوقيت الجهاز المحلي)
  const dateEl = $('#resDate');
  if (dateEl) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    dateEl.min = local.toISOString().split('T')[0];
  }

  // تحديث الملخص مباشرة
  ['guestName', 'resDate', 'resTime', 'guests'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateSummary);
      el.addEventListener('change', updateSummary);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameEl = $('#guestName');
    const phoneEl = $('#guestPhone');
    const timeEl = $('#resTime');
    const guestsEl = $('#guests');
    const guests = Number(guestsEl.value);

    const checks = [
      ['guestName', validName(nameEl.value)],
      ['guestPhone', validPhone(phoneEl.value)],
      ['resDate', dateEl.value !== '' && dateEl.value >= dateEl.min],
      ['resTime', timeEl.value !== ''],
      ['guests', Number.isInteger(guests) && guests >= 1 && guests <= 8]
    ];

    let firstBad = null;
    checks.forEach(([id, ok]) => {
      setError(id, !ok);
      if (!ok && !firstBad) firstBad = id;
    });
    setError('table', !selectedTable);

    if (firstBad || !selectedTable) {
      if (firstBad) document.getElementById(firstBad).focus();
      Toast.show('يرجى استكمال جميع حقول الحجز واختيار طاولة.', 'error');
      return;
    }

    const result = $('#reservationResult');
    result.innerHTML = `
      <h3>
        <svg class="check-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>
        تم تأكيد حجزك (تجريبيًا)
      </h3>
      <span class="ref">NML-${Date.now().toString(36).toUpperCase()}</span>
      <ul>
        <li>الاسم: ${nameEl.value}</li>
        <li>التاريخ: ${dateEl.value}</li>
        <li>الوقت: ${timeEl.options[timeEl.selectedIndex].text}</li>
        <li>عدد الأشخاص: ${guests}</li>
        <li>الطاولة: طاولة ${selectedTable.num} (${selectedTable.cap} أشخاص)</li>
      </ul>
      <p class="fine">هذا الحجز تجريبي ولا يُرسل إلى المطعم ولا يُعتبر حجزًا حقيقيًا.</p>`;
    result.hidden = false;
    result.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });

    Toast.show('تم تأكيد حجزك تجريبيًا.', 'success');
  });
}

/* --------------------------------------------------------------------------
   Scroll Reveal
   -------------------------------------------------------------------------- */
let revealObserver = null;

function setupReveal() {
  const els = $$('.reveal');
  if (REDUCED || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('is-visible');
      else en.target.classList.remove('is-visible');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => revealObserver.observe(el));
}

/** مراقبة العناصر الجديدة المضافة ديناميكيًا */
function refreshReveal(scope = document) {
  const els = $$('.reveal', scope);
  markMissingImages(scope);
  if (REDUCED || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  if (revealObserver) els.forEach(el => revealObserver.observe(el));
}

/* --------------------------------------------------------------------------
   زر العودة إلى الأعلى
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;
  const toggle = () => btn.classList.toggle('show', window.scrollY > 500);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  });
}

/* --------------------------------------------------------------------------
   التهيئة
   -------------------------------------------------------------------------- */
function init() {
  // السنة في التذييل
  $$('#year').forEach(el => { el.textContent = new Date().getFullYear(); });

  Toast.init();
  Cart.load();

  setupReveal();

  // عرض البيانات حسب الصفحة
  renderFeatured();   // الرئيسية
  renderMenu();       // القائمة
  renderOrderProducts(); // الطلب
  renderCart();       // السلة

  // البكجات — عرض مختلف في كل صفحة
  renderComboPromo();   // الرئيسية
  renderMenuCombos();   // القائمة
  renderOrderCombos();  // الطلب

  initPlaceholders();
  initOrderForm();
  initReservationForm();
  initBackToTop();

  // وسم الصور الناقصة بعد اكتمال التحميل
  markMissingImages();
  window.addEventListener('load', () => markMissingImages());
}

init();
