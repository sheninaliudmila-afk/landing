(function (root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  root.NavigatorEngine = engine;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  const version = 'navigator-rules-1.0';
  const scenarios = [
    {id:'money', title:'Не хватает денег', shortTitle:'Деньги', description:'Разобраться, почему прибыль есть, а на платежи не хватает.', icon:'wallet'},
    {id:'profit', title:'Неясна реальная прибыль', shortTitle:'Прибыль', description:'Увидеть, какие направления зарабатывают и что влияет на результат.', icon:'chart'},
    {id:'growth', title:'Хочу масштабировать бизнес', shortTitle:'Рост', description:'Проверить, какие ресурсы и финансовые условия нужны для роста.', icon:'growth'},
    {id:'investment', title:'Планирую инвестиции', shortTitle:'Инвестиции', description:'Сравнить сценарии проекта и потребность в финансировании.', icon:'layers'},
    {id:'control', title:'Не хватает финансового контроля', shortTitle:'Контроль', description:'Связать цифры, ответственность и управленческие решения.', icon:'compass'}
  ];
  const toolOptions = [
    {value:'yes',label:'Да, есть и используется',detail:'Инструмент регулярно обновляется и помогает в решениях'},
    {value:'partial',label:'Частично',detail:'Есть отдельные элементы, но процесс работает не полностью'},
    {value:'no',label:'Нет',detail:'Такого инструмента или регулярного процесса пока нет'},
    {value:'unknown',label:'Не знаю',detail:'Нужно уточнить у команды или проверить на диагностике'}
  ];
  const universal = [
    {id:'businessModel',title:'Как устроен ваш бизнес?',hint:'Выберите основную модель. Она поможет определить, какие процессы стоит проверить.',kind:'universal',options:[
      {value:'trade',label:'Торговля',detail:'Закупка, запасы и продажа товаров'},
      {value:'services',label:'Услуги',detail:'Команда, загрузка и оказание услуг'},
      {value:'production',label:'Производство',detail:'Сырьё, производство и готовая продукция'},
      {value:'projects',label:'Проектный бизнес',detail:'Отдельные проекты, этапы и бюджеты'}
    ]},
    {id:'structure',title:'Насколько сложная у бизнеса структура?',hint:'Это вопрос об организации, а не об обороте или успешности компании.',kind:'universal',options:[
      {value:'single',label:'Одно направление',detail:'Одна компания и основной продукт или услуга'},
      {value:'multiunit',label:'Несколько направлений',detail:'Продукты, подразделения или точки продаж'},
      {value:'group',label:'Группа компаний',detail:'Несколько юридических лиц и общие ресурсы'},
      {value:'projects',label:'Несколько проектов',detail:'У каждого проекта свои сроки, доходы и расходы'}
    ]}
  ];
  const tool = (scenario,id,title,hint,module) => ({id:scenario+'_'+id,title,hint,module,kind:'tool',options:toolOptions});
  const branches = {
    money:[
      tool('money','cash','Видите ли вы будущие поступления и платежи?','Например, в платёжном календаре на ближайшие недели.','cash'),
      tool('money','working','Отслеживаете ли вы деньги в долгах клиентов и запасах?','Речь о сроках оплаты, просроченной задолженности и оборачиваемости запасов.','workingCapital'),
      tool('money','debt','Есть ли общий график обязательств и обслуживания долга?','Важно учитывать поставщиков, кредиты, лизинг и другие предстоящие выплаты.','investment'),
      tool('money','reconcile','Сверяете ли вы план движения денег с фактом?','Регулярная сверка помогает находить отклонения; отсутствие отчёта само по себе не доказывает причину дефицита.','control')
    ],
    profit:[
      tool('profit','pnl','Считаете ли вы прибыль отдельно от остатка денег?','В отчёте о финансовом результате доходы и расходы относятся к соответствующему периоду.','profit'),
      tool('profit','cost','Есть ли понятный расчёт себестоимости?','Включая прямые расходы и согласованный порядок распределения общих затрат.','cost'),
      tool('profit','segments','Видите ли вы прибыльность по направлениям?','Например, по продуктам, услугам, точкам или проектам.','profit'),
      tool('profit','compare','Сравниваете ли вы фактическую прибыль с планом?','Важно не только увидеть отклонение, но и разобрать его с ответственными.','budget')
    ],
    growth:[
      tool('growth','model','Есть ли финансовая модель роста?','Модель связывает продажи, расходы, ресурсы и денежный поток.','budget'),
      tool('growth','capital','Рассчитываете ли вы потребность роста в оборотных средствах?','Рост продаж может потребовать больше денег в запасах и задолженности клиентов.','workingCapital'),
      tool('growth','scenario','Сравниваете ли вы разные сценарии роста?','Например, изменение темпа продаж, цен, сроков оплат и нагрузки на команду.','investment'),
      tool('growth','execution','Есть ли регулярный план-факт по целям и ресурсам?','С понятной ответственностью за показатели и решения.','control')
    ],
    investment:[
      tool('investment','scenario','Есть ли сценарная финансовая модель проекта?','Проверяете ли вы основные предпосылки, платежи и чувствительность результата.','investment'),
      tool('investment','funding','Есть ли график финансирования проекта?','Понимаете ли вы, когда нужны средства и за счёт каких источников.','investment'),
      tool('investment','returns','Проверяете ли вы окупаемость и инвестиционные показатели?','Например, NPV и IRR с явно указанными предпосылками и ограничениями.','investment'),
      tool('investment','tracking','Отслеживаете ли вы бюджет и фактические расходы проекта?','Для контроля этапов, отклонений и обязательств.','project')
    ],
    control:[
      tool('control','reports','Есть ли связанные управленческие отчёты?','Отчёт о финансовом результате, движение денег и управленческий баланс.','control'),
      tool('control','closing','Есть ли регламент закрытия периода и проверки данных?','Сроки, ответственные, сверки и правила исправления ошибок.','control'),
      tool('control','roles','Закреплены ли показатели и ответственность за решения?','Команда понимает, кто готовит данные, объясняет отклонения и принимает решения.','control'),
      tool('control','data','Собираются ли данные по единым правилам?','Без повторного ручного ввода и несогласованных версий; автоматизация применяется там, где она нужна.','automation')
    ]
  };
  const primary = {money:'cash',profit:'profit',growth:'budget',investment:'investment',control:'control'};
  const modules = {
    cash:{title:'ДДС и платёжный календарь',deliverable:'План поступлений и выплат, сверка план-факта и порядок согласования платежей.',verify:'Полноту обязательств, период планирования, качество исходных данных и существующие инструменты.'},
    profit:{title:'ОФР и аналитика рентабельности',deliverable:'Отчёт о финансовом результате с согласованными разрезами по направлениям.',verify:'Принципы признания доходов и расходов, структуру направлений и согласованность расчёта прибыли.'},
    budget:{title:'Бюджетирование и финансовая модель',deliverable:'Связанные бюджеты, сценарии и регулярный план-факт по целям бизнеса.',verify:'Предпосылки роста, доступные ресурсы, существующие бюджеты и данные для расчёта.'},
    investment:{title:'Инвестиции и финансирование',deliverable:'Сценарная модель, график финансирования и проверка инвестиционных предпосылок.',verify:'Период и риски проекта, источники средств, обслуживание долга и применимость NPV/IRR.'},
    control:{title:'Управленческая отчётность и регламенты',deliverable:'Связанные отчёты, правила закрытия периода, роли и порядок разбора показателей.',verify:'Состав отчётов, сверки, сроки подготовки, роли и качество учётных данных.'},
    workingCapital:{title:'Оборотный капитал',deliverable:'Контроль задолженности, запасов и сроков расчётов с учётом бизнес-модели.',verify:'Состав оборотных статей, условия оплаты, сезонность и применимость показателей оборачиваемости.'},
    cost:{title:'Себестоимость и затраты',deliverable:'Методика расчёта себестоимости и анализа прямых и общих расходов.',verify:'Состав затрат, драйверы распределения, доступные данные и особенности продуктов.'},
    consolidation:{title:'Консолидированная отчётность',deliverable:'Общая финансовая картина группы с согласованными правилами и внутригрупповыми сверками.',verify:'Периметр компаний, внутригрупповые операции и правила объединения отчётности.'},
    project:{title:'Проектный финансовый контроль',deliverable:'Бюджеты, обязательства и план-факт по отдельным проектам и этапам.',verify:'Структуру проектов, порядок отнесения затрат, сроки и графики платежей.'},
    automation:{title:'Автоматизация и BI',deliverable:'Согласованный контур данных и требования к автоматизации после проверки методологии.',verify:'Текущие системы, ручные операции, качество данных и целесообразность автоматизации.'}
  };
  const core = [
    {title:'Экспертная диагностика',description:'Проверить исходные данные, существующие инструменты и согласовать задачу.'},
    {title:'Архитектура учётных данных',description:'Определить источники, справочники, разрезы и единые правила учёта.'},
    {title:'ОФР, ДДС и управленческий баланс',description:'Связать три отчёта; проверить и доработать существующие вместо повторной разработки.'},
    {title:'Планирование и план-факт',description:'Связать цели, бюджеты и регулярный разбор отклонений.'},
    {title:'Показатели и регламенты',description:'Закрепить сроки, контрольные показатели и ответственность за данные и решения.'},
    {title:'Тестовый отчётный цикл',description:'Провести цикл на согласованных данных и проверить работу системы.'},
    {title:'Обучение и передача',description:'Передать инструкции, шаблоны и порядок самостоятельной работы команды.'}
  ];
  const stages = [
    {id:'meeting',title:'Бесплатная встреча',description:'Обсудим запрос и проверим, подходит ли наш формат работы.',deliverable:'Общее понимание задачи и следующий шаг.'},
    {id:'diagnostics',title:'Платная экспертная диагностика',description:'Проверим данные и инструменты, уточним объём, сроки и стоимость проекта.',deliverable:'Выводы диагностики и согласованное предложение.'},
    {id:'design',title:'Проектирование',description:'Определим архитектуру системы, методологию, разрезы и ответственность.',deliverable:'Согласованный проект финансового управления.'},
    {id:'development',title:'Разработка',description:'Подготовим или доработаем отчёты, модель и регламенты.',deliverable:'Рабочие инструменты под согласованные задачи.'},
    {id:'implementation',title:'Внедрение и тестовый цикл',description:'Проверим систему в управленческом цикле вместе с командой.',deliverable:'Проверенные отчёты, сверки и список исправлений.'},
    {id:'handover',title:'Передача и обучение',description:'Обучим ответственных и передадим порядок самостоятельной работы.',deliverable:'Инструкции и работающая система; сопровождение необязательно.'}
  ];

  function getQuestions(scenarioId) {
    if (!Object.prototype.hasOwnProperty.call(branches,scenarioId)) throw new TypeError('Неизвестный сценарий.');
    return [...universal,...branches[scenarioId]];
  }
  function assess(scenarioId, answers) {
    const questions=getQuestions(scenarioId);
    if (!answers || typeof answers!=='object' || Array.isArray(answers)) throw new TypeError('Нужны ответы на вопросы.');
    for(const question of questions) {
      if (!Object.prototype.hasOwnProperty.call(answers,question.id) || !question.options.some(option=>option.value===answers[question.id])) throw new TypeError('Ответьте на вопрос: '+question.title);
    }
    const tools=questions.filter(question=>question.kind==='tool');
    const unknownCount=tools.filter(question=>answers[question.id]==='unknown').length;
    const knownCount=tools.length-unknownCount;
    const scores={yes:2,partial:1,no:0};
    const score=tools.reduce((sum,question)=>sum+(scores[answers[question.id]]??0),0);
    const maxScore=knownCount*2;
    const coveragePercent=maxScore ? Math.round(score/maxScore*100) : null;
    const level=knownCount===0?'unknown':coveragePercent>=75?'present':coveragePercent>=40?'partial':'limited';
    const titles={unknown:'Инструменты пока не подтверждены',present:'Есть инструменты, на которые можно опереться',partial:'Стоит проверить согласованность инструментов',limited:'Есть направления для настройки контроля'};
    const entries=[];
    const add=(id,reason,rank)=>{
      if(entries.some(entry=>entry.id===id)) return;
      entries.push({id,...modules[id],reason,rank});
    };
    const scenario=scenarios.find(item=>item.id===scenarioId);
    add(primary[scenarioId],`Ваш основной запрос — «${scenario.title.toLowerCase()}». Начнём с проверки подходящих инструментов, а не с предположения о причинах.`,0);
    tools.filter(question=>answers[question.id]==='no').forEach(question=>add(question.module,`На вопрос «${question.title}» вы ответили «Нет». Проверим потребность и объём настройки; это не доказательство финансовой проблемы.`,1));
    tools.filter(question=>answers[question.id]==='partial').forEach(question=>add(question.module,`Вы отметили частичное использование: «${question.title}». Проверим, что сохранить и что доработать.`,2));
    if(answers.businessModel==='trade') add('workingCapital','Вы выбрали торговую модель: проверим управление запасами и сроками расчётов.',3);
    if(answers.businessModel==='production') add('cost','Вы выбрали производство: проверим методику себестоимости и распределение затрат.',3);
    if(answers.businessModel==='projects') add('project','Вы выбрали проектную модель: проверим бюджеты, обязательства и результаты по проектам.',3);
    if(answers.structure==='group') add('consolidation','Вы указали группу компаний: проверим необходимость общей отчётности и внутригрупповых сверок.',4);
    if(answers.structure==='multiunit') add('profit','Вы указали несколько направлений: проверим сопоставимость результатов по каждому из них.',4);
    if(answers.structure==='projects') add('project','Вы указали несколько проектов: проверим раздельный учёт бюджетов, этапов и платежей.',4);
    // Unknown responses activate verification, never an asserted absence or diagnosis.
    tools.filter(question=>answers[question.id]==='unknown').forEach(question=>add(question.module,`Нужно уточнить ответ на вопрос «${question.title}». Неизвестность не означает отсутствие инструмента.`,5));
    const ordered=entries.sort((a,b)=>a.rank-b.rank).map(({rank,...entry})=>entry);
    const priorities=ordered.filter(entry=>!entry.reason.startsWith('Нужно уточнить')).slice(0,3);
    const priorityIds=new Set(priorities.map(entry=>entry.id));
    const additional=ordered.filter(entry=>!priorityIds.has(entry.id));
    const summary=knownCount===0
      ? 'По четырём вопросам пока нет подтверждённых ответов. Это неизвестность, а не отсутствие контроля. На экспертной диагностике сначала проверим инструменты вместе с командой.'
      : `По вашим ответам отмечено ${score} из ${maxScore} возможных баллов среди ${knownCount} вопросов с известным ответом.${unknownCount ? ` Ещё ${unknownCount} ответа нужно уточнить отдельно.` : ''} Это предварительная оценка наличия инструментов, а не финансовый диагноз и не оценка успешности бизнеса.`;
    return {version,score,maxScore,unknownCount,knownCount,toolCount:tools.length,coveragePercent,level,title:titles[level],summary,priorities,additional,core,stages};
  }

  const inputDefinitions=[
    {id:'ni',label:'Чистая прибыль',symbol:'NI',min:-30,max:50,step:0.5,default:15,hint:'Финансовый результат за условный период.'},
    {id:'nce',label:'Неденежные расходы',symbol:'NCE',min:0,max:20,step:0.5,default:2,hint:'Например, амортизация: расход в прибыли без выплаты в этом периоде.'},
    {id:'ar',label:'Изменение дебиторской задолженности',symbol:'ΔAR',min:-30,max:30,step:0.5,default:12,hint:'Рост задолженности клиентов уменьшает поток; сокращение увеличивает.'},
    {id:'inventory',label:'Изменение запасов',symbol:'ΔINV',min:-30,max:30,step:0.5,default:5,hint:'Увеличение запасов уменьшает поток; высвобождение запасов увеличивает.'},
    {id:'ap',label:'Изменение кредиторской задолженности',symbol:'ΔAP',min:-30,max:30,step:0.5,default:4,hint:'Рост обязательств перед поставщиками увеличивает поток в этой модели, но не является доходом.'},
    {id:'capex',label:'Инвестиционные выплаты',symbol:'CAPEX',min:0,max:40,step:0.5,default:6,hint:'Денежные выплаты на инвестиционные активы за условный период.'}
  ];
  const exampleInputs=[
    {id:'gap',title:'Прибыль есть, поток после инвестиций отрицательный',inputs:{ni:15,nce:2,ar:12,inventory:5,ap:4,capex:6}},
    {id:'simple',title:'Без изменений оборотного капитала',inputs:{ni:10,nce:0,ar:0,inventory:0,ap:0,capex:0}},
    {id:'negative',title:'Отрицательный операционный поток',inputs:{ni:0,nce:1,ar:5,inventory:0,ap:0,capex:0}},
    {id:'positive',title:'Положительный поток после инвестиций',inputs:{ni:8,nce:1,ar:0,inventory:0,ap:4,capex:3}}
  ];
  function simulate(inputs) {
    if(!inputs || typeof inputs!=='object') throw new TypeError('Нужны параметры модели.');
    for(const definition of inputDefinitions) {
      const value=inputs[definition.id];
      if(typeof value!=='number' || !Number.isFinite(value) || value<definition.min || value>definition.max) throw new RangeError('Проверьте параметр: '+definition.label);
    }
    const round=value=>{const n=Number(value.toFixed(6));return Object.is(n,-0)?0:n;};
    const {ni,nce,ar,inventory,ap,capex}=inputs;
    const ocf=round(ni+nce-ar-inventory+ap),afterCapex=round(ocf-capex);
    let running=0;
    const contribution=(id,label,value,total=false)=>{
      const start=total?0:running,end=total?value:round(running+value);
      running=end;
      return {id,label,value:round(value),total,start,end};
    };
    const contributions=[
      contribution('ni','Чистая прибыль',ni,true),contribution('nce','Неденежные расходы',nce),
      contribution('ar','Изменение ДЗ',-ar),contribution('inventory','Изменение запасов',-inventory),
      contribution('ap','Изменение КЗ',ap),contribution('ocf','Операционный поток',ocf,true),
      contribution('capex','Инвестиционные выплаты',-capex),contribution('afterCapex','Поток после CAPEX',afterCapex,true)
    ];
    const state=ocf<0?'negative_ocf':afterCapex<0?'negative_after_capex':'positive';
    const explanations={
      negative_ocf:'В иллюстративном расчёте операционный поток отрицательный. Стоит разобрать изменения задолженности, запасов и обязательств. Модель не показывает остаток денег и не устанавливает причины реального дефицита.',
      negative_after_capex:'Операционный поток положительный или равен нулю, но инвестиционные выплаты превышают его. Проверьте график инвестиций и источники финансирования. Это условный поток после CAPEX, а не остаток денег.',
      positive:'В иллюстративном расчёте операционный поток покрывает инвестиционные выплаты. Итог не является остатком денег, полным свободным денежным потоком или гарантией финансовой устойчивости.'
    };
    return {ocf,afterCapex,contributions,state,explanation:explanations[state]};
  }
  return {version,scenarios,getQuestions,assess,simulate,inputDefinitions,exampleInputs,core,stages};
});
