(() => {
  'use strict';
  const E = globalThis.NavigatorEngine;
  const P = globalThis.PeriodModel;
  const $ = id => document.getElementById(id);
  const screen = $('screen');
  const storageKey = 'finconsult-landing-navigator-v1';
  const routes = {start:'Ваша задача',assessment:'Оценка контроля',map:'Финансовая карта',simulator:'Симулятор',roadmap:'Дорожная карта',offer:'Как работаем',meeting:'Бесплатная встреча'};
  const defaultInputs = () => JSON.parse(JSON.stringify(P.demoInput));
  const freshState = () => ({schemaVersion:'1.2',screen:'start',scenario:null,answers:{},questionIndex:0,inputs:defaultInputs(),sessionId:globalThis.crypto?.randomUUID?.() || String(Date.now()),events:[],campaignId:null});
  let state = freshState();
  let storageAvailable = true;
  let simulator = null;
  let draftFields = {name:'',company:'',method:'email',contact:'',message:'',consent:false,marketing:false,attach:false};
  let draftText = '';
  let meetingAutoSection = '';
  let meetingAutoHasTopics = false;
  let sessionWasRestored = false;
  let simulatorMigrationNotice = false;
  let simulatorFieldsNotice = false;
  const safe = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const motion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  const announce = text => { $('announcement').textContent = text; };
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      if (Object.hasOwn(routes,saved.screen)) state.screen=saved.screen;
      if (E.scenarios.some(scenario=>scenario.id===saved.scenario)) state.scenario=saved.scenario;
      if (saved.answers && typeof saved.answers==='object' && !Array.isArray(saved.answers)) {
        for (const scenario of E.scenarios) for (const question of E.getQuestions(scenario.id)) {
          if (question.options.some(option=>option.value===saved.answers[question.id])) state.answers[question.id]=saved.answers[question.id];
        }
      }
      if (Number.isInteger(saved.questionIndex)) state.questionIndex=Math.min(5,Math.max(0,saved.questionIndex));
      if(saved.inputs) {
        try {
          const upgraded=P.upgradeInput(saved.inputs);
          if(!P.isInputShape(upgraded)) throw new TypeError('Некорректная структура симулятора.');
          state.inputs=upgraded;
          simulatorFieldsNotice=!saved.inputs.balances?.cash || !Object.hasOwn(saved.inputs.flows||{},'revenue') || !Object.hasOwn(saved.inputs.flows||{},'costOfSales');
        } catch { simulatorMigrationNotice=true; }
      }
      if (typeof saved.sessionId==='string' && saved.sessionId.length<100) state.sessionId=saved.sessionId;
      if (typeof saved.campaignId==='string' && /^[a-zA-Z0-9_-]{1,48}$/.test(saved.campaignId)) state.campaignId=saved.campaignId;
      if (Array.isArray(saved.events)) state.events=saved.events.filter(event=>event && typeof event.type==='string' && typeof event.step==='string').slice(-100);
      sessionWasRestored=true;
    }
  } catch { storageAvailable=false; }
  const campaign = new URLSearchParams(location.search).get('campaign_id');
  if (campaign && /^[a-zA-Z0-9_-]{1,48}$/.test(campaign)) state.campaignId=campaign;
  function persist() {
    try { sessionStorage.setItem(storageKey,JSON.stringify(state)); }
    catch { storageAvailable=false; }
    $('session-note').textContent=storageAvailable ? 'Прогресс сохраняется в этой вкладке' : 'Прогресс доступен до перезагрузки страницы';
  }
  function track(type,step=state.screen) {
    if (state.events.some(event=>event.type===type && event.step===step)) return;
    state.events.push({type,step,occurredAt:new Date().toISOString()});
    state.events=state.events.slice(-100);
    persist();
  }
  const currentScenario = () => E.scenarios.find(scenario=>scenario.id===state.scenario);
  const result = () => { try {return E.assess(state.scenario,state.answers);} catch{return null;} };
  const button = (label,route,primary=true) => `<button class="button ${primary?'button-primary':'button-secondary'}" data-nav="${route}">${label} <span aria-hidden="true">→</span></button>`;
  const info = (text,warning=false) => `<div class="info-box${warning?' warning-box':''}"><span aria-hidden="true">i</span><div>${text}</div></div>`;
  const heading = (eyebrow,title,description,step) => `<div class="page-heading"><p class="eyebrow"><span class="eyebrow-dot"></span>${eyebrow}</p><div class="page-heading-row"><div><h1>${title}</h1><p class="screen-description">${description}</p></div>${step?`<span class="stage-indicator"><strong>${step}</strong> / 06 · ваш маршрут</span>`:''}</div></div>`;
  const icons = {
    wallet:'<path d="M4 7h14v13H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12v4M18 11h-5v5h5M15 13.5h.01"/>',
    chart:'<path d="M3 3v17h18M7 15v-4M12 15V7M17 15V3"/>',
    growth:'<path d="m3 17 6-6 4 3 8-10M14 4h7v7M3 21h18"/>',
    layers:'<path d="m12 2 10 6-10 6L2 8l10-6Zm-9 11 9 5 9-5M3 18l9 5 9-5"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>'
  };
  const mobileQuery=window.matchMedia('(max-width: 760px)');
  function setMobileMenu(open=false) {
    const expanded=mobileQuery.matches&&open;
    $('sidebar').classList.toggle('is-open',expanded);
    $('sidebar').inert=mobileQuery.matches&&!expanded;
    if($('sidebar').inert)$('sidebar').setAttribute('aria-hidden','true');else $('sidebar').removeAttribute('aria-hidden');
    $('mobile-menu').setAttribute('aria-expanded',String(expanded));
    $('mobile-menu').setAttribute('aria-label',expanded?'Закрыть меню':'Открыть меню');
  }
  function go(route,{focus=true}={}) {
    if (!Object.hasOwn(routes,route)) route='start';
    if(route==='assessment'&&!state.scenario) route='start';
    simulator?.destroy(); simulator=null;
    state.screen=route;
    persist();
    if(location.hash!==`#${route}`) history.replaceState(null,'',`#${route}`);
    $('breadcrumb-current').textContent=routes[route];
    document.querySelectorAll('[data-nav]').forEach(node=>{
      if(!node.closest('.step-nav')) return;
      const active=node.dataset.nav===route;
      node.classList.toggle('is-active',active);
      if(active) node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');
      node.classList.toggle('is-done',Boolean(result())&&['assessment','map'].includes(node.dataset.nav));
    });
    setMobileMenu(false);
    screen.innerHTML=renderers[route]();
    if(route==='assessment') bindAssessment();
    if(route==='simulator') {
      simulator=globalThis.NavSimulator.mount($('simulator-mount'),{values:state.inputs,onChange:values=>{state.inputs=JSON.parse(JSON.stringify(values));simulatorMigrationNotice=false;simulatorFieldsNotice=false;persist();track('model_changed','simulator');}});
      track('navigator_opened');
    }
    if(route==='meeting') bindMeeting();
    if(route==='roadmap'&&result()) track('roadmap_viewed');
    if(route==='meeting') track('meeting_cta_clicked');
    if(focus){screen.focus({preventScroll:true});window.scrollTo({top:0,behavior:motion()});announce(routes[route]);}
  }
  function renderStart() {
    return `<section class="start-hero"><div><p class="eyebrow"><span class="eyebrow-dot"></span>ДЛЯ СОБСТВЕННИКОВ РАСТУЩЕГО БИЗНЕСА</p><h1>От финансовых вопросов —<br><span>к понятному плану.</span></h1><p class="hero-description">Узнайте, какие инструменты помогут управлять вашим бизнесом.<br>Выберите задачу, исследуйте цифры и получите свой маршрут внедрения.</p></div><div class="route-art" aria-label="Маршрут от задачи к работающей системе"><p>СНАЧАЛА — ВАША ЗАДАЧА</p><svg viewBox="0 0 236 143" fill="none" aria-hidden="true"><path d="M17 110h56c32 0 4-75 40-75h100" stroke="#a8ccc4" stroke-width="1.3" stroke-dasharray="4 4"/><circle cx="17" cy="110" r="7" fill="#127f70"/><circle cx="113" cy="35" r="7" fill="#127f70"/><circle cx="213" cy="35" r="7" fill="#142b3c"/><circle cx="213" cy="35" r="16" stroke="#a8c8c3"/><path d="m209 35 3 3 5-6" stroke="#c6efde" stroke-width="1.5"/><text x="4" y="137" fill="#557280" font-size="9" font-family="Manrope,Arial">Ваша ситуация</text><text x="80" y="12" fill="#557280" font-size="9" font-family="Manrope,Arial">Ясность в цифрах</text><text x="158" y="72" fill="#142b3c" font-size="9" font-family="Manrope,Arial">План действий</text><path d="M175 109h12m-6-6v12M202 108l7 7 11-15" stroke="#adc9c4" stroke-width="1.2"/></svg><span>От первого вопроса —<br>до работающей системы управления.</span></div></section>
      <section aria-labelledby="choose-title"><div class="section-label"><h2 id="choose-title">Что сейчас важнее для вашего бизнеса?</h2><span>Выберите одну задачу</span></div><div class="scenario-grid">${E.scenarios.map(scenario=>`<label class="scenario-card"><input type="radio" name="scenario" value="${scenario.id}" ${state.scenario===scenario.id?'checked':''} aria-labelledby="scenario-${scenario.id}"><span class="scenario-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[scenario.icon]}</svg></span><span class="scenario-select" aria-hidden="true"></span><strong id="scenario-${scenario.id}">${safe(scenario.title)}</strong><small>${safe(scenario.description)}</small></label>`).join('')}</div></section>
      <div class="start-actionbar"><div><h3>Ваша задача → оценка → симулятор → дорожная карта</h3><p>6 простых вопросов · около 3 минут · персональные рекомендации</p></div><button class="button button-primary" id="start-assessment" ${state.scenario?'':'disabled'}>Исследовать <span aria-hidden="true">→</span></button></div>
      <div class="start-bottom"><p class="privacy-note"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2 6 2v6c0 4-6 7-6 7s-6-3-6-7V4l6-2Z"/><path d="m7 9 2 2 4-4"/></svg>Без регистрации, контактов и финансовых документов</p><button class="text-link" data-nav="simulator">Сразу попробовать симулятор ↗</button></div>`;
  }
  function renderAssessment() {
    const scenario=currentScenario();
    const questions=E.getQuestions(state.scenario);
    const question=questions[state.questionIndex];
    const answered=Object.hasOwn(state.answers,question.id);
    track('assessment_started',state.scenario);
    return `${heading('ОЦЕНКА ИНСТРУМЕНТОВ','Сначала поймём вашу ситуацию.','Никаких сумм и документов. Только вопросы о том, как устроено управление финансами.','02')}<div class="assessment-layout"><form class="question-panel" id="question-form"><div class="question-topline"><span>${safe(scenario.shortTitle.toUpperCase())} / ${question.kind==='universal'?'О ВАШЕМ БИЗНЕСЕ':'ИНСТРУМЕНТЫ КОНТРОЛЯ'}</span><span><strong>${String(state.questionIndex+1).padStart(2,'0')}</strong> / 06</span></div><div class="question-progress" role="progressbar" aria-label="Прогресс оценки" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${questions.filter(q=>Object.hasOwn(state.answers,q.id)).length}">${questions.map((q,index)=>`<i class="${index===state.questionIndex?'current':Object.hasOwn(state.answers,q.id)?'done':''}"></i>`).join('')}</div><fieldset class="question-fieldset"><legend id="question-title" tabindex="-1">${safe(question.title)}</legend><p class="question-hint">${safe(question.hint)}</p><div class="answer-options">${question.options.map((option,index)=>`<label class="answer-option"><input type="radio" name="answer" value="${option.value}" required ${state.answers[question.id]===option.value?'checked':''} aria-labelledby="answer-label-${index}" aria-describedby="answer-detail-${index}"><span class="radio-mark" aria-hidden="true"></span><span><strong id="answer-label-${index}">${safe(option.label)}</strong><small id="answer-detail-${index}">${safe(option.detail)}</small></span></label>`).join('')}</div></fieldset><div class="question-actions"><button class="question-back" type="button" id="question-back"><span aria-hidden="true">←</span>${state.questionIndex?'Назад':'Выбрать задачу'}</button><button class="button button-primary" id="question-next" type="submit" ${answered?'':'disabled'}>${state.questionIndex===5?'Моя финансовая карта':'Далее'}<span aria-hidden="true">→</span></button></div></form><aside class="assessment-aside"><p class="aside-label">ВАШ ОСНОВНОЙ ЗАПРОС</p><h3>${safe(scenario.title)}</h3><p>Ответы помогут выбрать направления проверки и показать, что стоит настроить в первую очередь.</p><div class="aside-rule"></div><ol><li class="active"><span>1</span>Контекст бизнеса</li><li class="${state.questionIndex>=2?'active':''}"><span>2</span>Инструменты контроля</li><li><span>3</span>Персональная карта</li></ol><div class="aside-rule"></div><p>«Не знаю» — полноценный ответ. Он означает, что инструмент нужно проверить, а не что его нет.</p></aside></div>`;
  }
  function bindAssessment() {
    const question=E.getQuestions(state.scenario)[state.questionIndex];
    $('question-form').addEventListener('change',event=>{
      if(event.target.name!=='answer')return;
      state.answers[question.id]=event.target.value;
      $('question-next').disabled=false;
      const questions=E.getQuestions(state.scenario);
      screen.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',questions.filter(q=>Object.hasOwn(state.answers,q.id)).length);
      persist();track('question_answered',question.id);
    });
    $('question-form').addEventListener('submit',event=>{
      event.preventDefault();
      if(!Object.hasOwn(state.answers,question.id))return;
      if(state.questionIndex<5){state.questionIndex++;go('assessment',{focus:false});$('question-title').focus({preventScroll:true});$('question-title').scrollIntoView({block:'start',behavior:motion()});announce(`Вопрос ${state.questionIndex+1} из 6`);}
      else{track('assessment_completed',state.scenario);go('map');}
    });
    $('question-back').addEventListener('click',()=>{if(state.questionIndex>0){state.questionIndex--;go('assessment',{focus:false});$('question-title').focus({preventScroll:true});$('question-title').scrollIntoView({block:'start',behavior:motion()});}else go('start');});
  }
  function missingMap(route) {
    return `${heading(route==='map'?'ФИНАНСОВАЯ КАРТА':'ПЕРСОНАЛЬНЫЙ МАРШРУТ',route==='map'?'У каждой карты есть точка старта.':'Соберём маршрут под вашу задачу.','Ответьте на несколько вопросов — так рекомендации будут связаны с вашей ситуацией.',route==='map'?'03':'05')}<div class="empty-state"><span aria-hidden="true">↗</span><h2>${state.scenario?'Продолжим с вашего вопроса?':'Начнём с выбора задачи?'}</h2><p>Вы сможете увидеть основания каждой рекомендации и сохранить предварительный план. Без контактов и загрузки документов.</p>${button(state.scenario?'Продолжить оценку':'Выбрать задачу',state.scenario?'assessment':'start')}</div>`;
  }
  function renderMap() {
    const assessment=result(); if(!assessment)return missingMap('map');
    const ring=assessment.coveragePercent===null?0:assessment.coveragePercent;
    const statuses={yes:['Есть','yes'],partial:['Частично','partial'],no:['Нет','no'],unknown:['Уточнить','unknown']};
    return `${heading('ФИНАНСОВАЯ КАРТА','Что уже видно. Что стоит проверить.',`Ваш запрос: ${safe(currentScenario().title.toLowerCase())}. Оцениваем наличие инструментов по вашим ответам, а не реальные результаты бизнеса.`,'03')}<section class="score-panel" aria-labelledby="score-title"><div class="score-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="53" fill="none" stroke="#3b5363" stroke-width="5"/><circle cx="60" cy="60" r="53" fill="none" stroke="#9ee4cf" stroke-width="5" stroke-linecap="round" stroke-dasharray="${ring*3.33} 333"/></svg><div><strong>${assessment.coveragePercent===null?'—':assessment.score+' / '+assessment.maxScore}</strong><small>по известным<br>ответам</small></div></div><div class="score-copy"><p class="eyebrow">ПРЕДВАРИТЕЛЬНОЕ НАБЛЮДЕНИЕ</p><h2 id="score-title">${safe(assessment.title)}</h2><p>${safe(assessment.summary)}</p><div class="score-facts"><span>Известных ответов: <strong>${assessment.knownCount} / 4</strong></span><span>Нужно уточнить: <strong>${assessment.unknownCount}</strong></span><span>Правила: <strong>v1.0</strong></span></div></div></section>
      <div class="content-grid"><section class="white-panel"><h2 class="panel-title">Инструменты в вашем сценарии</h2><p class="panel-description">Да — 2 балла, частично — 1, нет — 0. Неизвестные ответы учитываются отдельно и не снижают оценку.</p><ul class="tool-list">${E.getQuestions(state.scenario).filter(q=>q.kind==='tool').map(question=>{const status=statuses[state.answers[question.id]];return `<li><span>${safe(question.title)}</span><strong class="status-pill ${status[1]}">${status[0]}</strong></li>`;}).join('')}</ul></section><section class="white-panel"><h2 class="panel-title">В первую очередь проверим</h2><p class="panel-description">До трёх направлений, связанных с запросом и ответами.</p><ol class="priority-list">${assessment.priorities.map(module=>`<li><strong>${safe(module.title)}</strong><p>${safe(module.reason)}</p></li>`).join('')}</ol></section></div><div class="notice-row">${info('<strong>Это не финансовый диагноз.</strong> Ответы не подтверждают финансовую устойчивость и не устанавливают причины кассовых разрывов. Существующие инструменты сначала проверяем и интегрируем.')}</div><div class="page-actions"><button class="text-link" data-action="edit-assessment">Изменить ответы</button><div class="button-row">${button('Моя дорожная карта','roadmap',false)}${button('Исследовать денежный поток','simulator')}</div></div>`;
  }
  function renderSimulator() {
    return `${heading('ФИНАНСОВЫЙ СИМУЛЯТОР','Прибыль есть, а деньги где?','Сопоставьте прибыль за период и показатели на две отчётные даты. Навигатор покажет, что изменилось в деньгах, запасах и долгах, и поможет подготовить вопросы бухгалтеру.','04')}${simulatorMigrationNotice?`<div class="notice-row" style="margin:0 0 22px">${info('Симулятор обновлён: открыт учебный пример с двумя датами. Прежние изменения за период не перенесены в остатки. Ответы на вопросы сохранены.')}</div>`:''}${simulatorFieldsNotice?`<div class="notice-row" style="margin:0 0 22px">${info(`Ваши прежние суммы и даты сохранены. Новые поля — выручка, себестоимость и денежные средства — оставлены пустыми. Заполните их для расширенного анализа или ${state.inputs.mode==='demo'?'нажмите «Вернуть пример»':'выберите «Попробовать на примере»'}, чтобы открыть обновлённые учебные данные.`)}</div>`:''}<div id="simulator-mount"></div><div class="page-actions"><button class="text-link" data-nav="${result()?'map':'start'}">← ${result()?'К финансовой карте':'К выбору задачи'}</button><div class="button-row">${button('Как устроена работа','offer',false)}${button('Перейти к дорожной карте','roadmap')}</div></div>`;
  }
  function renderRoadmap() {
    const assessment=result(); if(!assessment)return missingMap('roadmap');
    return `${heading('ПЕРСОНАЛЬНАЯ ДОРОЖНАЯ КАРТА','От приоритетов — к работающей системе.',`Предварительный маршрут по запросу «${safe(currentScenario().title.toLowerCase())}». Для каждого модуля — основание, результат и предмет проверки.`,'05')}${info('<strong>Состав уточняется после экспертной диагностики.</strong> Уже работающие инструменты проверяем, интегрируем или дорабатываем. Объём, стоимость и график проекта согласуем отдельно.')}<div class="subheading"><h2>Приоритетные направления</h2><span>${assessment.priorities.length} из 3 возможных приоритетов</span></div><div class="module-grid">${assessment.priorities.map((module,index)=>`<article class="module-card"><div class="module-top"><span>ПРИОРИТЕТ ${String(index+1).padStart(2,'0')}</span><span aria-hidden="true">↗</span></div><h3>${safe(module.title)}</h3><p class="reason">${safe(module.reason)}</p><dl><dt>ЧТО ПОЛУЧАЕТЕ</dt><dd>${safe(module.deliverable)}</dd><dt>ЧТО ПРОВЕРИМ НА ДИАГНОСТИКЕ</dt><dd>${safe(module.verify)}</dd></dl></article>`).join('')}</div><div class="subheading"><h2>Основа финансового управления</h2><span>Обязательное ядро проекта</span></div><section class="white-panel"><p class="panel-description" style="margin-top:0">Это единая система, а не набор отдельных таблиц. Глубина каждого блока зависит от задачи и того, что уже есть в бизнесе.</p><div class="core-grid">${assessment.core.map(core=>`<article class="core-item"><span aria-hidden="true">✓</span><div><h3>${safe(core.title)}</h3><p>${safe(core.description)}</p></div></article>`).join('')}</div></section>${assessment.additional.length?`<details class="extra-details"><summary>Дополнительные направления для проверки (${assessment.additional.length}) <span aria-hidden="true">+</span></summary><div>${assessment.additional.map(module=>`<article><h3>${safe(module.title)}</h3><p>${safe(module.reason)}</p><p><strong>Результат:</strong> ${safe(module.deliverable)}</p><p><strong>Проверим:</strong> ${safe(module.verify)}</p></article>`).join('')}</div></details>`:''}<div class="page-actions"><div><button class="text-link" data-action="save-roadmap">Сохранить карту ↓</button><p id="save-status" class="save-status" role="status"></p></div><div class="button-row">${button('Этапы и условия','offer',false)}${button('Обсудить на бесплатной встрече','meeting')}</div></div>`;
  }
  function renderOffer() {
    return `${heading('КАК УСТРОЕНА РАБОТА','Не просто отчёты. Система для решений.','Разработаем, внедрим и передадим вашей команде финансовое управление, с которым можно работать самостоятельно.','06')}<section class="offer-hero"><div><h2>Цифры связаны.<br>Ответственность понятна.<br>Решения — обоснованы.</h2><p>От согласования задачи до тестового отчётного цикла. Существующие решения сохраняем и дорабатываем там, где это необходимо.</p></div><div class="offer-output"><span>ПРОВЕРЯЕМЫЕ РЕЗУЛЬТАТЫ</span><ul><li>Связанные управленческие отчёты</li><li>План-факт и понятные показатели</li><li>Проверенный управленческий цикл</li><li>Инструкции и обученная команда</li></ul></div></section><div class="subheading"><h2>Шесть этапов сотрудничества</h2><span>Сопровождение — по желанию</span></div><div class="timeline">${E.stages.map((stage,index)=>`<article class="timeline-step"><span>${String(index).padStart(2,'0')} / ${index===0?'БЕСПЛАТНО':index===1?'ОТДЕЛЬНЫЙ ПЛАТНЫЙ ЭТАП':'ПРОЕКТ'}</span><h3>${safe(stage.title)}</h3><p>${safe(stage.description)}</p><small>Результат: ${safe(stage.deliverable)}</small></article>`).join('')}</div><div class="evidence-panel"><span aria-hidden="true">↗</span><div><h3>Оцениваем работу по тому, что можно проверить.</h3><p>Согласованные сверки, корректность отчётов и прохождение тестового цикла. Без гарантированных процентов роста прибыли и обещаний эффекта до анализа данных.</p></div></div><div class="notice-row">${info('<strong>Как определяется стоимость?</strong> Бесплатная встреча помогает уточнить запрос. Далее — отдельная платная экспертная диагностика. Договорную цену, объём и сроки проекта утверждаем по её итогам.')}</div><div class="page-actions"><button class="text-link" data-nav="roadmap">← К моей дорожной карте</button>${button('Начать с бесплатной встречи','meeting')}</div>`;
  }
  function prepareMeetingMessage() {
    const viewed=state.events.some(event=>event.type==='navigator_opened'&&event.step==='simulator');
    let topics=[];
    if(viewed) {
      try {
        const analysis=P.analyze(state.inputs);
        if(analysis.valid) topics=(analysis.analysis?.summary?.meetingTopics||[]).slice(0,3);
      } catch {}
    }
    const hasTopics=topics.length>0;
    const header=state.inputs.mode==='demo'?'Темы для обсуждения на учебном примере:':'Темы по предварительному разбору моих данных:';
    const section=hasTopics?`${header}\n${topics.map(topic=>`— ${topic.text}`).join('\n')}\n\nЧто хотите добавить?\n`:'Что хотите добавить?\n';
    let message=draftFields.message;
    let manuallyChanged=false;
    if(!meetingAutoSection) message=section+message;
    else if(message.includes(meetingAutoSection)) message=message.replace(meetingAutoSection,section);
    else if(!meetingAutoHasTopics&&hasTopics) message=section+message;
    else manuallyChanged=true;
    if(message.length>2000) return 'Ваше сообщение сохранено. Дополнительные темы можно вписать после сокращения текста.';
    if(manuallyChanged) return 'Вы отредактировали сообщение. Ваш текст сохранён; актуальные темы можно добавить из разбора вручную.';
    if(draftFields.message!==message) draftText='';
    draftFields.message=message;
    meetingAutoSection=section;
    meetingAutoHasTopics=hasTopics;
    return hasTopics
      ? state.inputs.mode==='demo'?'Темы относятся к учебному примеру. Измените их под вашу ситуацию.':'Темы предложены по предварительному разбору без финансовых сумм. Проверьте и дополните их.'
      : 'Здесь можно описать любую задачу, которую вы хотите обсудить.';
  }
  const workFormats = [
    {id:'diagnostics',title:'Экспертная диагностика',label:'ПОНЯТЬ СИТУАЦИЮ',description:'Разберём текущие данные, инструменты и финансовые приоритеты бизнеса.',items:['Выводы по финансовой картине','План следующего этапа'],note:'Отдельный платный этап'},
    {id:'implementation',title:'Разработка и внедрение системы',label:'ВЫСТРОИТЬ УПРАВЛЕНИЕ',description:'Создадим или доработаем систему финансового управления и передадим её команде.',items:['Связанные отчёты, модель и регламенты','Тестовый цикл, инструкции и обучение'],note:'Объём и сроки — по итогам диагностики'},
    {id:'support',title:'Сопровождение бизнеса',label:'ПОДДЕРЖАТЬ РЕЗУЛЬТАТ',description:'Поддержим работу действующей системы и регулярный разбор показателей.',items:['План-факт и контроль отклонений','Поддержка ответственных сотрудников'],note:'По желанию, формат согласуется под задачу'}
  ];
  function renderWorkFormats() {
    return `<section class="work-formats" aria-labelledby="work-formats-title"><p class="eyebrow"><span class="eyebrow-dot"></span>ВАРИАНТЫ РАБОТЫ СО МНОЙ</p><h2 id="work-formats-title">Выберите подходящий следующий шаг.</h2><p class="work-formats-intro">Начать можно с диагностики, затем перейти к проекту и при необходимости к сопровождению.</p><div class="work-format-grid">${workFormats.map((format,index)=>`<article class="work-format-card"><div class="work-format-top"><span>${format.label}</span><span>${String(index+1).padStart(2,'0')}</span></div><h3>${safe(format.title)}</h3><p>${safe(format.description)}</p><ul>${format.items.map(item=>`<li>${safe(item)}</li>`).join('')}</ul><small>${safe(format.note)}</small><button class="button button-secondary" type="button" data-work-format="${format.id}">Обсудить этот формат <span aria-hidden="true">↘</span></button></article>`).join('')}</div><p class="work-formats-note">На бесплатной встрече определим подходящий следующий шаг. Объём, сроки и стоимость проекта согласуем после экспертной диагностики.</p><p class="work-format-status" id="work-format-status" role="status"></p></section>`;
  }
  function discussWorkFormat(id) {
    const format=workFormats.find(item=>item.id===id),message=$('lead-message');
    if(!format||!message)return;
    const line=`Хочу обсудить формат «${format.title}».`;
    const current=message.value;
    const combined=current.includes(line)?current:current+(current&&!current.endsWith('\n')?'\n':'')+line+'\n';
    if(combined.length>message.maxLength) {
      $('work-format-status').textContent='Ваш текст сохранён. Сократите сообщение, чтобы добавить выбранный формат.';
      message.scrollIntoView({block:'center',behavior:motion()});message.focus({preventScroll:true});return;
    }
    if(combined!==current) {
      message.value=combined;
      message.dispatchEvent(new Event('input',{bubbles:true}));
    }
    $('work-format-status').textContent=current.includes(line)?'Этот формат уже добавлен к темам встречи.':'Формат добавлен к темам встречи.';
    $('meeting-form').scrollIntoView({block:'start',behavior:motion()});
    $('lead-name').focus({preventScroll:true});
  }
  function renderMeeting() {
    const completed=Boolean(result());
    const messageHint=prepareMeetingMessage();
    return `${renderWorkFormats()}${heading('БЕСПЛАТНАЯ ОЗНАКОМИТЕЛЬНАЯ ВСТРЕЧА','Начнём с вашего управленческого вопроса.','Обсудим ситуацию, определим следующий шаг и поймём, будет ли полезна экспертная диагностика.','')}<div class="meeting-layout"><form id="meeting-form" class="meeting-form" novalidate><h2>Подготовьте заявку</h2><p class="panel-description">В прототипе вы можете проверить форму и сохранить черновик.</p><div class="field-grid"><div class="field"><label for="lead-name">Как к вам обращаться <span>*</span></label><input id="lead-name" name="name" autocomplete="name" required minlength="2" maxlength="100" placeholder="Например, Алексей" value="${safe(draftFields.name)}"><span class="field-error" id="name-error"></span></div><div class="field"><label for="lead-company">Компания</label><input id="lead-company" name="company" autocomplete="organization" maxlength="150" placeholder="Название компании" value="${safe(draftFields.company)}"></div><div class="field"><label for="lead-method">Как с вами связаться <span>*</span></label><select id="lead-method" name="method"><option value="email" ${draftFields.method==='email'?'selected':''}>Электронная почта</option><option value="phone" ${draftFields.method==='phone'?'selected':''}>Телефон</option></select></div><div class="field"><label for="lead-contact" id="contact-label">${draftFields.method==='email'?'Электронная почта':'Телефон'} <span>*</span></label><input id="lead-contact" name="contact" type="${draftFields.method==='email'?'email':'tel'}" autocomplete="${draftFields.method==='email'?'email':'tel'}" required maxlength="200" placeholder="${draftFields.method==='email'?'name@company.ru':'+7 900 000-00-00'}" value="${safe(draftFields.contact)}"><span class="field-error" id="contact-error"></span></div><div class="field full"><label for="lead-message">Что обсудить на встрече</label><textarea id="lead-message" name="message" maxlength="2000" rows="8" aria-describedby="lead-message-hint" placeholder="Что хотите добавить к предложенным темам?">${safe(draftFields.message)}</textarea><p class="message-hint" id="lead-message-hint">${safe(messageHint)}</p></div></div><div class="consents"><label class="check-label"><input type="checkbox" name="consent" id="lead-consent" required ${draftFields.consent?'checked':''}><span>Даю согласие на обработку данных для заявки <strong>*</strong><br><small>Демонстрация согласия. Политика и реквизиты оператора утверждаются перед запуском.</small></span></label><span class="field-error" id="consent-error"></span><label class="check-label"><input type="checkbox" name="attach" id="lead-attach" ${draftFields.attach&&completed?'checked':''} ${completed?'':'disabled'}><span>Приложить ответы и предварительную дорожную карту${completed?'':'<br><small>Сначала завершите оценку инструментов.</small>'}</span></label><label class="check-label"><input type="checkbox" name="marketing" id="lead-marketing" ${draftFields.marketing?'checked':''}><span>Хочу получать материалы о финансовом управлении <small>(необязательно)</small></span></label></div><p class="meeting-demo">Это интерактивный прототип. Данные не отправляются, встреча не бронируется. После проверки вы сможете скачать черновик.</p><div class="button-row"><button class="button button-primary" type="submit">Подготовить черновик <span aria-hidden="true">↗</span></button></div><div id="draft-result" tabindex="-1" hidden></div></form><aside class="meeting-aside"><p class="aside-label">НА ПЕРВОЙ ВСТРЕЧЕ</p><h3>Сначала познакомимся.</h3><ul><li><span aria-hidden="true">✓</span>Уточним задачу и контекст бизнеса</li><li><span aria-hidden="true">✓</span>Обсудим, как устроено финансовое управление</li><li><span aria-hidden="true">✓</span>Определим, нужна ли экспертная диагностика</li></ul><p>Экспертная диагностика — отдельный платный этап. Стоимость проекта внедрения согласуется после её проведения.</p></aside></div>`;
  }
  function bindMeeting() {
    const form=$('meeting-form');
    const invalidateDraft=()=>{draftText='';$('draft-result').hidden=true;$('draft-result').replaceChildren();};
    const capture=()=>{
      draftFields={name:$('lead-name').value,company:$('lead-company').value,method:$('lead-method').value,contact:$('lead-contact').value,message:$('lead-message').value,consent:$('lead-consent').checked,marketing:$('lead-marketing').checked,attach:$('lead-attach').checked};
    };
    form.addEventListener('input',event=>{capture();invalidateDraft();if(event.target.id==='lead-name')setError('lead-name','name-error','');if(event.target.id==='lead-contact')setError('lead-contact','contact-error','');});
    form.addEventListener('change',event=>{
      capture();
      invalidateDraft();
      if(event.target.id==='lead-method'){
        const email=draftFields.method==='email';
        $('lead-contact').type=email?'email':'tel';$('lead-contact').autocomplete=email?'email':'tel';$('lead-contact').placeholder=email?'name@company.ru':'+7 900 000-00-00';
        $('contact-label').innerHTML=`${email?'Электронная почта':'Телефон'} <span>*</span>`;
        setError('lead-contact','contact-error','');
      }
      if(event.target.id==='lead-consent'&&event.target.checked){$('consent-error').textContent='';event.target.removeAttribute('aria-invalid');}
    });
    form.addEventListener('submit',event=>{
      event.preventDefault();capture();
      const name=draftFields.name.trim(),contact=draftFields.contact.trim();
      const nameError=name.length<2?'Укажите имя: минимум 2 символа.':'';
      const validContact=draftFields.method==='email'?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact):/^\+?[\d\s()\-]+$/.test(contact)&&contact.replace(/\D/g,'').length>=7&&contact.replace(/\D/g,'').length<=15;
      const contactError=validContact?'':draftFields.method==='email'?'Укажите email, например name@company.ru.':'Укажите телефон: от 7 до 15 цифр.';
      setError('lead-name','name-error',nameError);setError('lead-contact','contact-error',contactError);
      $('consent-error').textContent=draftFields.consent?'':'Подтвердите демонстрационное согласие для подготовки черновика.';
      $('lead-consent').setAttribute('aria-describedby','consent-error');$('lead-consent').setAttribute('aria-invalid',String(!draftFields.consent));
      if(nameError||contactError||!draftFields.consent){$(nameError?'lead-name':contactError?'lead-contact':'lead-consent').focus();announce('Проверьте отмеченные поля формы.');return;}
      draftText=['FINCONSULT — черновик заявки на бесплатную встречу','Данные не отправлены. Время встречи не назначено.','',`Имя: ${name}`,`Компания: ${draftFields.company.trim()||'Не указана'}`,`${draftFields.method==='email'?'Email':'Телефон'}: ${contact}`,`Комментарий: ${draftFields.message.trim()||'Не указан'}`,'',`Демонстрационное согласие: ${draftFields.consent?'Да':'Нет'}`,`Материалы о финансовом управлении: ${draftFields.marketing?'Да':'Нет'}`,`Приложить ответы: ${draftFields.attach?'Да':'Нет'}`].join('\n');
      if(draftFields.attach&&result())draftText+='\n\n'+roadmapText(true);
      const node=$('draft-result');node.hidden=false;node.className='draft-result';node.innerHTML='<h3>Черновик подготовлен.</h3><p>Проверьте данные и сохраните их. Для настоящей отправки на этапе внедрения подключается получатель заявок; время встречи согласуется отдельно.</p><pre id="draft-preview"></pre><button class="button button-secondary" type="button" data-action="save-draft">Скачать черновик <span aria-hidden="true">↓</span></button>';
      $('draft-preview').textContent=draftText;node.focus();node.scrollIntoView({block:'nearest',behavior:motion()});announce('Черновик подготовлен. Данные не отправлены.');track('draft_prepared','meeting');
    });
  }
  function setError(inputId,errorId,message){$(errorId).textContent=message;$(inputId).setAttribute('aria-describedby',errorId);$(inputId).setAttribute('aria-invalid',String(Boolean(message)));}
  function roadmapText(withAnswers=false) {
    const assessment=result();if(!assessment)return '';
    const lines=['FINCONSULT — предварительная дорожная карта',`Запрос: ${currentScenario().title}`,`Версия правил: ${assessment.version}`,'',assessment.title,assessment.summary,'','ПРИОРИТЕТЫ',...assessment.priorities.flatMap(module=>[module.title,`Причина: ${module.reason}`,`Что получаете: ${module.deliverable}`,`Проверим: ${module.verify}`,'']),'ОБЯЗАТЕЛЬНОЕ ЯДРО',...assessment.core.map(core=>`• ${core.title}: ${core.description}`),'','ЭТАПЫ',...assessment.stages.map((stage,index)=>`${index}. ${stage.title}: ${stage.deliverable}`)];
    if(assessment.additional.length)lines.push('','ДОПОЛНИТЕЛЬНО ПРОВЕРИМ',...assessment.additional.map(module=>`${module.title}: ${module.reason}`));
    if(withAnswers)lines.push('','ОТВЕТЫ',...E.getQuestions(state.scenario).map(question=>`${question.title}\n${question.options.find(option=>option.value===state.answers[question.id]).label}`));
    lines.push('','Это предварительная оценка инструментов контроля, не финансовый диагноз. Сроки, объём и договорная цена согласуются после платной экспертной диагностики.');
    return lines.join('\n');
  }
  function download(text,name,statusNode){
    try{const blob=new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);if(statusNode)statusNode.textContent='Файл подготовлен для скачивания.';}
    catch{if(statusNode)statusNode.textContent='Скачивание недоступно. Скопируйте текст со страницы.';announce('Скачивание недоступно в этом браузере.');}
  }
  const renderers={start:renderStart,assessment:renderAssessment,map:renderMap,simulator:renderSimulator,roadmap:renderRoadmap,offer:renderOffer,meeting:renderMeeting};
  document.addEventListener('click',event=>{
    const format=event.target.closest('[data-work-format]');if(format){event.preventDefault();discussWorkFormat(format.dataset.workFormat);return;}
    const nav=event.target.closest('[data-nav]');if(nav){event.preventDefault();go(nav.dataset.nav);return;}
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='edit-assessment'){state.questionIndex=0;go('assessment');}
    if(action==='save-roadmap')download(roadmapText(true),'finconsult-roadmap.txt',$('save-status'));
    if(action==='save-draft')download(draftText,'finconsult-meeting-draft.txt',null);
    if(event.target.closest('#start-assessment')){if(state.scenario){state.questionIndex=0;go('assessment');}}
  });
  screen.addEventListener('change',event=>{
    if(event.target.name!=='scenario')return;
    const scenario=event.target.value;if(!E.scenarios.some(item=>item.id===scenario))return;
    if(state.scenario!==scenario){draftFields.attach=false;draftText='';}
    state.scenario=scenario;state.questionIndex=0;persist();track('scenario_selected',scenario);
    $('start-assessment').disabled=false;
    announce(`Выбран сценарий: ${currentScenario().title}`);
  });
  $('mobile-menu').addEventListener('click',()=>setMobileMenu(!$('sidebar').classList.contains('is-open')));
  document.addEventListener('click',event=>{if(!event.target.closest('.sidebar,.mobile-menu'))setMobileMenu(false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('sidebar').classList.contains('is-open')){setMobileMenu(false);$('mobile-menu').focus();}});
  mobileQuery.addEventListener('change',()=>setMobileMenu(false));
  const dialog=$('reset-dialog');
  $('reset-session').addEventListener('click',()=>dialog.showModal());
  $('cancel-reset').addEventListener('click',()=>dialog.close());
  $('confirm-reset').addEventListener('click',()=>{simulator?.destroy();state=freshState();simulatorMigrationNotice=false;simulatorFieldsNotice=false;draftFields={name:'',company:'',method:'email',contact:'',message:'',consent:false,marketing:false,attach:false};draftText='';meetingAutoSection='';meetingAutoHasTopics=false;dialog.close();persist();go('start');announce('Ответы и параметры очищены. Можно выбрать новую задачу.');});
  window.addEventListener('hashchange',()=>{const route=location.hash.slice(1);if(Object.hasOwn(routes,route))go(route);});
  const route=location.hash.slice(1);if(Object.hasOwn(routes,route))state.screen=route;
  track('landing_view','start');go(state.screen,{focus:false});
  if(sessionWasRestored)announce('Прогресс восстановлен в этой вкладке.');
})();
