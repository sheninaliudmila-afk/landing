import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ContactProvider, useContact, MESSAGE_MAX } from '@/components/site/ContactContext';
import { Quiz } from '@/components/site/Quiz';
import { Calculator } from '@/components/site/Calculator';
import { ContactSection } from '@/components/site/ContactSection';
import { PracticeCarousel } from '@/components/site/PracticeCarousel';
import { contactEndpointConfigured } from '@/lib/contact-client';
import { questions } from '@/lib/quiz-model';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
const carousel = vi.hoisted(() => {
  let selected = 0;
  const listeners = new Set<() => void>();
  return {
    selectedScrollSnap: () => selected,
    on: (_event: string, listener: () => void) => listeners.add(listener),
    off: (_event: string, listener: () => void) => listeners.delete(listener),
    scrollTo: (index: number) => { selected = index; listeners.forEach((listener) => listener()); },
    reset: () => { selected = 0; listeners.clear(); },
  };
});
vi.mock('embla-carousel-react', () => ({ default: () => [() => {}, carousel] }));
beforeEach(() => {
  carousel.reset();
  Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'), media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) });
  vi.stubGlobal('IntersectionObserver', class {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    unobserve() {} disconnect() {}
  });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = vi.fn();
});

describe('practice carousel', () => {
  it('connects tabs and arrows to the active panel and transfers the selected offer', () => {
    render(<ContactProvider><PracticeCarousel /><MessageHarness /></ContactProvider>);
    expect(screen.getByRole('tabpanel', { name: /Отзывы/ })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Предыдущий слайд' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: /Услуги/ }));
    expect(screen.getByRole('tabpanel', { name: /Услуги/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Услуги/ }).getAttribute('aria-selected')).toBe('true');
    expect((screen.getByRole('button', { name: 'Следующий слайд' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Начать с диагностики/ }));
    expect((screen.getByLabelText('Request message') as HTMLTextAreaElement).value).toContain('Интересует финансовая диагностика');
    fireEvent.click(screen.getByRole('button', { name: 'Предыдущий слайд' }));
    expect(screen.getByRole('tabpanel', { name: /Формат работы/ })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('tab', { name: /Формат работы/ }), { key: 'Home' });
    expect(screen.getByRole('tabpanel', { name: /Отзывы/ })).toBeTruthy();
  });
});

describe('training contact form', () => {
  it('validates fields, downloads the request, and never claims remote sending', async () => {
    expect(contactEndpointConfigured).toBe(false);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const downloadClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createObjectURL = vi.fn().mockReturnValue('blob:qa-request');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
    render(<ContactProvider><ContactSection /></ContactProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Сохранить заявку/ }));
    expect(screen.getByText('Укажите имя — минимум 2 символа.')).toBeTruthy();
    expect(document.activeElement?.id).toBe('name');
    expect(downloadClick).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Как к вам обращаться/), { target: { value: 'Тестовый клиент' } });
    fireEvent.change(screen.getByLabelText(/Электронная почта/), { target: { value: 'qa@example.com' } });
    fireEvent.change(screen.getByLabelText('О чём хотели бы поговорить'), { target: { value: 'Нужна диагностика бизнеса' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Согласен/ }));
    fireEvent.click(screen.getByRole('button', { name: /Сохранить заявку/ }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Заявка сохранена на вашем устройстве'));
    expect(downloadClick).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0]![0] as Blob;
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });
    expect(text).toContain('Тестовый клиент');
    expect(text).toContain('qa@example.com');
    expect(text).toContain('Нужна диагностика бизнеса');
    expect(text).toContain('Это локальная копия');
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function MessageHarness() {
  const { message, setMessage, injectBlock } = useContact();
  const [accepted, setAccepted] = React.useState<boolean | null>(null);
  return <div>
    <label>Request message<textarea aria-label="Request message" value={message} onChange={(e) => setMessage(e.target.value)} /></label>
    <input id="name" aria-label="Client name" />
    <button onClick={() => setAccepted(injectBlock('quiz', 'Quiz result one'))}>Insert quiz one</button>
    <button onClick={() => setAccepted(injectBlock('quiz', 'Quiz result two'))}>Insert quiz two</button>
    <button onClick={() => setAccepted(injectBlock('calculator', 'Package quote'))}>Insert package</button>
    <output aria-label="Insert accepted">{String(accepted)}</output>
  </div>;
}

describe('contact composition', () => {
  it('preserves the user message and updates only its own injected result block', () => {
    render(<ContactProvider><MessageHarness /></ContactProvider>);
    const field = screen.getByLabelText('Request message') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: 'My own business question' } });
    fireEvent.click(screen.getByText('Insert quiz one'));
    expect(field.value).toBe('My own business question\n\nQuiz result one');
    fireEvent.click(screen.getByText('Insert package'));
    fireEvent.click(screen.getByText('Insert quiz two'));
    expect(field.value).toBe('My own business question\n\nQuiz result two\n\nPackage quote');
  });

  it('refuses overflowing blocks without truncating the user message', () => {
    render(<ContactProvider><MessageHarness /></ContactProvider>);
    const field = screen.getByLabelText('Request message') as HTMLTextAreaElement;
    const original = 'Я'.repeat(MESSAGE_MAX - 2);
    fireEvent.change(field, { target: { value: original } });
    fireEvent.click(screen.getByText('Insert quiz one'));
    expect(field.value).toBe(original);
    expect(screen.getByLabelText('Insert accepted').textContent).toBe('false');
  });
});

