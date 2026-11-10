(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  root.PeriodModel = model;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  const version = 'period-model-1.3';
  const MAX_RUBLES = 1e12;
  const units = [
    { id: 'ruble', title: 'Рубли', shortTitle: '₽', multiplier: 1 },
    { id: 'thousand', title: 'Тысячи рублей', shortTitle: 'тыс. ₽', multiplier: 1000 },
    { id: 'million', title: 'Миллионы рублей', shortTitle: 'млн ₽', multiplier: 1000000 }
  ];
  const balanceDefinitions = [
    { id: 'cash', title: 'Денежные средства', nonnegative: true,
      help: 'Остаток денежных средств и согласованных денежных эквивалентов на каждую дату. Состав показателя должен быть одинаковым на обе даты.',
      source: 'Баланс и расшифровка кассы, банковских счетов и денежных эквивалентов на обе даты. Отдельно поясните ограничения на использование, валютную переоценку и изменения состава.' },
    { id: 'fixedAssets', title: 'Основные средства', nonnegative: true,
      help: 'Остаточная балансовая стоимость основных средств на каждую дату. Это стоимость активов, а не сумма денежных покупок.',
      source: 'Баланс и расшифровка основных средств: остаточная стоимость на обе даты, поступления, выбытия, амортизация и прочие изменения.' },
    { id: 'retainedEarnings', title: 'Нераспределённая прибыль / непокрытый убыток', nonnegative: false,
      help: 'Накопленный результат в капитале на каждую дату. Убыток указывается со знаком минус; это не прибыль за выбранный период.',
      source: 'Баланс и расшифровка изменений капитала: остатки нераспределённой прибыли или убытка на обе даты, начисленные или распределённые дивиденды и прочие корректировки капитала. Фактические денежные выплаты собственникам покажите отдельно.' },
    { id: 'inventory', title: 'Запасы', nonnegative: true,
      help: 'Сопоставимая стоимость запасов на каждую дату. Рост запасов уменьшает условный поток в модели.',
      source: 'Баланс и расшифровка запасов на обе даты: товары, сырьё, незавершённое производство и готовая продукция в одном периметре учёта.' },
    { id: 'loans', title: 'Кредиты и займы к погашению', nonnegative: true,
      help: 'Остаток основного долга по полученным кредитам и займам на каждую дату. Изменение долга не равно денежным выдачам и погашениям.',
      source: 'Расшифровка краткосрочных и долгосрочных полученных кредитов и займов на обе даты; отдельно — фактические получения, погашения и неденежные изменения.' },
    { id: 'receivables', title: 'Дебиторская задолженность покупателей', nonnegative: true,
      help: 'Операционная задолженность покупателей за товары и услуги. Рост означает, что часть выручки ещё не получена деньгами.',
      source: 'Расшифровка операционной задолженности покупателей на обе даты. Попросите отдельно выделить займы, инвестиционные операции, налоги и прочие непрофильные статьи.' },
    { id: 'payables', title: 'Кредиторская задолженность поставщикам', nonnegative: true,
      help: 'Операционная задолженность поставщикам и подрядчикам. Банковские кредиты и инвестиционные обязательства сюда не включаются.',
      source: 'Расшифровка операционных обязательств перед поставщиками на обе даты без кредитов, займов, расчётов с собственниками и инвестиционных статей.' }
  ];
  const flowDefinitions = [
    { id: 'revenue', title: 'Выручка за период', nonnegative: true,
      help: 'Признанная выручка за выбранный период, за вычетом НДС и аналогичных обязательных платежей по применимым правилам учёта. Это не сумма поступлений на счёт.',
      source: 'ОФР / ОПиУ за интервал между датами: выручка в согласованной учётной базе, сопоставимая с себестоимостью продаж.' },
    { id: 'costOfSales', title: 'Себестоимость продаж за период', nonnegative: true,
      help: 'Затраты, относящиеся к проданным товарам, продукции или услугам того же периода. Это не все закупки и не все денежные выплаты.',
      source: 'ОФР / ОПиУ и расшифровка себестоимости реализованных товаров, продукции или услуг за тот же интервал и в том же периметре, что выручка.' },
    { id: 'netProfit', title: 'Чистая прибыль / убыток за период', nonnegative: false,
      help: 'Результат только за промежуток после прошлой даты по текущую дату включительно. Не остаток на счёте и не изменение нераспределённой прибыли.',
      source: 'Отчёт о финансовых результатах за выбранный промежуток. Если отчёт составлен нарастающим итогом, попросите бухгалтера выделить именно нужный период.' },
    { id: 'noncash', title: 'Неденежные корректировки за период', nonnegative: false,
      help: 'Согласованная сумма неденежных корректировок прибыли. Амортизация и другие расходы обычно добавляются, неденежные доходы вычитаются.',
      source: 'Расшифровка амортизации и прочих неденежных корректировок, относящихся к прибыли выбранного периода, с указанием знаков.' },
    { id: 'capex', title: 'Денежные инвестиционные выплаты за период', nonnegative: true,
      help: 'Фактически выплаченные деньги на инвестиционные активы. Эту сумму нельзя получить только из разницы основных средств.',
      source: 'Отчёт о движении денежных средств или расшифровка реальных инвестиционных платежей за выбранный период; отдельно от неденежных поступлений активов.' },
    { id: 'loanReceived', title: 'Кредиты и займы получены деньгами', nonnegative: true,
      help: 'Только фактически поступившие за период деньги по кредитам и займам; остаток долга вводится отдельно.',
      source: 'ОДДС или выписка по фактическим денежным получениям кредитов и займов за выбранный период, без неденежных операций.' },
    { id: 'loanRepaid', title: 'Основной долг погашен деньгами', nonnegative: true,
      help: 'Фактически выплаченная основная сумма долга за период. Проценты не смешиваются с основным долгом.',
      source: 'ОДДС, банковские выписки и кредитные графики: реальные денежные погашения основной суммы за выбранный период, отдельно от процентов.' },
    { id: 'dividends', title: 'Дивиденды выплачены деньгами', nonnegative: true,
      help: 'Фактические выплаты собственникам за период. Начисленные, но ещё не выплаченные дивиденды сюда не включаются.',
      source: 'ОДДС и расшифровка денежных выплат собственникам за выбранный период; отдельно начисленные, но не выплаченные суммы.' }
  ];
  const balanceIds = balanceDefinitions.map(item => item.id);
  const flowIds = flowDefinitions.map(item => item.id);
  const has = (object, key) => Boolean(object && Object.prototype.hasOwnProperty.call(object, key));
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const unknown = value => value === null || value === undefined;
  const round = value => {
    const result = Number(value.toFixed(9));
    return Object.is(result, -0) ? 0 : result;
  };
  const unitById = id => units.find(unit => unit.id === id);
  const maxAmount = unit => {
    const definition = unitById(unit);
    if (!definition) throw new TypeError('Выберите единицу измерения.');
    return MAX_RUBLES / definition.multiplier;
  };

  function createEmptyInput(options = {}) {
    return {
      previousDate: options.previousDate || '2025-12-31',
      currentDate: options.currentDate || '2026-09-30',
      unit: options.unit || 'million',
      mode: 'own',
      balances: Object.fromEntries(balanceIds.map(id => [id, { previous: null, current: null }])),
      flows: Object.fromEntries(flowIds.map(id => [id, null]))
    };
  }
  function cloneInput(input) {
    if (!isObject(input)) throw new TypeError('Нужен объект данных симулятора.');
    return {
      previousDate: input.previousDate,
      currentDate: input.currentDate,
      unit: input.unit,
      mode: input.mode,
      balances: Object.fromEntries(balanceIds.map(id => [id, {
        previous: input.balances?.[id]?.previous ?? null,
        current: input.balances?.[id]?.current ?? null
      }])),
      flows: Object.fromEntries(flowIds.map(id => [id, input.flows?.[id] ?? null]))
    };
  }
  function parsedDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value + 'T00:00:00.000Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  }
  function validateDates(previousDate, currentDate) {
    const errors = {};
    const previous = parsedDate(previousDate), current = parsedDate(currentDate);
    if (!previous) errors.previousDate = 'Укажите корректную прошлую отчётную дату.';
    if (!current) errors.currentDate = 'Укажите корректную текущую отчётную дату.';
    if (previous && current && previous.getTime() >= current.getTime()) {
      errors.currentDate = 'Текущая дата должна быть позже прошлой.';
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }
  function validateInput(input) {
    if (!isObject(input)) return { valid: false, errors: { input: 'Нужны данные симулятора.' } };
    const errors = { ...validateDates(input.previousDate, input.currentDate).errors };
    const unit = unitById(input.unit);
    if (!unit) errors.unit = 'Выберите рубли, тысячи или миллионы рублей.';
    if (!['demo', 'own'].includes(input.mode)) errors.mode = 'Выберите учебный пример или свои данные.';
    if (!isObject(input.balances)) errors.balances = 'Нужен набор остатков на две даты.';
    if (!isObject(input.flows)) errors.flows = 'Нужен набор показателей за период.';
    const limit = unit ? maxAmount(input.unit) : MAX_RUBLES;
    const check = (value, path, definition) => {
      if (unknown(value)) return;
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors[path] = 'Введите конечное число или оставьте показатель неизвестным.';
      } else if (Math.abs(value) > limit) {
        errors[path] = 'Значение превышает предел 1 трлн ₽ в выбранных единицах.';
      } else if (definition.nonnegative && value < 0) {
        errors[path] = 'Для этого показателя укажите неотрицательную сумму.';
      }
    };
    for (const definition of balanceDefinitions) {
      const record = input.balances?.[definition.id];
      if (record !== undefined && !isObject(record)) {
        errors['balances.' + definition.id] = 'Нужны остатки на прошлую и текущую даты.';
        continue;
      }
      check(record?.previous, 'balances.' + definition.id + '.previous', definition);
      check(record?.current, 'balances.' + definition.id + '.current', definition);
    }
    for (const definition of flowDefinitions) check(input.flows?.[definition.id], 'flows.' + definition.id, definition);
    return { valid: Object.keys(errors).length === 0, errors };
  }
  function isInputShape(input) {
    if (!isObject(input) || typeof input.previousDate !== 'string' || input.previousDate.length > 10 || typeof input.currentDate !== 'string' || input.currentDate.length > 10) return false;
    if (!unitById(input.unit) || !['demo', 'own'].includes(input.mode) || !isObject(input.balances) || !isObject(input.flows)) return false;
    const amount = value => value === null || typeof value === 'number' && Number.isFinite(value);
    for (const id of balanceIds) {
      const record = input.balances[id];
      if (!isObject(record) || !has(record, 'previous') || !has(record, 'current') || !amount(record.previous) || !amount(record.current)) return false;
    }
    for (const id of flowIds) if (!has(input.flows, id) || !amount(input.flows[id])) return false;
    // Date inputs may be temporarily blank/reversed while the visitor is editing.
    return validateInput({ ...input, previousDate: '2025-12-31', currentDate: '2026-09-30' }).valid;
  }
  function normalizeInput(input) {
    if (!isInputShape(input)) throw new TypeError('Структура сохранённых данных симулятора некорректна.');
    return cloneInput(input);
  }
  function upgradeInput(input) {
    if (isInputShape(input)) return cloneInput(input);
    if (!isObject(input) || !isObject(input.balances) || !isObject(input.flows)) throw new TypeError('Структура сохранённых данных симулятора некорректна.');
    const oldBalances = balanceIds.filter(id => id !== 'cash');
    const oldFlows = flowIds.filter(id => !['revenue', 'costOfSales'].includes(id));
    if (!oldBalances.every(id => isObject(input.balances[id]) && has(input.balances[id], 'previous') && has(input.balances[id], 'current')) || !oldFlows.every(id => has(input.flows, id))) throw new TypeError('Недостаточно полей для переноса данных версии 1.1.');
    const output = cloneInput(input);
    if (!isInputShape(output)) throw new TypeError('Некорректные данные нельзя переносить автоматически.');
    return output;
  }
  function convertUnit(input, nextUnit) {
    if (!isInputShape(input)) throw new TypeError('Сначала исправьте суммы симулятора.');
    const previous = unitById(input.unit), next = unitById(nextUnit);
    if (!next) throw new TypeError('Неизвестная единица измерения.');
    const output = cloneInput(input), factor = previous.multiplier / next.multiplier;
    const convert = value => unknown(value) ? null : round(value * factor);
    output.unit = nextUnit;
    for (const id of balanceIds) for (const side of ['previous', 'current']) output.balances[id][side] = convert(output.balances[id][side]);
    for (const id of flowIds) output.flows[id] = convert(output.flows[id]);
    return output;
  }

  const demoInput = {
    previousDate: '2025-12-31', currentDate: '2026-09-30', unit: 'million', mode: 'demo',
    balances: {
      cash: { previous: 10, current: 7 },
      fixedAssets: { previous: 20, current: 24 },
      retainedEarnings: { previous: 18, current: 30 },
      inventory: { previous: 8, current: 13 },
      loans: { previous: 10, current: 14 },
      receivables: { previous: 8, current: 20 },
      payables: { previous: 6, current: 10 }
    },
    flows: { revenue: 100, costOfSales: 65, netProfit: 15, noncash: 2, capex: 6, loanReceived: 8, loanRepaid: 4, dividends: 3 }
  };
  const cautions = [
    'Выручка, себестоимость продаж и чистая прибыль относятся к одному интервалу. Валовая прибыль не равна чистой: прочие доходы, расходы, проценты и налоги в этих трёх строках отдельно не раскрыты.',
    'Разность чистой прибыли и изменения денежных средств — сравнительная величина, а не денежный поток или доказанное использование прибыли. Чистый долг здесь равен только выбранным кредитам и займам минус введённые деньги и не оценивает платёжеспособность.',
    'Остатки сравниваются на две даты, а прибыль и денежные выплаты относятся к промежутку после прошлой даты по текущую включительно. Все данные должны быть в одних единицах и в сопоставимом периметре.',
    'Нераспределённая прибыль — накопленный показатель капитала. Её изменение не заменяет чистую прибыль за период и не добавляется к чистой прибыли второй раз.',
    'Изменение основных средств не равно CAPEX: на него влияют амортизация, выбытия, переоценки и неденежные поступления. CAPEX вводится по денежным платежам отдельно.',
    'Изменение остатка кредитов не равно полученным и погашенным деньгами суммам: возможны курсовые и неденежные изменения. Проценты не смешиваются с основной суммой долга.',
    'Дебиторская и кредиторская задолженность для моста должны быть операционными. Смешанные бухгалтерские строки нужно расшифровать, чтобы не учитывать инвестиционные и финансовые статьи дважды.',
    'Модель иллюстративная: не охватывает все оборотные статьи, корректировки, налоги, проценты и потоки финансирования. Итоги не являются остатком денег, полным свободным денежным потоком или финансовым диагнозом.',
    '«Не знаю» и пустое поле означают отсутствие данных, а не ноль. Если показатель действительно равен нулю, нужно ввести 0.'
  ];
  function periodDates(previousDate, currentDate) {
    const start = parsedDate(previousDate);
    start.setUTCDate(start.getUTCDate() + 1);
    const from = start.toISOString().slice(0, 10);
    const human = value => value.slice(8, 10) + '.' + value.slice(5, 7) + '.' + value.slice(0, 4);
    return { previous: previousDate, current: currentDate, start: from, end: currentDate, label: human(from) + '–' + human(currentDate) };
  }
  function emptySummary() {
    return { strengths: [], problems: [], risks: [], solutions: [], meetingTopics: [] };
  }
  function buildSummary(metrics, data) {
    const summary = emptySummary();
    const metric = id => metrics.find(item => item.id === id)?.value ?? null;
    const evidence = ids => Object.fromEntries(ids
      .map(id => [id, metric(id)])
      .filter(([, value]) => value !== null));
    const add = (group, id, text, ids) => {
      if (summary[group].length >= 3 || summary[group].some(item => item.id === id)) return;
      summary[group].push({ id, text, evidence: evidence(ids) });
    };
    const topic = (id, text) => {
      if (summary.meetingTopics.length < 3 && !summary.meetingTopics.some(item => item.id === id || item.text === text)) summary.meetingTopics.push({ id, text });
    };
    const gross = metric('grossProfit'), profit = metric('netProfit');
    const cashChange = metric('cashChange'), workingChange = metric('operatingWorkingCapitalChange');
    const debtChange = metric('netDebtChange');
    if (gross !== null && gross > 0) add('strengths', 'positive_gross_profit', 'Продажи покрывают их себестоимость и формируют валовую прибыль.', ['revenue', 'costOfSales', 'grossProfit']);
    if (profit !== null && profit > 0) add('strengths', 'positive_net_profit', 'Период завершён с чистой прибылью.', ['netProfit']);
    if (cashChange !== null && cashChange > 0) add('strengths', 'cash_increase', 'Введённый остаток денежных средств увеличился.', ['cashPrevious', 'cashCurrent', 'cashChange']);

    // Findings are ordered by the facts that most directly affect the question
    // about profit and money. Each selected finding has a matching next check.
    const findings = [];
    if (profit !== null && profit < 0) findings.push({
      id: 'net_loss', text: 'За выбранный период получен чистый убыток.', ids: ['netProfit'],
      risk: 'Если убытки повторятся, ресурсы бизнеса могут сокращаться; нужно проверить причины.',
      solution: 'Разобрать выручку, себестоимость и прочие расходы; подготовить план улучшений.',
      meeting: 'Хочу разобрать причины убытка и варианты улучшения результата.'
    });
    if (gross !== null && gross < 0) findings.push({
      id: 'negative_gross_profit', text: 'Себестоимость продаж превышает выручку.', ids: ['revenue', 'costOfSales', 'grossProfit'],
      risk: 'При сохранении этого соотношения продажи могут не покрывать связанные затраты.',
      solution: 'Проверить состав себестоимости, цены и рентабельность по направлениям.',
      meeting: 'Хочу проверить себестоимость продаж и возможности улучшить рентабельность.'
    });
    if (cashChange !== null && cashChange < 0) {
      const profitable = profit !== null && profit > 0;
      findings.push({
        id: profitable ? 'profit_cash_divergence' : 'cash_decline',
        text: profitable ? 'При чистой прибыли остаток денег снизился.' : 'Введённый остаток денег снизился за выбранный период.',
        ids: profitable ? ['netProfit', 'cashPrevious', 'cashCurrent', 'cashChange'] : ['cashPrevious', 'cashCurrent', 'cashChange'],
        risk: 'Если деньги продолжат снижаться, может усилиться напряжение по предстоящим платежам.',
        solution: 'Сверить движение денег, инвестиции и выплаты; составить платёжный календарь.',
        meeting: profitable ? 'Хочу разобраться, почему при прибыли снижаются деньги.' : 'Хочу разобраться в снижении денег и планировании платежей.'
      });
    }
    if (workingChange !== null && workingChange > 0) findings.push({
      id: 'working_capital_growth', text: 'Долги покупателей и запасы за вычетом долгов поставщикам выросли; нужен разбор.',
      ids: ['operatingWorkingCapitalPrevious', 'operatingWorkingCapitalCurrent', 'operatingWorkingCapitalChange'],
      risk: 'Рост этих остатков может увеличить потребность в финансировании; нужны сроки расчётов.',
      solution: 'Проверить сроки оплаты покупателей, оборачиваемость запасов и условия поставщиков.',
      meeting: 'Хочу обсудить управление задолженностью покупателей, запасами и расчётами с поставщиками.'
    });
    if (debtChange !== null && debtChange > 0 && data.balances.loans.current !== null && data.balances.loans.current > 0) findings.push({
      id: 'selected_debt_growth', text: 'Кредиты и займы за вычетом введённых денег выросли; нужен разбор.',
      ids: ['netDebtPrevious', 'netDebtCurrent', 'netDebtChange', 'loansChange', 'cashChange'],
      risk: 'График погашений может не совпадать с поступлениями; нужно проверить сроки и доступность денег.',
      solution: 'Сопоставить кредитные выплаты с ожидаемыми поступлениями и доступностью денег.',
      meeting: 'Хочу проверить график кредитных выплат и запас денег для них.'
    });
    for (const finding of findings.slice(0, 3)) {
      add('problems', finding.id, finding.text, finding.ids);
      add('risks', finding.id, finding.risk, finding.ids);
      add('solutions', finding.id, finding.solution, finding.ids);
      topic(finding.id, finding.meeting);
    }
    return summary;
  }
  function buildAnalysis(data, balances) {
    const metrics = [], observations = [], missing = [];
    const byId = id => balances.find(item => item.id === id);
    const present = values => values.every(value => !unknown(value));
    const calculation = (values, compute) => present(values) ? round(compute(...values)) : null;
    const add = (id, title, value, formula, basis, unit = 'amount') => {
      metrics.push({ id, title, value, unit, formula, basis });
      return value;
    };
    const observation = (id, title, text, tone, ids) => observations.push({
      id, title, text, tone,
      evidence: Object.fromEntries(ids.map(key => [key, metrics.find(metric => metric.id === key)?.value ?? null]))
    });
    const samePeriod = 'Один и тот же период между выбранными датами, единые периметр и учётная база.';
    const revenue = add('revenue', 'Выручка', data.flows.revenue, 'Введённая выручка за период', samePeriod);
    const cost = add('costOfSales', 'Себестоимость продаж', data.flows.costOfSales, 'Введённая себестоимость продаж за период', samePeriod);
    const profit = add('netProfit', 'Чистая прибыль или убыток', data.flows.netProfit, 'Введённая чистая прибыль за период', samePeriod);
    const gross = add('grossProfit', 'Валовая прибыль', calculation([revenue, cost], (r, c) => r - c), 'Выручка − себестоимость продаж', samePeriod);
    const grossMargin = add('grossMargin', 'Валовая рентабельность', present([gross, revenue]) && revenue > 0 ? round(gross / revenue * 100) : null, 'Валовая прибыль / выручка × 100%', 'Рассчитывается только при известной выручке больше нуля.', 'percent');
    const netMargin = add('netMargin', 'Чистая рентабельность', present([profit, revenue]) && revenue > 0 ? round(profit / revenue * 100) : null, 'Чистая прибыль / выручка × 100%', 'Рассчитывается только при известной выручке больше нуля.', 'percent');
    const cash = byId('cash'), loans = byId('loans');
    add('cashPrevious', 'Деньги на прошлую дату', cash.previous, 'Введённый остаток денежных средств', 'Одинаковый состав денежных средств и эквивалентов на обе даты.');
    add('cashCurrent', 'Деньги на текущую дату', cash.current, 'Введённый остаток денежных средств', 'Одинаковый состав денежных средств и эквивалентов на обе даты.');
    const cashChange = add('cashChange', 'Изменение денежных средств', cash.delta, 'Деньги на текущую дату − деньги на прошлую дату', 'Изменение введённых остатков; может включать валютную переоценку, переклассификации и изменение периметра. Не самостоятельная расшифровка денежных потоков.');
    const working = {};
    for (const side of ['previous', 'current']) {
      const value = calculation([byId('receivables')[side], byId('inventory')[side], byId('payables')[side]], (ar, inventory, ap) => ar + inventory - ap);
      working[side] = add(side === 'previous' ? 'operatingWorkingCapitalPrevious' : 'operatingWorkingCapitalCurrent', 'Операционный оборотный капитал ' + (side === 'previous' ? 'на прошлую дату' : 'на текущую дату'), value, 'Долги покупателей + запасы − долги поставщикам', 'Упрощённая группа операционных статей; это не все оборотные активы и обязательства.');
    }
    const workingChange = add('operatingWorkingCapitalChange', 'Изменение операционного оборотного капитала', calculation([working.current, working.previous], (current, previous) => current - previous), 'Операционный оборотный капитал на текущую дату − на прошлую дату', 'Не учитывает все оборотные статьи и не равняется полному денежному потоку.');
    const netDebt = {};
    for (const side of ['previous', 'current']) {
      netDebt[side] = add(side === 'previous' ? 'netDebtPrevious' : 'netDebtCurrent', 'Чистый долг по выбранным статьям ' + (side === 'previous' ? 'на прошлую дату' : 'на текущую дату'), calculation([loans[side], cash[side]], (debt, money) => debt - money), 'Остаток кредитов и займов − введённые денежные средства', 'Только выбранные кредитные обязательства и деньги; не полная оценка платёжеспособности.');
    }
    const netDebtChange = add('netDebtChange', 'Изменение чистого долга по выбранным статьям', calculation([netDebt.current, netDebt.previous], (current, previous) => current - previous), 'Чистый долг на текущую дату − на прошлую дату', 'Не заменяет графики обслуживания долга и анализ доступности денег.');
    const difference = add('profitMinusCashChange', 'Разница между прибылью и изменением денег', calculation([profit, cashChange], (ni, delta) => ni - delta), 'Чистая прибыль за период − изменение остатка денег', 'Сравнительная величина, а не денежный поток, расход или доказанное направление использования прибыли.');
    for (const [id, title] of [['fixedAssets', 'Изменение основных средств'], ['retainedEarnings', 'Изменение нераспределённой прибыли'], ['receivables', 'Изменение долгов покупателей'], ['inventory', 'Изменение запасов'], ['payables', 'Изменение долгов поставщикам'], ['loans', 'Изменение кредитов и займов']]) {
      const item = byId(id);
      add(id + 'Change', title, item.delta, 'Текущий остаток − прошлый остаток', item.explanation);
    }
    if (gross !== null) {
      observation('gross_profit', gross < 0 ? 'Себестоимость продаж выше выручки' : 'Валовая прибыль рассчитана', gross < 0
        ? 'В выбранном периоде себестоимость продаж превышает выручку. Уточните состав затрат, признание выручки и сопоставимость периода; это наблюдение по введённым суммам.'
        : 'Рассчитан результат после себестоимости продаж. До чистой прибыли также учитываются прочие доходы и расходы, проценты и налоги; их детализация здесь не введена.', gross < 0 ? 'attention' : 'neutral', ['revenue', 'costOfSales', 'grossProfit', 'grossMargin']);
    }
    if (revenue === 0) observation('zero_revenue', 'При нулевой выручке проценты не рассчитываются', 'Валовая и чистая рентабельность требуют положительной выручки в знаменателе. Нулевая выручка не означает отсутствие денежных поступлений или прочих доходов.', 'neutral', ['revenue', 'grossProfit', 'netProfit']);
    if (profit !== null && cashChange !== null) {
      observation(profit > 0 && cashChange < 0 ? 'profit_cash_divergence' : 'profit_cash_comparison', profit > 0 && cashChange < 0 ? 'Прибыль положительная, а денег стало меньше' : 'Прибыль и изменение денег сопоставлены', profit > 0 && cashChange < 0
        ? 'Чистая прибыль положительная, но введённый остаток денежных средств снизился. Проверьте операционные расчёты, инвестиции, кредиты, выплаты собственникам и прочие движения. Одни остатки не доказывают причины снижения.'
        : 'Прибыль относится к результатам периода, а изменение денег — к двум остаткам. Разность между ними сама по себе не показывает, куда направлены деньги и какие операции её сформировали.', profit > 0 && cashChange < 0 ? 'attention' : 'neutral', ['netProfit', 'cashPrevious', 'cashCurrent', 'cashChange', 'profitMinusCashChange']);
    } else if (cashChange !== null) {
      observation('cash_change', 'Изменение денег видно по двум датам', 'Сравниваются введённые остатки денег; на их изменение могут влиять курсовая переоценка, переклассификации и изменение периметра. Для сопоставления с финансовым результатом нужно уточнить чистую прибыль именно за интервал между датами.', 'neutral', ['cashPrevious', 'cashCurrent', 'cashChange']);
    }
    if (workingChange !== null) {
      observation('working_capital', workingChange > 0 ? 'Операционный оборотный капитал вырос' : workingChange < 0 ? 'Операционный оборотный капитал снизился' : 'Операционный оборотный капитал не изменился', workingChange > 0
        ? 'Сумма долгов покупателей и запасов за вычетом долгов поставщикам увеличилась. В упрощённой модели это направление проверки потребности в финансировании; изменение не является доказанной суммой оттока денег.'
        : 'Показано изменение выбранной группы операционных статей. Для объяснения реальных денежных поступлений и выплат нужны обороты, состав задолженности и остальные статьи.', 'neutral', ['operatingWorkingCapitalPrevious', 'operatingWorkingCapitalCurrent', 'operatingWorkingCapitalChange', 'receivablesChange', 'inventoryChange', 'payablesChange']);
    }
    if (netDebtChange !== null) {
      observation('net_debt', netDebtChange > 0 ? 'Чистый долг по выбранным статьям вырос' : netDebtChange < 0 ? 'Чистый долг по выбранным статьям снизился' : 'Чистый долг по выбранным статьям не изменился', 'Расчёт сопоставляет основной долг по кредитам и займам с введёнными деньгами. Для вывода о долговой нагрузке и платёжеспособности нужны графики выплат, ограничения на деньги и другие обязательства.', 'neutral', ['netDebtPrevious', 'netDebtCurrent', 'netDebtChange', 'loansChange', 'cashChange']);
    }
    if (byId('fixedAssets').delta !== null) observation('fixed_assets', 'Основные средства сравниваются отдельно', 'Изменение остаточной стоимости включает амортизацию, поступления, выбытия, переоценки и другие операции. Эту разницу не подставляем вместо оплаченных инвестиций.', 'neutral', ['fixedAssetsChange']);
    if (byId('retainedEarnings').delta !== null) observation('retained_earnings', 'Накопленная прибыль отделена от результата периода', 'Нераспределённая прибыль — накопленная сумма в капитале. Её изменение может включать распределения собственникам и корректировки; это не остаток денег и не замена чистой прибыли.', 'neutral', ['retainedEarningsChange', 'netProfit']);
    const primaryFlowIds = ['revenue', 'costOfSales', 'netProfit'];
    let knownCount = 0;
    for (const balance of balances) for (const side of ['previous', 'current']) {
      if (unknown(balance[side])) missing.push(balance.title + ' — ' + (side === 'previous' ? 'на прошлую дату' : 'на текущую дату'));
      else knownCount++;
    }
    for (const id of primaryFlowIds) {
      if (unknown(data.flows[id])) missing.push(flowDefinitions.find(item => item.id === id).title);
      else knownCount++;
    }
    return { status: knownCount === 0 ? 'empty' : missing.length ? 'partial' : 'complete', knownCount, totalCount: 17, metrics, observations, missing, summary: buildSummary(metrics, data) };
  }
  function analyze(input) {
    const validation = validateInput(input);
    const emptyResults = { ocf: null, afterCapex: null, loanNet: null, financingNet: null, conditionalAfterFinancing: null };
    if (!validation.valid) return { valid: false, errors: validation.errors, status: 'invalid', analysis: {status:'invalid',knownCount:0,totalCount:17,metrics:[],observations:[],missing:[],summary:emptySummary()}, results: emptyResults, balances: [], flows: [], missing: { core: [], capex: [], financing: [], balances: [], flows: [] }, contributions: [], explanation: 'Исправьте отмеченные поля. Расчёт не выполняется по некорректным данным.', cautions: [...cautions], version };
    const data = cloneInput(input);
    const balances = balanceDefinitions.map(definition => {
      const { previous, current } = data.balances[definition.id];
      const delta = unknown(previous) || unknown(current) ? null : round(current - previous);
      const explanations = {
        cash: 'Изменение введённых остатков денег. Не подменяет ОДДС и само по себе не объясняет причины движения.',
        fixedAssets: 'Изменение балансовой стоимости активов. Не используется вместо денежных инвестиционных выплат.',
        retainedEarnings: 'Изменение накопленного результата в капитале. Не используется вместо прибыли выбранного периода.',
        inventory: 'Рост запасов уменьшает условный операционный поток; снижение увеличивает.',
        loans: 'Изменение остатка основного долга. Денежные получения и погашения вводятся отдельно.',
        receivables: 'Рост долга клиентов уменьшает условный операционный поток; снижение увеличивает.',
        payables: 'Рост операционных обязательств увеличивает условный поток в этой модели, но не является доходом.'
      };
      return { ...definition, previous, current, delta, explanation: explanations[definition.id] };
    });
    const flows = flowDefinitions.map(definition => ({ ...definition, value: data.flows[definition.id] }));
    const balanceById = id => balances.find(balance => balance.id === id);
    const missing = { core: [], capex: [], financing: [], balances: [], flows: [] };
    for (const balance of balances) for (const side of ['previous', 'current']) {
      if (!unknown(balance[side])) continue;
      const label = balance.title + ' — ' + (side === 'previous' ? 'на прошлую дату' : 'на текущую дату');
      missing.balances.push(label);
      if (['receivables', 'inventory', 'payables'].includes(balance.id)) missing.core.push(label);
    }
    for (const flow of flows) if (unknown(flow.value)) {
      missing.flows.push(flow.title);
      if (['netProfit', 'noncash'].includes(flow.id)) missing.core.push(flow.title);
      if (flow.id === 'capex') missing.capex.push(flow.title);
      if (['loanReceived', 'loanRepaid', 'dividends'].includes(flow.id)) missing.financing.push(flow.title);
    }
    const results = { ...emptyResults };
    if (!missing.core.length) results.ocf = round(data.flows.netProfit + data.flows.noncash - balanceById('receivables').delta - balanceById('inventory').delta + balanceById('payables').delta);
    if (results.ocf !== null && !missing.capex.length) results.afterCapex = round(results.ocf - data.flows.capex);
    if (!unknown(data.flows.loanReceived) && !unknown(data.flows.loanRepaid)) results.loanNet = round(data.flows.loanReceived - data.flows.loanRepaid);
    if (results.loanNet !== null && !unknown(data.flows.dividends)) results.financingNet = round(results.loanNet - data.flows.dividends);
    if (results.afterCapex !== null && results.financingNet !== null) results.conditionalAfterFinancing = round(results.afterCapex + results.financingNet);
    const known = balances.reduce((sum, balance) => sum + Number(!unknown(balance.previous)) + Number(!unknown(balance.current)), 0) + flows.filter(flow => !unknown(flow.value)).length;
    const status = known === 0 ? 'empty' : missing.balances.length || missing.flows.length ? 'partial' : 'complete';
    let explanation = results.ocf === null
      ? 'Для условного операционного потока пока недостаточно данных. Неизвестные значения не заменяем нулями; их можно запросить у бухгалтера.'
      : results.ocf < 0
        ? 'В иллюстративном расчёте операционный поток отрицательный. Изменения задолженности и запасов показаны как направления проверки, а не доказанные причины реальной нехватки денег.'
        : results.afterCapex === null
          ? 'Условный операционный поток рассчитан. Для следующего шага нужны фактические инвестиционные выплаты; изменение основных средств их не заменяет.'
          : results.afterCapex < 0
            ? 'Условный операционный поток не покрывает указанные инвестиционные выплаты. Для проверки общей картины нужны источники финансирования и остальные денежные потоки.'
            : 'В иллюстративном расчёте операционный поток покрывает указанные инвестиционные выплаты. Это не подтверждает фактический остаток денег или финансовую устойчивость.';
    const contributions = [];
    if (results.ocf !== null) {
      let running = 0;
      const add = (id, label, value, total = false) => {
        const start = total ? 0 : running;
        const end = total ? value : round(running + value);
        contributions.push({ id, label, value, total, start, end });
        running = end;
      };
      add('ni', 'Чистая прибыль', data.flows.netProfit, true);
      add('nce', 'Неденежные корректировки', data.flows.noncash);
      add('ar', 'Изменение дебиторской задолженности', round(-balanceById('receivables').delta));
      add('inventory', 'Изменение запасов', round(-balanceById('inventory').delta));
      add('ap', 'Изменение кредиторской задолженности', balanceById('payables').delta);
      add('ocf', 'Условный операционный поток', results.ocf, true);
      if (results.afterCapex !== null) {
        add('capex', 'Денежные инвестиционные выплаты', round(-data.flows.capex));
        add('afterCapex', 'Условный поток после CAPEX', results.afterCapex, true);
      }
    }
    const analysis = buildAnalysis(data, balances);
    return { valid: true, errors: {}, version, status, analysis, dates: periodDates(data.previousDate, data.currentDate), unit: data.unit, mode: data.mode, balances, flows, missing, results, contributions, explanation, cautions: [...cautions] };
  }
  function accountantRequest(input = createEmptyInput()) {
    const previous = parsedDate(input.previousDate) ? input.previousDate : 'ПРОШЛАЯ ДАТА';
    const current = parsedDate(input.currentDate) ? input.currentDate : 'ТЕКУЩАЯ ДАТА';
    const unit = unitById(input.unit)?.title.toLowerCase() || 'согласованных единицах';
    const period = validateDates(previous, current).valid ? periodDates(previous, current).label : 'промежуток после прошлой даты по текущую включительно';
    return [
      'Запрос бухгалтеру для подготовки финансового навигатора',
      '',
      `Пожалуйста, подготовьте сопоставимые данные по одному и тому же периметру бизнеса на ${previous} и ${current}. Единицы измерения: ${unit}.`,
      `Показатели за период нужны только за ${period}. Если отчёты нарастающим итогом, пожалуйста, выделите нужный промежуток и подтвердите сопоставимость расчёта.`,
      '',
      'Какие исходные отчёты подготовить:',
      '• Бухгалтерский или управленческий баланс на обе даты.',
      '• Оборотно-сальдовую ведомость (ОСВ) за выбранный период с начальными и конечными остатками, дебетовыми и кредитовыми оборотами; необходимые расшифровки по контрагентам и видам операций.',
      '• Отчёт о финансовых результатах (ОФР / ОПиУ) за промежуток между датами, а не только неподтверждённый накопленный итог.',
      '• Отчёт о движении денежных средств (ОДДС / ДДС), если он ведётся, для последующей сверки. Если его нет — расшифровку фактических денежных операций по инвестициям, кредитам и выплатам собственникам на основе выписок и учёта.',
      '',
      '1. Баланс и расшифровки на ОБЕ даты:',
      ...balanceDefinitions.map(definition => '• ' + definition.title + '. ' + definition.source),
      '',
      '2. Показатели и денежные движения ЗА ПЕРИОД:',
      ...flowDefinitions.map(definition => '• ' + definition.title + '. ' + definition.source),
      '',
      'Просьба отдельно пояснить курсовые, неденежные и прочие корректировки, изменение периметра или учётных правил. Не смешивать операционные расчёты с инвестиционными и финансовыми статьями.',
      'Если суммы нет или её нужно уточнить, отметьте «неизвестно»; ноль указывайте только при подтверждённом отсутствии суммы.',
      'Изменение основных средств не заменяет CAPEX; изменение кредитов не заменяет денежные получения и погашения; изменение нераспределённой прибыли не заменяет чистую прибыль периода.',
      'Для прототипа достаточно подготовить суммы: финансовые документы в навигатор не загружаются.'
    ].join('\n');
  }
  return { version, MAX_RUBLES, units, balanceDefinitions, flowDefinitions, demoInput, createEmptyInput, cloneInput, normalizeInput, upgradeInput, isInputShape, validateDates, validateInput, maxAmount, convertUnit, convertUnits: convertUnit, analyze, accountantRequest };
});
