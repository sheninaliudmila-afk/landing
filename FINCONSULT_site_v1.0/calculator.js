import { calculatePackage, parsePrice, SERVICE_CATALOG, DISCOUNT_POLICY } from './discount-model.mjs';

const root = document.querySelector('#calculator');
if (root) {
  const form = root.querySelector('#discount-form');
  const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
  const integer = new Intl.NumberFormat('ru-RU');
  const range = root.querySelector('#calc-months');
  const duration = root.querySelector('#calc-duration');
  const proposalLink = root.querySelector('#calc-proposal');
  const announcement = root.querySelector('#calc-announcement');
  const resultCard = root.querySelector('#calc-result');
  const selectionError = root.querySelector('#calc-selection-error');
  const termButtons = [...root.querySelectorAll('[data-calc-months]')];
  const controls = SERVICE_CATALOG.map(service => ({
    ...service,
    checkbox: root.querySelector(`#calc-select-${service.id}`),
    priceInput: root.querySelector(`#calc-price-${service.id}`),
    row: root.querySelector(`[data-calc-service="${service.id}"]`),
    error: root.querySelector(`#calc-error-${service.id}`)
  }));
  let result;
  let announceTimer;
  let lastProposal = '';

  function monthsLabel(value) {
    return `${value} ${value === 1 ? 'месяц' : value < 5 ? 'месяца' : 'месяцев'}`;
  }
  const write = (selector, value) => { root.querySelector(selector).textContent = value; };
  function announce(message) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { announcement.textContent = message; }, 350);
  }

  function update({ silent = false } = {}) {
    const services = controls.filter(control => control.checkbox.checked).map(control => ({ id: control.id, price: control.priceInput.value }));
    const hasSupport = controls.find(control => control.id === 'support').checkbox.checked;
    duration.disabled = !hasSupport;
    range.setAttribute('aria-valuetext', monthsLabel(Number(range.value)));
    range.style.setProperty('--range-progress', `${((Number(range.value) - 1) / 11) * 100}%`);
    write('#calc-months-output', monthsLabel(Number(range.value)));
    write('#calc-duration-hint', hasSupport ? 'Диагностика и стратегия учитываются один раз. Срок меняет только стоимость сопровождения и бонус за длительность.' : 'Срок не влияет на разовые услуги. Выберите сопровождение, чтобы получить дополнительную скидку за длительность.');
    termButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.calcMonths) === Number(range.value))));
    result = calculatePackage({ services, months: range.value });
    controls.forEach(control => {
      const selected = control.checkbox.checked;
      const error = result.errors?.[control.id] ?? '';
      control.row.classList.toggle('is-selected', selected);
      control.priceInput.disabled = !selected;
      control.priceInput.setCustomValidity(error);
      control.priceInput.setAttribute('aria-invalid', String(Boolean(error)));
      control.error.textContent = error;
      control.error.hidden = !error;
    });
    root.querySelector('#calc-result-values').hidden = !result.ok;
    root.querySelector('#calc-empty').hidden = result.ok;
    proposalLink.setAttribute('aria-disabled', String(!result.ok));
    proposalLink.tabIndex = result.ok ? 0 : -1;
    selectionError.hidden = true;
    if (!result.ok) {
      write('#calc-badge', 'до 25%');
      write('#calc-empty-title', result.reason === 'empty' ? 'Соберите свой пакет' : 'Проверьте базовые цены');
      write('#calc-empty-description', result.reason === 'empty' ? 'Выберите хотя бы одну услугу — здесь появится расчёт.' : 'Укажите положительные цены в рублях для всех выбранных услуг. Затем расчёт обновится автоматически.');
      if (!silent) announce(result.reason === 'empty' ? 'Выберите хотя бы одну услугу для расчёта.' : 'Проверьте базовые цены выбранных услуг.');
      return result;
    }
    const percentage = result.discountPercent === 0 ? '0%' : `до ${result.discountPercent}%`;
    write('#calc-badge', result.discountPercent === 0 ? 'Без скидки' : percentage);
    const minimum = root.querySelector('#calc-minimum');
    minimum.replaceChildren(document.createTextNode(`${integer.format(result.minimumPrice)} `));
    const currency = document.createElement('span');
    currency.textContent = '₽';
    minimum.append(currency);
    write('#calc-period', result.months ? `За весь пакет, включая ${monthsLabel(result.months)} сопровождения` : 'За весь выбранный пакет · разовые услуги');
    write('#calc-base-total', money.format(result.baseTotal));
    write('#calc-discount-percent', percentage);
    write('#calc-savings', money.format(result.discountAmount));
    write('#calc-package-bonus', `+${result.packagePercent}%`);
    write('#calc-duration-bonus', `+${result.durationPercent}%`);
    root.querySelector('#calc-cap-fill').style.width = `${result.discountPercent / DISCOUNT_POLICY.maximumPercent * 100}%`;
    write('#calc-cap-label', result.discountPercent === DISCOUNT_POLICY.maximumPercent ? 'Достигнут максимальный размер скидки — 25%' : `${result.discountPercent}% из максимально возможных 25%`);
    const items = result.items.map(item => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = `${item.title} · ${item.monthly ? `${item.quantity} мес.` : 'разово'}`;
      const value = document.createElement('strong');
      value.textContent = money.format(item.lineTotal);
      li.append(label, value);
      return li;
    });
    root.querySelector('#calc-items').replaceChildren(...items);
    if (!silent) announce(`Минимальная цена пакета ${money.format(result.minimumPrice)}. Максимальная скидка ${percentage}. Экономия ${money.format(result.discountAmount)}.`);
    return result;
  }

  controls.forEach(control => {
    control.checkbox.addEventListener('change', () => update());
    control.priceInput.addEventListener('input', () => update());
    control.priceInput.addEventListener('blur', () => {
      const value = parsePrice(control.priceInput.value);
      if (value !== null) control.priceInput.value = integer.format(value);
    });
  });
  range.addEventListener('input', () => update());
  termButtons.forEach(button => button.addEventListener('click', () => {
    range.value = button.dataset.calcMonths;
    update();
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const current = update();
    if (!current.ok) {
      if (current.reason === 'empty') {
        selectionError.textContent = 'Выберите хотя бы одну услугу, чтобы рассчитать скидку.';
        selectionError.hidden = false;
        controls[0].checkbox.focus();
      } else {
        const invalid = controls.find(control => control.checkbox.checked && current.errors?.[control.id]);
        invalid?.priceInput.focus();
        invalid?.priceInput.reportValidity();
      }
      return;
    }
    resultCard.focus({ preventScroll: true });
    resultCard.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  form.addEventListener('reset', () => {
    // The native reset applies after this event has finished.
    setTimeout(() => update(), 0);
  });
  proposalLink.addEventListener('click', event => {
    event.preventDefault();
    const current = update({ silent: true });
    if (!current.ok) return;
    const lines = current.items.map(item => `— ${item.title}${item.monthly ? `, ${item.quantity} мес.` : ', разово'}: ${money.format(item.lineTotal)}.`);
    const proposal = `Учебный расчёт пакета:\n${lines.join('\n')}\nБез скидки: ${money.format(current.baseTotal)}. Максимальная скидка: до ${current.discountPercent}%. Экономия: ${money.format(current.discountAmount)}. Минимальная цена: ${money.format(current.minimumPrice)}.`;
    const message = document.querySelector('#message');
    const previous = message.value.trim();
    const draft = lastProposal && previous.includes(lastProposal) ? previous.replace(lastProposal, proposal) : previous.includes(proposal) ? previous : previous ? `${previous}\n\n${proposal}` : proposal;
    const oldStatus = document.querySelector('#form-status');
    if (message.maxLength > 0 && draft.length > message.maxLength) {
      oldStatus.textContent = 'В поле задачи недостаточно места для расчёта. Ваш текст сохранён; расчёт остаётся в калькуляторе.';
      oldStatus.hidden = false;
    } else {
      message.value = draft;
      lastProposal = proposal;
      oldStatus.hidden = true;
    }
    document.querySelector('#contact').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    document.querySelector('#name').focus({ preventScroll: true });
  });

  root.querySelector('#calc-submit').disabled = false;
  update({ silent: true });
}
