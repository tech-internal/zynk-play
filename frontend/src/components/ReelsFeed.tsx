import React from 'react';
import './ReelsFeed.css';
import { ReelItem } from '../config/reels';

type ReelsFeedProps = {
  reels: ReelItem[];
  scrollRootRef?: React.RefObject<HTMLElement | null>;
  onFocusChange?: (focused: boolean) => void;
};

const ReelVideo: React.FC<{ reel: ReelItem; active: boolean; preload: boolean; muted: boolean }> = ({
  reel,
  active,
  preload,
  muted,
}) => {
  const sources = React.useMemo(
    () => [reel.src, reel.fallbackSrc, reel.proxySrc],
    [reel.src, reel.fallbackSrc, reel.proxySrc],
  );
  const [sourceIndex, setSourceIndex] = React.useState(0);
  const src = sources[sourceIndex] ?? reel.proxySrc;
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    setSourceIndex(0);
  }, [reel.id]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [active, src]);

  return (
    <video
      ref={videoRef}
      className="watch-reel-video"
      src={src}
      playsInline
      muted={muted}
      loop
      preload={preload ? 'metadata' : 'none'}
      aria-label={reel.title}
      onError={() => {
        setSourceIndex((index) => (index < sources.length - 1 ? index + 1 : index));
      }}
    />
  );
};

const ReelsFeed: React.FC<ReelsFeedProps> = ({ reels, scrollRootRef, onFocusChange }) => {
  const containerRef = React.useRef<HTMLElement | null>(null);
  const reelRefs = React.useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [muted, setMuted] = React.useState(true);

  React.useEffect(() => {
    const root = scrollRootRef?.current ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isNaN(index)) continue;
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }
        if (bestRatio >= 0.5 && bestIndex >= 0) {
          setActiveIndex(bestIndex);
        }
      },
      { root, threshold: [0.25, 0.5, 0.75, 0.95] },
    );

    reelRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [reels.length, scrollRootRef]);

  React.useEffect(() => {
    onFocusChange?.(activeIndex > 0);
  }, [activeIndex, onFocusChange]);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      reelRefs.current.forEach((node) => {
        const video = node?.querySelector('video');
        if (video) video.muted = next;
      });
      return next;
    });
  };

  if (reels.length === 0) return null;

  return (
    <section className="watch-reels" ref={containerRef} aria-label="Reels">
      {reels.map((reel, index) => (
        <article
          key={reel.id}
          className={`watch-reel${index === activeIndex ? ' watch-reel--active' : ''}`}
          data-index={index}
          ref={(node: HTMLElement | null) => {
            reelRefs.current[index] = node;
          }}
        >
          <ReelVideo
            reel={reel}
            active={index === activeIndex}
            preload={index <= activeIndex + 1}
            muted={muted}
          />
          <div className="watch-reel-overlay">
            <p className="watch-reel-title">{reel.title}</p>
            {index === activeIndex ? (
              <button
                type="button"
                className="watch-reel-mute"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute reel' : 'Mute reel'}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {muted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
};

export default ReelsFeed;
