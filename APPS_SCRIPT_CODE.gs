
/**
 * VQTH6 v5.3 - Apps Script
 * Sheet dùng tên cột tiếng Việt không dấu:
 * hocsinh: ma_hs, ho_ten, lop, ten_dang_nhap, mat_khau, trang_thai, xp, huy_hieu, cap_do, diem_cao_nhat
 * tramhoc: ma_tram, ten_tram, loai_tram, hoc_ky, xp, dieu_kien_mo, thu_tu, chu_de, bieu_tuong, mau, diem_dat, hien_thi, bat_buoc, video_url, image_url, luyen_tap_url, kiem_tra_url, tom_tat
 * cauhoi: ma_cau_hoi, ma_tram, loai_cau_hoi, muc_do, noi_dung, dap_an, diem, lua_chon, items, pairs, giai_thich
 * tien_do: ma_hs, ma_tram, tien_do_video, da_xem_tom_tat, da_luyen_tap, diem_kiem_tra, xp_da_nhan, ngay_cap_nhat
 */

const SHEET = {
  hocSinh: 'hocsinh',
  tramHoc: 'tramhoc',
  cauHoi: 'cauhoi',
  tienDo: 'tien_do',
  cauHinh: 'cau_hinh'
};

function doPost(e){
  try{
    const req = JSON.parse(e.postData.contents || '{}');
    const action = req.action || '';
    let data = {};
    if(action === 'login') data = login(req);
    else if(action === 'getAppData') data = getAppData(req);
    else if(action === 'saveStation') data = saveStation(req.station || {});
    else if(action === 'deleteStation') data = deleteStation(req.id || req.ma_tram || '');
    else if(action === 'saveQuestion') data = saveQuestion(req.question || {});
    else if(action === 'deleteQuestion') data = deleteQuestion(req.id || req.ma_cau_hoi || '');
    else if(action === 'markMission') data = markMission(req);
    else if(action === 'updateVideoProgress') data = updateVideoProgress(req);
    else if(action === 'submitTest') data = submitTest(req);
    else if(action === 'getReports') data = getReports(req);
    else if(action === 'adminLogin') data = {success:true};
    else data = {success:false, message:'Action không hợp lệ: '+action};
    return json(data);
  }catch(err){
    return json({success:false, message:String(err && err.message ? err.message : err)});
  }
}

function doGet(e){
  return json({success:true, app:'VQTH6 v5.3'});
}

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ss(){ return SpreadsheetApp.getActiveSpreadsheet(); }

function getSheet(name){
  const sh = ss().getSheetByName(name);
  if(!sh) throw new Error('Chưa có sheet: '+name);
  return sh;
}

function getObjects(name){
  const sh = getSheet(name);
  const values = sh.getDataRange().getValues();
  if(values.length < 2) return [];
  const head = values[0].map(String);
  return values.slice(1).filter(r => r.some(c => c !== '')).map(r => {
    const o = {};
    head.forEach((h,i)=>o[h]=r[i]);
    return o;
  });
}

function writeObjects(name, rows){
  const sh = getSheet(name);
  const head = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  const body = rows.map(o => head.map(h => o[h] === undefined ? '' : o[h]));
  if(sh.getLastRow() > 1) sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  if(body.length) sh.getRange(2,1,body.length,head.length).setValues(body);
}

function bool(v){
  if(v === true) return true;
  const s = String(v).toLowerCase().trim();
  return ['true','1','yes','có','co','x'].includes(s);
}

function toStation(r){
  return {
    id: String(r.ma_tram || ''),
    order: Number(r.thu_tu || 1),
    semester: String(r.hoc_ky || ''),
    unit: String(r.chu_de || ''),
    title: String(r.ten_tram || ''),
    type: String(r.loai_tram || 'lesson'),
    icon: String(r.bieu_tuong || '🏆'),
    color: String(r.mau || 'blue'),
    unlockMode: String(r.dieu_kien_mo || 'sequential'),
    passScore: Number(r.diem_dat || 70),
    visible: bool(r.hien_thi),
    required: r.bat_buoc === '' ? true : bool(r.bat_buoc),
    videoUrl: String(r.video_url || ''),
    imageUrl: String(r.image_url || ''),
    practiceUrl: String(r.luyen_tap_url || ''),
    testUrl: String(r.kiem_tra_url || ''),
    summary: String(r.tom_tat || ''),
    xp: Number(r.xp || 0)
  };
}

