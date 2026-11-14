const video = document.querySelector('#video');
for (const button of document.querySelectorAll('[data-time]')) {
  button.addEventListener('click', () => {
    const seek = () => {
      video.currentTime = Number(button.dataset.time);
      video.scrollIntoView({behavior: 'instant', block: 'center'});
      video.focus({preventScroll: true});
    };
    if (video.readyState >= 1) seek();
    else {
      video.addEventListener('loadedmetadata', seek, {once: true});
      video.load();
    }
  });
}
