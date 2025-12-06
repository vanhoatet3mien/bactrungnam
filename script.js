// NOTE: file: script.js
// Tổng quát:
// - điều hướng nội bộ (single page): showPage(id)
// - xử lý video autoplay, skip, unmute, fix lỗi âm thanh khi skip, đảm bảo video có thể play lại khi quay lại.
// - xử lý menu toggle: menu chỉ mở khi user click, không "mở sẵn" lần sau.

// ----- Helpers -----
const $ = sel => document.querySelector(sel)
const $$ = sel => Array.from(document.querySelectorAll(sel))

// ----- Page navigation -----
function showPage(id){
  // hide all
  $$('.page').forEach(p => p.classList.remove('active'))
  const page = $('#'+id)
  if(page) page.classList.add('active')

  // when leaving video page, ensure video is paused and muted to stop any sound
  if(id !== 'video-page'){
    stopAndResetVideo()
  }

  // if arriving to video page, play it (muted to allow autoplay in most browsers),
  // but if user previously unmuted in this session, respect the choice.
  if(id === 'video-page'){
    playIntroVideo()
  }
}

// ----- Header/menu -----
const menuToggle = $('#menu-toggle')
const sideMenu = $('#side-menu')

menuToggle.addEventListener('click', () => {
  const open = sideMenu.classList.toggle('open')
  menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  sideMenu.setAttribute('aria-hidden', open ? 'false' : 'true')
})

// Close menu when clicking outside (optional)
document.addEventListener('click', (e) => {
  if(!sideMenu.contains(e.target) && !menuToggle.contains(e.target)){
    if(sideMenu.classList.contains('open')){
      sideMenu.classList.remove('open')
      menuToggle.setAttribute('aria-expanded', 'false')
      sideMenu.setAttribute('aria-hidden', 'true')
    }
  }
})

// Nav buttons
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tgt = e.currentTarget.dataset.target
    if(tgt) {
      showPage(tgt)
      // close menu after navigate
      sideMenu.classList.remove('open')
      menuToggle.setAttribute('aria-expanded', 'false')
      sideMenu.setAttribute('aria-hidden', 'true')
    }
  })
})

// ----- Year in footer -----
document.getElementById('year').textContent = new Date().getFullYear()

// ----- Intro continue button -----
$('#intro-continue').addEventListener('click', () => {
  // go to video page
  showPage('video-page')
})

// ----- VIDEO logic -----
const introVideo = $('#intro-video')
const skipBtn = $('#skip-video')
const unmuteBtn = $('#unmute-video')

// We'll track if user explicitly unmuted in this session
let userUnmuted = false

function playIntroVideo(){
  if(!introVideo) return
  // Reset if previous state
  introVideo.pause()
  introVideo.currentTime = 0
  // For autoplay reliability, start muted. If user previously unmuted in session:
  introVideo.muted = !userUnmuted
  // try to play (may be blocked by browser if not muted; we start muted)
  const playPromise = introVideo.play()
  if(playPromise !== undefined){
    playPromise.catch(err => {
      // Autoplay blocked - fallback: show UI to request user interaction (we already have buttons)
      console.warn('Video play was blocked or failed:', err)
    })
  }
  // visually mark skip available
  skipBtn.disabled = false
  // Add pulse effect to map points when video ends? not needed here
}

// Stop and reset video to avoid lingering audio when leaving/skipping
function stopAndResetVideo(){
  if(!introVideo) return
  introVideo.pause()
  try{
    // remove audio immediately
    introVideo.muted = true
    introVideo.currentTime = 0
  }catch(e){
    console.warn('Error resetting video', e)
  }
}

// Skip button: stop audio and go to map
skipBtn.addEventListener('click', () => {
  // ensure video stopped and muted
  stopAndResetVideo()
  // navigate to map page
  showPage('map')
})

// Unmute button toggles muted state (user gesture allowed)
unmuteBtn.addEventListener('click', (e) => {
  if(!introVideo) return
  // toggle mute/unmute
  const willUnmute = introVideo.muted
  introVideo.muted = !willUnmute
  userUnmuted = !introVideo.muted
  unmuteBtn.textContent = introVideo.muted ? 'Bật âm' : 'Tắt âm'
  unmuteBtn.setAttribute('aria-pressed', (!introVideo.muted).toString())
  // If video was paused due to browser autoplay policy, try to resume
  introVideo.play().catch(()=>{})
})

// When video ended, go to map automatically. Also ensure audio stopped.
if(introVideo){
  introVideo.addEventListener('ended', () => {
    // ensure no audio lingers
    introVideo.pause()
    introVideo.currentTime = 0
    introVideo.muted = true
    // navigate to map
    showPage('map')
  })
}

// If user navigates away while video playing, pause and reset (handled in showPage)

// ----- MAP INTERACTION -----
// Simple pan with mouse drag
const mapEl = $('#vn-map')
let isPanning = false
let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0

if(mapEl){
  // To allow "drag to move", we use pointer events to move background-position.
  // We'll implement a simple parallax-like pan by adjusting background-position.
  let bgPos = {x:50, y:50} // percent
  let startBg = {...bgPos}

  mapEl.addEventListener('pointerdown', (e) => {
    isPanning = true
    mapEl.setPointerCapture(e.pointerId)
    startX = e.clientX; startY = e.clientY
    startBg = {...bgPos}
  })
  mapEl.addEventListener('pointermove', (e) => {
    if(!isPanning) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    // adjust by small factor to not move too quickly
    const factor = 0.06
    bgPos.x = Math.min(100, Math.max(0, startBg.x - dx * factor))
    bgPos.y = Math.min(100, Math.max(0, startBg.y - dy * factor))
    mapEl.style.backgroundPosition = `${bgPos.x}% ${bgPos.y}%`
  })
  mapEl.addEventListener('pointerup', (e) => {
    isPanning = false
    mapEl.releasePointerCapture(e.pointerId)
  })
  mapEl.addEventListener('pointercancel', () => { isPanning = false })
}

// Map points: click to region page and animate
$$('.map-point').forEach(pt => {
  pt.classList.add('pulse') // make them glow
  pt.addEventListener('click', (e) => {
    const region = e.currentTarget.dataset.region
    if(region){
      showPage(region)
    }
  })
})

// Back to map buttons on region pages
$$('.back-to-map').forEach(b => {
  b.addEventListener('click', () => showPage('map'))
})

// ----- Accessibility / keyboard shortcuts (optional) -----
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){
    // close menu if open
    if(sideMenu.classList.contains('open')){
      sideMenu.classList.remove('open')
      menuToggle.setAttribute('aria-expanded','false')
      sideMenu.setAttribute('aria-hidden','true')
    }
  }
})

// ----- Initialization: show intro by default -----
document.addEventListener('DOMContentLoaded', () => {
  showPage('intro')
})

// Accordion
document.querySelectorAll(".accordion-button").forEach(btn => {
    btn.addEventListener("click", () => {
        const content = btn.nextElementSibling;

        // Đóng tất cả accordion khác
        document.querySelectorAll(".accordion-content").forEach(c => {
            if (c !== content) c.style.maxHeight = null;
        });

        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});

// Bắt sự kiện click 3 điểm bản đồ
document.querySelectorAll(".map-point").forEach(point => {
    point.addEventListener("click", () => {
        const region = point.dataset.region;
        showPage(region); // gọi trang tương ứng: north / central / south
    });
});
