document.addEventListener('DOMContentLoaded', async () => {
  function esc(s){
    return String(s||'')
      .replaceAll('&','&amp;')
      .replaceAll('"','&quot;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }

  const stationBox = document.getElementById('stationBox');
  const titleEl = document.getElementById('stationTitle');
  const metaEl = document.getElementById('stationMeta');
  const logoutBtn = document.getElementById('logout');

  function showFatal(err){
    console.error(err);
    const msg = esc(err && err.message ? err.message : err || 'Không rõ lỗi');
    if(stationBox){
      stationBox.innerHTML = `<section class="panel warn">
        <h2>⚠️ Trang trạm đang lỗi</h2>
        <p>${msg}</p>
        <p class="muted">Cô chụp màn hình lỗi này gửi lại để kiểm tra tiếp.</p>
      </section>`;
    }
  }

  try{
    const u = VQTH6.getUser();
    if(!u){
      location.href='login.html?redirect='+encodeURIComponent(location.pathname.split('/').pop()+location.search);
      return;
    }

    if(logoutBtn){
      logoutBtn.onclick=()=>{VQTH6.logout();location.href='index.html'};
    }

    const urlId = new URLSearchParams(location.search).get('id');
    const stations = await VQTH6.getStations();
    if(!stations || !stations.length) throw new Error('Chưa tải được danh sách trạm.');

    const st = stations.find(x=>String(x.id)===String(urlId))
      || stations.find(x=>String(x.ma_tram)===String(urlId))
      || stations[0];

    const stationId = st.id || st.ma_tram || urlId || '';
    const passScore = Number(st.passScore || st.diem_dat || 70);
    const minWatchSeconds = Math.max(10, Number(
      st.minWatchSeconds ||
      st.thoi_gian_xem_toi_thieu ||
      st.thoiGianXemToiThieu ||
      60
    ));

    let videoTimer = null;
    let lastTick = 0;
    let lastSyncedVideoProgress = 0;

    if(titleEl) titleEl.textContent=`${st.icon||st.bieu_tuong||'🏆'} ${st.title||st.ten_tram||'Trạm học'}`;
    if(metaEl) metaEl.textContent=`${st.semester||st.hoc_ky||''} • ${st.unit||st.chu_de||''} • Đạt ${passScore}% để qua trạm`;

    function pr(){ return VQTH6.userProgress(u.maHS); }
    function done(m){ return !!pr().missions?.[stationId+'_'+m]; }
    function testInfo(){ return pr().tests?.[stationId] || {attempt:0,best:0,last:0}; }
    function isImage(s){ return /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(String(s||'')); }

    function youtubeId(url){
      url=String(url||'').trim();
      if(!url || url==='#') return '';
      let m=url.match(/[?&]v=([^&]+)/); if(m) return m[1];
      m=url.match(/youtu\.be\/([^?&]+)/); if(m) return m[1];
      m=url.match(/youtube\.com\/shorts\/([^?&]+)/); if(m) return m[1];
      m=url.match(/youtube\.com\/embed\/([^?&]+)/); if(m) return m[1];
      return '';
    }

    function videoSecondsKey(){ return 'vqth6_video_seconds_'+stationId+'_'+u.maHS; }
    function videoProgressKey(){ return 'vqth6_video_progress_'+stationId+'_'+u.maHS; }

    function getWatchedSeconds(){
      return Math.max(0, Number(localStorage.getItem(videoSecondsKey()) || 0));
    }

    function setWatchedSeconds(sec){
      sec = Math.max(0, Math.min(minWatchSeconds, Math.floor(Number(sec)||0)));
      localStorage.setItem(videoSecondsKey(), String(sec));
      const percent = Math.min(100, Math.floor(sec / minWatchSeconds * 100));
      localStorage.setItem(videoProgressKey(), String(percent));

      const p = pr();
      p.flags = p.flags || {};
      p.flags[stationId+'_videoProgress'] = percent;
      p.flags[stationId+'_videoSeconds'] = sec;
      if(VQTH6.saveUserProgress) VQTH6.saveUserProgress(p);

      updateVideoProgressUi(sec);

      if(VQTH6.API_URL && (percent >= 100 || percent - lastSyncedVideoProgress >= 10)){
        lastSyncedVideoProgress = percent;
        VQTH6.api('updateVideoProgress', {
          maHS:u.maHS,
          stationId:stationId,
          percent:percent,
          silent:true
        }, {silent:true}).then(res=>{
          if(res.progress && VQTH6.saveUserProgress) VQTH6.saveUserProgress(res.progress);
        }).catch(()=>{});
      }
    }

    function getVideoProgress(){
      const local = Number(localStorage.getItem(videoProgressKey()) || 0);
      const p = pr();
      const saved = Number(p.flags?.[stationId+'_videoProgress'] || 0);
      return Math.max(local, saved, 0);
    }

    function fmtTime(sec){
      sec = Math.max(0, Math.floor(Number(sec)||0));
      const m = Math.floor(sec/60);
      const s = sec%60;
      return m>0 ? `${m}:${String(s).padStart(2,'0')}` : `${s}s`;
    }

    function updateVideoProgressUi(sec){
      sec = Math.max(getWatchedSeconds(), Number(sec)||0);
      const percent = Math.min(100, Math.floor(sec / minWatchSeconds * 100));
      const bar=document.getElementById('ytProgressBar');
      const text=document.getElementById('ytProgressText');
      const hint=document.getElementById('videoWatchHint');
      const time=document.getElementById('videoTimeText');
      const btn=document.querySelector('[data-m="video"]');

      if(bar) bar.style.width=percent+'%';
      if(text) text.textContent=percent+'%';
      if(time) time.textContent=`${fmtTime(sec)} / ${fmtTime(minWatchSeconds)}`;

      if(hint){
        if(percent>=100){
          hint.className='ok';
          hint.textContent='✅ Đã xem đủ thời gian. Em có thể nhận XP.';
        }else{
          hint.className='warn';
          hint.textContent='⏳ Hãy giữ video đang mở đến khi đủ thời gian xem tối thiểu.';
        }
      }

      if(btn && !done('video')){

  if(percent >= 100){
      btn.disabled = false;
      btn.classList.remove('disabled');
      btn.textContent = '🎁 Nhận 10 XP';
  }else{
      btn.disabled = true;
      btn.textContent = '🔒 Chưa đủ thời gian xem';
  }

}
    }

    function startVideoTimer(){
      if(done('video')) return;
      clearInterval(videoTimer);
      lastTick = Date.now();
      updateVideoProgressUi(getWatchedSeconds());

      videoTimer = setInterval(()=>{
        const box = document.getElementById('videoContent');
        if(!box || box.classList.contains('hidden')){
          clearInterval(videoTimer);
          return;
        }
        const now = Date.now();
        const delta = Math.max(0, Math.floor((now-lastTick)/1000));
        lastTick = now;
        if(delta>0){
          setWatchedSeconds(getWatchedSeconds()+delta);
        }
      }, 1000);
    }

    function stopVideoTimer(){
      clearInterval(videoTimer);
      const percent = getVideoProgress();
      if(VQTH6.API_URL && percent>0){
        VQTH6.api('updateVideoProgress', {
          maHS:u.maHS,
          stationId:stationId,
          percent:percent,
          silent:true
        }, {silent:true}).catch(()=>{});
      }
    }

    function playSound(file, vol=.75){
      try{ const a=new Audio(file); a.volume=vol; a.play().catch(()=>{}); }catch(e){}
    }

    function showXpGain(xp){
      playSound('audio/xp.mp3', .8);
      const el=document.createElement('div');
      el.className='xp-fly';
      el.textContent='+'+xp+' XP';
      document.body.appendChild(el);
      setTimeout(()=>el.classList.add('show'),20);
      setTimeout(()=>el.remove(),1250);
    }

    async function mark(m, extra={}){
      if(m==='video' && getVideoProgress()<100){
        alert('Em cần xem đủ thời gian tối thiểu mới nhận được XP.');
        updateVideoProgressUi(getWatchedSeconds());
        return;
      }

      const before=Number(pr().xp||0);
      await VQTH6.markMission(stationId, m, {
        ...extra,
        videoProgress:getVideoProgress(),
        watchedSeconds:getWatchedSeconds(),
        minWatchSeconds:minWatchSeconds
      });
      const after=Number(pr().xp||0);
      showXpGain(Math.max(0,after-before) || (m==='video'?10:m==='summary'?10:20));
      setTimeout(renderStation,700);
    }

    function stationDoneCount(){
      const p=pr(), tests=p.tests||{};
      return stations.filter(s=>Number(tests[(s.id||s.ma_tram)]?.best||0)>=Number(s.passScore||s.diem_dat||70)).length;
    }

    function xpPercent(xp){ return Math.min(100,Math.round((Number(xp||0)%500)/500*100)); }

    function studentHud(){
      const p=pr(), t=testInfo();
      const xp=Number(p.xp||0);
      const passed=stationDoneCount();
      const total=stations.length||17;
      const progressPct=Math.round(passed/total*100);
      return `<section class="student-hud panel game-profile-card">
        <div class="profile-top">
          <div class="profile-medal">🎖️</div>
          <div class="profile-title">
            <div class="profile-class">🏫 Lớp ${esc(u.lop||'')}</div>
            <div class="profile-name">👩‍🎓 ${esc(u.hoTen||'Học sinh')}</div>
          </div>
        </div>

        <div class="profile-stats">
          <div class="profile-stat badge-stat">
            <span>🏅 Huy hiệu</span>
            <b>${esc(p.badge||'Tân binh')}</b>
          </div>

          <div class="profile-stat xp-stat">
            <div class="stat-line"><span>⭐ XP</span><b>${xp}</b></div>
            <div class="xp-bar"><span style="width:${xpPercent(xp)}%"></span></div>
          </div>

          <div class="profile-stat progress-stat">
            <div class="stat-line"><span>📈 Tiến độ</span><b>${progressPct}%</b></div>
            <div class="learn-bar"><span style="width:${progressPct}%"></span></div>
            <small>${passed} / ${total} trạm</small>
          </div>

          <div class="profile-stat score-stat">
            <span>🏆 Điểm kiểm tra</span>
            <b>${t.best||0}%</b>
          </div>
        </div>
      </section>`;
    }

    function videoHtml(){
      const videoUrl=st.videoUrl||st.video_url||'';
      const id=youtubeId(videoUrl);
      const watched=getWatchedSeconds();
      const percent=Math.min(100, Math.floor(watched/minWatchSeconds*100));

      let frame = '';
      if(id){
        frame = `<iframe
          src="https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1"
          title="Video bài học"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          loading="lazy"></iframe>`;
      }else if(/\.(mp4|webm|ogg)(\?|#|$)/i.test(videoUrl)){
        frame = `<video controls src="${esc(videoUrl)}"></video>`;
      }else if(videoUrl && videoUrl !== '#'){
        frame = `<a class="vqth6-auto-link" href="${esc(videoUrl)}" target="_blank">🎥 Mở video</a>`;
      }else{
        frame = `<span class="muted">Cô sẽ cập nhật video.</span>`;
      }

      return `<div class="video-progress-card">
        <div class="video-progress-head">
          <b>🎬 Tiến độ xem video</b>
          <strong id="ytProgressText">${percent}%</strong>
        </div>
        <div class="yt-progress"><span id="ytProgressBar" style="width:${percent}%"></span></div>
        <p id="videoWatchHint" class="${percent>=100?'ok':'warn'}">${percent>=100?'✅ Đã xem đủ thời gian. Em có thể nhận XP.':'⏳ Hãy giữ video đang mở đến khi đủ thời gian xem tối thiểu.'}</p>
        <p class="muted">⏱️ Thời gian xem: <b id="videoTimeText">${fmtTime(watched)} / ${fmtTime(minWatchSeconds)}</b></p>
      </div>
      <div class="video-frame">${frame}</div>`;
    }

    function summaryHtml(){
      const src=st.summaryImage||st.summary||st.imageUrl||st.image_url||'';
      if(isImage(src)) return `<div class="summary-thumb" id="summaryThumb"><img src="${esc(src)}" alt="Tóm tắt bài học"><div class="summary-hint">🔍 Click vào ảnh để phóng to</div></div>`;
      return `<p>${esc(st.summary||st.tom_tat||'Cô sẽ cập nhật tóm tắt.')}</p>`;
    }

    function showImageModal(src){
      const old=document.getElementById('imageModal'); if(old) old.remove();
      const div=document.createElement('div'); div.id='imageModal'; div.className='image-modal';
      div.innerHTML=`<button class="image-close">Đóng ✕</button><img src="${esc(src)}" alt="Tóm tắt bài học phóng to">`;
      div.onclick=e=>{ if(e.target===div||e.target.classList.contains('image-close')) div.remove(); };
      document.body.appendChild(div);
    }

    function renderStation(){
      const t=testInfo();
      const practiceLink=(st.practiceUrl&&st.practiceUrl!=='#')?st.practiceUrl:`luyen-tap.html?id=${encodeURIComponent(stationId)}`;
      const testLink=(st.testUrl&&st.testUrl!=='#')?st.testUrl:`kiem-tra.html?id=${encodeURIComponent(stationId)}`;

      stationBox.innerHTML = `${studentHud()}<section class="panel station-mission-panel">
        <h2>🎯 Nhiệm vụ trạm</h2>
        <p class="muted">Em bấm vào từng nhiệm vụ để mở nội dung.</p>
        <div class="mission-list">
          <div class="mission compact-mission"><div class="ico">🎬</div><div><b>Xem video kiến thức</b><p class="muted">Mở video và giữ video đang mở đến khi đủ thời gian xem tối thiểu.</p><button class="btn" data-open="videoContent">🎬 Xem video</button><div id="videoContent" class="reveal-box hidden">${videoHtml()}<div class="quick-actions"><button class="btn good" data-m="video" ${done('video')||getVideoProgress()<100?'disabled':''}>${done('video')?'✅ Đã xem':(getVideoProgress()>=100?'+10 XP':'🔒 Chưa đủ thời gian xem')}</button></div></div></div></div>
          <div class="mission compact-mission"><div class="ico">📘</div><div><b>Tóm tắt bài học</b><p class="muted">Xem tóm tắt sau khi nhận XP video.</p><button class="btn" data-open="summaryContent" ${!done('video')?'disabled':''}>📘 Xem tóm tắt bài học</button><div id="summaryContent" class="reveal-box hidden">${summaryHtml()}<div class="quick-actions"><button class="btn good" data-m="summary" ${!done('video')||done('summary')?'disabled':''}>${done('summary')?'✅ Đã xem':'+10 XP - Đánh dấu đã đọc'}</button></div></div></div></div>
          <div class="mission compact-mission"><div class="ico">📝</div><div><b>Luyện tập</b><p class="muted">Mở sau khi đã xem tóm tắt.</p><a class="btn good ${!done('summary')?'disabled-link':''}" href="${!done('summary')?'#':practiceLink}">${done('practice')?'✅ Đã luyện tập':'📝 Làm luyện tập'}</a></div></div>
          <div class="mission compact-mission"><div class="ico">🏆</div><div><b>Kiểm tra mở khóa</b><p class="muted">Điểm cao nhất: ${t.best||0}% • Số lần: ${t.attempt||0}</p><a class="btn gold ${!done('practice')?'disabled-link':''}" href="${!done('practice')?'#':testLink}">🏆 Làm kiểm tra mở khóa</a></div></div>
        </div>
      </section>`;

      document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>mark(b.dataset.m));
      document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{
        const box=document.getElementById(b.dataset.open);
        if(!box) return;
        box.classList.toggle('hidden');
        b.textContent=box.classList.contains('hidden') ? (b.dataset.open==='videoContent'?'🎬 Xem video':'📘 Xem tóm tắt bài học') : '🔼 Thu gọn';

        if(b.dataset.open==='videoContent'){
          if(box.classList.contains('hidden')) stopVideoTimer();
          else startVideoTimer();
        }
      });

      const thumb=document.getElementById('summaryThumb');
      if(thumb) thumb.onclick=()=>showImageModal(st.summaryImage||st.summary||st.imageUrl||st.image_url);

      updateVideoProgressUi(getWatchedSeconds());
    }

    renderStation();

    window.addEventListener('beforeunload', stopVideoTimer);

  }catch(err){
    showFatal(err);
  }
});
