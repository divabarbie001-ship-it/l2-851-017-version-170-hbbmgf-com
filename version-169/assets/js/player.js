import { H as Hls } from './hls-vendor.js';

function setupPlayer(shell) {
  var video = shell.querySelector('video');
  var button = shell.querySelector('.player-start');
  var status = shell.querySelector('.player-status');
  var started = false;
  var hls = null;

  if (!video) {
    return;
  }

  var source = video.getAttribute('data-src');

  function setStatus(message) {
    if (status) {
      status.textContent = message || '';
    }
  }

  function hideButton() {
    if (button) {
      button.classList.add('hidden');
    }
  }

  function playVideo() {
    var promise = video.play();

    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        setStatus('点击视频继续播放');
      });
    }
  }

  function bindSource() {
    if (!source) {
      setStatus('播放线路暂不可用');
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', playVideo, { once: true });
      return;
    }

    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        playVideo();
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setStatus('播放线路加载失败');
            hls.destroy();
          }
        }
      });

      return;
    }

    video.src = source;
    video.addEventListener('loadedmetadata', playVideo, { once: true });
  }

  function start() {
    if (started) {
      playVideo();
      return;
    }

    started = true;
    hideButton();
    setStatus('正在加载播放线路...');
    bindSource();
  }

  if (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      start();
    });
  }

  shell.addEventListener('click', function (event) {
    if (event.target === video) {
      return;
    }

    if (!started) {
      start();
    }
  });

  video.addEventListener('playing', function () {
    hideButton();
    setStatus('');
  });

  video.addEventListener('pause', function () {
    if (started && video.currentTime > 0 && !video.ended) {
      setStatus('已暂停');
    }
  });

  video.addEventListener('ended', function () {
    setStatus('播放结束');
  });

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}

Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(setupPlayer);
