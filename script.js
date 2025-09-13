let highestZ = 1;

class Paper {
  holdingPaper = false;
  mouseTouchX = 0;
  mouseTouchY = 0;
  mouseX = 0;
  mouseY = 0;
  prevMouseX = 0;
  prevMouseY = 0;
  velX = 0;
  velY = 0;
  rotation = Math.random() * 30 - 15;
  currentPaperX = 0;
  currentPaperY = 0;
  rotating = false;

  init(paper) {
    document.addEventListener('mousemove', (e) => {
      if (!this.rotating) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.velX = this.mouseX - this.prevMouseX;
        this.velY = this.mouseY - this.prevMouseY;
      }

      const dirX = e.clientX - this.mouseTouchX;
      const dirY = e.clientY - this.mouseTouchY;
      const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
      const dirNormalizedX = dirLength ? dirX / dirLength : 0;
      const dirNormalizedY = dirLength ? dirY / dirLength : 0;

      const angle = Math.atan2(dirNormalizedY, dirNormalizedX);
      let degrees = (360 + Math.round((180 * angle) / Math.PI)) % 360;

      if (this.rotating) {
        this.rotation = degrees;
      }

      if (this.holdingPaper) {
        if (!this.rotating) {
          this.currentPaperX += this.velX;
          this.currentPaperY += this.velY;
        }
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;

        paper.style.transform = `translate(${this.currentPaperX}px, ${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
      }
    });

    paper.addEventListener('mousedown', (e) => {
      if (this.holdingPaper) return;
      this.holdingPaper = true;

      paper.style.zIndex = highestZ++;
      if (e.button === 0) {
        this.mouseTouchX = this.mouseX;
        this.mouseTouchY = this.mouseY;
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;
      }
      if (e.button === 2) {
        this.rotating = true;
      }
    });

    window.addEventListener('mouseup', () => {
      this.holdingPaper = false;
      this.rotating = false;
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const papers = Array.from(document.querySelectorAll('.paper'));
  papers.forEach((paper) => {
    const p = new Paper();
    p.init(paper);
  });

  // --- Start overlay / music ---
  const startButton = document.getElementById('startButton');
  const overlay = document.getElementById('overlay');
  const backgroundMusic = document.getElementById('backgroundMusic');
  const body = document.body;

  if (startButton) {
    startButton.addEventListener('click', function () {
      backgroundMusic.play();
      body.classList.remove('blur');
      overlay.style.display = 'none';
    });
  }

  // --- Elements (grab after DOM is ready) ---
  const surpriseButton = document.getElementById('surpriseButton');
  const modal = document.getElementById('nicknameModal');
  const submitButton = document.getElementById('submitNickname');
  const nicknameInput = document.getElementById('nicknameInput');
  const nicknameResult = document.getElementById('nicknameResult');
  const video = document.getElementById('surpriseVideo');
  const videoContainer = document.getElementById('videoContainer');
  const closeVideoBtn = document.getElementById('closeVideo');
  const heartsContainer = document.getElementById('heartsContainer');

  let heartInterval = null;

  // --- open modal when user clicks Surprise ---
  if (surpriseButton && modal) {
    surpriseButton.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  // --- create a falling heart (top -> bottom) ---
  function createHeart() {
    if (!heartsContainer) return; // safety

    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = '❤️';

    // position: start slightly above viewport, random X
    heart.style.position = 'absolute';
    heart.style.top = '-8vh';
    heart.style.left = Math.random() * 100 + 'vw';

    // random size + random duration
    heart.style.fontSize = (18 + Math.random() * 30) + 'px';
    const duration = 3 + Math.random() * 3; // 3s - 6s
    heart.style.animation = `fallHeart ${duration}s linear forwards`;

    heartsContainer.appendChild(heart);

    // remove when animation ends (fallback: timeout)
    heart.addEventListener('animationend', () => heart.remove());
    setTimeout(() => {
      if (heart.parentNode) heart.remove();
    }, duration * 1000 + 200);
  }

  // --- submit nickname handler ---
  if (submitButton) {
    submitButton.addEventListener('click', () => {
      const nickname = (nicknameInput && nicknameInput.value || '').toLowerCase().trim();

      if (nickname === 'buddhu') {
        if (nicknameResult) {
          nicknameResult.style.color = 'green';
          nicknameResult.textContent = "That's correct! ❤️";
        }

        if (modal) modal.style.display = 'none';

        if (videoContainer) {
          // show the container: prefer class toggle if you use .video-container.active in CSS,
          // but set display as fallback so it works in either setup
          videoContainer.classList.add('active');
          videoContainer.style.display = 'flex';
        }

        // try to play video (may be blocked if not muted)
        if (video) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // autoplay was blocked — user will need to click play or we can set muted
              // (no error needed; we just swallow the rejection)
            });
          }
        }

        // start producing hearts
        if (!heartInterval) heartInterval = setInterval(createHeart, 350);

        // stop hearts when video ends or when close button clicked
        if (video) video.addEventListener('ended', stopHeartsOnce, { once: true });
        if (closeVideoBtn) closeVideoBtn.addEventListener('click', stopHeartsOnce, { once: true });

      } else {
        if (nicknameResult) {
          nicknameResult.style.color = 'red';
          nicknameResult.textContent = 'Nope!';
        }
      }
    });
  }

  function stopHeartsOnce() {
    if (heartInterval) {
      clearInterval(heartInterval);
      heartInterval = null;
    }
  }

  // --- close everything and cleanup ---
  function closeAll() {
    if (modal) modal.style.display = 'none';
    if (videoContainer) {
      videoContainer.classList.remove('active');
      videoContainer.style.display = 'none';
    }
    if (video) {
      try {
        video.pause();
        video.currentTime = 0;
      } catch (e) { /* ignore if video unavailable */ }
    }
    if (nicknameResult) nicknameResult.textContent = '';
    if (nicknameInput) nicknameInput.value = '';
    if (heartsContainer) heartsContainer.innerHTML = '';
    stopHeartsOnce();
  }

  // click outside to close
  window.addEventListener('click', (event) => {
    if (event.target === modal || event.target === videoContainer) {
      closeAll();
    }
  });

  if (closeVideoBtn) {
    closeVideoBtn.addEventListener('click', closeAll);
  }
});