function fromStation(st){
  return {
    ma_tram: st.id || st.ma_tram || '',
    ten_tram: st.title || st.ten_tram || '',
    loai_tram: st.type || st.loai_tram || 'lesson',
    hoc_ky: st.semester || st.hoc_ky || '',
    xp: st.xp || '',
    dieu_kien_mo: st.unlockMode || st.dieu_kien_mo || 'sequential',
    thu_tu: st.order || st.thu_tu || '',
    chu_de: st.unit || st.chu_de || '',
    bieu_tuong: st.icon || st.bieu_tuong || '',
    mau: st.color || st.mau || '',
    diem_dat: st.passScore || st.diem_dat || 70,
    hien_thi: st.visible === false ? false : true,
    bat_buoc: st.required === false ? false : true,
    video_url: st.videoUrl || st.video_url || '',
    image_url: st.imageUrl || st.image_url || '',
    luyen_tap_url: st.practiceUrl || st.luyen_tap_url || '',
    kiem_tra_url: st.testUrl || st.kiem_tra_url || '',
    tom_tat: st.summary || st.tom_tat || ''
  };
}

function toQuestion(r){
  let q = {
    id: String(r.ma_cau_hoi || ''),
    stationId: String(r.ma_tram || ''),
    type: mapType(String(r.loai_cau_hoi || '')),
    level: String(r.muc_do || ''),
    question: String(r.noi_dung || ''),
    answer: String(r.dap_an || ''),
    score: Number(r.diem || 10),
    explain: String(r.giai_thich || '')
  };
  if(r.lua_chon) q.options = String(r.lua_chon).split('|').map(s=>s.trim()).filter(Boolean);
  if(r.items) q.items = String(r.items).split('|').map(s=>s.trim()).filter(Boolean);
  if(r.pairs) q.pairs = String(r.pairs).split('|').map(x=>x.split('=').map(s=>s.trim())).filter(p=>p[0] && p[1]);
  return q;
}

function fromQuestion(q){
  return {
    ma_cau_hoi: q.id || q.ma_cau_hoi || '',
    ma_tram: q.stationId || q.ma_tram || '',
    loai_cau_hoi: unmapType(q.type || q.loai_cau_hoi || ''),
    muc_do: q.level || q.muc_do || '',
    noi_dung: q.question || q.noi_dung || '',
    dap_an: q.answer || q.dap_an || '',
    diem: q.score || q.diem || 10,
    lua_chon: Array.isArray(q.options) ? q.options.join('|') : (q.lua_chon || ''),
    items: Array.isArray(q.items) ? q.items.join('|') : (q.items || ''),
    pairs: Array.isArray(q.pairs) ? q.pairs.map(p=>p[0]+'='+p[1]).join('|') : (q.pairs || ''),
    giai_thich: q.explain || q.giai_thich || ''
  };
}

function mapType(t){
  t = String(t).toLowerCase().trim();
  if(t === 'trac_nghiem' || t === 'trắc nghiệm') return 'choice';
  if(t === 'keo_tha' || t === 'kéo thả') return 'drag';
  if(t === 'ghep_cap' || t === 'ghép cặp') return 'match';
  if(t === 'dien_tu' || t === 'điền từ') return 'fill';
  return t || 'choice';
}

function unmapType(t){
  t = String(t).toLowerCase().trim();
  if(t === 'choice') return 'trac_nghiem';
  if(t === 'drag') return 'keo_tha';
  if(t === 'match') return 'ghep_cap';
  if(t === 'fill') return 'dien_tu';
  return t;
}

