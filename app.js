/* ============================================================
   SATELLITE RADIO CALL – JAVASCRIPT
   Cart, filters, mobile menu, form, animations
   ============================================================ */

/* ── PRODUCT DATA ───────────────────────────────────────────── */
const PRODUCTS = {
  1:  { id: 1,  name: 'Kenwood eXcelon CarPlay 7"',              price: 349.99, img: '101-1024x1024.jpg'          },
  2:  { id: 2,  name: 'Kenwood Apple CarPlay & Backup Cam',      price: 289.99, img: '51.jpg'                     },
  3:  { id: 3,  name: 'Kenwood + Satellite Connect Bundle',      price: 449.99, img: '71.jpg'                     },
  4:  { id: 4,  name: 'Kenwood HD-Radio CarPlay Receiver',       price: 319.99, img: '61.jpg'                     },
  5:  { id: 5,  name: 'Soundstream Reserve + MagiCast Wireless', price: 549.99, img: '91-1024x1024.jpg'          },
  6:  { id: 6,  name: 'Pioneer NEX Touchscreen Receiver',        price: 199.99, img: '81-300x300.jpg'            },
  7:  { id: 7,  name: 'Kenwood BT/FM/USB Single DIN Receiver',  price: 89.99,  img: '111-300x300.jpg'           },
  8:  { id: 8,  name: 'Kenwood CarPlay + Satellite Bundle',      price: 499.99, img: '121.jpg'                    },
  9:  { id: 9,  name: 'SXM MotoRide Chrome Speaker System',     price: 229.99, img: 'product_motorcycle_radio.jpg'    },
  10: { id: 10, name: 'Alpine Halo 9" CarPlay / Android Auto',  price: 649.99, img: 'product_multimedia_receiver.jpg' },
  11: { id: 11, name: 'Kenwood ProDash 7" Touch Receiver',      price: 349.99, img: 'product_radio_1.jpg'             },
  12: { id: 12, name: 'Onyx Plus Satellite Dash Receiver',       price: 89.99,  img: 'product_satellite_radio.jpg'     },
};

/* ── CART STATE ─────────────────────────────────────────────── */
let cart = JSON.parse(localStorage.getItem('sxm_cart_v2') || '[]');

function saveCart() {
  localStorage.setItem('sxm_cart_v2', JSON.stringify(cart));
}

function addToCart(productId) {
  const product = PRODUCTS[productId];
  if (!product) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart();
  renderCart();
  showToast(`✓ Added to cart!`);
  bounceCartBtn();

  // Animate button
  const btn = document.getElementById(`cartBtn${productId}`);
  if (btn) {
    btn.classList.add('added');
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Added!';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = orig;
    }, 1600);
  }
}

function addPlanToCart(planName, price) {
  const id = `plan_${planName.replace(/\s/g, '_')}`;
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name: planName, price, img: '', qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`✓ ${planName} added!`);
  bounceCartBtn();
  setTimeout(openCart, 400);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  saveCart();
  renderCart();
}

function getTotal()  { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function getCount()  { return cart.reduce((s, i) => s + i.qty, 0); }

/* ── RENDER CART ────────────────────────────────────────────── */
function renderCart() {
  const count = getCount();
  const total = getTotal();

  // Update all count displays
  ['navCartCount','cartCountBadge','mobileStickyCount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  });
  const subtotalEl = document.getElementById('cartSubtotal');
  if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;

  const itemsEl  = document.getElementById('cartItems');
  const emptyEl  = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');

  // Remove existing cart items (keep empty message)
  itemsEl.querySelectorAll('.cart-item').forEach(e => e.remove());

  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    if (footerEl) footerEl.style.display = 'none';
  } else {
    emptyEl.style.display = 'none';
    if (footerEl) footerEl.style.display = 'block';

    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      const imgHTML = item.img
        ? `<img src="${item.img}" alt="${item.name}" class="cart-item-img" />`
        : `<div class="cart-item-no-img">📡</div>`;

      div.innerHTML = `
        ${imgHTML}
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="updateQty('${item.id}', -1)" aria-label="Decrease">−</button>
            <span class="qty-display">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}', 1)" aria-label="Increase">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" aria-label="Remove">✕</button>
      `;
      itemsEl.appendChild(div);
    });
  }
}

