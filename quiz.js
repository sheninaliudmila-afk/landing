(() => {
  'use strict';
  const model = globalThis.FinQuiz;
  const section = document.getElementById('diagnostic');
  if (!model || !section) return;
  const $ = id => document.getElementById(id);
  const answers = Array(model.questions.length).fill(null);
  const form = $('fq-form');
  const shell = $('fq-shell');
  const resultPanel = $('fq-result');
  const next = $('fq-next');
  let current = 0;
  let result = null;
  let injectedSummary = '';
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const announce = message => { $('fq-announcement').textContent = message; };

  function updateProgress() {
    const count = answers.filter(answer => answer !== null).length;
    $('fq-progress').setAttribute('aria-valuenow', String(count));
    $('fq-progress').setAttribute('aria-valuetext', `Отвечено на ${count} из 10 вопросов`);
    [...$('fq-progress').children].forEach((segment, index) => {
      segment.classList.toggle('is-current', index === current);
      segment.classList.toggle('is-complete', answers[index] !== null && index !== current);
    });
    const group = current < 2 ? 0 : current < 7 ? 1 : 2;
    section.querySelectorAll('[data-fq-step]').forEach((step, index) => {
      step.classList.toggle('is-current', index === group);
      step.classList.toggle('is-complete', index < group);
      if (index === group) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }

  function renderQuestion(moveFocus = false) {
    const question = model.questions[current];
    shell.hidden = false;
    resultPanel.hidden = true;
    $('fq-current').textContent = String(current + 1).padStart(2, '0');
    $('fq-category').textContent = question.category.toUpperCase();
    $('fq-question').textContent = question.title;
    $('fq-hint').textContent = question.hint;
    $('fq-options').replaceChildren(...question.options.map((option, index) => {
      const label = document.createElement('label');
      label.className = 'fq-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'fq-answer';
      input.value = String(index);
      input.required = true;
      input.checked = answers[current] === index;
      input.setAttribute('aria-labelledby', `fq-label-${index}`);
      input.setAttribute('aria-describedby', `fq-detail-${index}`);
      const radio = document.createElement('span');
      radio.className = 'fq-radio';
      radio.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('span');
      copy.className = 'fq-option-copy';
      const title = document.createElement('strong');
      title.id = `fq-label-${index}`;
      title.textContent = option.label;
      const detail = document.createElement('small');
      detail.textContent = option.detail;
      detail.id = `fq-detail-${index}`;
      copy.append(title, detail);
      label.append(input, radio, copy);
      return label;
    }));
    next.disabled = answers[current] === null;
    next.innerHTML = current === model.questions.length - 1 ? 'Получить результат <span aria-hidden="true">↗</span>' : 'Далее <span aria-hidden="true">→</span>';
    $('fq-back').disabled = current === 0;
    $('fq-select-hint').textContent = answers[current] === null ? 'Выберите один вариант' : 'Ответ выбран';
    updateProgress();
    if (moveFocus) {
      $('fq-question').focus({preventScroll:true});
      const bounds = shell.getBoundingClientRect();
      if (bounds.top < 85 || bounds.top > window.innerHeight * .7) shell.scrollIntoView({block:'start', behavior:reduceMotion() ? 'instant' : 'smooth'});
      announce(`Вопрос ${current + 1} из 10. ${question.title}`);
    }
  }

  form.addEventListener('change', event => {
    if (event.target.name !== 'fq-answer') return;
    answers[current] = Number(event.target.value);
    next.disabled = false;
    $('fq-select-hint').textContent = 'Ответ выбран';
    updateProgress();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (answers[current] === null) return;
    if (current < model.questions.length - 1) {
      current++;
      renderQuestion(true);
    } else showResult();
  });
  $('fq-back').addEventListener('click', () => {
    if (current > 0) { current--; renderQuestion(true); }
  });

  function showResult() {
    result = model.getResult(answers);
    shell.hidden = true;
    resultPanel.hidden = false;
    const e = escapeHTML;
    const formats = [
      {id:'diagnostic',title:'Финансовая диагностика',description:'Разбор данных, финансовых рисков и приоритетных задач. Подходит для понятного первого шага.',duration:'3–5 рабочих дней'},
      {id:'strategy',title:'Финансовая стратегия',description:'Диагностика, финансовая модель и сценарии. Когда нужен план для обоснованных решений.',duration:'Диагностика + 1–2 недели'},
      {id:'support',title:'Внедрение и сопровождение',description:'Настройка отчётности и передача системы команде. Регулярная поддержка — по вашему запросу.',duration:'Внедрение: 2–4 недели · поддержка: ежемесячно'}
    ];
    const recommended = formats.find(format => format.id === result.format);
    Object.assign(recommended, {title:result.title, description:result.summary, duration:result.duration});
    resultPanel.innerHTML = `
      <div class="fq-result-heading"><div><p class="fq-result-label"><span aria-hidden="true">✓</span> 10 ИЗ 10 · ВАШ МАРШРУТ ГОТОВ</p><h3 id="fq-result-title">${e(result.title)}</h3><p class="fq-result-summary">${e(result.summary)}</p></div><div class="fq-result-duration">Ориентировочная длительность<strong>${e(result.duration)}</strong></div></div>
      <div class="fq-result-grid"><div><h4>Приоритетные услуги для вас</h4><ul class="fq-result-services">${result.services.map(service => `<li><span class="fq-service-tick" aria-hidden="true">↗</span><div><strong>${e(service.title)}</strong><p>${e(service.description)}</p></div></li>`).join('')}</ul></div><div><h4>Как может строиться работа</h4><ol class="fq-result-stages">${result.stages.map(stage => `<li><strong>${e(stage.title)}</strong><span>${e(stage.duration)}</span><p>${e(stage.description)}</p></li>`).join('')}</ol></div></div>
      <div class="fq-result-reason"><strong>Почему этот маршрут подходит</strong><ul>${result.reasons.map(reason => `<li>${e(reason)}</li>`).join('')}</ul></div>
      <p class="fq-result-schedule">${e(result.schedule)}</p>
      <div class="fq-formats"><h4>Варианты работы со мной</h4><div class="fq-format-grid">${formats.map(format => `<article class="fq-format${format.id === result.format ? ' is-recommended' : ''}"><span>${format.id === result.format ? '↗ РЕКОМЕНДУЕМЫЙ ФОРМАТ' : 'ДРУГОЙ ВАРИАНТ'}</span><h5>${e(format.title)}</h5><p>${e(format.description)}</p><small>${e(format.duration)}</small></article>`).join('')}</div></div>
      <div class="fq-result-actions"><button class="button button-primary" type="button" data-fq-action="discuss">Обсудить мой результат <span aria-hidden="true">↗</span></button><button class="fq-result-secondary" type="button" data-fq-action="save">Сохранить результат ↓</button><button class="fq-text-action" type="button" data-fq-action="edit">Изменить ответы</button><button class="fq-text-action" type="button" data-fq-action="restart">Пройти заново</button></div>
      <p class="fq-result-status" id="fq-result-status" role="status"></p>
      <p class="fq-result-note">Ответы обрабатываются только в вашем браузере. Вы можете сохранить результат и обсудить его на знакомстве. Форма заявки на этом лендинге учебная и не отправляет данные.</p>`;
    resultPanel.focus({preventScroll:true});
    resultPanel.scrollIntoView({block:'start', behavior:reduceMotion() ? 'instant' : 'smooth'});
    announce(`Тест завершён. Рекомендуемый формат: ${result.title}.`);
  }

  function resultText(includeAnswers = true) {
    const lines = ['FINCONSULT — результат экспресс-диагностики', '', result.title, `Сроки: ${result.duration}`, `Приоритет: ${result.focus}`, '', result.summary, '', 'Рекомендуемые услуги:', ...result.services.map(service => `• ${service.title}: ${service.description}`), '', 'Этапы работы:', ...result.stages.map(stage => `• ${stage.title} — ${stage.duration}`), '', 'Основания рекомендации:', ...result.reasons.map(reason => `• ${reason}`), '', result.schedule];
    if (includeAnswers) lines.push('', 'Ваши ответы:', ...model.questions.map((question, index) => `${index + 1}. ${question.title}\n${question.options[answers[index]].label}`));
    lines.push('', 'Результат предварительный. Состав услуг и точные сроки согласуются после знакомства.');
    return lines.join('\n');
  }

  resultPanel.addEventListener('click', event => {
    const action = event.target.closest('[data-fq-action]')?.dataset.fqAction;
    if (!action || !result) return;
    if (action === 'edit') { renderQuestion(true); return; }
    if (action === 'restart') {
      answers.fill(null);
      current = 0;
      result = null;
      resultPanel.replaceChildren();
      renderQuestion(true);
      return;
    }
    if (action === 'save') {
      try {
        const blob = new Blob(['\uFEFF' + resultText()], {type:'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'finconsult-result.txt';
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        $('fq-result-status').textContent = 'Результат подготовлен для скачивания в текстовом файле.';
      } catch {
        $('fq-result-status').textContent = 'Не удалось скачать файл в этом браузере. Вы можете выделить и скопировать результат со страницы.';
      }
      return;
    }
    if (action === 'discuss') {
      const message = $('message');
      const summary = `Результат экспресс-теста: ${result.title}.\nПриоритет: ${result.focus}.\nОриентир по срокам: ${result.duration}.\nУслуги: ${result.services.map(service => service.title).join('; ')}.`;
      const original = message.value;
      const combined = injectedSummary && original.includes(injectedSummary)
        ? original.replace(injectedSummary, summary)
        : original.trim() ? `${original.trim()}\n\n${summary}` : summary;
      if (combined.length <= message.maxLength) {
        message.value = combined;
        injectedSummary = summary;
      } else {
        $('fq-result-status').textContent = 'В форме уже есть длинное сообщение. Сохраните результат отдельно, чтобы не потерять ваш текст.';
        announce('Ваш текст в форме сохранён. Результат можно скачать отдельно.');
      }
      $('contact').scrollIntoView({behavior:reduceMotion() ? 'instant' : 'smooth'});
      $('name').focus({preventScroll:true});
    }
  });
  renderQuestion();
})();
