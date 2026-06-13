window.VQTH6 = (()=>{
  const CFG = window.VQTH6_CONFIG || {}; const API_URL = CFG.API_URL || '';
  const USER_KEY='vqth6_current_user_v51'; const PROG_KEY='vqth6_progress_v51'; const ST_KEY='vqth6_stations_v51'; const Q_KEY='vqth6_questions_v51'; const CLASS_KEY='vqth6_class_session_v51';
  const CACHE_KEY='vqth6_app_cache_v51_fast'; const CACHE_TTL=Number(CFG.CACHE_TTL_MS||300000); const SYNC_KEY='vqth6_pending_sync_v51_fast';
  const PASS=Number(CFG.PASS_SCORE||70);
  const TYPE_LABEL={lesson:'Bài học',review:'Ôn tập',test:'Kiểm tra',boss:'Boss'};
  const XP={video:10,summary:10,practice:20,test:50,station:30};
  const DEFAULT_STATIONS=[
    ['bai-1',1,'HK1','Chủ đề A','Thông tin và dữ liệu','lesson','🧠','blue'],['bai-2',2,'HK1','Chủ đề A','Xử lí thông tin','lesson','⚙️','purple'],['bai-3',3,'HK1','Chủ đề A','Thông tin trong máy tính','lesson','💾','cyan'],['ot-gk1',4,'HK1','Ôn tập','Ôn tập giữa kì 1','review','🎁','orange'],['bai-5',5,'HK1','Chủ đề B','Internet','lesson','🌐','green'],['boss-hk1',6,'HK1','Boss','Boss cuối học kì 1','boss','🐉','red'],['bai-6',7,'HK2','Chủ đề C','Mạng thông tin toàn cầu','lesson','🕸️','blue'],['bai-7',8,'HK2','Chủ đề C','Tìm kiếm thông tin trên Internet','lesson','🔎','purple'],['bai-8',9,'HK2','Chủ đề C','Thư điện tử','lesson','✉️','cyan'],['bai-9',10,'HK2','Chủ đề C','An toàn thông tin trên Internet','lesson','🛡️','green'],['ot-gk2',11,'HK2','Ôn tập','Ôn tập giữa kì 2','review','🎁','orange'],['bai-10',12,'HK2','Chủ đề D','Sơ đồ tư duy','lesson','🗺️','blue'],['bai-11',13,'HK2','Chủ đề D','Định dạng văn bản','lesson','📝','purple'],['bai-12',14,'HK2','Chủ đề D','Trình bày thông tin dạng bảng','lesson','📊','cyan'],['bai-13',15,'HK2','Chủ đề D','Tìm kiếm và thay thế','lesson','🔁','green'],['bai-14',16,'HK2','Chủ đề E','Thuật toán','lesson','🤖','orange'],['boss-final',17,'HK2','Boss','Đại Boss Vương Quốc Tin Học','boss','👑','red']
  ].map(a=>({id:a[0],order:a[1],semester:a[2],unit:a[3],title:a[4],type:a[5],icon:a[6],color:a[7],unlockMode:a[1]===1?'manual':'sequential',passScore:70,visible:true,required:true,videoUrl:'#',imageUrl:'',practiceUrl:'#',testUrl:'#',summary:'Nội dung tóm tắt sẽ được cô cập nhật trong trang Admin.'}));
  const DEFAULT_QUESTIONS=[
    {id:'q1',stationId:'bai-1',round:1,type:'choice',level:'NB',score:10,question:'Thông tin là gì?',options:['A. Những gì đem lại hiểu biết cho con người','B. Chỉ là chữ số','C. Chỉ là hình ảnh','D. Chỉ là âm thanh'],answer:'0',explain:'Thông tin giúp con người có hiểu biết về thế giới xung quanh.'},
    {id:'q2',stationId:'bai-1',round:2,type:'drag',level:'TH',score:10,question:'Phân loại ví dụ sau',items:[{text:'Tiếng trống trường',category:'Âm thanh'},{text:'Biển báo giao thông',category:'Hình ảnh'},{text:'Số 36°C',category:'Dữ liệu số'}],explain:'Mỗi vật mang tin có thể chứa dạng dữ liệu khác nhau.'},
    {id:'q3',stationId:'bai-1',round:3,type:'fill',level:'TH',score:10,question:'Thông tin đem lại điều gì cho con người?',fillAnswers:['hiểu biết','hieu biet'],answer:'hiểu biết',explain:'Thông tin đem lại hiểu biết cho con người.'}
  ];

  function injectContentFixCss(){
    if(document.getElementById('vqth6ContentFixStyle')) return;
    const style=document.createElement('style');
    style.id='vqth6ContentFixStyle';
    style.textContent=`
      .task-card,.mission-card,.station-task,.task-content,.task-text,.mission-row,.lesson-card,.station-card,.card,.table-wrap,main,section{
        max-width:100%;
        box-sizing:border-box;
      }
      .task-card p,.mission-card p,.station-task p,.task-content p,.task-text p,.mission-row p,.lesson-card p,.card p,
      .task-card a,.mission-card a,.station-task a,.task-content a,.task-text a,.mission-row a,.lesson-card a,.card a,
      .task-card div,.mission-card div,.station-task div,.task-content div,.task-text div,.mission-row div,.lesson-card div,.card div{
        max-width:100%;
        overflow-wrap:anywhere;
        word-break:break-word;
        white-space:normal;
      }
      .vqth6-auto-link{
        display:inline-flex;
        align-items:center;
        gap:8px;
        width:max-content;
        max-width:100%;
        margin-top:8px;
        padding:10px 16px;
        border-radius:16px;
        background:linear-gradient(135deg,#38bdf8,#6366f1);
        color:#fff!important;
        font-weight:900;
        text-decoration:none!important;
        box-shadow:0 0 16px rgba(56,189,248,.45), inset 0 1px 0 rgba(255,255,255,.35);
        vertical-align:middle;
      }
      .vqth6-auto-link:hover{transform:translateY(-2px);filter:brightness(1.15)}
    `;
    document.head.appendChild(style);
  }
  function linkLabel(url){
    const u=String(url||'').toLowerCase();
    if(/\.(mp4|webm|mov)(\?|#|$)|youtube\.com|youtu\.be|drive\.google\.com/.test(u)) return '🎥 Mở video';
    if(/\.(png|jpe?g|gif|webp|svg)(\?|#|$)|scontent\.|fbcdn\.|fbsbx\./.test(u)) return '🖼️ Xem hình ảnh';
    if(/\.(pdf)(\?|#|$)/.test(u)) return '📄 Mở tài liệu PDF';
    return '📖 Mở nội dung bài học';
  }
  function shortenLongUrls(){
    injectContentFixCss();
    const areas=document.querySelectorAll('.task-card,.mission-card,.station-task,.task-content,.task-text,.mission-row,.lesson-card,.card');
    const urlRe=/https?:\/\/[^\s<>"']{18,}/g;
    areas.forEach(area=>{
      if(area.dataset.vqth6UrlFixed==='1') return;
      area.dataset.vqth6UrlFixed='1';
      const walker=document.createTreeWalker(area,NodeFilter.SHOW_TEXT,{acceptNode(node){
        if(!urlRe.test(node.nodeValue||'')) return NodeFilter.FILTER_REJECT;
        if(node.parentElement && ['A','SCRIPT','STYLE','TEXTAREA','INPUT'].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }});
      const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node=>{
        const txt=node.nodeValue; const frag=document.createDocumentFragment(); let last=0;
        txt.replace(urlRe,(url,idx)=>{
          frag.appendChild(document.createTextNode(txt.slice(last,idx)));
          const a=document.createElement('a');
          a.href=url; a.target='_blank'; a.rel='noopener'; a.className='vqth6-auto-link'; a.textContent=linkLabel(url);
          frag.appendChild(a); last=idx+url.length;
        });
        frag.appendChild(document.createTextNode(txt.slice(last)));
        node.parentNode.replaceChild(frag,node);
      });
    });
  }
  if(typeof document!=='undefined'){
    const run=()=>{injectContentFixCss(); shortenLongUrls(); setTimeout(shortenLongUrls,700); setTimeout(shortenLongUrls,1800);};
    document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',run) : run();
  }

  function localGet(k,def){try{return JSON.parse(localStorage.getItem(k))||def}catch(e){return def}}
  function localSet(k,v){localStorage.setItem(k,JSON.stringify(v));return v}
  function getUser(){return localGet(USER_KEY,null)} function setUser(u){localSet(USER_KEY,u)} function logout(){localStorage.removeItem(USER_KEY)}
  function progressAll(){return localGet(PROG_KEY,{})} function saveProgressAll(p){localSet(PROG_KEY,p)}
  function userProgress(maHS){const p=progressAll(); return p[maHS]||{maHS,xp:0,badge:'Tân binh',missions:{},tests:{},flags:{}}}
  function saveUserProgress(pr){const p=progressAll(); p[pr.maHS]=pr; saveProgressAll(p);} function applyRemoteProgress(maHS,progress){if(progress){progress.maHS=progress.maHS||maHS; saveUserProgress(progress);}}
  function stationsLocal(){const s=localGet(ST_KEY,null); if(!s){localSet(ST_KEY,DEFAULT_STATIONS);return DEFAULT_STATIONS} return s}
  function questionsLocal(){const q=localGet(Q_KEY,null); if(!q){localSet(Q_KEY,DEFAULT_QUESTIONS);return DEFAULT_QUESTIONS} return q}
  
  function now(){return Date.now()}
  function getCache(){try{const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null'); if(!c||!c.time) return null; return c}catch(e){return null}}
  function setCache(data){localStorage.setItem(CACHE_KEY,JSON.stringify({time:now(),data:data||{}}));return data}
  function cacheFresh(c=getCache()){return !!(c && (now()-Number(c.time||0) < CACHE_TTL))}
  function clearCache(){localStorage.removeItem(CACHE_KEY)}
  function cachedStations(){const c=getCache(); return c?.data?.stations}
  function cachedQuestions(){const c=getCache(); return c?.data?.questions}
  function mergeCache(part){const c=getCache()||{time:0,data:{}}; return setCache({...c.data,...part})}
  function pendingSync(){return localGet(SYNC_KEY,[])}
  function savePendingSync(list){localSet(SYNC_KEY,list||[])}
  function queueSync(item){const list=pendingSync(); list.push({...item,queuedAt:new Date().toISOString()}); savePendingSync(list)}
  async function flushPendingSync(){
    if(!API_URL) return;
    const list=pendingSync(); if(!list.length) return;
    const remain=[];
    for(const item of list){
      try{await api(item.action,item.payload||{},{silent:true,noQueue:true});}
      catch(e){remain.push(item)}
    }
    savePendingSync(remain.slice(-30));
  }
  setTimeout(()=>flushPendingSync().catch(()=>{}),1200);
  window.addEventListener?.('online',()=>flushPendingSync().catch(()=>{}));
  let loadingCount=0;
  function ensureUi(){
    if(document.getElementById('vqth6Loading')) return;
    const style=document.createElement('style');
    style.id='vqth6LoadingStyle';
    style.textContent=`
      .vqth6-loading{position:fixed;inset:0;z-index:999999;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,.58);backdrop-filter:blur(8px);font-family:'Segoe UI',Arial,sans-serif;color:#fff}
      .vqth6-loading.show{display:flex}
      .vqth6-loading-card{width:min(420px,88vw);border:4px solid rgba(255,255,255,.92);border-radius:28px;padding:28px 24px;text-align:center;background:linear-gradient(145deg,#2563eb,#7c3aed 55%,#06b6d4);box-shadow:0 14px 0 #172554,0 0 32px rgba(0,229,255,.8),0 0 70px rgba(255,213,79,.35);position:relative;overflow:hidden}
      .vqth6-loading-card:before{content:'';position:absolute;inset:-50%;background:radial-gradient(circle,rgba(255,255,255,.35) 0 2px,transparent 3px);background-size:46px 46px;animation:vqStars 5s linear infinite;opacity:.35}
      .vqth6-loading-card>*{position:relative;z-index:1}.vqth6-robot{width:82px;height:82px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;border-radius:22px;background:linear-gradient(145deg,#facc15,#fb923c);border:4px solid #fff;box-shadow:0 8px 0 #92400e,0 0 25px #facc15;font-size:46px;animation:vqBounce 1.2s ease-in-out infinite}
      .vqth6-loading-title{font-size:24px;font-weight:1000;color:#fff7b0;text-shadow:0 2px 0 #7c2d12;margin-bottom:6px}.vqth6-loading-msg{font-size:17px;font-weight:800;line-height:1.45}.vqth6-dots:after{content:'';animation:vqDots 1.3s steps(4,end) infinite}
      .vqth6-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(30px);z-index:1000000;opacity:0;pointer-events:none;max-width:min(520px,92vw);padding:14px 18px;border-radius:18px;border:2px solid rgba(255,255,255,.85);background:linear-gradient(145deg,#0f172a,#2563eb);color:#fff;font-weight:900;box-shadow:0 0 24px rgba(0,229,255,.65);transition:.25s ease}.vqth6-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}.vqth6-toast.error{background:linear-gradient(145deg,#7f1d1d,#dc2626)}.vqth6-toast.success{background:linear-gradient(145deg,#14532d,#16a34a)}
      body.vqth6-busy{cursor:wait} body.vqth6-busy button,body.vqth6-busy a{pointer-events:none}
      @keyframes vqBounce{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}@keyframes vqStars{from{transform:translateY(0)}to{transform:translateY(46px)}}@keyframes vqDots{0%{content:''}25%{content:'.'}50%{content:'..'}75%,100%{content:'...'}}`;
    document.head.appendChild(style);
    const overlay=document.createElement('div'); overlay.id='vqth6Loading'; overlay.className='vqth6-loading';
    overlay.innerHTML=`<div class="vqth6-loading-card"><div class="vqth6-robot">🤖</div><div class="vqth6-loading-title">Robot đang xử lý<span class="vqth6-dots"></span></div><div class="vqth6-loading-msg" id="vqth6LoadingMsg">Đang thực hiện, vui lòng đợi...</div></div>`;
    const toast=document.createElement('div'); toast.id='vqth6Toast'; toast.className='vqth6-toast';
    document.body.appendChild(overlay); document.body.appendChild(toast);
  }
  function showLoading(msg='Đang thực hiện, vui lòng đợi...'){
    ensureUi(); loadingCount++;
    const box=document.getElementById('vqth6Loading'), m=document.getElementById('vqth6LoadingMsg');
    if(m) m.textContent=msg; if(box) box.classList.add('show'); document.body.classList.add('vqth6-busy');
  }
  function hideLoading(force=false){
    if(force) loadingCount=0; else loadingCount=Math.max(0,loadingCount-1);
    if(loadingCount===0){const box=document.getElementById('vqth6Loading'); if(box) box.classList.remove('show'); document.body.classList.remove('vqth6-busy');}
  }
  function toast(msg,type='normal',time=2300){
    ensureUi(); const t=document.getElementById('vqth6Toast'); if(!t) return;
    t.textContent=msg; t.className='vqth6-toast show '+(type||''); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),time);
  }
  async function api(action,payload={},opts={}){
    if(!API_URL) throw new Error('Chưa cấu hình API_URL. Đang dùng demo localStorage.');
    const silent=opts.silent===true || (payload && payload.silent===true); const loadingMessage=(payload && payload.loadingMessage) || 'Đang kết nối Google Sheet...';
    const cleanPayload={...payload}; delete cleanPayload.silent; delete cleanPayload.loadingMessage;
    if(!silent) showLoading(loadingMessage);
    try{
      const res=await fetch(API_URL,{method:'POST',body:JSON.stringify({action,...cleanPayload})});
      const text=await res.text(); let json;
      try{json=JSON.parse(text)}catch(e){throw new Error('Apps Script trả về không phải JSON: '+text.slice(0,160))}
      if(json.success===false) throw new Error(json.message||'Lỗi API');
      return json;
    }catch(err){
      if(!silent) toast(err.message||'Có lỗi khi xử lý dữ liệu.','error',4200);
      throw err;
    }finally{ if(!silent) hideLoading(); }
  }
  
  async function getAppData(force=false){
    if(!API_URL) return {success:true,stations:stationsLocal(),questions:questionsLocal(),demo:true};
    const c=getCache();
    if(!force && cacheFresh(c) && c.data?.stations && c.data?.questions) return {success:true,...c.data,fromCache:true};
    try{
      const u=getUser();
      const data=await api('getAppData',{maHS:u?.maHS||'',silent:!force,loadingMessage:'Đang tải dữ liệu game...'});
      if(data.stations||data.questions) setCache({stations:data.stations||[],questions:data.questions||[],config:data.config||{},reports:data.reports||null});
      if(data.progress && u?.maHS) applyRemoteProgress(u.maHS,data.progress);
      return data;
    }catch(e){
      console.warn(e);
      if(c?.data) return {success:true,...c.data,fromCache:true,offline:true};
      return {success:true,stations:stationsLocal(),questions:questionsLocal(),offline:true};
    }
  }
  async function getStations(force=false){
    const c=getCache();
    if(!force && cacheFresh(c) && c.data?.stations) return c.data.stations;
    if(API_URL){const data=await getAppData(force); if(data.stations) return data.stations}
    return stationsLocal();
  }
  async function saveStation(st){ clearCache(); if(API_URL){try{const r=await api('saveStation',{station:st}); await getAppData(true); return r}catch(e){console.warn(e)}} const arr=stationsLocal().filter(x=>x.id!==st.id); arr.push(st); arr.sort((a,b)=>Number(a.order)-Number(b.order)); localSet(ST_KEY,arr); return {success:true};}
  async function deleteStation(id){ clearCache(); if(API_URL){try{const r=await api('deleteStation',{id}); await getAppData(true); return r}catch(e){console.warn(e)}} localSet(ST_KEY,stationsLocal().filter(x=>x.id!==id)); return {success:true};}
  
  async function getQuestions(stationId='',force=false){
    const c=getCache();
    if(!force && cacheFresh(c) && c.data?.questions){const q=c.data.questions; return stationId?q.filter(x=>x.stationId===stationId):q;}
    if(API_URL){const data=await getAppData(force); const q=data.questions||[]; return stationId?q.filter(x=>x.stationId===stationId):q;}
    const q=questionsLocal(); return stationId?q.filter(x=>x.stationId===stationId):q;
  }
  async function saveQuestion(q){ clearCache(); if(API_URL){try{const r=await api('saveQuestion',{question:q}); await getAppData(true); return r}catch(e){console.warn(e)}} const arr=questionsLocal().filter(x=>x.id!==q.id); arr.push(q); localSet(Q_KEY,arr); return {success:true};}
  async function deleteQuestion(id){ clearCache(); if(API_URL){try{const r=await api('deleteQuestion',{id}); await getAppData(true); return r}catch(e){console.warn(e)}} localSet(Q_KEY,questionsLocal().filter(x=>x.id!==id)); return {success:true};}
  async function login(maHS,matKhau){ if(API_URL){const u=await api('login',{maHS,matKhau}); if(u.progress) applyRemoteProgress(u.maHS||u.ma_hs||maHS,u.progress); return u;} const u={success:true,maHS,hoTen:maHS==='GV'?'Giáo viên Demo':'Học sinh Demo',lop:maHS==='GV'?'GV':'6A',role:maHS==='GV'?'TEACHER':'STUDENT'}; setUser(u); return u;}
  async function markMission(stationId,mission,extra={}){
    const u=getUser(); if(!u) throw new Error('Chưa đăng nhập');
    const pr=userProgress(u.maHS); const key=stationId+'_'+mission;
    pr.missions=pr.missions||{}; pr.xpEarned=pr.xpEarned||{}; pr.flags=pr.flags||{};
    pr.missions[key]={done:true,at:new Date().toISOString(),...extra};
    if(!pr.xpEarned[key]){pr.xp=(pr.xp||0)+(XP[mission]||0); pr.xpEarned[key]=true;}
    pr.badge=badgeByXp(pr.xp||0); saveUserProgress(pr);
    const localResult={success:true,progress:pr,optimistic:true};
    if(API_URL){
      api('markMission',{maHS:u.maHS,stationId,mission,extra,silent:true},{silent:true}).then(res=>{if(res.progress) applyRemoteProgress(u.maHS,res.progress); toast('Đã đồng bộ tiến độ.','success',1500)}).catch(e=>{console.warn(e); queueSync({action:'markMission',payload:{maHS:u.maHS,stationId,mission,extra}}); toast('Đã lưu tạm trên máy. Sẽ đồng bộ lại khi mạng ổn.','error',3600)});
    }
    return localResult;
  }
  async function submitTest(stationId,score,wrong=[],answers={}){
    const u=getUser(); if(!u) throw new Error('Chưa đăng nhập');
    const pr=userProgress(u.maHS); pr.tests=pr.tests||{}; pr.flags=pr.flags||{}; pr.xpEarned=pr.xpEarned||{};
    const t=pr.tests[stationId]||{attempt:0,best:0}; t.attempt++; t.last=score; t.best=Math.max(t.best||0,score); t.wrong=wrong; t.updatedAt=new Date().toISOString(); pr.tests[stationId]=t;
    if(score>=PASS && !pr.xpEarned[stationId+'_test']){pr.xp=(pr.xp||0)+XP.test+XP.station; pr.xpEarned[stationId+'_test']=true; pr.xpEarned[stationId+'_station']=true;}
    if(score<PASS){pr.flags[stationId]=t.attempt>=3?'support':(t.attempt>=2?'practiceAgain':'reviewAgain');} else delete pr.flags[stationId];
    pr.badge=badgeByXp(pr.xp||0); saveUserProgress(pr);
    const localResult={success:true,progress:pr,test:t,passed:score>=PASS,attempt:t.attempt,best:t.best,optimistic:true};
    if(API_URL){
      api('submitTest',{maHS:u.maHS,stationId,score,wrong,answers,silent:true},{silent:true}).then(res=>{if(res.progress) applyRemoteProgress(u.maHS,res.progress); toast('Đã đồng bộ bài kiểm tra.','success',1500)}).catch(e=>{console.warn(e); queueSync({action:'submitTest',payload:{maHS:u.maHS,stationId,score,wrong,answers}}); toast('Đã lưu tạm bài kiểm tra. Sẽ đồng bộ lại khi mạng ổn.','error',3800)});
    }
    return localResult;
  }
  function badgeByXp(xp){if(xp>=1800)return '👑 Vua Tin Học'; if(xp>=1200)return '🛡️ Hiệp sĩ Internet'; if(xp>=700)return '⚔️ Chiến binh dữ liệu'; if(xp>=300)return '🧭 Nhà thám hiểm'; return '🌱 Tân binh';}
  async function getReports(filter={}){ if(API_URL){try{return await api('getReports',filter)}catch(e){console.warn(e)}} const stations=stationsLocal(); const p=progressAll(); const rows=Object.values(p); const missingVideo=[],missingPractice=[],below70=[],stuckStudents=[]; rows.forEach(pr=>{stations.forEach(st=>{const title=st.title; if(!pr.missions?.[st.id+'_video']) missingVideo.push({maHS:pr.maHS,title,stationId:st.id}); if(!pr.missions?.[st.id+'_practice']) missingPractice.push({maHS:pr.maHS,title,stationId:st.id}); const t=pr.tests?.[st.id]; if(t&&t.last<PASS) below70.push({maHS:pr.maHS,title,stationId:st.id,score:t.last,attempt:t.attempt}); if(pr.flags?.[st.id]==='support') stuckStudents.push({maHS:pr.maHS,title,stationId:st.id,status:'Cần hỗ trợ'});});}); return {missingVideo,missingPractice,below70,stuckStudents,wrongQuestions:[],wrongStations:[]};}
  function canOpen(st,stations,pr){ if(st.unlockMode==='manual') return true; if(st.unlockMode==='date' && st.unlockDate) return new Date()>=new Date(st.unlockDate); const prev=stations.filter(x=>x.visible!==false && Number(x.order)<Number(st.order)).sort((a,b)=>b.order-a.order)[0]; if(!prev) return true; return (pr.tests?.[prev.id]?.best||0) >= (prev.passScore||PASS); }
  function stationProgress(st,pr){let n=0; ['video','summary','practice'].forEach(m=>{if(pr.missions?.[st.id+'_'+m])n++}); if((pr.tests?.[st.id]?.best||0)>=(st.passScore||PASS))n++; return n;}
  return {CFG,API_URL,TYPE_LABEL,injectContentFixCss,shortenLongUrls,PASS,XP,USER_KEY,CLASS_KEY,api,getAppData,clearCache,flushPendingSync,showLoading,hideLoading,toast,getUser,setUser,logout,login,getStations,saveStation,deleteStation,getQuestions,saveQuestion,deleteQuestion,markMission,submitTest,getReports,userProgress,saveUserProgress,canOpen,stationProgress,badgeByXp,local:{stations:stationsLocal,questions:questionsLocal,progressAll,saveProgressAll,reset(){localStorage.removeItem(ST_KEY);localStorage.removeItem(Q_KEY);localStorage.removeItem(PROG_KEY);localStorage.removeItem(CACHE_KEY);localStorage.removeItem(SYNC_KEY)}}};
})();