function login(req){
  const user = String(req.maHS || req.ten_dang_nhap || '').trim();
  const pass = String(req.matKhau || req.mat_khau || '').trim();
  const rows = getObjects(SHEET.hocSinh);
  const r = rows.find(x =>
    String(x.ma_hs).trim() === user ||
    String(x.ten_dang_nhap).trim() === user
  );
  if(!r) return {success:false, message:'Không tìm thấy tài khoản.'};
  if(String(r.mat_khau || '').trim() !== pass) return {success:false, message:'Sai mật khẩu.'};
  if(String(r.trang_thai || 'ACTIVE').toUpperCase() !== 'ACTIVE') return {success:false, message:'Tài khoản chưa hoạt động.'};
  return {
    success:true,
    maHS:String(r.ma_hs || ''),
    hoTen:String(r.ho_ten || ''),
    lop:String(r.lop || ''),
    role:'STUDENT',
    progress: buildProgress(String(r.ma_hs || ''))
  };
}

function getAppData(req){
  const maHS = String(req.maHS || '').trim();
  const data = {
    success:true,
    stations:getObjects(SHEET.tramHoc).map(toStation).sort((a,b)=>a.order-b.order),
    questions:getObjects(SHEET.cauHoi).map(toQuestion),
    config: safeObjects(SHEET.cauHinh),
    serverTime:new Date().toISOString()
  };
  if(maHS) data.progress = buildProgress(maHS);
  return data;
}

function safeObjects(name){
  try{return getObjects(name)}catch(e){return []}
}

function saveStation(st){
  const rows = getObjects(SHEET.tramHoc);
  const obj = fromStation(st);
  const idx = rows.findIndex(r => String(r.ma_tram) === String(obj.ma_tram));
  if(idx >= 0) rows[idx] = Object.assign(rows[idx], obj);
  else rows.push(obj);
  writeObjects(SHEET.tramHoc, rows);
  return {success:true};
}

function deleteStation(id){
  const rows = getObjects(SHEET.tramHoc).filter(r => String(r.ma_tram) !== String(id));
  writeObjects(SHEET.tramHoc, rows);
  return {success:true};
}

function saveQuestion(q){
  const rows = getObjects(SHEET.cauHoi);
  const obj = fromQuestion(q);
  const idx = rows.findIndex(r => String(r.ma_cau_hoi) === String(obj.ma_cau_hoi));
  if(idx >= 0) rows[idx] = Object.assign(rows[idx], obj);
  else rows.push(obj);
  writeObjects(SHEET.cauHoi, rows);
  return {success:true};
}

function deleteQuestion(id){
  const rows = getObjects(SHEET.cauHoi).filter(r => String(r.ma_cau_hoi) !== String(id));
  writeObjects(SHEET.cauHoi, rows);
  return {success:true};
}

function getProgressRow(maHS, maTram){
  const rows = getObjects(SHEET.tienDo);
  let r = rows.find(x => String(x.ma_hs) === String(maHS) && String(x.ma_tram) === String(maTram));
  if(!r){
    r = {ma_hs:maHS, ma_tram:maTram, tien_do_video:0, da_xem_tom_tat:false, da_luyen_tap:false, diem_kiem_tra:0, xp_da_nhan:0, ngay_cap_nhat:''};
    rows.push(r);
    writeObjects(SHEET.tienDo, rows);
  }
  return r;
}

function saveProgressRow(row){
  const rows = getObjects(SHEET.tienDo);
  const idx = rows.findIndex(x => String(x.ma_hs) === String(row.ma_hs) && String(x.ma_tram) === String(row.ma_tram));
  row.ngay_cap_nhat = new Date();
  if(idx >= 0) rows[idx] = Object.assign(rows[idx], row);
  else rows.push(row);
  writeObjects(SHEET.tienDo, rows);
}

