// Demo pricing policy agreed for this educational landing page (see ТЗ §06).
export const DISCOUNT_POLICY = Object.freeze({
  maximumPercent: 25,
  minimumMonths: 1,
  maximumMonths: 12,
  maximumUnitPrice: 10_000_000,
});

export type ServiceId = "diagnostics" | "strategy" | "support";
export interface CatalogService {
  id: ServiceId;
  title: string;
  short: string;
  description: string;
  defaultPrice: number;
  monthly: boolean;
}

export const SERVICE_CATALOG: readonly CatalogService[] = Object.freeze([
  { id: "diagnostics", title: "Финансовая диагностика", short: "Диагностика", description: "Разовый разбор финансов и рисков", defaultPrice: 15_000, monthly: false },
  { id: "strategy", title: "Финансовая стратегия", short: "Стратегия", description: "Модель бизнеса и план действий", defaultPrice: 45_000, monthly: false },
  { id: "support", title: "Сопровождение бизнеса", short: "Сопровождение", description: "Регулярный контроль и поддержка", defaultPrice: 80_000, monthly: true },
]);

export function parsePrice(value: unknown): number | null {
  const normalized = String(value ?? "").replace(/[\s\u00a0\u202f]/g, "");
  if (!/^\d+$/.test(normalized)) return null;
  const price = Number(normalized);
  return Number.isSafeInteger(price) && price >= 1 && price <= DISCOUNT_POLICY.maximumUnitPrice ? price : null;
}

export interface PackageItem extends CatalogService {
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type PackageResult =
  | { ok: false; reason: "empty" | "invalid"; errors: Partial<Record<ServiceId | "months" | "general", string>> }
  | {
      ok: true;
      items: PackageItem[];
      baseTotal: number;
      packagePercent: number;
      durationPercent: number;
      discountPercent: number;
      discountAmount: number;
      minimumPrice: number;
      selectedCount: number;
      months: number | null;
    };

export function calculatePackage({
  services = [],
  months = 1,
}: { services?: { id: string; price: unknown }[]; months?: number | string } = {}): PackageResult {
  if (!Array.isArray(services)) return { ok: false, reason: "invalid", errors: { general: "Проверьте выбранные услуги." } };
  if (services.length === 0) return { ok: false, reason: "empty", errors: {} };
  const errors: Partial<Record<ServiceId | "months" | "general", string>> = {};
  const seen = new Set<string>();
  const selected = services
    .map((item) => {
      const service = SERVICE_CATALOG.find((entry) => entry.id === item?.id);
      if (!service || seen.has(item.id)) {
        errors.general = "Каждую услугу можно добавить в пакет только один раз.";
        return null;
      }
      seen.add(item.id);
      const price = parsePrice(item.price);
      if (price === null) errors[service.id] = "Укажите цену от 1 до 10 000 000 ₽ целым числом.";
      return { ...service, unitPrice: price ?? 0 };
    })
    .filter((s): s is CatalogService & { unitPrice: number } => s !== null);
  const hasSupport = selected.some((item) => item.monthly);
  const term = hasSupport ? Number(months) : 1;
  if (hasSupport && (!Number.isInteger(term) || term < DISCOUNT_POLICY.minimumMonths || term > DISCOUNT_POLICY.maximumMonths)) {
    errors.months = "Выберите срок от 1 до 12 месяцев.";
  }
  if (Object.keys(errors).length) return { ok: false, reason: "invalid", errors };
  const items = selected.map((service) => {
    const quantity = service.monthly ? term : 1;
    return { ...service, quantity, lineTotal: service.unitPrice * quantity };
  });
  const baseTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const packagePercent = items.length >= 3 ? 10 : items.length === 2 ? 5 : 0;
  const durationPercent = !hasSupport || term < 3 ? 0 : term < 6 ? 5 : term < 12 ? 10 : 15;
  const discountPercent = Math.min(DISCOUNT_POLICY.maximumPercent, packagePercent + durationPercent);
  // Round savings down: the payable price can never break the agreed discount ceiling.
  const discountAmount = Math.floor((baseTotal * discountPercent) / 100);
  return {
    ok: true,
    items,
    baseTotal,
    packagePercent,
    durationPercent,
    discountPercent,
    discountAmount,
    minimumPrice: baseTotal - discountAmount,
    selectedCount: items.length,
    months: hasSupport ? term : null,
  };
}

export function monthsLabel(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "месяц" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "месяца" : "месяцев";
  return `${value} ${word}`;
}
