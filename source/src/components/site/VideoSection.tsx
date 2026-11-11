import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { Reveal } from "./Reveal";
import poster from "@/assets/alekseeva-congrats-poster.jpg";
import video from "@/assets/alekseeva-congrats-v2.mp4";

export function VideoSection() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = async () => {
    setPlaying(true);
    ref.current?.focus();
    try {
      await ref.current?.play();
    } catch {
      /* native controls remain available */
    }
  };

  return (
    <section id="video" aria-labelledby="video-title" className="relative border-y border-border bg-card/40">
      <div className="container-x section-y grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="kicker">02 — Личный подход</p>
          <h2 id="video-title" className="h-section mt-5">
            Внимание к цифрам.
            <span className="muted-heading block">Понимание бизнеса.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            За каждым решением — ваши цели, ваша команда и ваш бизнес. Поэтому работа начинается с диалога.
          </p>
          <p className="mt-8 inline-flex items-center gap-3 text-sm font-semibold">
            <span className="h-px w-10 bg-primary" /> Познакомимся ближе
          </p>
        </Reveal>
        <Reveal delay={120} className="relative overflow-hidden rounded-[2rem] border border-border shadow-card">
          <video
            ref={ref}
            controls={playing}
            playsInline
            preload="none"
            poster={poster}
            aria-label="Видео со звуком: Алексеева Людмила и клиент поздравляют друг друга с успешным проектом"
            className="aspect-video w-full bg-background object-cover"
            onPlay={() => setPlaying(true)}
            onEnded={() => setPlaying(false)}
          >
            <source src={video} type="video/mp4" />
            Ваш браузер не поддерживает видео. <a href={video}>Скачать ролик</a>.
          </video>
          {!playing && (
            <button
              type="button"
              onClick={play}
              aria-label="Воспроизвести видео со звуком, 10 секунд"
              className="group absolute inset-0 flex flex-col items-center justify-center bg-background/30 transition-colors hover:bg-background/10"
            >
              <span className="relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform duration-500 group-hover:scale-110">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" aria-hidden="true" />
                <Play className="relative ml-1 size-8 fill-current" />
              </span>
              <span className="absolute inset-x-0 bottom-0 flex justify-between p-6 text-xs font-bold tracking-[0.16em]">
                <span>УСПЕШНЫЙ ПРОЕКТ · СО ЗВУКОМ</span>
                <span>00:10 ↗</span>
              </span>
            </button>
          )}
        </Reveal>
      </div>
    </section>
  );
}
