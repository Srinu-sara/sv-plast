/**
 * SV PLAST Dynamic Media Loader
 * Fetches and displays up to 5 items each for:
 * 1. Instagram Videos (#insta-videos-grid)
 * 2. YouTube Videos (#youtube-videos-grid)
 * 3. Photo Gallery (#photo-gallery-grid)
 */

document.addEventListener('DOMContentLoaded', function() {
  const instaGrid = document.getElementById('insta-videos-grid');
  const youtubeGrid = document.getElementById('youtube-videos-grid');
  const galleryGrid = document.getElementById('photo-gallery-grid');

  // Lightbox elements
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightboxModal.style.display = 'none';
    });
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.style.display = 'none';
    });
  }

  // Load Media Data from Centralized Cloud Hub
  fetchMediaData();

  async function fetchMediaData() {
    try {
      let data = null;

      if (window.SVCloud) {
        data = await window.SVCloud.getMedia();
        // Subscribe to real-time changes from any device / Chrome profile
        window.SVCloud.subscribe((realtimeData) => {
          if (realtimeData) {
            renderAllMedia(realtimeData);
          }
        });
      }

      if (!data) {
        try {
          const res = await fetch('/api/media');
          const json = await res.json();
          if (json && json.success && json.data) {
            data = json.data;
          }
        } catch (err) {
          console.warn('API fetch fallback:', err);
        }
      }

      if (!data) {
        const resFile = await fetch('data/media.json?t=' + Date.now());
        data = await resFile.json();
      }

      if (data) {
        renderAllMedia(data);

        // Auto-scroll all three media sections smoothly
        initAutoScroll('photo-gallery-grid', 3600);
        initAutoScroll('youtube-videos-grid', 4200);
        initAutoScroll('insta-videos-grid', 4800);
      }
    } catch (e) {
      console.error('Failed to load media sections:', e);
    }
  }

  function renderAllMedia(data) {
    renderGallerySection(data.gallery || []);
    renderYouTubeSection(data.youtube || []);
    renderInstagramSection(data.instagram || []);
  }

  // 1. Render Instagram Section (Max 5 items) - Rich Card with Thumbnail (Just like YouTube!)
  function renderInstagramSection(items) {
    if (!instaGrid) return;
    if (!items || items.length === 0) {
      instaGrid.innerHTML = '<div class="media-empty">No Instagram videos posted yet.</div>';
      return;
    }

    let html = '';
    items.forEach(item => {
      const title = item.title || 'SV PLAST Instagram Reel';
      const url = item.url || '#';
      const thumbUrl = item.imageUrl || 'images/frame_018.webp';

      html += `
        <div class="glass-card media-card insta-card tilt-card-3d">
          <div class="insta-video-wrapper">
            <img src="${thumbUrl}" alt="${title}" class="insta-thumb-img" loading="lazy" onerror="this.src='images/frame_018.webp'">
            <a href="${url}" target="_blank" rel="noopener" class="insta-play-btn" aria-label="Watch Reel on Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </a>
          </div>
          <div class="insta-info">
            <div class="insta-header-row">
              <span class="badge-pill insta-badge-pill"><span class="badge-dot"></span> Instagram Reel</span>
              <span class="insta-date">${item.date || ''}</span>
            </div>
            <h3 class="media-title">${title}</h3>
            <a href="${url}" target="_blank" rel="noopener" class="btn btn-insta">
              <span>▶ Watch Reel on Instagram</span>
            </a>
          </div>
        </div>
      `;
    });
    instaGrid.innerHTML = html;
  }

  // 2. Render YouTube Section (Max 5 items)
  function renderYouTubeSection(items) {
    if (!youtubeGrid) return;
    if (!items || items.length === 0) {
      youtubeGrid.innerHTML = '<div class="media-empty">No YouTube videos posted yet.</div>';
      return;
    }

    let html = '';
    items.forEach(item => {
      const vId = item.videoId || extractYtId(item.url);
      const title = item.title || 'SV PLAST YouTube Showcase';
      const thumbUrl = `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

      html += `
        <div class="glass-card media-card yt-card tilt-card-3d">
          <div class="yt-video-wrapper" id="yt-player-${item.id}">
            <img src="${thumbUrl}" alt="${title}" class="yt-thumb-img" loading="lazy">
            <button class="yt-play-btn" aria-label="Play Video" onclick="loadYtIframe('${item.id}', '${vId}')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
          <div class="yt-info">
            <span class="badge-pill" style="font-size: 0.7rem; margin-bottom: 0.5rem;"><span class="badge-dot"></span> YouTube</span>
            <h3 class="media-title">${title}</h3>
          </div>
        </div>
      `;
    });
    youtubeGrid.innerHTML = html;
  }

  // Helper to dynamically load YouTube iframe on click
  window.loadYtIframe = function(id, videoId) {
    const container = document.getElementById(`yt-player-${id}`);
    if (container) {
      container.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
        </iframe>
      `;
    }
  };

  // 3. Render Photo Gallery Section (Max 5 items)
  function renderGallerySection(items) {
    if (!galleryGrid) return;
    if (!items || items.length === 0) {
      galleryGrid.innerHTML = '<div class="media-empty">No gallery photos posted yet.</div>';
      return;
    }

    let html = '';
    items.forEach(item => {
      // Fix .jpg -> .webp if needed
      let img = item.imageUrl || 'images/work_curved_ceiling.webp';
      if (img.endsWith('.jpg')) {
        img = img.replace('.jpg', '.webp');
      }
      const title = item.title || 'SV PLAST Project';
      const location = item.location || 'Project Site';

      html += `
        <div class="gallery-card glass-card tilt-card-3d" onclick="openLightbox('${img}', '${title} - ${location}')">
          <div class="gallery-img-container">
            <img src="${img}" alt="${title}" class="zoomable-img" loading="lazy" onerror="this.src='images/work_curved_ceiling.webp'">
            <div class="gallery-hover-overlay">
              <span>🔍 Tap to Expand</span>
            </div>
          </div>
          <div class="gallery-info">
            <h3 class="gallery-title">${title}</h3>
            <p class="gallery-location">📍 ${location}</p>
          </div>
        </div>
      `;
    });
    galleryGrid.innerHTML = html;
  }

  // Helper Lightbox trigger
  window.openLightbox = function(imgSrc, captionText) {
    if (lightboxModal && lightboxImg) {
      // Ensure valid image path fallback
      if (imgSrc.endsWith('.jpg')) {
        imgSrc = imgSrc.replace('.jpg', '.webp');
      }
      lightboxImg.onerror = function() {
        this.src = 'images/work_curved_ceiling.webp';
      };
      lightboxImg.src = imgSrc;
      if (lightboxCaption) lightboxCaption.textContent = captionText;
      lightboxModal.style.display = 'flex';
    }
  };

  // Attach horizontal slider control buttons listeners
  document.querySelectorAll('.slide-next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const container = document.getElementById(targetId);
      if (container) {
        const cardWidth = container.firstElementChild?.offsetWidth || 320;
        container.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('.slide-prev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const container = document.getElementById(targetId);
      if (container) {
        const cardWidth = container.firstElementChild?.offsetWidth || 320;
        container.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
      }
    });
  });

  // Auto-scroll controller for media sections with loop and hover pause
  function initAutoScroll(gridId, intervalMs = 3500) {
    const container = document.getElementById(gridId);
    if (!container) return;

    let timer = null;
    let isPaused = false;

    function step() {
      if (isPaused || !container.children.length) return;
      const card = container.firstElementChild;
      const scrollStep = card ? (card.offsetWidth + 24) : 340;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft >= maxScroll - 20) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollStep, behavior: 'smooth' });
      }
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(step, intervalMs);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Hover / Touch interaction pauses auto-scroll to respect user focus
    container.addEventListener('mouseenter', () => {
      isPaused = true;
      stopTimer();
    });
    container.addEventListener('mouseleave', () => {
      isPaused = false;
      startTimer();
    });
    container.addEventListener('touchstart', () => {
      isPaused = true;
      stopTimer();
    }, { passive: true });
    container.addEventListener('touchend', () => {
      isPaused = false;
      startTimer();
    }, { passive: true });

    // Reset timer on manual slider button clicks
    document.querySelectorAll(`button[data-target="${gridId}"]`).forEach(btn => {
      btn.addEventListener('click', () => {
        startTimer();
      });
    });

    startTimer();
  }

  function extractYtId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'dQw4w9WgXcQ';
  }
});