describe('express quiz', () => {
  it('requires an answer, completes all ten questions, preserves choices on edit, and transfers the result', async () => {
    render(<ContactProvider><Quiz /><MessageHarness /></ContactProvider>);
    const next = () => screen.getByRole('button', { name: /Далее/ });
    expect((next() as HTMLButtonElement).disabled).toBe(true);
    for (let index = 0; index < questions.length; index++) {
      expect(screen.getByText(questions[index].title)).toBeTruthy();
      fireEvent.click(screen.getAllByRole('radio')[0]!);
      fireEvent.click(screen.getByRole('button', { name: index === questions.length - 1 ? /Получить результат/ : /Далее/ }));
    }
    expect(screen.getByText('10 ИЗ 10 · ВАШ МАРШРУТ ГОТОВ')).toBeTruthy();
    expect(document.activeElement?.id).toBe('fq-result-title');
    fireEvent.click(screen.getByRole('button', { name: /Обсудить мой результат/ }));
    expect((screen.getByLabelText('Request message') as HTMLTextAreaElement).value).toContain('Результат экспресс-теста: Финансовая диагностика.');
    await waitFor(() => expect(document.activeElement?.id).toBe('name'));
    fireEvent.click(screen.getByRole('button', { name: /Изменить ответы/ }));
    expect(screen.getByText(questions[9]!.title)).toBeTruthy();
    expect((screen.getAllByRole('radio')[0] as HTMLInputElement).checked).toBe(true);
    await waitFor(() => expect(document.activeElement?.tagName).toBe('LEGEND'));
    fireEvent.click(screen.getByRole('button', { name: /Получить результат/ }));
    fireEvent.click(screen.getByRole('button', { name: /Пройти заново/ }));
    expect(screen.getByText(questions[0]!.title)).toBeTruthy();
    expect((next() as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect(document.querySelector('#fq-shell')?.classList.contains('is-visible')).toBe(true));
    await waitFor(() => expect(document.activeElement?.tagName).toBe('LEGEND'));
  });
});

describe('calculator UI', () => {
  it('starts with the 255000 quote, reaches the 25% ceiling, and transfers the computed package', () => {
    render(<ContactProvider><Calculator /><MessageHarness /></ContactProvider>);
    const result = screen.getByRole('complementary');
    expect(result.textContent?.replace(/\s/g, '')).toContain('255000');
    fireEvent.click(screen.getByRole('button', { name: '12 мес.' }));
    expect(result.textContent?.replace(/\s/g, '')).toContain('765000');
    expect(result.textContent).toContain('Достигнут максимальный размер скидки — 25%');
    fireEvent.click(screen.getByRole('button', { name: /Обсудить этот пакет/ }));
    expect((screen.getByLabelText('Request message') as HTMLTextAreaElement).value.replace(/\s/g, '')).toContain('минимальнаяцена:765000₽');
  });

  it('rejects invalid selected prices and recovers after deselection', () => {
    render(<ContactProvider><Calculator /></ContactProvider>);
    const strategy = screen.getByLabelText('Базовая цена: Финансовая стратегия, ₽ разово');
    fireEvent.change(strategy, { target: { value: '0' } });
    expect(screen.getByText('Проверьте базовые цены')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Обсудить этот пакет/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: /Финансовая стратегия/ }));
    expect((screen.getByRole('button', { name: /Обсудить этот пакет/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows an empty state when every service is deselected and disables term selection', () => {
    render(<ContactProvider><Calculator /></ContactProvider>);
    for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox);
    expect(screen.getByText('Соберите свой пакет')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Обсудить этот пакет/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('slider') as HTMLInputElement).closest('fieldset')?.disabled).toBe(true);
  });
});
