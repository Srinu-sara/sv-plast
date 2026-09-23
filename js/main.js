/**
 * SV PLAST - Main Interactive Application Logic
 * Interactive Before & After Plaster Slider, 3D Tilt Card,
 * Construction Savings Calculator, Gallery Carousel, Modal & Inquiries.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================
  // 1. Enterprise Navigation & Off-Canvas Drawer
  // ==========================================
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerLinks = document.querySelectorAll('.drawer-link');
  const siteHeader = document.getElementById('site-header');

  function openMobileNav() {
    if (!mobileNavDrawer) return;
    mobileNavDrawer.classList.add('open');
    mobileNavBackdrop?.classList.add('active');
    mobileMenuBtn?.classList.add('is-active');
    mobileMenuBtn?.setAttribute('aria-expanded', 'true');
    mobileNavDrawer.setAttribute('aria-hidden', 'false');
    mobileNavBackdrop?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (!mobileNavDrawer) return;
    mobileNavDrawer.classList.remove('open');
    mobileNavBackdrop?.classList.remove('active');
    mobileMenuBtn?.classList.remove('is-active');
    mobileMenuBtn?.setAttribute('aria-expanded', 'false');
    mobileNavDrawer.setAttribute('aria-hidden', 'true');
    mobileNavBackdrop?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileNavDrawer?.classList.contains('open');
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  drawerCloseBtn?.addEventListener('click', closeMobileNav);
  mobileNavBackdrop?.addEventListener('click', closeMobileNav);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  document.querySelectorAll('.drawer-action-btn').forEach(btn => {
    btn.addEventListener('click', closeMobileNav);
  });

  // Close drawer on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNavDrawer?.classList.contains('open')) {
      closeMobileNav();
    }
  });

  // Header background scroll elevation
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      siteHeader?.classList.add('scrolled');
    } else {
      siteHeader?.classList.remove('scrolled');
    }
  }, { passive: true });

  // ==========================================
  // 1b. Hero Section Automatic Mobile Slideshow (3-Second Cycle)
  // ==========================================
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.hero-slideshow-dots .slide-dot');
  const heroTimerProgress = document.getElementById('hero-timer-progress');
  const heroSlideshowContainer = document.getElementById('hero-slideshow');

  if (heroSlides.length > 0) {
    let currentSlideIdx = 0;
    let slideTimer = null;
    const SLIDE_DURATION = 3000; // Changes image every 3 seconds
    let isSlideshowPaused = false;

    function showSlide(index) {
      currentSlideIdx = (index + heroSlides.length) % heroSlides.length;

      heroSlides.forEach((slide, idx) => {
        if (idx === currentSlideIdx) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      heroDots.forEach((dot, idx) => {
        if (idx === currentSlideIdx) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      // Animate progress bar across 3 seconds
      if (heroTimerProgress) {
        heroTimerProgress.style.transition = 'none';
        heroTimerProgress.style.width = '0%';
        void heroTimerProgress.offsetWidth; // Force CSS reflow
        heroTimerProgress.style.transition = `width ${SLIDE_DURATION}ms linear`;
        heroTimerProgress.style.width = '100%';
      }
    }

    function nextSlide() {
      if (isSlideshowPaused) return;
      showSlide(currentSlideIdx + 1);
    }

    function startSlideshow() {
      stopSlideshow();
      showSlide(currentSlideIdx);
      slideTimer = setInterval(nextSlide, SLIDE_DURATION);
    }

    function stopSlideshow() {
      if (slideTimer) {
        clearInterval(slideTimer);
        slideTimer = null;
      }
    }

    // Dot click triggers
    heroDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const targetIdx = parseInt(dot.getAttribute('data-index'), 10) || 0;
        showSlide(targetIdx);
        startSlideshow();
      });
    });

    // Pause on hover or touch so user can examine photos
    const heroCard = document.querySelector('.hero-right-card');
    const pauseTarget = heroCard || heroSlideshowContainer;

    pauseTarget?.addEventListener('mouseenter', () => {
      isSlideshowPaused = true;
    });
    pauseTarget?.addEventListener('mouseleave', () => {
      isSlideshowPaused = false;
      startSlideshow();
    });
    pauseTarget?.addEventListener('touchstart', () => {
      isSlideshowPaused = true;
    }, { passive: true });
    pauseTarget?.addEventListener('touchend', () => {
      isSlideshowPaused = false;
      startSlideshow();
    }, { passive: true });

    startSlideshow();
  }

  // ==========================================
  // 1c. ScrollSpy (Active Navigation Highlighting)
  // ==========================================
  const spySections = document.querySelectorAll('section[id]');
  const desktopNavLinks = document.querySelectorAll('.nav-link');

  if ('IntersectionObserver' in window && spySections.length > 0) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          
          desktopNavLinks.forEach(link => {
            if (link.getAttribute('href') === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });

          drawerLinks.forEach(link => {
            if (link.getAttribute('href') === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    spySections.forEach(sec => spyObserver.observe(sec));
  }

  // ==========================================
  // 1c. Smooth Back to Top
  // ==========================================
  const backToTopBtn = document.getElementById('footer-back-to-top');
  backToTopBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // ==========================================
  // 2. Interactive Before & After Plaster Slider
  // ==========================================
  const comparisonContainer = document.getElementById('before-after-box');
  const afterLayer = document.getElementById('ba-after-layer');
  const handle = document.getElementById('ba-handle');

  if (comparisonContainer && afterLayer && handle) {
    let isDragging = false;

    function setSliderPosition(clientX) {
      const rect = comparisonContainer.getBoundingClientRect();
      const x = clientX - rect.left;
      let percentage = (x / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));

      afterLayer.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    }

    // Mouse events
    handle.addEventListener('mousedown', () => (isDragging = true));
    window.addEventListener('mouseup', () => (isDragging = false));
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      setSliderPosition(e.clientX);
    });

    // Click anywhere on container to move handle
    comparisonContainer.addEventListener('click', (e) => {
      setSliderPosition(e.clientX);
    });

    // Touch events for mobile
    handle.addEventListener('touchstart', () => (isDragging = true), { passive: true });
    window.addEventListener('touchend', () => (isDragging = false));
    window.addEventListener('touchmove', (e) => {
      if (!isDragging || !e.touches[0]) return;
      setSliderPosition(e.touches[0].clientX);
    }, { passive: true });
  }

  // ==========================================
  // 3. Interactive 3D Tilt Card (Product Bag)
  // ==========================================
  const tiltCard = document.querySelector('.tilt-card-3d');
  if (tiltCard) {
    const glare = tiltCard.querySelector('.glare-reflection');

    tiltCard.addEventListener('mousemove', (e) => {
      const rect = tiltCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      if (glare) {
        glare.style.opacity = '0.5';
        glare.style.transform = `translate(${x - 150}px, ${y - 150}px)`;
      }
    });

    tiltCard.addEventListener('mouseleave', () => {
      tiltCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      if (glare) glare.style.opacity = '0';
    });
  }

  // ==========================================
  // 4. Gypsum vs Traditional Savings Calculator (Image 3 Design)
  // ==========================================
  const areaInput = document.getElementById('calc-area');
  const rangeInput = document.getElementById('calc-range');
  const thicknessPills = document.querySelectorAll('.thickness-pill');
  let selectedThickness = 12; // Default 12mm

  const outBags = document.getElementById('out-bags');
  const outWater = document.getElementById('out-water');
  const subBagNote = document.getElementById('sub-bag-note');

  function updateSliderFill(rangeEl) {
    if (!rangeEl) return;
    const min = parseFloat(rangeEl.min) || 100;
    const max = parseFloat(rangeEl.max) || 10000;
    const val = parseFloat(rangeEl.value) || 1000;
    const pct = ((val - min) / (max - min)) * 100;
    rangeEl.style.background = `linear-gradient(to right, #16a34a 0%, #16a34a ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`;
  }

  function calculateSavings() {
    const area = parseFloat(rangeInput?.value || areaInput?.value || 1000);

    // Exact coverage math per 25kg bag:
    // 10mm: 24 sq.ft per 25kg bag
    // 12mm: 20 sq.ft per 25kg bag -> 1000 sq.ft = 50 bags
    // 15mm: 16 sq.ft per 25kg bag
    // 18mm: 240 / 18 ≈ 13.33 sq.ft per 25kg bag -> 1000 sq.ft = 75 bags
    let sqFtPerBag = 20;
    if (selectedThickness === 10) sqFtPerBag = 24;
    else if (selectedThickness === 12) sqFtPerBag = 20;
    else if (selectedThickness === 15) sqFtPerBag = 16;
    else if (selectedThickness === 18) sqFtPerBag = 240 / 18;

    const bags = Math.ceil(area / sqFtPerBag);
    const waterSaved = Math.round(area * 15);

    if (outBags) outBags.textContent = bags.toLocaleString();
    if (outWater) outWater.textContent = waterSaved.toLocaleString();
    if (subBagNote) subBagNote.textContent = `25 Kg Bags at ${selectedThickness}mm`;

    const btnBagsCount = document.getElementById('btn-calc-bags-count');
    if (btnBagsCount) btnBagsCount.textContent = bags.toLocaleString();

    if (rangeInput) updateSliderFill(rangeInput);
  }

  if (rangeInput) {
    rangeInput.addEventListener('input', () => {
      if (areaInput) areaInput.value = rangeInput.value;
      const areaText = document.getElementById('calc-area-val');
      if (areaText) areaText.textContent = `${rangeInput.value} Sq. Ft.`;
      calculateSavings();
    });
  }

  if (areaInput) {
    areaInput.addEventListener('input', () => {
      if (rangeInput) rangeInput.value = areaInput.value;
      const areaText = document.getElementById('calc-area-val');
      if (areaText) areaText.textContent = `${areaInput.value} Sq. Ft.`;
      calculateSavings();
    });
  }

  thicknessPills.forEach(pill => {
    pill.addEventListener('click', () => {
      thicknessPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedThickness = parseInt(pill.getAttribute('data-value') || '12', 10);
      calculateSavings();
    });
  });

  calculateSavings();

  // ==========================================
  // 5. "Our Work in Action" Carousel
  // ==========================================
  const track = document.getElementById('gallery-track');
  const prevBtn = document.getElementById('gal-prev');
  const nextBtn = document.getElementById('gal-next');
  const dotsContainer = document.getElementById('gal-dots');

  if (track && prevBtn && nextBtn) {
    const slides = track.querySelectorAll('.gallery-card');
    let currentIndex = 0;
    const totalSlides = slides.length;

    // Create dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = `gal-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      });
    }

    function updateSlide() {
      const slideWidth = slides[0].offsetWidth + 24; // width + gap
      track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

      const dots = dotsContainer?.querySelectorAll('.gal-dot');
      dots?.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    function goToSlide(index) {
      currentIndex = Math.max(0, Math.min(totalSlides - 1, index));
      updateSlide();
    }

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateSlide();
    });

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateSlide();
    });

    window.addEventListener('resize', updateSlide);
  }

  // ==========================================
  // 6. Brochure Modal
  // ==========================================
  const brochureModal = document.getElementById('brochure-modal');
  const openBrochureBtns = document.querySelectorAll('.btn-open-brochure');
  const closeBrochureBtn = document.getElementById('close-brochure-modal');

  openBrochureBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      brochureModal?.classList.add('active');
    });
  });

  closeBrochureBtn?.addEventListener('click', () => {
    brochureModal?.classList.remove('active');
  });

  brochureModal?.addEventListener('click', (e) => {
    if (e.target === brochureModal) {
      brochureModal.classList.remove('active');
    }
  });

  // ==========================================
  // 7. WhatsApp Quick Direct Connect & Order Form
  // ==========================================
  const inquiryForm = document.getElementById('quick-inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('inq-name')?.value || '';
      const phone = document.getElementById('inq-phone')?.value || '';
      const city = document.getElementById('inq-city')?.value || '';
      const area = document.getElementById('inq-area')?.value || '';
      const message = document.getElementById('inq-message')?.value || '';

      const text = `*SV PLAST Inquiry*%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Phone:* ${encodeURIComponent(phone)}%0A` +
        `*Location/City:* ${encodeURIComponent(city)}%0A` +
        `*Project Area:* ${encodeURIComponent(area)} sq.ft%0A` +
        `*Requirement:* ${encodeURIComponent(message)}`;

      const waUrl = `https://wa.me/919640735819?text=${text}`;
      window.open(waUrl, '_blank');

      // Visual success badge
      const statusEl = document.getElementById('form-status');
      if (statusEl) {
        statusEl.textContent = 'Redirecting to WhatsApp with your inquiry...';
        statusEl.className = 'status-badge success';
        statusEl.style.display = 'block';
      }
    });
  }

  // Direct WhatsApp Button in quote form
  const btnDirectWa = document.getElementById('btn-direct-whatsapp-send');
  if (btnDirectWa && inquiryForm) {
    btnDirectWa.addEventListener('click', () => {
      const name = document.getElementById('inq-name')?.value || '';
      const phone = document.getElementById('inq-phone')?.value || '';
      const city = document.getElementById('inq-city')?.value || '';
      const category = document.getElementById('inq-category')?.value || '';
      const area = document.getElementById('inq-area')?.value || '';
      const message = document.getElementById('inq-message')?.value || '';

      const text = `*SV PLAST Commercial Quote Request*%0A` +
        `*Name:* ${encodeURIComponent(name || 'Customer')}%0A` +
        `*Phone:* ${encodeURIComponent(phone)}%0A` +
        `*Location/City:* ${encodeURIComponent(city)}%0A` +
        `*Category:* ${encodeURIComponent(category)}%0A` +
        `*Requirement:* ${encodeURIComponent(area)}%0A` +
        `*Notes:* ${encodeURIComponent(message)}`;

      window.open(`https://wa.me/919640735819?text=${text}`, '_blank');
    });
  }

  // Calculator WhatsApp Order Button
  const btnOrderCalc = document.getElementById('btn-order-calc-whatsapp');
  if (btnOrderCalc) {
    btnOrderCalc.addEventListener('click', () => {
      const area = areaInput?.value || '1500';
      const thickness = selectedThickness || '12';
      const bags = outBags?.textContent || '154';
      const text = `*SV PLAST Material Requirement Estimate*%0A` +
        `*Estimated Area:* ${area} sq.ft%0A` +
        `*Plaster Thickness:* ${thickness} mm%0A` +
        `*Bags Needed:* ${bags} bags (25kg)%0A` +
        `Please provide a quotation for supply and delivery.`;
      window.open(`https://wa.me/919640735819?text=${text}`, '_blank');
    });
  }


  // Lightbox view for gallery
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeLightbox = document.getElementById('close-lightbox');

  document.querySelectorAll('.zoomable-img').forEach(img => {
    img.addEventListener('click', () => {
      if (lightboxModal && lightboxImg) {
        lightboxImg.src = img.src;
        if (lightboxCaption) lightboxCaption.textContent = img.alt || 'SV PLAST Project';
        lightboxModal.classList.add('active');
      }
    });
  });

  closeLightbox?.addEventListener('click', () => {
    lightboxModal?.classList.remove('active');
  });

  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) {
      lightboxModal.classList.remove('active');
    }
  });

  // Close active modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lightboxModal?.classList.contains('active')) {
        lightboxModal.classList.remove('active');
      }
      if (brochureModal?.classList.contains('active')) {
        brochureModal.classList.remove('active');
      }
    }
  });

  // ==========================================
  // 10. Code & Asset Protection Guardian
  // Disables right-click, dev shortcuts, image dragging
  // ==========================================
  (function initProtection() {
    // Block context menu (Right-Click)
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, { capture: true });

    // Block developer inspection shortcuts
    window.addEventListener('keydown', (e) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / J / C (Inspect / Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I','J','C','i','j','c'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    }, { capture: true });

    // Block image & canvas dragging
    document.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'CANVAS') {
        e.preventDefault();
        return false;
      }
    });

    // Console Intellectual Property Notice
    try {
      console.clear();
      console.log(
        '%c⚠ SV PLAST — PROTECTED INTELLECTUAL PROPERTY',
        'color: #4ade80; font-size: 16px; font-weight: bold; background: #050805; padding: 6px 12px; border: 1px solid #2b9e37; border-radius: 4px;'
      );
      console.log(
        '%cAll architecture, custom animations, design assets, and source files are proprietary to SV PLAST. Unauthorized copying or distribution is prohibited.',
        'font-size: 11px; color: #888888;'
      );
    } catch (_) {}
  })();
});


