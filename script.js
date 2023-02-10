
function muyuiconTap() {
  const muyuicon = document.getElementById('muyuicon')
  const ripple = document.getElementById('ripple')
  const audio = document.getElementById('audio')
  muyuicon.src ="./muyu2.png"
  ripple.style=""
  audio.play()

  setTimeout(() => {
    muyuicon.src ="./muyu1.png"
  }, 200);
  setTimeout(() => {
    ripple.style ="-webkit-animation: ripple 0.4s linear;animation:ripple 0.4s linear;"
  }, 200);
}