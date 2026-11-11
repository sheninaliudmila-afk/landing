(function(global){
  'use strict';
  const mounts=new WeakMap();let sequence=0;
  const e=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const formatter=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:9});
  const fmt=value=>value==null?'—':formatter.format(value).replace('-','−');
  const signed=value=>value==null?'—':`${value>0?'+':''}${fmt(value)}`;
  const get=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);
  const put=(object,path,value)=>{const keys=path.split('.');let at=object;keys.slice(0,-1).forEach(key=>at=at[key]);at[keys.at(-1)]=value;};
  function parse(raw){
    const text=String(raw).trim().replace(/[\s\u00a0\u202f]/g,'').replace(/₽|руб\.?/gi,'').replace('−','-');
    if(!text)return {value:null};
    if(!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text))return {value:null,error:'Введите число. Можно использовать пробелы и десятичную запятую.'};
    const value=Number(text.replace(',','.'));
    return Number.isFinite(value)?{value}:{value:null,error:'Проверьте число.'};
  }
  function dateLabel(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';
    const date=new Date(`${value}T12:00:00Z`);
    return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('ru-RU',{timeZone:'UTC'}).format(date);
  }
  function mount(root,options={}){
    const P=global.PeriodModel;
    if(!root||!P)throw new Error('Для симулятора необходимы контейнер и PeriodModel.');
    mounts.get(root)?.();
    const uid=`period-${++sequence}`,clone=P.cloneInput,convert=P.convertUnit||P.convertUnits;
    const empty=unit=>{const input=P.createEmptyInput();input.mode='own';input.previousDate='';input.currentDate='';return convert(input,unit||input.unit);};
    let candidate=options.values;
    try{if(candidate&&P.upgradeInput)candidate=P.upgradeInput(candidate);}catch{candidate=null;}
    let state=P.isInputShape(candidate)?clone(candidate):clone(P.demoInput);
    const drafts={demo:null,own:null};drafts[state.mode]=clone(state);
    let localErrors={};
    const id=path=>`${uid}-${path.replaceAll('.','-')}`;
    const field=(path,title,description='')=>`<div class="pd-field"><label class="pd-sr-only" for="${id(path)}">${e(title)}</label><input id="${id(path)}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-period-field="${path}" placeholder="Не знаю" aria-describedby="${id(path)}-error${description?' '+description:''}"><span class="pd-field-error" id="${id(path)}-error" data-period-error="${path}" hidden></span></div>`;
    const flowRow=(key,heading)=>{
      const definition=P.flowDefinitions.find(item=>item.id===key),path=`flows.${key}`;
      return `<div class="pd-flow-row"><div><label for="${id(path)}">${e(heading||definition.title)}</label><p>${e(definition.help)}</p><details class="pd-source"><summary>Где взять цифру</summary><p>${e(definition.source)}</p></details></div>${field(path,definition.title)}</div>`;
    };
    root.classList.add('ns-root','pd-root');
    root.innerHTML=`
    <div class="pd-modebar"><div class="pd-modes" role="group" aria-label="Режим финансового примера"><button type="button" data-period-mode="demo" aria-pressed="false">Попробовать на примере</button><button type="button" data-period-mode="own" aria-pressed="false">Ввести свои данные</button></div><button class="pd-reset" type="button" data-period-reset>Вернуть пример <span aria-hidden="true">↺</span></button></div>
    <p class="pd-mode-note" data-period-mode-note></p>
    <div class="pd-period-card"><div class="pd-section-heading"><span class="pd-step">01</span><div><h3>Выберите две даты и единицу измерения</h3><p>Сравним, что было на прошлую дату и что есть на текущую.</p></div></div><div class="pd-period-controls"><div><label for="${uid}-previous">Прошлая дата</label><input id="${uid}-previous" type="date" data-period-date="previousDate" aria-describedby="${uid}-previous-error"><p class="pd-field-error" id="${uid}-previous-error" data-period-error="previousDate" hidden></p></div><div><label for="${uid}-current">Текущая дата</label><input id="${uid}-current" type="date" data-period-date="currentDate" aria-describedby="${uid}-current-error"><p class="pd-field-error" id="${uid}-current-error" data-period-error="currentDate" hidden></p></div><div><label for="${uid}-unit">Все суммы указаны в</label><select id="${uid}-unit" data-period-unit>${P.units.map(unit=>`<option value="${unit.id}">${e(unit.title)}</option>`).join('')}</select><p class="pd-control-note">Единица одна для всех показателей.</p></div></div></div>
    <details class="pd-accountant-request"><summary><span class="pd-request-icon" aria-hidden="true">?</span><span><strong>Не знаете цифры? Вот что попросить у бухгалтера</strong><small>Готовый запрос с датами, показателями и пояснениями.</small></span><span class="pd-expand-icon" aria-hidden="true">+</span></summary><div class="pd-request-content"><p>Не нужно собирать всё самостоятельно. Скопируйте запрос и отправьте его вашему бухгалтеру или финансовому специалисту.</p><textarea readonly data-period-request aria-label="Готовый запрос бухгалтеру" rows="11"></textarea><div class="pd-request-actions"><button type="button" class="pd-button" data-period-copy>Скопировать запрос <span aria-hidden="true">⧉</span></button><button type="button" class="pd-button pd-button-quiet" data-period-download>Скачать запрос ↓</button></div><p data-period-request-status role="status"></p></div></details>
    <div class="pd-section-heading pd-data-heading"><span class="pd-step">02</span><div><h3>Внесите понятные цифры</h3><p>Если показатель неизвестен, оставьте поле пустым. Ноль вводите только тогда, когда сумма действительно равна нулю.</p></div><span class="pd-unit-badge" data-period-unit-label></span></div>
    <div class="pd-main-grid"><div class="pd-data-column"><div class="pd-balance-panel"><table class="pd-balance-table"><caption>Показатели на две даты</caption><thead><tr><th scope="col">Что сравниваем</th><th scope="col" data-period-previous-heading>На прошлую дату</th><th scope="col" data-period-current-heading>На текущую дату</th><th scope="col">Изменение</th></tr></thead><tbody>${P.balanceDefinitions.map(definition=>`<tr><th scope="row"><span class="pd-metric-title">${e(definition.title)}</span><details class="pd-source"><summary>Что это и где взять</summary><div id="${uid}-help-${definition.id}"><p>${e(definition.help)}</p><p><strong>Источник:</strong> ${e(definition.source)}</p></div></details></th><td data-label="Прошлая дата">${field(`balances.${definition.id}.previous`,`${definition.title} на прошлую дату`,`${uid}-help-${definition.id}`)}</td><td data-label="Текущая дата">${field(`balances.${definition.id}.current`,`${definition.title} на текущую дату`,`${uid}-help-${definition.id}`)}</td><td class="pd-change-cell" data-label="Изменение"><output data-period-delta="${definition.id}">—</output><small data-period-delta-caption="${definition.id}"></small></td></tr>`).join('')}</tbody></table></div>
    <div class="pd-profit-card"><span class="pd-period-tag">ЗА ПЕРИОД, А НЕ НА ДАТУ</span><h4>Выручка, себестоимость и прибыль за период</h4><p data-period-profit-period></p>${flowRow('revenue','Выручка без НДС за выбранный период')}${flowRow('costOfSales','Себестоимость проданного за тот же период')}${flowRow('netProfit','Чистая прибыль за выбранный период')}<p class="pd-distinction">Чистая прибыль — результат работы за период. Её нельзя заменить разницей нераспределённой прибыли на две даты. Себестоимость относится к уже проданным товарам или услугам за тот же период.</p></div>
    <details class="pd-cash-details"><summary><span><strong>Уточнить движение денег</strong><small>Необязательно для разбора 10 показателей. Дополнительная модель потока.</small></span><span class="pd-expand-icon" aria-hidden="true">+</span></summary><div class="pd-extra-content">${flowRow('noncash','Неденежные расходы и корректировки')}${flowRow('capex','Фактически оплаченные инвестиции')}<p class="pd-distinction">Изменение основных средств не равно инвестиционным выплатам: на стоимость также влияют амортизация, продажи, переоценки и другие операции.</p><div data-period-cash-summary></div></div></details>
    <details class="pd-financing-details"><summary><span><strong>Добавить кредиты и дивиденды</strong><small>Необязательно. Отдельно от операционной деятельности.</small></span><span class="pd-expand-icon" aria-hidden="true">+</span></summary><div class="pd-extra-content">${flowRow('loanReceived','Получено кредитов и займов')}${flowRow('loanRepaid','Погашено тело кредитов и займов')}${flowRow('dividends','Фактически выплачено дивидендов')}<p class="pd-distinction">Разница кредитов на две даты не показывает все получения и погашения. Проценты не включайте в погашение тела кредита.</p><div data-period-financing-result></div></div></details></div>
    <aside class="pd-summary" aria-label="Что видно из введённых данных"><div class="pd-section-heading"><span class="pd-step">03</span><h3>Краткий обзор</h3></div><p class="pd-completion" data-period-completion></p><div data-period-summary></div><p class="pd-local-note">Значения остаются в этой вкладке и не отправляются.</p></aside></div>
    <section class="pd-analysis-section" aria-labelledby="${uid}-analysis-title"><div class="pd-section-heading"><span class="pd-step">04</span><div><h3 id="${uid}-analysis-title">Что говорят ваши цифры</h3><p>Коротко о сильных сторонах, проблемах, рисках и возможных действиях.</p></div></div><div data-period-qualitative-summary></div><details class="pd-detailed-analysis" data-period-analysis-details><summary>Подробные расчёты и основания <span aria-hidden="true">+</span></summary><div class="pd-analysis-grid" data-period-analysis></div></details></section>
    <div class="pd-limits"><span aria-hidden="true">i</span><p><strong>Предварительный пример для понимания взаимосвязей.</strong> Модель не рассчитывает остаток денег и не заменяет финансовую диагностику. Она не учитывает все оборотные статьи, прочие неденежные корректировки, отдельные налоги или проценты в зависимости от классификации и начальный остаток. Поток после инвестиций не является полным свободным денежным потоком.</p></div>`;
    root.querySelector('.pd-data-column').prepend(root.querySelector('.pd-profit-card'));
    const $=selector=>root.querySelector(selector),fields=[...root.querySelectorAll('[data-period-field]')];
    const unit=()=>P.units.find(item=>item.id===state.unit),unitTitle=()=>unit().title;
    const requestText=()=>P.accountantRequest(state);
    function error(path,message){
      const input=$(`[data-period-field="${path}"]`)||$(`[data-period-date="${path}"]`),node=$(`[data-period-error="${path}"]`);
      if(input){input.setCustomValidity(message||'');input.setAttribute('aria-invalid',String(Boolean(message)));}
      if(node){node.textContent=message||'';node.hidden=!message;}
    }
    const notify=()=>{if(typeof options.onChange==='function')options.onChange(clone(state));};
    function syncInputs(){
      fields.forEach(input=>{const value=get(state,input.dataset.periodField);input.value=value==null?'':fmt(value);});
      root.querySelectorAll('[data-period-date]').forEach(input=>input.value=state[input.dataset.periodDate]||'');
      $('[data-period-unit]').value=state.unit;localErrors={};
    }
    const metricValue=metric=>metric?.value==null?'Неизвестно':`${fmt(metric.value)}${metric.unit==='percent'?'%':' '+unit().shortTitle}`;
    function renderQualitativeSummary(analysis,metrics){
      const summary=analysis.summary||{};
      const groups=[
        {id:'strengths',title:'Сильные стороны',mark:'↗',empty:'По заполненным данным пока недостаточно оснований, чтобы отметить сильные стороны.'},
        {id:'problems',title:'Выявленные проблемы',mark:'?',empty:'По заполненным данным пока недостаточно оснований, чтобы выделить конкретные проблемы.'},
        {id:'risks',title:'Риски',mark:'◇',empty:'По заполненным данным пока недостаточно оснований, чтобы описать конкретные риски.'},
        {id:'solutions',title:'Возможные решения',mark:'→',empty:'По заполненным данным пока недостаточно оснований для конкретных решений. Уточним показатели и контекст бизнеса.'}
      ];
      $('[data-period-qualitative-summary]').innerHTML=`<p class="pd-qualifier" data-analysis-qualifier>${state.mode==='demo'?'Разбор примера':'Предварительный разбор ваших данных'}</p><div class="pd-qual-grid">${groups.map(group=>{
        const items=Array.isArray(summary[group.id])?summary[group.id].slice(0,3):[];
        return `<article class="pd-qual-card" data-qualitative-group="${group.id}"><h4><span aria-hidden="true">${group.mark}</span>${group.title}</h4>${items.length?`<ul>${items.map(item=>`<li data-qualitative-item="${e(item.id)}"><p>${e(item.text)}</p>${Object.keys(item.evidence||{}).length?`<details class="pd-qual-evidence"><summary>Основание</summary><p>${Object.entries(item.evidence).map(([id,value])=>`${e(metrics.get(id)?.title||id)}: ${e(metricValue({...metrics.get(id),value}))}`).join('; ')}.</p></details>`:''}</li>`).join('')}</ul>`:`<p class="pd-qual-empty">${group.empty}</p>`}</article>`;
      }).join('')}</div><div class="pd-qual-footer"><p>Предварительные наблюдения по введённым цифрам. Финальные выводы требуют проверки данных и контекста.</p><button class="pd-button" type="button" data-nav="meeting" data-analysis-meeting>Обсудить эти вопросы <span aria-hidden="true">→</span></button></div>`;
    }
    function renderAnalysis(analysis){
      const metrics=new Map((analysis.metrics||[]).map(metric=>[metric.id,metric]));
      renderQualitativeSummary(analysis,metrics);
      const groups=[
        {id:'profit',title:'Прибыльность',subtitle:'Что остаётся от продаж',metrics:['grossProfit','grossMargin','netMargin'],observations:['gross_profit','zero_revenue']},
        {id:'cash',title:'Прибыль и деньги',subtitle:'Чем результат отличается от изменения денег',metrics:['netProfit','cashChange','profitMinusCashChange'],observations:['profit_cash_divergence','profit_cash_comparison','cash_change']},
        {id:'workingCapital',title:'Деньги в обороте',subtitle:'Запасы и операционные расчёты',metrics:['operatingWorkingCapitalPrevious','operatingWorkingCapitalCurrent','operatingWorkingCapitalChange'],observations:['working_capital']},
        {id:'debtAssets',title:'Долг и активы',subtitle:'Изменения структуры бизнеса',metrics:['netDebtCurrent','netDebtChange','fixedAssetsChange','retainedEarningsChange'],observations:['net_debt','fixed_assets','retained_earnings']}
      ];
      $('[data-period-analysis]').dataset.analysisState=analysis.status||'partial';
      $('[data-period-analysis]').innerHTML=groups.map((group,index)=>{
        const chosen=group.metrics.map(id=>metrics.get(id)).filter(Boolean),observations=(analysis.observations||[]).filter(item=>group.observations.includes(item.id));
        return `<article class="pd-analysis-block" data-analysis-block="${group.id}"><header><span>${String(index+1).padStart(2,'0')}</span><div><h4>${group.title}</h4><p>${group.subtitle}</p></div></header><dl class="pd-analysis-metrics">${chosen.map(metric=>`<div><dt>${e(metric.title)}</dt><dd data-analysis-metric="${metric.id}">${e(metricValue(metric))}</dd></div>`).join('')}</dl>${observations.map(observation=>`<div class="pd-observation" data-analysis-observation="${observation.id}"><h5>${e(observation.title)}</h5><p>${e(observation.text)}</p><small><strong>На каких цифрах:</strong> ${Object.entries(observation.evidence||{}).map(([id,value])=>`${e(metrics.get(id)?.title||id)}: ${e(metricValue({...metrics.get(id),value}))}`).join('; ')}.</small></div>`).join('')}${!observations.length?'<p class="pd-analysis-empty">Пояснение появится, когда будут известны нужные показатели. Пустые поля не заменяем нулями.</p>':''}<details class="pd-analysis-method"><summary>Расчёты и исходные данные</summary>${chosen.map(metric=>`<p><strong>${e(metric.title)}.</strong> ${e(metric.formula||'')}${metric.basis?' '+e(metric.basis):''}</p>`).join('')}</details></article>`;
      }).join('');
      return metrics;
    }
    function update(){
      const a=P.analyze(state),previous=dateLabel(state.previousDate),current=dateLabel(state.currentDate),errors={...a.errors,...localErrors};
      [...fields.map(input=>input.dataset.periodField),'previousDate','currentDate'].forEach(path=>error(path,errors[path]));
      root.querySelectorAll('[data-period-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.periodMode===state.mode)));
      $('[data-period-reset]').firstChild.textContent=state.mode==='own'?'Очистить данные ':'Вернуть пример ';
      $('[data-period-mode-note]').textContent=state.mode==='own'?'Ваши данные. Неизвестные показатели можно оставить пустыми. Значения остаются в этой вкладке и не отправляются.':'Пример на условных цифрах. Изменяйте значения, чтобы понять, как связаны показатели.';
      $('[data-period-mode-note]').dataset.mode=state.mode;
      $('[data-period-unit-label]').textContent=unitTitle();
      $('[data-period-previous-heading]').textContent=previous?`На ${previous}`:'На прошлую дату';
      $('[data-period-current-heading]').textContent=current?`На ${current}`:'На текущую дату';
      $('[data-period-profit-period]').textContent=previous&&current?`За период после ${previous} по ${current} включительно.`:'Укажите обе даты, чтобы определить период.';
      $('[data-period-request]').value=requestText();
      P.balanceDefinitions.forEach(definition=>{const item=a.balances.find(row=>row.id===definition.id);$(`[data-period-delta="${definition.id}"]`).textContent=signed(item?.delta);$(`[data-period-delta-caption="${definition.id}"]`).textContent=item?.delta==null?'Нужны обе суммы':item.delta===0?'Без изменения':item.delta>0?'Увеличение':'Уменьшение';});
      const primary=a.analysis||{metrics:[],observations:[],status:'partial'};
      const known=primary.knownCount??P.balanceDefinitions.reduce((count,item)=>count+Number(state.balances[item.id].previous!==null)+Number(state.balances[item.id].current!==null),['revenue','costOfSales','netProfit'].filter(id=>state.flows[id]!==null).length);
      const count=primary.totalCount||17;
      $('[data-period-completion]').textContent=`Заполнено ${known} из ${count} основных значений. Пустые поля не считаются нулём.`;
      const metrics=renderAnalysis(primary),primaryStatus=primary.status==='invalid'?'Проверьте даты и отмеченные поля. Прошлая дата должна быть раньше текущей.':primary.status==='complete'?'Основные данные заполнены. Ниже — четыре направления предварительного разбора.':'Разбор строится по известным показателям. Недостающие суммы можно уточнить у бухгалтера.';
      $('[data-period-summary]').innerHTML=['netProfit','cashChange','operatingWorkingCapitalChange'].map(id=>metrics.get(id)).filter(Boolean).map(metric=>`<div class="pd-glance"><span>${e(metric.title)}</span><strong>${e(metricValue(metric))}</strong></div>`).join('')+`<div class="pd-status" data-period-status data-period-output-state="${primary.status}" role="status" aria-live="polite">${e(primaryStatus)}</div>`;
      const r=a.results,ocf=r.ocf,after=r.afterCapex,invalid=a.status==='invalid';
      const status=invalid?'Проверьте даты и отмеченные поля. Прошлая дата должна быть раньше текущей.':ocf===null?(known===0?'Добавьте известные показатели. Даже неполные данные помогут увидеть, что ещё нужно уточнить.':'Изменения показаны в таблице. Для оценки движения денег уточните недостающие показатели.'):a.explanation;
      const opened=$('[data-period-calculation]')?.open;
      $('[data-period-cash-summary]').innerHTML=`<div class="pd-cash-result"><span>Деньги от текущей работы бизнеса</span><strong data-period-ocf>${fmt(ocf)}</strong><small>${e(unitTitle())} · упрощённый операционный поток</small>${ocf===null?'<p>Появится, когда известны чистая прибыль, неденежные корректировки и изменения долгов клиентов, запасов и обязательств перед поставщиками.</p>':''}</div><div class="pd-cash-result pd-after-result"><span>После инвестиционных выплат</span><strong data-period-after>${fmt(after)}</strong><small>${e(unitTitle())} · не остаток денег на счёте</small>${after===null?'<p>Нужны операционный поток и фактически оплаченные инвестиции за период.</p>':''}</div><div class="pd-status" data-period-cash-status data-period-cash-state="${a.status}">${e(status)}</div>${ocf===null&&a.missing.core.length?`<details class="pd-missing"><summary>Какие данные ещё уточнить</summary><ul>${a.missing.core.map(item=>`<li>${e(item)}</li>`).join('')}</ul></details>`:''}${ocf!==null?`<details class="pd-calculation" data-period-calculation${opened?' open':''}><summary>Как получился расчёт <span aria-hidden="true">+</span></summary><div><p class="pd-formula">Прибыль + неденежные корректировки − рост дебиторской задолженности − рост запасов + рост кредиторской задолженности.</p><table><caption class="pd-sr-only">Вклад показателей в расчёт денежного потока</caption><tbody>${a.contributions.map(item=>`<tr${item.total?' class="pd-total-row"':''}><th scope="row">${e(item.label)}</th><td>${item.total?fmt(item.value):signed(item.value)}</td></tr>`).join('')}</tbody></table><p>При снижении задолженности или запасов знак соответствующего изменения меняется. Это модельная оценка, а не расчёт фактического остатка денег.</p></div></details>`:''}`;
      $('[data-period-ocf]').classList.toggle('pd-negative',ocf!==null&&ocf<0);$('[data-period-after]').classList.toggle('pd-negative',after!==null&&after<0);
      $('[data-period-financing-result]').innerHTML=r.financingNet!==null?`<p>Кредиты и дивиденды вместе: <strong>${signed(r.financingNet)} ${e(unitTitle())}</strong>.</p>${r.conditionalAfterFinancing!==null?`<p>Условный поток с учётом финансирования: <strong>${fmt(r.conditionalAfterFinancing)} ${e(unitTitle())}</strong>. Это также не остаток денег.</p>`:''}`:'<p>Чтобы посчитать финансирование, нужны все три суммы. Если операций не было, укажите подтверждённый ноль.</p>';
    }
    function setMode(mode){if(mode===state.mode)return;drafts[state.mode]=clone(state);state=convert(drafts[mode]||(mode==='own'?empty(state.unit):clone(P.demoInput)),state.unit);state.mode=mode;syncInputs();update();notify();}
    const onInput=event=>{
      const input=event.target;if(input.dataset.periodDate){state[input.dataset.periodDate]=input.value;update();notify();return;}
      const path=input.dataset.periodField;if(!path)return;
      const parsed=parse(input.value),definition=(path.startsWith('balances.')?P.balanceDefinitions:P.flowDefinitions).find(item=>item.id===path.split('.')[1]);
      let message=parsed.error||'';
      if(parsed.value!==null&&definition.nonnegative&&parsed.value<0)message='Для этого показателя нужна неотрицательная сумма.';
      if(parsed.value!==null&&Math.abs(parsed.value)>P.maxAmount(state.unit))message=`Сумма слишком велика для этой единицы. Максимум по модулю: ${fmt(P.maxAmount(state.unit))}.`;
      if(message)localErrors[path]=message;else delete localErrors[path];
      put(state,path,message?null:parsed.value);update();notify();
    };
    const onChange=event=>{if(event.target.matches('[data-period-unit]')){state=convert(state,event.target.value);syncInputs();update();notify();}};
    const onBlur=event=>{const path=event.target.dataset.periodField;if(path&&!localErrors[path])event.target.value=get(state,path)===null?'':fmt(get(state,path));};
    const onClick=async event=>{
      const mode=event.target.closest('[data-period-mode]');if(mode){setMode(mode.dataset.periodMode);return;}
      if(event.target.closest('[data-period-reset]')){state=state.mode==='own'?empty(state.unit):convert(clone(P.demoInput),state.unit);drafts[state.mode]=clone(state);syncInputs();update();notify();return;}
      if(event.target.closest('[data-period-copy]')){try{await global.navigator.clipboard.writeText(requestText());$('[data-period-request-status]').textContent='Запрос скопирован. Его можно отправить вашему бухгалтеру.';}catch{const field=$('[data-period-request]');field.focus();field.select();$('[data-period-request-status]').textContent='Текст выделен. Скопируйте его сочетанием клавиш или скачайте запрос.';}}
      if(event.target.closest('[data-period-download]')){try{const url=global.URL.createObjectURL(new Blob(['\uFEFF'+requestText()],{type:'text/plain;charset=utf-8'})),link=root.ownerDocument.createElement('a');link.href=url;link.download='zapros-buhgalteru.txt';root.ownerDocument.body.append(link);link.click();link.remove();setTimeout(()=>global.URL.revokeObjectURL(url),1500);$('[data-period-request-status]').textContent='Запрос подготовлен для скачивания.';}catch{$('[data-period-request-status]').textContent='Не удалось скачать файл. Вы можете скопировать текст запроса.';}}
    };
    root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('focusout',onBlur);root.addEventListener('click',onClick);
    syncInputs();update();
    const destroy=()=>{root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('focusout',onBlur);root.removeEventListener('click',onClick);mounts.delete(root);};
    mounts.set(root,destroy);return {destroy,getValues:()=>clone(state)};
  }
  global.NavSimulator={mount};
})(typeof globalThis==='undefined'?window:globalThis);
