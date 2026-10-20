/* Quiet background playlist, with browser-safe autoplay and visitor controls. */
(function () {
  'use strict';
  const songs = [
    { title: 'Song One', src: '/assets/music/song-1.mp3' },
    { title: 'Song Two', src: '/assets/music/song-2.mp3' }
  ];
  const key = 'bj-background-music-v1';
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(key) || '{}') || {}; } catch (_) {}
  let index = saved.index === 1 ? 1 : 0;
  let resumeTime = Number.isFinite(saved.time) && saved.time > 0 ? saved.time : 0;
  let userPaused = saved.userPaused === true;
  const audio = new Audio();
  audio.id = 'bj-background-audio';
  audio.hidden = true;
  audio.preload = 'none';
  audio.volume = Number.isFinite(saved.volume) ? Math.max(0, Math.min(.3, saved.volume)) : .05;
  const player = document.createElement('section');
  player.className = 'bj-music';
  player.setAttribute('aria-label', 'Optional background music');
  player.innerHTML = '<div class="bj-music-title"><span>Background music</span><small id="bj-music-track"></small></div>' +
    '<button type="button" id="bj-music-play">Play music</button>' +
    '<button type="button" id="bj-music-next" aria-label="Play the next song">Next song</button>' +
    '<label class="bj-music-volume">Volume <input id="bj-music-volume" type="range" min="0" max="30" step="1" aria-label="Music volume, up to 30 percent"></label>' +
    '<span class="bj-music-status" id="bj-music-status" role="status"></span>';
  player.appendChild(audio);
  document.body.appendChild(player);
  document.body.classList.add('has-bj-music');
  const playButton = document.getElementById('bj-music-play');
  const nextButton = document.getElementById('bj-music-next');
  const volume = document.getElementById('bj-music-volume');
  const track = document.getElementById('bj-music-track');
  const status = document.getElementById('bj-music-status');
  volume.value = Math.round(audio.volume * 100);
  function persist() {
    try { sessionStorage.setItem(key, JSON.stringify({index, time: audio.currentTime || 0, volume: audio.volume, userPaused})); } catch (_) {}
  }
  function showState() {
    playButton.textContent = audio.paused ? 'Play music' : 'Pause music';
    playButton.setAttribute('aria-label', (audio.paused ? 'Play ' : 'Pause ') + songs[index].title);
  }
  function loadSong() {
    track.textContent = songs[index].title + ' of two';
    audio.src = songs[index].src;
    showState();
  }
  async function play() {
    userPaused = false;
    status.textContent = '';
    try { await audio.play(); } catch (error) {
      status.textContent = error.name === 'NotAllowedError' ? 'Press Play to start the music.' : 'Music is unavailable right now. Please try again later.';
      showState();
    }
  }
  audio.addEventListener('loadedmetadata', function () {
    if (resumeTime && Number.isFinite(audio.duration)) audio.currentTime = Math.min(resumeTime, Math.max(0, audio.duration - .2));
    resumeTime = 0;
  });
  audio.addEventListener('play', function () { showState(); persist(); });
  audio.addEventListener('pause', function () { showState(); persist(); });
  audio.addEventListener('error', function () {
    status.textContent = 'Music is unavailable right now. Please try again later.';
    showState();
  });
  function next() {
    index = (index + 1) % songs.length;
    resumeTime = 0;
    loadSong();
    play();
  }
  audio.addEventListener('ended', next);
  playButton.addEventListener('click', function () { if (audio.paused) play(); else { userPaused = true; audio.pause(); } });
  nextButton.addEventListener('click', next);
  volume.addEventListener('input', function () { audio.volume = Number(volume.value) / 100; persist(); });
  let lastSaved = 0;
  audio.addEventListener('timeupdate', function () { if (Date.now() - lastSaved > 1000) { persist(); lastSaved = Date.now(); } });
  window.addEventListener('pagehide', persist);
  loadSong();
  if (!userPaused) play();
})();
