document.addEventListener('DOMContentLoaded',async()=>{
const u=VQTH6.getUser();
if(!u){location.href='login.html?redirect='+encodeURIComponent(location.pathname.split('/').pop()+location.search);return;}
document.getElementById('logout').onclick=()=>{VQTH6.logout();location.href='index.html'};
const params=new URLSearchParams(location.search);
const stationId=params.get('id');
const mode=location.pathname.includes('kiem-tra')?'test':'practice';
const stations=await VQTH6.getStations();
const st=stations.find(x=>x.id===stationId)||stations[0];
document.getElementById('backStation').href='tram.html?id='+encodeURIComponent(st.id);
document.getElementById('quizTitle').textContent=(mode==='test'?'🏆 Kiểm tra mở khóa: ':'📝 Luyện tập: ')+st.title;
document.getElementById('quizMeta').textContent='4 vòng: Trắc nghiệm • Kéo thả • Điền từ • Trắc nghiệm';
const all=(await VQTH6.getQuestions(st.id)).sort((a,b)=>(Number(a.round||1)-Number(b.round||1))||String(a.id).localeCompare(String(b.id)));
const rounds=[1,2,3,4].map(r=>({round:r,items:all.filter(q=>Number(q.round||1)===r)}));
const box=document.getElementById('gameBox');
let current=0, answers={}, scoreByQ={}, finished=false;
if(!all.length){box.innerHTML='<h2>Chưa có câu hỏi</h2><p>Cô cần thêm câu hỏi trong Admin cho bài này.</p><a class="btn" href="tram.html?id='+encodeURIComponent(st.id)+'">Quay lại trạm</a>';return;}
renderRound();

function esc(s){return String(s||'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim()}
function roundTitle(r){return {1:'Vòng 1 - Trắc nghiệm chọn đáp án đúng',2:'Vòng 2 - Kéo thả phân loại',3:'Vòng 3 - Điền từ vào ô trống',4:'Vòng 4 - Trắc nghiệm về đích'}[r]||('Vòng '+r)}
function renderRound(){
 const data=rounds[current], qs=data.items;
 if(!qs.length){current++; if(current<rounds.length) return renderRound(); return finish();}
 box.innerHTML=`<h2>${roundTitle(data.round)}</h2><p class="muted">Câu hỏi của riêng bài: <b>${esc(st.title)}</b></p><div class="round-progress">Vòng ${current+1}/4</div><div id="questions"></div><div class="quick-actions"><button class="btn gold" id="checkRound">Kiểm tra vòng này</button></div>`;
 const qbox=document.getElementById('questions');
 qs.forEach((q,idx)=>qbox.appendChild(renderQuestion(q,idx)));
 document.getElementById('checkRound').onclick=()=>checkRound(qs);
}
function renderQuestion(q,idx){
 const div=document.createElement('div'); div.className='question play-question'; div.dataset.qid=q.id; div.dataset.type=q.type;
 let html=`<b>Câu ${idx+1}. ${esc(q.question)}</b>`;
 if(q.type==='choice'){
   html+=(q.options||[]).map((o,i)=>`<label class="choice"><input type="radio" name="${esc(q.id)}" value="${i}"> ${esc(o)}</label>`).join('');
 }
 else if(q.type==='fill'){
   html+=`<input class="fill-answer" placeholder="Nhập câu trả lời vào đây">`;
 }
 else if(q.type==='drag'){
   const cats=[...new Set((q.items||[]).map(x=>(typeof x==='string'?'Chưa phân loại':x.category)).filter(Boolean))];
   html+=`<p class="muted">Chọn nhóm đúng cho từng thẻ.</p>`+(q.items||[]).map((it,i)=>{
     const text=typeof it==='string'?it:it.text;
     return `<div class="drag-classify-row"><span>${esc(text)}</span><select data-drag-index="${i}"><option value="">-- Chọn nhóm --</option>${cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>`;
   }).join('');
 }
 else if(q.type==='match'){
   html+=`<p class="muted">Nhập cặp dạng Trái=Phải, cách nhau bởi dấu |</p><input class="match-answer" placeholder="Ví dụ: A=1 | B=2">`;
 }
 div.innerHTML=html;
 return div;
}
function checkQuestion(q){
 const wrap=document.querySelector(`[data-qid="${CSS.escape(q.id)}"]`);
 let ok=false, userAns='';
 if(q.type==='choice'){
   userAns=wrap.querySelector(`input[name="${CSS.escape(q.id)}"]:checked`)?.value ?? '';
   ok=String(userAns)===String(q.answer);
 }
 else if(q.type==='fill'){
   userAns=wrap.querySelector('.fill-answer')?.value||'';
   const accepts=(q.fillAnswers&&q.fillAnswers.length?q.fillAnswers:[q.answer]).map(norm);
   ok=accepts.includes(norm(userAns));
 }
 else if(q.type==='drag'){
   const selects=[...wrap.querySelectorAll('[data-drag-index]')];
   ok=selects.length>0 && selects.every(sel=>{
     const idx=Number(sel.dataset.dragIndex), it=q.items[idx], right=typeof it==='string'?'':it.category;
     return norm(sel.value)===norm(right);
   });
   userAns=selects.map(s=>s.value).join('|');
 }
 else if(q.type==='match'){
   userAns=wrap.querySelector('.match-answer')?.value||'';
   const right=(q.pairs||[]).map(p=>norm(p[0])+'='+norm(p[1])).sort().join('|');
   const got=userAns.split('|').map(x=>x.trim()).filter(Boolean).map(x=>x.split('=').map(norm).join('=')).sort().join('|');
   ok=got===right;
 }
 scoreByQ[q.id]=ok?1:0; answers[q.id]=userAns;
 wrap.classList.remove('answer-ok','answer-wrong'); wrap.classList.add(ok?'answer-ok':'answer-wrong');
 let fb=wrap.querySelector('.feedback'); if(!fb){fb=document.createElement('div');fb.className='feedback';wrap.appendChild(fb)}
 fb.innerHTML=ok?'✅ Chính xác!':'❌ Chưa đúng. '+(q.explain?esc(q.explain):'Em xem lại kiến thức nhé.');
 return ok;
}
function checkRound(qs){
 let okCount=0; qs.forEach(q=>{if(checkQuestion(q)) okCount++});
 const pass=okCount===qs.length;
 const next=document.createElement('div'); next.className=pass?'ok':'warn';
 next.innerHTML=`<b>Kết quả vòng này:</b> ${okCount}/${qs.length} câu đúng.`;
 if(pass || mode==='practice'){
   next.innerHTML+=`<br><button class="btn good" id="nextRound">${current<rounds.length-1?'Sang vòng tiếp theo':'Hoàn thành'}</button>`;
 }else{
   next.innerHTML+='<br>Em cần sửa câu sai rồi bấm kiểm tra lại.';
 }
 box.appendChild(next);
 const btn=document.getElementById('nextRound');
 if(btn) btn.onclick=()=>{current++; if(current<rounds.length)renderRound(); else finish();};
}
async function finish(){
 if(finished) return; finished=true;
 const total=all.length, correct=Object.values(scoreByQ).reduce((a,b)=>a+b,0);
 const score=Math.round(correct/total*100);
 const wrong=all.filter(q=>!scoreByQ[q.id]).map(q=>({id:q.id,question:q.question,round:q.round}));
 if(mode==='practice'){
   await VQTH6.markMission(st.id,'practice',{score,correct,total,answers});
   box.innerHTML=`<h2>🎉 Hoàn thành luyện tập</h2><div class="ok">Em đúng ${correct}/${total} câu (${score}%).</div><a class="btn good" href="tram.html?id=${encodeURIComponent(st.id)}">Quay lại trạm</a>`;
 }else{
   await VQTH6.submitTest(st.id,score,wrong,answers);
   box.innerHTML=`<h2>${score>=(st.passScore||70)?'🏆 Đã vượt qua kiểm tra!':'💪 Cần luyện thêm'}</h2><div class="${score>=(st.passScore||70)?'ok':'warn'}">Điểm của em: <b>${score}%</b> (${correct}/${total} câu đúng).</div><a class="btn good" href="tram.html?id=${encodeURIComponent(st.id)}">Quay lại trạm</a>`;
 }
}
});