/* ── CART OPEN/CLOSE ────────────────────────────────────────── */
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function bounceCartBtn() {
  const btn = document.getElementById('cartBtn');
  if (!btn) return;
  btn.style.transform = 'scale(1.25)';
  setTimeout(() => btn.style.transform = '', 220);
}

/* ── BUY NOW ─────────────────────────────────────────────────── */
function buyNow(id) {
  addToCart(id);
  setTimeout(openCart, 350);
}

/* ── CHECKOUT ────────────────────────────────────────────────── */
function checkout() {
  if (!cart.length) return;
  const total = getTotal();
  showToast('🎉 Redirecting to secure checkout…');
  setTimeout(() => {
    alert(`Thank you for your order! 🎉\n\nOrder Total: $${total.toFixed(2)}\n\nTo complete your purchase or need help, please call:\n\n📞 +1 (888) 854-8245\n\nWe're available 24/7!`);
  }, 800);
}

/* ── TOAST ───────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── PRODUCT FILTER ──────────────────────────────────────────── */
function filterProducts(cat) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const map = { all: 'filterAll', receiver: 'filterReceiver', satellite: 'filterSatellite', bundle: 'filterBundle', moto: 'filterMoto' };
  const btn = document.getElementById(map[cat]);
  if (btn) btn.classList.add('active');

  document.querySelectorAll('.product-card').forEach((card, i) => {
    const match = cat === 'all' || card.dataset.category === cat;
    if (match) {
      card.classList.remove('hidden');
      card.style.animation = 'none';
      requestAnimationFrame(() => {
        card.style.animation = `fadeUp .4s ${i * 0.05}s ease both`;
      });
    } else {
      card.classList.add('hidden');
    }
  });
}

/* ── MOBILE MENU ─────────────────────────────────────────────── */
function toggleMobileMenu() {
  const nav  = document.getElementById('navLinks');
  const ham  = document.getElementById('hamburger');
  const open = nav.classList.toggle('open');
  ham.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function closeMobileMenu() {
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── CONTACT FORM ────────────────────────────────────────────── */
function submitForm(e) {
  e.preventDefault();
  const name  = document.getElementById('formName').value.trim();
  const email = document.getElementById('formEmail').value.trim();
  if (!name || !email) { showToast('⚠️ Please fill in all required fields.'); return; }
  const btn = document.getElementById('formSubmitBtn');
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => {
    showToast(`✅ Thank you, ${name}! We'll be in touch soon.`);
    document.getElementById('contactForm').reset();
    btn.textContent = 'Send Message →';
    btn.disabled = false;
  }, 1200);
}

/* ── SCROLL ANIMATIONS ───────────────────────────────────────── */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.service-card, .product-card, .plan-card, .testi-card, .stat-item, .brand-chip, .visual-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = `opacity .5s ${i * 0.06}s ease, transform .5s ${i * 0.06}s ease`;
    observer.observe(el);
  });
}

/* ── SMOOTH SCROLL for hash links ────────────────────────────── */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  const navH = document.getElementById('navbar').offsetHeight;
  window.scrollTo({ top: target.offsetTop - navH - 8, behavior: 'smooth' });
});

/* ── ESC closes cart ────────────────────────────────────────── */
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

/* ── DISCLAIMER BAR ─────────────────────────────────────────── */
function dismissDisclaimer() {
  const bar = document.getElementById('disclaimerBar');
  if (bar) {
    bar.style.maxHeight = bar.scrollHeight + 'px';
    requestAnimationFrame(() => {
      bar.style.transition = 'max-height .4s ease, opacity .4s ease, padding .4s ease';
      bar.style.maxHeight = '0';
      bar.style.opacity = '0';
      bar.style.padding = '0';
      bar.style.overflow = 'hidden';
    });
    setTimeout(() => { bar.classList.add('hidden'); }, 420);
    localStorage.setItem('sxm_disclaimer_dismissed', '1');
  }
}

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  initScrollAnimations();

  // Restore disclaimer bar state
  if (localStorage.getItem('sxm_disclaimer_dismissed') === '1') {
    const bar = document.getElementById('disclaimerBar');
    if (bar) bar.classList.add('hidden');
  }
});
