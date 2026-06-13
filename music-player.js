(function(){
  const KEY_ON='vqth6_music_on', KEY_VOL='vqth6_music_vol';
  const ON_ICON='images/btn-music.png';
  const OFF_ICON='images/btn-music-off.png';

  function ready(fn){
    document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',fn) : fn();
  }

  ready(()=>{
    let audio=document.getElementById('bgMusic');
    if(!audio){
      audio=document.createElement('audio');
      audio.id='bgMusic';
      audio.loop=true;
      audio.innerHTML='<source src="audio/background.mp3" type="audio/mpeg">';
      document.body.appendChild(audio);
    }
    audio.volume=Number(localStorage.getItem(KEY_VOL)||0.25);

    let btn=document.getElementById('musicToggle');
    if(!btn){
      btn=document.createElement('button');
      btn.id='musicToggle';
      btn.type='button';
      btn.className='music-toggle';
      btn.title='Bật/tắt nhạc';
      document.body.appendChild(btn);
    }

    let icon=btn.querySelector('img');
    if(!icon){
      icon=document.createElement('img');
      icon.alt='Âm thanh';
      btn.appendChild(icon);
    }

    function draw(){
      const on=localStorage.getItem(KEY_ON)==='1';
      icon.src=on ? ON_ICON : OFF_ICON;
      btn.classList.toggle('sound-on', on);
      btn.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    }

    async function tryPlay(){
      try{
        await audio.play();
        localStorage.setItem(KEY_ON,'1');
      }catch(e){}
      draw();
    }

    function stop(){
      audio.pause();
      localStorage.setItem(KEY_ON,'0');
      draw();
    }

    btn.addEventListener('click',()=> audio.paused ? tryPlay() : stop());

    draw();
    if(localStorage.getItem(KEY_ON)==='1') tryPlay();

    ['click','touchstart','keydown'].forEach(ev=>{
      document.addEventListener(ev,()=>{
        if(localStorage.getItem(KEY_ON)==='1' && audio.paused) tryPlay();
      },{once:true});
    });
  });
})();
