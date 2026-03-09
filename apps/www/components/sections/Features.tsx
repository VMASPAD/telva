"use client";
import React, { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const featureData = [
  {
    id: "multiplayer",
    title: "Real-Time Multiplayer",
    subtitle: "Collaborate instantly",
    description: "Built-in Liveblocks integration for live collaborative sessions. See presence cursors, sync document state globally, and orchestrate shared asset uploads without conflict. Read-only limits available.",
    image: "https://placehold.co/600x400.png",
    type: "img",
    reverse: false
  },
  {
    id: "react-components",
    title: "React Components",
    subtitle: "Embed anything",
    description: "Insert any React Component right into the canvas as a first-class object. Shapes can also be grouped, nested, bound to each other, and customized deeply with 12 semantic colors and 4 gradient types.",
    image: "/cap2.webm",
    type: "gif",
    reverse: true
  },
  {
    id: "undo",
    title: "Undo / Redo Time-travel",
    subtitle: "Command History",
    description: "Every single action is tracked in a robust command history. Reversible patches with before/after snapshots allow safe, reliable time-travel operations for every modification.",
    image: "/cap3.webm",
    type: "gif",
    reverse: false
  },
  {
    id: "api",
    title: "Developer API",
    subtitle: "Built to be embedded",
    description: "Telva gives you the full state machine. Toggle UI panels, disable assets, handle operations imperatively via the TelvaApp object, and hook into live callbacks seamlessly.",
    image: "/types.ts.png",
    type: "img",
    reverse: true
  }
];

function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mm = gsap.matchMedia();

    const ctx = gsap.context(() => {
      mm.add("(min-width: 768px)", () => {
        const panels = gsap.utils.toArray<HTMLElement>(".feature-panel");

        panels.forEach((panel) => {
          const innerPanel = panel.querySelector<HTMLElement>(".section-inner");
          if (!innerPanel) return;

          const computeRatio = () => {
            panel.style.marginBottom = "";

            const panelHeight = innerPanel.offsetHeight;
            const viewportHeight = window.innerHeight;
            const difference = panelHeight - viewportHeight;
            const ratio = difference > 0 ? difference / (difference + viewportHeight) : 0;

            if (ratio > 0) {
              panel.style.marginBottom = `${panelHeight * ratio}px`;
            }

            return ratio;
          };

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: panel,
              start: "bottom bottom",
              end: () => (computeRatio() > 0 ? `+=${innerPanel.offsetHeight}` : "bottom top"),
              pin: true,
              pinSpacing: false,
              scrub: true,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });

          tl.to(
            innerPanel,
            {
              yPercent: () => (computeRatio() > 0 ? -100 : 0),
              y: () => (computeRatio() > 0 ? window.innerHeight : 0),
              duration: () => {
                const ratio = computeRatio();
                return ratio > 0 ? 1 / (1 - ratio) - 1 : 0;
              },
              ease: "none",
            },
            0,
          )
            .fromTo(
              panel,
              { scale: 1, opacity: 1 },
              { scale: 0.88, opacity: 0.55, duration: 0.9, ease: "none" },
              0,
            )
            .to(panel, { opacity: 0, duration: 0.1, ease: "none" });
        });

        const refreshScroll = () => ScrollTrigger.refresh();

        window.addEventListener("resize", refreshScroll);
        window.addEventListener("orientationchange", refreshScroll);

        const resizeObserver = new ResizeObserver(refreshScroll);
        resizeObserver.observe(container);

        ScrollTrigger.refresh();

        return () => {
          window.removeEventListener("resize", refreshScroll);
          window.removeEventListener("orientationchange", refreshScroll);
          resizeObserver.disconnect();
          gsap.set(".feature-panel", { clearProps: "marginBottom" });
        };
      });
    }, containerRef);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section className="bg-black px-4 py-12 sm:px-6 sm:py-16 md:py-20" ref={containerRef}>
      <div className="mx-auto flex max-w-9xl flex-col gap-6 md:gap-8">
        {featureData.map((feature) => (
          <section key={feature.id} className="feature-panel relative mb-6 flex w-full justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-white md:mb-10 md:h-[calc(100svh-64px)]">
            <div className={`section-inner flex h-full w-full flex-col items-stretch ${feature.reverse ? "md:flex-row-reverse" : "md:flex-row"}`}>
              <div className="z-20 flex h-full w-full flex-1 flex-col justify-center gap-4 p-6 sm:p-8 md:p-12 lg:p-20 xl:p-24">
                <span className="text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase">{feature.subtitle}</span>
                <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">{feature.title}</h2>
                <p className="mt-1 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                  {feature.description}
                </p>
              </div>
              <div className="relative h-[40svh] w-full flex-1 overflow-hidden sm:h-[48svh] md:h-full">
                <div className={feature.reverse ? "absolute inset-0 z-10 hidden bg-linear-to-r from-zinc-950 via-zinc-950/20 to-transparent md:block" : "absolute inset-0 z-10 hidden bg-linear-to-l from-zinc-950 via-zinc-950/20 to-transparent md:block"} />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950 to-transparent z-10 md:hidden" />
                
                {
                  feature.type === "img" ? (
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover opacity-60"
                    />
                  ) : (
                    <video
                      className="w-full h-full object-cover opacity-60"
                      src={feature.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )
                }
              </div>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export default Features;
