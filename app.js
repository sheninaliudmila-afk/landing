const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Открыть меню' : 'Закрыть меню');
  navigation.classList.toggle('is-open', !expanded);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 1001px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

const video = document.querySelector('#consultant-video');
const videoPlay = document.querySelector('#video-play');
videoPlay.addEventListener('click', async () => {
  videoPlay.hidden = true;
  video.focus();
  try {
    await video.play();
  } catch {
    // Keep native controls available if playback requires another user action.
    video.controls = true;
  }
});
video.addEventListener('play', () => { videoPlay.hidden = true; });
video.addEventListener('ended', () => { videoPlay.hidden = false; });

const serviceContent = {
  'Опыт и финансовая диагностика': {
    description: '20+ лет практики помогают смотреть на финансовые показатели в контексте бизнеса: видеть взаимосвязи, находить причины и расставлять приоритеты.',
    items: ['Анализ корпоративных и личных финансов.', 'Разбор доходов, расходов и движения денежных средств.', 'Определение финансовых рисков и приоритетных задач.']
  },
  'Индивидуальная финансовая стратегия': {
    description: 'Финансовый план начинается с ваших целей. Вместе определяем, какие решения помогут бизнесу развиваться и как учитывать личные приоритеты собственника.',
    items: ['Анализ текущей ситуации и ограничений.', 'Финансовая модель с учётом целей и рисков.', 'Последовательный план действий и контрольные показатели.']
  },
  'Конфиденциальность и защита информации': {
    description: 'Финансовые данные требуют внимательного обращения. Формат обмена информацией, доступ к документам и условия конфиденциальности обсуждаем до начала работы.',
    items: ['Обсуждение условий работы с коммерческой тайной.', 'Определение необходимого объёма финансовых данных.', 'Согласование доступа к документам и результатам анализа.']
  },
  'Система финансового управления': {
    description: 'Понятный управленческий учёт помогает видеть финансовое состояние компании и принимать решения на основе актуальных данных.',
    items: ['Отчёты ДДС, ОПиУ и управленческий баланс.', 'Платёжный календарь и контроль кассовых разрывов.', 'Регламенты, автоматизация в 1С/Excel и обучение команды.']
  }
};
const dialog = document.querySelector('#service-dialog');
let lastServiceButton;
let restoreServiceFocus = true;
document.querySelectorAll('[data-service]').forEach(button => {
  button.addEventListener('click', () => {
    const title = button.dataset.service;
    const content = serviceContent[title];
    lastServiceButton = button;
    restoreServiceFocus = true;
    document.querySelector('#dialog-title').textContent = title;
    document.querySelector('#dialog-description').textContent = content.description;
    const list = document.querySelector('#dialog-list');
    list.replaceChildren(...content.items.map(item => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  if (restoreServiceFocus) lastServiceButton?.focus({ preventScroll: true });
});
document.querySelector('#dialog-contact').addEventListener('click', event => {
  event.preventDefault();
  const title = document.querySelector('#dialog-title').textContent;
  const message = document.querySelector('#message');
  if (!message.value.trim()) message.value = `Интересует: ${title.toLowerCase()}.`;
  restoreServiceFocus = false;
  dialog.close();
  document.querySelector('#contact').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  document.querySelector('#name').focus({ preventScroll: true });
});

const contactForm = document.querySelector('#contact-form');
const nameInput = document.querySelector('#name');
nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (name.length < 2) {
    nameInput.setCustomValidity('Пожалуйста, укажите имя — минимум 2 символа.');
    nameInput.reportValidity();
    return;
  }
  const status = document.querySelector('#form-status');
  status.textContent = `${name}, спасибо! Это демонстрация подтверждения заявки. В учебной версии ваши данные никуда не отправляются.`;
  status.hidden = false;
  status.focus({ preventScroll: true });
  status.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navigation.querySelectorAll('a').forEach(link => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
}
