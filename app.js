/* ============================================================
   Sweet Confections — app.js
   Cart · Nav · Animations · Filter Tabs · Form
   ============================================================ */

(function () {
  'use strict';

  /* Keep the footer copyright year current without a yearly edit. */
  (function () {
    var y = String(new Date().getFullYear());
    document.querySelectorAll('.js-year').forEach(function (el) { el.textContent = y; });
  })();

  /* ----------------------------------------------------------
     1. CART SYSTEM
     Persisted in sessionStorage so it survives page navigation.
  ---------------------------------------------------------- */
  var CART_KEY = 'scCart';
  var cart;
  try {
    cart = JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    cart = [];
  }
  if (!Array.isArray(cart)) cart = [];

  function saveCart(updatedCart) {
    // sessionStorage can throw in private browsing — the cart still works within the page
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
    } catch (e) {}
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
    updateFormCartSummary();
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
  // Shared modal focus helpers: keep Tab inside an open overlay and
  // restore focus to whatever opened it when it closes.
  function focusableWithin(container) {
    var sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(container.querySelectorAll(sel), function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0;
    });
  }
  function keepFocusInside(container, e) {
    if (e.key !== 'Tab') return;
    var f = focusableWithin(container);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  var cartReturnFocus = null;

  function openCartDrawer() {
    var drawer   = document.getElementById('cartDrawer');
    var backdrop = document.getElementById('cartBackdrop');
    if (!drawer) return;
    cartReturnFocus = document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.inert = false;
    if (backdrop) backdrop.classList.add('visible');
    document.body.classList.add('cart-open');
    var closeBtn = document.getElementById('cartClose');
    if (closeBtn) closeBtn.focus();
  }

  function closeCartDrawer() {
    var drawer   = document.getElementById('cartDrawer');
    var backdrop = document.getElementById('cartBackdrop');
    if (!drawer) return;
    var wasOpen = drawer.classList.contains('open');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    if (backdrop) backdrop.classList.remove('visible');
    document.body.classList.remove('cart-open');
    if (wasOpen && cartReturnFocus && typeof cartReturnFocus.focus === 'function') cartReturnFocus.focus();
    cartReturnFocus = null;
  }

  var cartBtn     = document.getElementById('cartBtn');
  var cartClose   = document.getElementById('cartClose');
  var cartBackdrop = document.getElementById('cartBackdrop');

  if (cartBtn)      cartBtn.addEventListener('click', openCartDrawer);
  if (cartClose)    cartClose.addEventListener('click', closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);

  /* ----------------------------------------------------------
     3. HAMBURGER / MOBILE MENU
  ---------------------------------------------------------- */
  var hamburger  = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  var menuReturnFocus = null;

  function openMobileMenu() {
    if (!mobileMenu) return;
    menuReturnFocus = document.activeElement;
    mobileMenu.classList.add('open');
    if (hamburger) {
      hamburger.classList.add('active');
      hamburger.setAttribute('aria-label', 'Close menu');
      hamburger.setAttribute('aria-expanded', 'true');
    }
    document.body.classList.add('menu-open');
    var firstLink = mobileMenu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMobileMenu(restoreFocus) {
    if (!mobileMenu) return;
    var wasOpen = mobileMenu.classList.contains('open');
    mobileMenu.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-label', 'Open menu');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('menu-open');
    if (wasOpen && restoreFocus !== false && menuReturnFocus && typeof menuReturnFocus.focus === 'function') menuReturnFocus.focus();
    menuReturnFocus = null;
  }

  function toggleMobileMenu() {
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  if (hamburger) hamburger.addEventListener('click', toggleMobileMenu);

  // Close mobile menu when a link is clicked (link navigates, so don't yank focus back)
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeMobileMenu(false); });
    });
  }

  // Escape closes any open overlay; Tab is trapped inside it while open.
  document.addEventListener('keydown', function (e) {
    var drawer = document.getElementById('cartDrawer');
    var drawerOpen = drawer && drawer.classList.contains('open');
    var menuOpen = mobileMenu && mobileMenu.classList.contains('open');
    if (e.key === 'Escape') {
      if (drawerOpen) closeCartDrawer();
      if (menuOpen) closeMobileMenu();
    } else if (e.key === 'Tab') {
      if (drawerOpen) keepFocusInside(drawer, e);
      else if (menuOpen) keepFocusInside(mobileMenu, e);
    }
  });

  // If the viewport grows past the mobile breakpoint while the menu is open,
  // close it so the scroll-lock doesn't strand a desktop user.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && mobileMenu && mobileMenu.classList.contains('open')) {
      closeMobileMenu(false);
    }
  });

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
          t.setAttribute('aria-pressed', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed', 'true');

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

  // Mirror the cart into the hidden #cartSummary field (submitted to Netlify)
  // and the visible #cartSummaryBox. Runs via updateCartUI on every cart change.
  function updateFormCartSummary() {
    var cartSummaryField = document.getElementById('cartSummary');
    var summaryBox = document.getElementById('cartSummaryBox');
    var formCartItems = document.getElementById('formCartItems');
    if (!cartSummaryField && !summaryBox) return;

    if (cart.length === 0) {
      if (cartSummaryField) cartSummaryField.value = '';
      if (formCartItems) formCartItems.textContent = '';
      if (summaryBox) summaryBox.style.display = 'none';
      return;
    }

    var summaryLines = cart.map(function (item) {
      return item.name + ' x' + item.qty + ' ($' + (item.price * item.qty).toFixed(0) + ')';
    });
    summaryLines.push('Total: $' + getCartTotal().toFixed(0));

    if (cartSummaryField) cartSummaryField.value = summaryLines.join('\n');
    if (formCartItems) {
      formCartItems.textContent = '';
      summaryLines.forEach(function (line) {
        var div = document.createElement('div');
        div.textContent = line;
        formCartItems.appendChild(div);
      });
    }
    if (summaryBox) summaryBox.style.display = '';
  }

  if (orderForm) {
    // JS is available, so take over validation from the browser to show
    // friendly inline messages. No-JS visitors keep native HTML5 checks.
    orderForm.setAttribute('novalidate', 'novalidate');

    // Orders need 24-48h notice: constrain the native date picker too.
    // Build YYYY-MM-DD from local parts — toISOString() is UTC and can
    // land on the wrong day for evening visitors.
    function localISO(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    var pickupField = document.getElementById('pickupDate');
    if (pickupField) {
      var minDay = new Date();
      minDay.setDate(minDay.getDate() + 1);
      pickupField.min = localISO(minDay);
      var maxDay = new Date();
      maxDay.setFullYear(maxDay.getFullYear() + 2);
      pickupField.max = localISO(maxDay);
    }

    function setFieldError(field, message) {
      field.classList.add('field-error');
      field.setAttribute('aria-invalid', 'true');
      var msg = document.getElementById(field.id + '-error');
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'field-error-msg';
        msg.id = field.id + '-error';
        var group = field.closest('.form-group') || field.parentElement;
        group.appendChild(msg);
        var describedBy = field.getAttribute('aria-describedby');
        field.setAttribute('aria-describedby', describedBy ? describedBy + ' ' + msg.id : msg.id);
      }
      msg.textContent = message;
    }

    function clearFieldError(field) {
      field.classList.remove('field-error');
      field.removeAttribute('aria-invalid');
      var msg = document.getElementById(field.id + '-error');
      if (msg) msg.textContent = '';
    }

    // Returns a message describing what's wrong with a field, or '' if valid
    function fieldError(field) {
      var v = field.value.trim();
      switch (field.id) {
        case 'firstName':
          return v ? '' : 'Please enter your first name.';
        case 'lastName':
          return v ? '' : 'Please enter your last name.';
        case 'email':
          if (!v) return 'Please enter your email address.';
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'That email doesn’t look right — please double-check it.';
        case 'phone':
          if (!v) return '';
          var digits = v.replace(/\D/g, '');
          return (digits.length >= 7 && digits.length <= 15) ? '' : 'That phone number doesn’t look right — please double-check it.';
        case 'orderType':
          return v ? '' : 'Please choose what you’d like to order.';
        case 'pickupDate': {
          if (!v) return 'Please pick your desired pickup or event date.';
          var parts = v.split('-');
          var picked = new Date(parts[0], parts[1] - 1, parts[2]);
          if (isNaN(picked.getTime())) return 'Please pick a valid date.';
          var today = new Date();
          today.setHours(0, 0, 0, 0);
          var earliest = new Date(today);
          earliest.setDate(earliest.getDate() + 1);
          if (picked < earliest) return 'Orders need at least 24–48 hours notice — please choose a later date.';
          var latest = new Date(today);
          latest.setFullYear(latest.getFullYear() + 2);
          if (picked > latest) return 'That date is more than two years away — please double-check the year.';
          return '';
        }
        case 'orderDetails':
          if (!v) return 'Please tell us a little about your order.';
          if (v.length < 10) return 'Please add a few more details — flavors, servings, allergies, theme…';
          return '';
        default:
          return (field.hasAttribute('required') && !v) ? 'This field is required.' : '';
      }
    }

    // Lead-time hint under the date field follows the selected order type
    var orderTypeField = document.getElementById('orderType');
    var pickupHint = document.getElementById('pickupDateHint');
    if (orderTypeField && pickupHint) {
      var defaultHint = pickupHint.textContent;
      var LEAD_TIMES = {
        'custom-cake': 'Custom cakes need about 1 week of lead time.',
        'event-package': 'Wedding & event packages need 2–4 weeks of lead time.',
        'cake-bar': 'Cake bar bookings need 2–4 weeks of lead time.',
        'cupcakes': 'Cupcakes need 24–48 hours notice.',
        'cookies': 'Cookies need 24–48 hours notice.',
        'brownies': 'Brownies need 24–48 hours notice.',
        'cinnamon-rolls': 'Cinnamon rolls need 24–48 hours notice.',
        'brunch-box': 'Brunch boxes need 24–48 hours notice.'
      };
      orderTypeField.addEventListener('change', function () {
        pickupHint.textContent = LEAD_TIMES[orderTypeField.value] || defaultHint;
      });
    }

    // Prefill the order type when arriving from an events-page "Inquire" link
    // (e.g. contact.html?type=cake-bar#order). Only accept a value that is a
    // real <option>, then sync the lead-time hint.
    if (orderTypeField) {
      try {
        var wantType = new URLSearchParams(window.location.search).get('type');
        if (wantType && orderTypeField.querySelector('option[value="' + wantType.replace(/[^a-z-]/g, '') + '"]')) {
          orderTypeField.value = wantType;
          orderTypeField.dispatchEvent(new Event('change'));
        }
      } catch (e) {}
    }

    var validatedFields = orderForm.querySelectorAll('input:not([type="hidden"]):not([name="bot-field"]), select, textarea:not(#cartSummary)');
    validatedFields.forEach(function (field) {
      // Only flag on blur when the field has content ("reward early,
      // punish late") — empty required fields get caught on submit.
      field.addEventListener('blur', function () {
        if (!field.value.trim()) return;
        var err = fieldError(field);
        if (err) setFieldError(field, err); else clearFieldError(field);
      });
      field.addEventListener('input', function () { clearFieldError(field); });
      field.addEventListener('change', function () { clearFieldError(field); });
    });

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

      // Validate every field and show inline messages
      var firstInvalid = null;
      validatedFields.forEach(function (field) {
        var err = fieldError(field);
        if (err) {
          setFieldError(field, err);
          if (!firstInvalid) firstInvalid = field;
        } else {
          clearFieldError(field);
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    /* NOTE: nav/hamburger DISPLAY is owned entirely by style.css (breakpoint 900px).
       Only the hamburger→X animation lives here. Do not re-declare .hamburger display
       or a nav breakpoint here — a 768px rule here previously fought style.css's 900px
       rule and hid all navigation between 769–900px. */
    '.hamburger span { display: block; width: 24px; height: 2px; background: #7a4f3a; border-radius: 2px; transition: transform 0.3s, opacity 0.3s; }',
    '.hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }',
    '.hamburger.active span:nth-child(2) { opacity: 0; }',
    '.hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }',
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
