(() => {
  'use strict';
  const root = document.querySelector('[data-carousel]');
  if (!root) return;

  const viewport = root.querySelector('.carousel-viewport');
  const slides = [...root.querySelectorAll('.carousel-slide')];
  const tabs = [...root.querySelectorAll('.carousel-tab')];
  const dots = [...root.querySelectorAll('.carousel-dots button')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const counter = root.querySelector('#carousel-current');
  const progress = root.querySelector('#carousel-progress');
  const announcement = root.querySelector('#carousel-announcement');
  let activeIndex = 0;
  let settleTimer;
  let lastWidth = viewport.clientWidth;
  let drag = null;
  let suppressClickUntil = 0;

  const wrap = index => (index % slides.length + slides.length) % slides.length;
  const syncHeight = () => {
    const height = slides[activeIndex].offsetHeight;
    if (height > 0) viewport.style.height = `${height}px`;
  };

  function updateState(index, announce = true) {
    const next = wrap(index);
    // Keep focus outside a panel before that panel becomes inert.
    const focusedPanel = document.activeElement?.closest('.carousel-slide');
    if (focusedPanel && focusedPanel !== slides[next]) {
      tabs[next].focus({ preventScroll: true });
    }
    activeIndex = next;
    slides.forEach((slide, i) => {
      const current = i === next;
      slide.inert = !current;
      slide.setAttribute('aria-hidden', String(!current));
      slide.tabIndex = current ? 0 : -1;
      tabs[i].setAttribute('aria-selected', String(current));
      tabs[i].tabIndex = current ? 0 : -1;
      dots[i].setAttribute('aria-pressed', String(current));
    });
    counter.textContent = String(next + 1).padStart(2, '0');
    progress.style.width = `${((next + 1) / slides.length) * 100}%`;
    syncHeight();
    if (announce) announcement.textContent = `Слайд ${next + 1} из ${slides.length}: ${slides[next].dataset.title}`;
  }

  function selectSlide(index, { focusTab = false, instant = false } = {}) {
    const next = wrap(index);
    clearTimeout(settleTimer);
    const returnToTop = viewport.getBoundingClientRect().top < -80;
    if (focusTab) tabs[next].focus({ preventScroll: true });
    updateState(next);
    viewport.scrollTo({ left: next * viewport.clientWidth, behavior: instant || reducedMotion.matches ? 'instant' : 'smooth' });
    if (returnToTop) root.querySelector('.carousel-tabs').scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }

  root.querySelectorAll('[data-slide]').forEach(button => {
    button.addEventListener('click', () => selectSlide(Number(button.dataset.slide)));
  });
  root.querySelector('.carousel-prev').addEventListener('click', () => selectSlide(activeIndex - 1));
  root.querySelector('.carousel-next').addEventListener('click', () => selectSlide(activeIndex + 1));

  root.querySelector('.carousel-tabs').addEventListener('keydown', event => {
    const current = tabs.indexOf(event.target);
    if (current < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = current + 1;
    else if (event.key === 'ArrowLeft') next = current - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = slides.length - 1;
    else return;
    event.preventDefault();
    selectSlide(next, { focusTab: true });
  });
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport && !slides.includes(event.target)) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    selectSlide(activeIndex + (event.key === 'ArrowRight' ? 1 : -1), { focusTab: true });
  });

  const settleScroll = () => {
    if (drag || !viewport.clientWidth) return;
    const index = Math.max(0, Math.min(slides.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    if (index !== activeIndex) updateState(index);
    syncHeight();
  };
  viewport.addEventListener('scroll', () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settleScroll, 150);
  }, { passive: true });
  viewport.addEventListener('scrollend', settleScroll);

  // Touch uses native scrolling and scroll snap; mouse dragging adds the same gesture on desktop.
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a, button, input, textarea, select, summary, details')) return;
    drag = { pointerId: event.pointerId, startX: event.clientX, startScroll: viewport.scrollLeft, startIndex: activeIndex, moved: false };
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    event.preventDefault();
    viewport.scrollLeft = drag.startScroll - delta;
  });
  const finishDrag = event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const gesture = drag;
    drag = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (!gesture.moved) return;
    suppressClickUntil = performance.now() + 250;
    const delta = event.clientX - gesture.startX;
    const threshold = Math.min(90, viewport.clientWidth * 0.16);
    const next = Math.abs(delta) >= threshold ? gesture.startIndex + (delta < 0 ? 1 : -1) : gesture.startIndex;
    selectSlide(Math.max(0, Math.min(slides.length - 1, next)));
  };
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const index = drag.startIndex;
    drag = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    selectSlide(index);
  });
  viewport.addEventListener('pointerleave', event => {
    if (drag && !drag.moved) drag = null;
  });
  viewport.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  const handleResize = () => {
    if (viewport.clientWidth !== lastWidth) {
      lastWidth = viewport.clientWidth;
      viewport.scrollTo({ left: activeIndex * lastWidth, behavior: 'instant' });
    }
    syncHeight();
  };
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(handleResize);
    slides.forEach(slide => observer.observe(slide));
    observer.observe(viewport);
  } else {
    window.addEventListener('resize', handleResize);
    root.querySelectorAll('details').forEach(details => details.addEventListener('toggle', syncHeight));
  }
  document.fonts?.ready.then(handleResize);

  root.querySelectorAll('[data-contact-topic]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const message = document.querySelector('#message');
      const topic = link.dataset.contactTopic;
      // Preserve anything the visitor has already written.
      if (!message.value.includes(topic)) message.value = message.value.trim() ? `${message.value.trim()}\n\n${topic}` : topic;
      const oldStatus = document.querySelector('#form-status');
      if (oldStatus) oldStatus.hidden = true;
      document.querySelector('#contact').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      document.querySelector('#name').focus({ preventScroll: true });
    });
  });

  // The initial HTML stays readable without JS; enhancement adds the active-panel state.
  root.classList.add('carousel-ready');
  updateState(0, false);
})();
