// Demo pricing policy agreed for this educational landing page.
export const DISCOUNT_POLICY = Object.freeze({ maximumPercent: 25, minimumMonths: 1, maximumMonths: 12, maximumUnitPrice: 10_000_000 });
export const SERVICE_CATALOG = Object.freeze([
  Object.freeze({ id: 'diagnostics', title: 'Финансовая диагностика', defaultPrice: 15_000, monthly: false }),
  Object.freeze({ id: 'strategy', title: 'Финансовая стратегия', defaultPrice: 45_000, monthly: false }),
  Object.freeze({ id: 'support', title: 'Сопровождение бизнеса', defaultPrice: 80_000, monthly: true })
]);

export function parsePrice(value) {
  const normalized = String(value ?? '').replace(/[\s\u00a0\u202f]/g, '');
  if (!/^\d+$/.test(normalized)) return null;
  const price = Number(normalized);
  return Number.isSafeInteger(price) && price >= 1 && price <= DISCOUNT_POLICY.maximumUnitPrice ? price : null;
}

export function calculatePackage({ services = [], months = 1 } = {}) {
  if (!Array.isArray(services)) return { ok: false, reason: 'invalid', errors: { general: 'Проверьте выбранные услуги.' } };
  if (services.length === 0) return { ok: false, reason: 'empty', errors: {} };
  const errors = {};
  const seen = new Set();
  const selected = services.map(item => {
    const service = SERVICE_CATALOG.find(entry => entry.id === item?.id);
    if (!service || seen.has(item.id)) {
      errors.general = 'Каждую услугу можно добавить в пакет только один раз.';
      return null;
    }
    seen.add(item.id);
    const price = parsePrice(item.price);
    if (price === null) errors[item.id] = 'Укажите цену от 1 до 10 000 000 ₽ целым числом.';
    return { ...service, unitPrice: price };
  }).filter(Boolean);
  const hasSupport = selected.some(item => item.monthly);
  const term = hasSupport ? Number(months) : 1;
  if (hasSupport && (!Number.isInteger(term) || term < DISCOUNT_POLICY.minimumMonths || term > DISCOUNT_POLICY.maximumMonths)) {
    errors.months = 'Выберите срок от 1 до 12 месяцев.';
  }
  if (Object.keys(errors).length) return { ok: false, reason: 'invalid', errors };
  const items = selected.map(service => {
    const quantity = service.monthly ? term : 1;
    return { ...service, quantity, lineTotal: service.unitPrice * quantity };
  });
  const baseTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const packagePercent = items.length >= 3 ? 10 : items.length === 2 ? 5 : 0;
  const durationPercent = !hasSupport || term < 3 ? 0 : term < 6 ? 5 : term < 12 ? 10 : 15;
  const discountPercent = Math.min(DISCOUNT_POLICY.maximumPercent, packagePercent + durationPercent);
  // Round savings down: the payable price can never break the agreed discount ceiling.
  const discountAmount = Math.floor(baseTotal * discountPercent / 100);
  return {
    ok: true, items, baseTotal, packagePercent, durationPercent, discountPercent, discountAmount,
    minimumPrice: baseTotal - discountAmount, selectedCount: items.length, months: hasSupport ? term : null
  };
}
