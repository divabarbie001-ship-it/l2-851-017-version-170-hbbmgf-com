import { H as Hls } from './video-player-dru42stk.js';

function setStatus(player, message) {
  var status = player.querySelector('.player-status');
  if (status) {
    status.textContent = message;
  }
}

function setupPlayer(player) {
  var video = player.querySelector('video');
  var overlay = player.querySelector('.player-overlay');
  var playButton = player.querySelector('.player-play');
  var muteButton = player.querySelector('.player-mute');
  var fullscreenButton = player.querySelector('.player-fullscreen');
  var source = player.getAttribute('data-video-src');
  var hls = null;
  var initialized = false;

  if (!video || !source) {
    setStatus(player, '缺少播放源');
    return;
  }

  function initSource() {
    if (initialized) {
      return;
    }

    initialized = true;
    setStatus(player, '正在初始化 HLS...');

    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        setStatus(player, '播放源已加载');
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setStatus(player, '播放加载失败，请稍后重试');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', function () {
        setStatus(player, '播放源已加载');
      }, { once: true });
    } else {
      setStatus(player, '当前浏览器不支持 HLS 播放');
    }
  }

  function playOrPause() {
    initSource();

    if (video.paused) {
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          setStatus(player, '点击播放按钮后开始播放');
        });
      }
    } else {
      video.pause();
    }
  }

  if (overlay) {
    overlay.addEventListener('click', playOrPause);
  }

  if (playButton) {
    playButton.addEventListener('click', playOrPause);
  }

  if (muteButton) {
    muteButton.addEventListener('click', function () {
      video.muted = !video.muted;
      muteButton.textContent = video.muted ? '取消静音' : '静音';
    });
  }

  if (fullscreenButton) {
    fullscreenButton.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (player.requestFullscreen) {
        player.requestFullscreen();
      }
    });
  }

  video.addEventListener('play', function () {
    player.classList.add('is-playing');
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
    setStatus(player, '正在播放');
  });

  video.addEventListener('pause', function () {
    player.classList.remove('is-playing');
    setStatus(player, '已暂停');
  });

  video.addEventListener('ended', function () {
    player.classList.remove('is-playing');
    if (overlay) {
      overlay.classList.remove('is-hidden');
    }
    setStatus(player, '播放结束');
  });

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}

document.querySelectorAll('.video-player').forEach(setupPlayer);
