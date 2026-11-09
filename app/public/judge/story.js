const scenes = [...document.querySelectorAll('[data-scene]')];
const chapters = [...document.querySelectorAll('[data-chapter]')];
const play = document.querySelector('#play');
const seek = document.querySelector('#seek');
const clock = document.querySelector('#clock');
const note = document.querySelector('#playback-note');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let time = 0, running = false, previous = null, active = -1, frame;
const format = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
function render() {
  note.textContent = time >= 60 ? 'Tour complete. Run fresh public checks to verify both recorded flows; the illustration itself is not a verification result.' : reduced.matches ? 'Reduced motion enabled. Chapters remain still. Play advances through six chapters; you can also choose any chapter.' : 'Illustrated replay of recorded evidence, not live transactions or real-time execution. Pauses when you leave this tab.';
  const index = Math.min(5, Math.floor(time / 10));
  if (index !== active) {
    scenes.forEach((scene, i) => { scene.hidden = i !== index; });
    chapters.forEach((button, i) => { if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    active = index;
  }
  seek.value = time;
  seek.setAttribute('aria-valuetext', `${format(time)} of 1 minute, ${chapters[index].textContent.replace(/\s+/g, ' ').trim()}`);
  clock.value = `${format(time)} / 1:00`;
  play.innerHTML = running ? 'Pause tour <span aria-hidden="true">Ⅱ</span>' : time >= 60 ? 'Replay tour <span aria-hidden="true">↺</span>' : time > 0 ? 'Continue tour <span aria-hidden="true">▶</span>' : 'Play 60-second tour <span aria-hidden="true">▶</span>';
  document.querySelector('.player').classList.toggle('playing', running);
}
function stop() { running = false; previous = null; cancelAnimationFrame(frame); render(); }
function tick(now) {
  if (!running) return;
  if (previous !== null) time = Math.min(60, time + (now - previous) / 1000);
  previous = now;
  if (time >= 60) { stop(); return; }
  render(); frame = requestAnimationFrame(tick);
}
play.addEventListener('click', () => {
  if (running) return stop();
  if (time >= 60) time = 0;
  running = true; previous = null; render(); frame = requestAnimationFrame(tick);
});
seek.addEventListener('input', () => { const requested = Number(seek.value); stop(); time = requested; render(); });
seek.addEventListener('pointerdown', () => { if (running) stop(); });
chapters.forEach((button, i) => button.addEventListener('click', () => { stop(); time = i * 10; render(); }));
document.addEventListener('visibilitychange', () => { if (document.hidden && running) stop(); });
reduced.addEventListener('change', () => { stop(); });
document.querySelectorAll('.transport,.chapters').forEach(element => element.hidden = false);
render();
