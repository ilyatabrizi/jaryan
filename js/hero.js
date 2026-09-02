/* The hero clip.

   Autoplay-muted-inline is allowed on iOS, but not in Low Power Mode and not
   under prefers-reduced-motion — in both cases the poster is the hero and
   nothing looks broken. The element is also paused whenever it is scrolled
   out of view or the tab is hidden, because a looping video behind five
   screens of content is pure battery. */

export function mountHero(root) {
  const vid = root.querySelector('.hero video');
  if (!vid) return () => {};

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) { vid.remove(); return () => {}; }

  vid.addEventListener('playing', () => vid.classList.add('ready'), { once: true });
  const tryPlay = () => vid.play().catch(() => { /* poster carries it */ });
  tryPlay();

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) tryPlay(); else vid.pause();
  }, { threshold: 0.08 });
  io.observe(root.querySelector('.hero'));

  const onVis = () => (document.hidden ? vid.pause() : tryPlay());
  document.addEventListener('visibilitychange', onVis);

  /* One tap anywhere wakes a clip that a strict autoplay policy refused. */
  const kick = () => tryPlay();
  document.addEventListener('touchstart', kick, { once: true, passive: true });
  document.addEventListener('click', kick, { once: true });

  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    vid.pause();
  };
}
