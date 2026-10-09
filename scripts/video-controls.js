/*
 * Custom video controls, modelled on the source site's Dynamic Media (Scene7)
 * VideoViewer: a translucent bar along the bottom of the frame with play/pause,
 * a seek track, elapsed / total time, mute with a pop-up volume slider and a
 * full-screen toggle. The bar fades in while the pointer is over the player (or
 * focus is inside it) and fades out again once playback is idle.
 *
 * The browser's native controls look different in every browser and can't be
 * restyled reliably, so the <video> runs with controls off and these replace
 * them. Sliders are native <input type="range"> elements layered (transparent)
 * over the drawn tracks, so keyboard and screen-reader support comes for free.
 * Appearance lives in styles/lazy-styles.css (.dm-video-controls).
 */

// how long the bar stays up after the last pointer movement while playing
const HIDE_DELAY = 2500;
// slider resolution for the seek track (value is a fraction of the duration)
const SEEK_STEPS = 1000;

/**
 * Format seconds as m:ss (or h:mm:ss), like the source viewer's time display.
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/**
 * Create an element with a class name.
 * @param {string} tag
 * @param {string} className
 * @returns {HTMLElement}
 */
function el(tag, className) {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

/**
 * Create a control button holding an icon span (the icon is a CSS mask chosen
 * by the button's state classes).
 * @param {string} className
 * @returns {HTMLButtonElement}
 */
function controlButton(className) {
  const button = el('button', `dm-video-button ${className}`);
  button.type = 'button';
  button.append(el('span', 'dm-video-icon'));
  return button;
}

/**
 * Create a transparent range input that sits over a drawn track.
 * @param {string} label accessible name (also shown as the hover tooltip)
 * @param {number} max
 * @returns {HTMLInputElement}
 */
function rangeInput(label, max) {
  const input = el('input', 'dm-video-range');
  input.type = 'range';
  input.min = '0';
  input.max = String(max);
  input.step = '1';
  input.value = '0';
  input.title = label;
  input.setAttribute('aria-label', label);
  return input;
}

/** @param {HTMLButtonElement} button @param {string} label */
function setLabel(button, label) {
  button.title = label;
  button.setAttribute('aria-label', label);
}

/** @param {number} seconds @returns {boolean} */
function isDuration(seconds) {
  return Number.isFinite(seconds) && seconds > 0;
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

/**
 * Add the custom control bar to a rendered DM video.
 * @param {HTMLElement} wrapper the .dm-video-wrapper holding the <video>
 * @param {HTMLVideoElement} video
 * @param {() => Promise<void>} play starts playback (attaching the source first if needed)
 * @param {(() => Promise<number>)|null} loadDuration optional: reads the length
 * without loading the media, so the total shows before playback; called once,
 * the first time the pointer or focus enters the player
 */
export default function addVideoControls(wrapper, video, play, loadDuration = null) {
  video.controls = false;

  const bar = el('div', 'dm-video-controls');
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Video controls');

  // play / pause / replay
  const toggle = controlButton('dm-video-toggle');

  // seek track: drawn track + loaded + played, a knob, a time bubble shown while
  // scrubbing, and the (transparent) range input on top
  const seek = el('div', 'dm-video-seek');
  const track = el('div', 'dm-video-track');
  track.append(el('div', 'dm-video-track-loaded'), el('div', 'dm-video-track-played'));
  const bubble = el('span', 'dm-video-bubble');
  const seekInput = rangeInput('Seek Video', SEEK_STEPS);
  seek.append(track, el('span', 'dm-video-knob'), bubble, seekInput);

  const time = el('span', 'dm-video-time');

  // mute button with a vertical volume slider that pops up above it on hover
  const volume = el('div', 'dm-video-volume');
  const mute = controlButton('dm-video-mute');
  const volumePopup = el('div', 'dm-video-volume-popup');
  const volumeTrack = el('div', 'dm-video-volume-track');
  volumeTrack.append(el('div', 'dm-video-volume-fill'), el('span', 'dm-video-volume-knob'));
  const volumeInput = rangeInput('Video Volume', 100);
  volumeInput.classList.add('dm-video-range-vertical');
  volumePopup.append(volumeTrack, volumeInput);
  volume.append(mute, volumePopup);

  const fullscreen = controlButton('dm-video-fullscreen');
  const canFullscreen = document.fullscreenEnabled
    || document.webkitFullscreenEnabled
    || typeof video.webkitEnterFullscreen === 'function';

  bar.append(toggle, seek, time, volume);
  if (canFullscreen) bar.append(fullscreen);
  wrapper.append(bar);

  /* ---- state → UI ---- */

  let scrubbing = false;
  // length read ahead of playback (loadDuration), until the media reports its own
  let presetDuration = NaN;
  const getDuration = () => (isDuration(video.duration) ? video.duration : presetDuration);

  const updateToggle = () => {
    const { ended } = video;
    wrapper.classList.toggle('is-ended', ended);
    toggle.classList.toggle('is-pause', !video.paused && !ended);
    toggle.classList.toggle('is-replay', ended);
    if (ended) setLabel(toggle, 'Replay');
    else setLabel(toggle, video.paused ? 'Play' : 'Pause');
  };

  const updateTime = () => {
    const { currentTime } = video;
    const duration = getDuration();
    const played = isDuration(duration) ? Math.min(currentTime / duration, 1) : 0;
    wrapper.style.setProperty('--dm-played', played);
    if (!scrubbing) seekInput.value = String(Math.round(played * SEEK_STEPS));
    time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    seekInput.setAttribute('aria-valuetext', `${formatTime(currentTime)} of ${formatTime(duration)}`);
  };

  const updateLoaded = () => {
    const { duration, buffered } = video;
    if (!isDuration(duration) || !buffered.length) return;
    const loaded = buffered.end(buffered.length - 1) / duration;
    wrapper.style.setProperty('--dm-loaded', Math.min(loaded, 1));
  };

  const updateVolume = () => {
    const level = video.muted ? 0 : video.volume;
    wrapper.style.setProperty('--dm-volume', level);
    volumeInput.value = String(Math.round(level * 100));
    mute.classList.toggle('is-muted', level === 0);
    setLabel(mute, level === 0 ? 'Unmute' : 'Mute');
  };

  const updateFullscreen = () => {
    const active = fullscreenElement() === wrapper;
    wrapper.classList.toggle('is-fullscreen', active);
    fullscreen.classList.toggle('is-exit', active);
    setLabel(fullscreen, active ? 'Exit Full Screen' : 'Full Screen');
  };

  /* ---- show / hide the bar ---- */

  let hideTimer;
  let pointerInside = false;

  const hide = () => {
    // keep the bar up while it's being used (scrubbing, keyboard focus) or while
    // the paused video is under the pointer
    if (scrubbing || wrapper.querySelector(':focus-visible')) return;
    if (video.paused && pointerInside) return;
    wrapper.classList.remove('show-controls');
  };

  let durationRequested = false;
  const preloadDuration = () => {
    if (!loadDuration || durationRequested || isDuration(getDuration())) return;
    durationRequested = true;
    loadDuration().then((seconds) => {
      presetDuration = seconds;
      updateTime();
    });
  };

  const show = () => {
    preloadDuration();
    wrapper.classList.add('show-controls');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (!video.paused) hide(); }, HIDE_DELAY);
  };

  wrapper.addEventListener('pointermove', () => { pointerInside = true; show(); });
  wrapper.addEventListener('pointerdown', show);
  wrapper.addEventListener('pointerleave', () => {
    pointerInside = false;
    clearTimeout(hideTimer);
    hide();
  });
  wrapper.addEventListener('focusin', show);
  wrapper.addEventListener('focusout', () => {
    // wait for focus to land so the :focus-visible check sees the new target
    setTimeout(() => { if (!pointerInside) hide(); });
  });

  /* ---- actions ---- */

  const togglePlay = () => {
    if (video.paused || video.ended) play();
    else video.pause();
  };

  toggle.addEventListener('click', togglePlay);
  // clicking the picture itself plays / pauses, like the source viewer
  video.addEventListener('click', togglePlay);

  const seekTo = () => {
    const fraction = Number(seekInput.value) / SEEK_STEPS;
    const { duration } = video;
    wrapper.style.setProperty('--dm-played', fraction);
    if (isDuration(duration)) {
      bubble.textContent = formatTime(fraction * duration);
      video.currentTime = fraction * duration;
    }
  };

  seekInput.addEventListener('pointerdown', () => {
    scrubbing = true;
    wrapper.classList.add('is-scrubbing');
  });
  const endScrub = () => {
    scrubbing = false;
    wrapper.classList.remove('is-scrubbing');
  };
  seekInput.addEventListener('pointerup', endScrub);
  seekInput.addEventListener('pointercancel', endScrub);
  seekInput.addEventListener('input', seekTo);

  mute.addEventListener('click', () => {
    // unmuting from a zero volume restores an audible level
    if (video.muted || video.volume === 0) {
      video.muted = false;
      if (video.volume === 0) video.volume = 1;
    } else {
      video.muted = true;
    }
  });

  volumeInput.addEventListener('input', () => {
    const level = Number(volumeInput.value) / 100;
    video.volume = level;
    video.muted = level === 0;
  });

  fullscreen.addEventListener('click', () => {
    if (fullscreenElement()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen().catch(() => {});
    } else if (wrapper.webkitRequestFullscreen) {
      wrapper.webkitRequestFullscreen();
    } else {
      // iPhone Safari only offers native full screen on the <video> itself
      video.webkitEnterFullscreen();
    }
  });

  /* ---- media events ---- */

  ['play', 'pause', 'ended'].forEach((type) => video.addEventListener(type, () => {
    updateToggle();
    // starting playback (re)arms the auto-hide; pausing leaves the bar as it is
    if (type === 'play') show();
  }));
  ['timeupdate', 'durationchange', 'loadedmetadata', 'seeked'].forEach((type) => {
    video.addEventListener(type, updateTime);
  });
  ['progress', 'durationchange'].forEach((type) => video.addEventListener(type, updateLoaded));
  video.addEventListener('volumechange', updateVolume);
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((type) => {
    wrapper.addEventListener(type, updateFullscreen);
  });

  updateToggle();
  updateTime();
  updateVolume();
  updateFullscreen();
}