function updateVideoProgress(req){
  const maHS = String(req.maHS || '').trim();
  const maTram = String(req.stationId || req.ma_tram || '').trim();
  const percent = Math.max(0, Math.min(100, Number(req.percent || req.tien_do_video || 0)));
  const r = getProgressRow(maHS, maTram);
  r.tien_do_video = Math.max(Number(r.tien_do_video || 0), percent);
  saveProgressRow(r);
  return {success:true, progress:buildProgress(maHS)};
}

function markMission(req){
  const maHS = String(req.maHS || '').trim();
  const maTram = String(req.stationId || req.ma_tram || '').trim();
  const mission = String(req.mission || '').trim();
  const r = getProgressRow(maHS, maTram);
  if(mission === 'video'){
    const currentVideo = Math.max(Number(r.tien_do_video || 0), Number((req.extra && req.extra.videoProgress) || 0));
    if(currentVideo < 90) return {success:false, message:'Chưa xem đủ 90% video nên chưa được nhận XP.'};
    r.tien_do_video = currentVideo;
  }
  if(mission === 'summary') r.da_xem_tom_tat = true;
  if(mission === 'practice') r.da_luyen_tap = true;
  saveProgressRow(r);
  addXp(maHS, mission === 'video' ? 10 : mission === 'summary' ? 10 : mission === 'practice' ? 20 : 0);
  return {success:true, progress:buildProgress(maHS)};
}

function submitTest(req){
  const maHS = String(req.maHS || '').trim();
  const maTram = String(req.stationId || req.ma_tram || '').trim();
  const score = Number(req.score || req.diem_kiem_tra || 0);
  const r = getProgressRow(maHS, maTram);
  r.diem_kiem_tra = Math.max(Number(r.diem_kiem_tra || 0), score);
  saveProgressRow(r);
  if(score >= 70) addXp(maHS, 50);
  return {success:true, progress:buildProgress(maHS)};
}

function addXp(maHS, amount){
  amount = Number(amount || 0);
  if(amount <= 0) return;
  const rows = getObjects(SHEET.hocSinh);
  const idx = rows.findIndex(r => String(r.ma_hs) === String(maHS));
  if(idx < 0) return;
  const r = rows[idx];
  r.xp = Number(r.xp || 0) + amount;
  r.cap_do = Math.floor(Number(r.xp || 0) / 500) + 1;
  r.huy_hieu = badgeByXp(Number(r.xp || 0));
  rows[idx] = r;
  writeObjects(SHEET.hocSinh, rows);
}

function badgeByXp(xp){
  xp = Number(xp || 0);
  if(xp >= 1500) return 'Vua Tin Học';
  if(xp >= 1000) return 'Nhà thám hiểm';
  if(xp >= 500) return 'Chiến binh dữ liệu';
  if(xp >= 200) return 'Học viên chăm chỉ';
  return 'Tân binh';
}

function buildProgress(maHS){
  const hs = getObjects(SHEET.hocSinh).find(r => String(r.ma_hs) === String(maHS)) || {};
  const td = getObjects(SHEET.tienDo).filter(r => String(r.ma_hs) === String(maHS));
  const progress = {
    maHS:maHS,
    xp:Number(hs.xp || 0),
    badge:String(hs.huy_hieu || 'Tân binh'),
    missions:{},
    tests:{},
    flags:{}
  };
  td.forEach(r=>{
    const maTram = String(r.ma_tram || '');
    const video = Number(r.tien_do_video || 0);
    progress.flags[maTram+'_videoProgress'] = video;
    if(video >= 90) progress.missions[maTram+'_video'] = {done:true};
    if(bool(r.da_xem_tom_tat)) progress.missions[maTram+'_summary'] = {done:true};
    if(bool(r.da_luyen_tap)) progress.missions[maTram+'_practice'] = {done:true};
    progress.tests[maTram] = {best:Number(r.diem_kiem_tra || 0), last:Number(r.diem_kiem_tra || 0), attempt:Number(r.diem_kiem_tra || 0)>0?1:0};
  });
  return progress;
}

function getReports(req){
  const rows = getObjects(SHEET.tienDo);
  return {success:true, missingVideo:[], missingPractice:[], below70:[], stuckStudents:[], raw:rows};
}
