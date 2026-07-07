/* ============================================================
   Sweet Confections — app.js
   Cart · Nav · Animations · Filter Tabs · Form
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. CART SYSTEM
     Persisted in sessionStorage so it survives page navigation.
  ---------------------------------------------------------- */
  // Cart stored in memory — persists during the session
  // (uses a shared global so it survives soft navigations if pages are open in the same tab)
  if (!window._scCart) window._scCart = [];
  var cart = window._scCart;

  function saveCart(updatedCart) {
    window._scCart = updatedCart;
  }

  function getCartCount() {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function getCartTotal() {
    return cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
  }

  function updateCartUI() {
    var count = getCartCount();
    var total = getCartTotal();

    // Update all cart count badges across the page
    document.querySelectorAll('#cartCount, .cart-count').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('has-items', count > 0);
    });

    // Update cart total
    var totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '$' + total.toFixed(0);

    // Render cart items
    var itemsEl = document.getElementById('cartItems');
    var footerEl = document.getElementById('cartFooter');
    if (!itemsEl) return;

    if (cart.length === 0) {
      itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty — add something sweet! 🧁</p>';
      if (footerEl) footerEl.style.display = 'none';
    } else {
      itemsEl.innerHTML = cart.map(function (item, i) {
        return (
          '<div class="cart-item">' +
            '<div class="cart-item-info">' +
              '<span class="cart-item-name">' + escapeHtml(item.name) + '</span>' +
              '<span class="cart-item-price">$' + (item.price * item.qty).toFixed(0) + '</span>' +
            '</div>' +
            '<div class="cart-item-controls">' +
              '<button class="cart-qty-btn" data-action="dec" data-index="' + i + '" aria-label="Decrease quantity">−</button>' +
              '<span class="cart-qty">' + item.qty + '</span>' +
              '<button class="cart-qty-btn" data-action="inc" data-index="' + i + '" aria-label="Increase quantity">+</button>' +
              '<button class="cart-remove" data-index="' + i + '" aria-label="Remove item">✕</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      if (footerEl) footerEl.style.display = '';
    }

    saveCart(cart);
  }

  function addToCart(product, name, price) {
    var existing = cart.find(function (item) { return item.product === product; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ product: product, name: name, price: price, qty: 1 });
    }
    updateCartUI();
    openCartDrawer();
    // Brief bounce animation on the count badge
    var badge = document.getElementById('cartCount');
    if (badge) {
      badge.classList.remove('cart-bounce');
      void badge.offsetWidth; // reflow
      badge.classList.add('cart-bounce');
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Delegate cart item controls (qty +/-, remove)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (btn) {
      var idx = parseInt(btn.dataset.index, 10);
      if (isNaN(idx) || !cart[idx]) return;
      if (btn.dataset.action === 'inc') {
        cart[idx].qty += 1;
      } else if (btn.dataset.action === 'dec') {
        cart[idx].qty -= 1;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      }
      updateCartUI();
      return;
    }

    var removeBtn = e.target.closest('.cart-remove');
    if (removeBtn) {
      var removeIdx = parseInt(removeBtn.dataset.index, 10);
      if (!isNaN(removeIdx)) {
        cart.splice(removeIdx, 1);
        updateCartUI();
      }
      return;
    }

    // Add-to-cart buttons
    var addBtn = e.target.closest('.add-to-cart');
    if (addBtn) {
      e.preventDefault();
      var product = addBtn.dataset.product;
      var name    = addBtn.dataset.name;
      var price   = parseFloat(addBtn.dataset.price) || 0;
      if (product) addToCart(product, name, price);
      return;
    }
  });

  /* ----------------------------------------------------------
     2. CART DRAWER
  ---------------------------------------------------------- */
  function openCartDrawer() {
    var drawer   = document.getElementById('cartDrawer');
    var backdrop = document.getElementById('cartBackdrop');
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.classList.add('visible');
    document.body.classList.add('cart-open');
  }

  function closeCartDrawer() {
    var drawer   = document.getElementById('cartDrawer');
    var backdrop = document.getElementById('cartBackdrop');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.classList.remove('visible');
    document.body.classList.remove('cart-open');
  }

  var cartBtn     = document.getElementById('cartBtn');
  var cartClose   = document.getElementById('cartClose');
  var cartBackdrop = document.getElementById('cartBackdrop');

  if (cartBtn)      cartBtn.addEventListener('click', openCartDrawer);
  if (cartClose)    cartClose.addEventListener('click', closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCartDrawer();
  });

  /* ----------------------------------------------------------
     3. HAMBURGER / MOBILE MENU
  ---------------------------------------------------------- */
  var hamburger  = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    if (hamburger) {
      hamburger.classList.add('active');
      hamburger.setAttribute('aria-label', 'Close menu');
    }
    document.body.classList.add('menu-open');
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-label', 'Open menu');
    }
    document.body.classList.remove('menu-open');
  }

  function toggleMobileMenu() {
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  if (hamburger) hamburger.addEventListener('click', toggleMobileMenu);

  // Close mobile menu when a link is clicked
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  /* ----------------------------------------------------------
     4. NAVBAR SCROLL EFFECT
     Adds .scrolled class to .site-header when user scrolls down.
  ---------------------------------------------------------- */
  var siteHeader = document.querySelector('.site-header');
  var lastScrollY = 0;

  function onScroll() {
    var currentScrollY = window.scrollY || window.pageYOffset;

    // Scrolled class for header styling
    if (siteHeader) {
      siteHeader.classList.toggle('scrolled', currentScrollY > 20);
    }

    // Sticky mobile CTA: hide near top, show after scrolling past hero
    var stickyCta = document.getElementById('stickyCta');
    if (stickyCta) {
      stickyCta.classList.toggle('visible', currentScrollY > 400);
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load to set initial state

  /* ----------------------------------------------------------
     5. SCROLL-TRIGGERED FADE-IN ANIMATIONS
     Elements with .fade-in get revealed on scroll via
     IntersectionObserver. The CSS holds the base hidden state.
  ---------------------------------------------------------- */
  var fadeEls = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window && fadeEls.length > 0) {
    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(function (el) { fadeObserver.observe(el); });
  } else {
    // Fallback: show everything immediately
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ----------------------------------------------------------
     6. GALLERY STRIP — pause on hover
     The infinite scroll animation runs in CSS. We pause it when
     the user hovers so they can inspect images.
  ---------------------------------------------------------- */
  var galleryTrack = document.querySelector('.gallery-track');
  if (galleryTrack) {
    galleryTrack.addEventListener('mouseenter', function () {
      galleryTrack.style.animationPlayState = 'paused';
    });
    galleryTrack.addEventListener('mouseleave', function () {
      galleryTrack.style.animationPlayState = 'running';
    });
  }

  /* ----------------------------------------------------------
     7. SHOP PAGE — FILTER TABS
     Filter product cards by data-category attribute.
  ---------------------------------------------------------- */
  var filterTabs = document.querySelectorAll('.filter-tab');

  if (filterTabs.length > 0) {
    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        // Update active state
        filterTabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        var filter = tab.dataset.filter;
        var cards  = document.querySelectorAll('.product-card');

        cards.forEach(function (card) {
          var cat    = card.dataset.category;
          var show   = filter === 'all' || cat === filter;
          card.style.display = show ? '' : 'none';

          // Re-animate visible cards with a stagger
          if (show) {
            card.classList.remove('visible');
            setTimeout(function () { card.classList.add('visible'); }, 30);
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     8. ORDER FORM — submission handler
     Validates required fields, shows success state, and
     pre-populates a hidden "cart items" summary field.
  ---------------------------------------------------------- */
  var orderForm = document.getElementById('orderForm');
  var formSuccess = document.getElementById('formSuccess');

  if (orderForm) {
    // If there's a cart summary field, populate it
    var cartSummaryField = document.getElementById('cartSummary');
    if (cartSummaryField && cart.length > 0) {
      var summaryLines = cart.map(function (item) {
        return item.name + ' x' + item.qty + ' ($' + (item.price * item.qty).toFixed(0) + ')';
      });
      summaryLines.push('Total: $' + getCartTotal().toFixed(0));
      cartSummaryField.value = summaryLines.join('\n');
    }

    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot — real users can't fill a hidden field, bots will
      var honeypot = orderForm.querySelector('input[name="bot-field"]');
      if (honeypot && honeypot.value) {
        // Silently pretend it worked so bots don't retry
        orderForm.style.display = 'none';
        if (formSuccess) formSuccess.style.display = '';
        return;
      }

      // Basic required-field validation
      var valid = true;
      orderForm.querySelectorAll('[required]').forEach(function (field) {
        if (!field.value.trim()) {
          valid = false;
          field.classList.add('field-error');
          field.addEventListener('input', function () {
            field.classList.remove('field-error');
          }, { once: true });
        }
      });

      if (!valid) {
        var firstError = orderForm.querySelector('.field-error');
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Submit to Netlify Forms via fetch (keeps user on the page)
      var submitBtn = orderForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      var formData = new FormData(orderForm);
      var body = new URLSearchParams(formData).toString();

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      })
      .then(function (response) {
        if (!response.ok) throw new Error('Network response was not ok');
        // Success
        orderForm.style.display = 'none';
        if (formSuccess) {
          formSuccess.style.display = '';
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Clear the cart
        cart.length = 0;
        window._scCart = cart;
        updateCartUI();
      })
      .catch(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Order Request →'; }
        alert('Sorry, something went wrong sending your order. Please email sctreatsshop@gmail.com directly.');
      });
    });
  }

  /* ----------------------------------------------------------
     9. SMOOTH ANCHOR SCROLLING
     Handles internal hash links with smooth scrolling and
     offset for the fixed nav bar.
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = anchor.getAttribute('href').slice(1);
      if (!targetId) return;
      var target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      var navHeight = siteHeader ? siteHeader.offsetHeight : 80;
      var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
      closeMobileMenu();
    });
  });

  /* ----------------------------------------------------------
     10. INITIAL CART RENDER
     Sync cart badge and drawer on every page load.
  ---------------------------------------------------------- */
  updateCartUI();

})();

/* ----------------------------------------------------------
   DYNAMIC STYLES — injected at runtime so they don't
   require changes to style.css for JS-only states.
---------------------------------------------------------- */
(function injectCartStyles() {
  var style = document.createElement('style');
  style.textContent = [
    /* Cart drawer open/close */
    '.cart-drawer { position: fixed; top: 0; right: -400px; width: 380px; max-width: 100vw; height: 100vh; background: #fffcf9; z-index: 1100; display: flex; flex-direction: column; transition: right 0.35s cubic-bezier(0.4,0,0.2,1); box-shadow: -8px 0 40px rgba(201,116,138,0.18); }',
    '.cart-drawer.open { right: 0; }',
    '.cart-drawer-inner { display: flex; flex-direction: column; height: 100%; }',
    '.cart-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #fce8ef; }',
    '.cart-header h3 { font-family: "Playfair Display", serif; font-size: 1.25rem; color: #7a4f3a; margin: 0; }',
    '.cart-close { background: none; border: none; font-size: 1.2rem; color: #c9748a; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 50%; transition: background 0.2s; }',
    '.cart-close:hover { background: #fce8ef; }',
    '.cart-items { flex: 1; overflow-y: auto; padding: 1rem 1.5rem; }',
    '.cart-empty { text-align: center; color: #a85870; font-size: 0.95rem; padding: 2rem 0; }',
    '.cart-item { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.75rem 0; border-bottom: 1px solid #fce8ef; }',
    '.cart-item:last-child { border-bottom: none; }',
    '.cart-item-info { display: flex; justify-content: space-between; align-items: center; }',
    '.cart-item-name { font-size: 0.9rem; color: #7a4f3a; font-weight: 500; }',
    '.cart-item-price { font-size: 0.9rem; color: #c9748a; font-weight: 600; }',
    '.cart-item-controls { display: flex; align-items: center; gap: 0.5rem; }',
    '.cart-qty-btn { width: 28px; height: 28px; border: 1.5px solid #f2b8c6; background: #fff; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; color: #c9748a; transition: background 0.2s, border-color 0.2s; line-height: 1; }',
    '.cart-qty-btn:hover { background: #fce8ef; border-color: #c9748a; }',
    '.cart-qty { min-width: 24px; text-align: center; font-size: 0.9rem; color: #7a4f3a; font-weight: 600; }',
    '.cart-remove { margin-left: auto; background: none; border: none; color: #c9748a; cursor: pointer; font-size: 0.85rem; padding: 0.2rem 0.4rem; border-radius: 4px; transition: background 0.2s; }',
    '.cart-remove:hover { background: #fce8ef; }',
    '.cart-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #fce8ef; }',
    '.cart-total { display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 700; color: #7a4f3a; margin-bottom: 1rem; }',
    '.cart-note { font-size: 0.78rem; color: #a85870; margin-top: 0.75rem; text-align: center; }',
    /* Backdrop */
    '.cart-backdrop { position: fixed; inset: 0; background: rgba(122,79,58,0.35); z-index: 1099; opacity: 0; pointer-events: none; transition: opacity 0.3s; }',
    '.cart-backdrop.visible { opacity: 1; pointer-events: auto; }',
    /* Body states */
    'body.cart-open, body.menu-open { overflow: hidden; }',
    /* Cart count badge */
    '.cart-count { position: absolute; top: -6px; right: -6px; background: #c9748a; color: #fff; font-size: 0.65rem; font-weight: 700; min-width: 18px; height: 18px; border-radius: 999px; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.5); transition: opacity 0.2s, transform 0.2s; pointer-events: none; }',
    '.cart-count.has-items { opacity: 1; transform: scale(1); }',
    '@keyframes cartBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.5)} }',
    '.cart-bounce { animation: cartBounce 0.35s ease; }',
    /* Cart button wrapper */
    '.cart-btn { position: relative; background: none; border: none; cursor: pointer; color: #7a4f3a; display: flex; align-items: center; padding: 0.4rem; }',
    /* Mobile menu — dropdown under nav, controlled by style.css display:none / display:flex */
    /* Hamburger active state */
    '.hamburger { background: none; border: none; cursor: pointer; display: none; flex-direction: column; gap: 5px; padding: 0.4rem; }',
    '.hamburger span { display: block; width: 24px; height: 2px; background: #7a4f3a; border-radius: 2px; transition: transform 0.3s, opacity 0.3s; }',
    '.hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }',
    '.hamburger.active span:nth-child(2) { opacity: 0; }',
    '.hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }',
    '@media(max-width:768px) { .hamburger { display: flex; } .nav-links { display: none; } .nav-order-btn { display: none; } }',
    /* Sticky mobile CTA */
    '.sticky-mobile-cta { position: fixed; bottom: 0; left: 0; right: 0; padding: 0.875rem 1rem; background: #fffcf9; border-top: 1px solid #fce8ef; z-index: 900; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); display: none; box-shadow: 0 -4px 24px rgba(201,116,138,0.15); }',
    '@media(max-width:768px) { .sticky-mobile-cta { display: block; } }',
    '.sticky-mobile-cta.visible { transform: translateY(0); }',
    /* Header scrolled state */
    '.site-header { transition: box-shadow 0.3s, background 0.3s; }',
    '.site-header.scrolled { box-shadow: 0 4px 30px rgba(201,116,138,0.12); background: rgba(255,252,249,0.98); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }',
    /* Fade-in animation */
    '.fade-in { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }',
    '.fade-in.visible { opacity: 1; transform: translateY(0); }',
    /* Filter tabs */
    '.filter-tab { background: none; border: 1.5px solid #f2b8c6; border-radius: 999px; padding: 0.5rem 1.25rem; font-size: 0.875rem; cursor: pointer; color: #a85870; transition: all 0.2s; font-family: "DM Sans", sans-serif; }',
    '.filter-tab:hover { border-color: #c9748a; color: #c9748a; background: #fce8ef; }',
    '.filter-tab.active { background: #c9748a; border-color: #c9748a; color: #fff; font-weight: 600; }',
    /* Form error state */
    '.field-error { border-color: #e05a7a !important; box-shadow: 0 0 0 3px rgba(224,90,122,0.15) !important; }',
  ].join('\n');
  document.head.appendChild(style);
})();
