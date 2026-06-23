/* ============================================================
   SUỐI TIÊN · VÉ COMBO 360°  —  standalone vanilla rebuild
   Data model & logic ported 1:1 from the original bundle;
   editorial "paper ticket" UI written from scratch.
   ============================================================ */

/* ---- icon paths (reused from original) ---- */
/* ICONS, DEST, SEA_DEST, COMBOS, QUIZ are loaded from data.json at runtime */
let ICONS, DEST, SEA_DEST, COMBOS, QUIZ;
/* ---- state ---- */
const state = {
  answers:[null,null,null], recId:null,
  selectedId:null, seaBy:{},
  adults:2, children:0,
  sheetId:null, toast:null,
  exploreId:null, vr:null, journey:null
};
let toastTimer=null, jTimer=null;

/* ---- helpers ---- */
const fmt = n => Number(n).toLocaleString('vi-VN') + 'đ';
const comboOf = id => COMBOS.find(c=>c.id===id);
const priceOf = (c,sea) => sea ? {adult:c.seaAdult,child:c.seaChild} : {adult:c.priceAdult,child:c.priceChild};
const esc = s => String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
/* Official Lucide icon bodies (https://lucide.dev), keyed by local name.
   Values are the exact inner markup from the `lucide` npm package, dropped
   into a shared 24×24 stroke wrapper by lucide(). Local→Lucide mapping:
   gate=DoorOpen temple=Landmark train=TrainFront mountain=Mountain fish=Fish
   lotus=Flower paw=PawPrint coaster=TrainTrack ferris=FerrisWheel
   tower=TowerControl water=Waves play=Play layers=Layers volume=Volume2
   film=Film map=Map users=Users navigation=Navigation pin=MapPin
   sparkle=Sparkles check=Check x=X plus=Plus minus=Minus
   arrow-*=Arrow* chevron-*=Chevron* pause=Pause maximize=Maximize */
const LUCIDE = {
  // destination icons (official Lucide paths)
  gate:"<path d=\"M11 20H2\"/><path d=\"M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z\"/><path d=\"M11 4H8a2 2 0 0 0-2 2v14\"/><path d=\"M14 12h.01\"/><path d=\"M22 20h-3\"/>",
  temple:"<path d=\"M10 18v-7\"/><path d=\"M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z\"/><path d=\"M14 18v-7\"/><path d=\"M18 18v-7\"/><path d=\"M3 22h18\"/><path d=\"M6 18v-7\"/>",
  train:"<path d=\"M8 3.1V7a4 4 0 0 0 8 0V3.1\"/><path d=\"m9 15-1-1\"/><path d=\"m15 15 1-1\"/><path d=\"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z\"/><path d=\"m8 19-2 3\"/><path d=\"m16 19 2 3\"/>",
  mountain:"<path d=\"m8 3 4 8 5-5 5 15H2L8 3z\"/>",
  fish:"<path d=\"M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z\"/><path d=\"M18 12v.5\"/><path d=\"M16 17.93a9.77 9.77 0 0 1 0-11.86\"/><path d=\"M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33\"/><path d=\"M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4\"/><path d=\"m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98\"/>",
  lotus:"<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5\"/><path d=\"M12 7.5V9\"/><path d=\"M7.5 12H9\"/><path d=\"M16.5 12H15\"/><path d=\"M12 16.5V15\"/><path d=\"m8 8 1.88 1.88\"/><path d=\"M14.12 9.88 16 8\"/><path d=\"m8 16 1.88-1.88\"/><path d=\"M14.12 14.12 16 16\"/>",
  paw:"<circle cx=\"11\" cy=\"4\" r=\"2\"/><circle cx=\"18\" cy=\"8\" r=\"2\"/><circle cx=\"20\" cy=\"16\" r=\"2\"/><path d=\"M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z\"/>",
  coaster:"<path d=\"M2 17 17 2\"/><path d=\"m2 14 8 8\"/><path d=\"m5 11 8 8\"/><path d=\"m8 8 8 8\"/><path d=\"m11 5 8 8\"/><path d=\"m14 2 8 8\"/><path d=\"M7 22 22 7\"/>",
  ferris:"<circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M12 2v4\"/><path d=\"m6.8 15-3.5 2\"/><path d=\"m20.7 7-3.5 2\"/><path d=\"M6.8 9 3.3 7\"/><path d=\"m20.7 17-3.5-2\"/><path d=\"m9 22 3-8 3 8\"/><path d=\"M8 22h8\"/><path d=\"M18 18.7a9 9 0 1 0-12 0\"/>",
  tower:"<path d=\"M18.2 12.27 20 6H4l1.8 6.27a1 1 0 0 0 .95.73h10.5a1 1 0 0 0 .96-.73Z\"/><path d=\"M8 13v9\"/><path d=\"M16 22v-9\"/><path d=\"m9 6 1 7\"/><path d=\"m15 6-1 7\"/><path d=\"M12 6V2\"/><path d=\"M13 2h-2\"/>",
  water:"<path d=\"M2 12q2.5 2 5 0t5 0 5 0 5 0\"/><path d=\"M2 19q2.5 2 5 0t5 0 5 0 5 0\"/><path d=\"M2 5q2.5 2 5 0t5 0 5 0 5 0\"/>",
  // ui / control icons (official Lucide paths)
  play:"<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\"/>",
  layers:"<path d=\"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z\"/><path d=\"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12\"/><path d=\"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17\"/>",
  volume:"<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\"/><path d=\"M16 9a5 5 0 0 1 0 6\"/><path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\"/>",
  film:"<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M7 3v18\"/><path d=\"M3 7.5h4\"/><path d=\"M3 12h18\"/><path d=\"M3 16.5h4\"/><path d=\"M17 3v18\"/><path d=\"M17 7.5h4\"/><path d=\"M17 16.5h4\"/>",
  map:"<path d=\"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z\"/><path d=\"M15 5.764v15\"/><path d=\"M9 3.236v15\"/>",
  users:"<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><path d=\"M16 3.128a4 4 0 0 1 0 7.744\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/>",
  navigation:"<polygon points=\"3 11 22 2 13 21 11 13 3 11\"/>",
  pin:"<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>",
  sparkle:"<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\"/><path d=\"M20 2v4\"/><path d=\"M22 4h-4\"/><circle cx=\"4\" cy=\"20\" r=\"2\"/>",
  check:"<path d=\"M20 6 9 17l-5-5\"/>",
  x:"<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>",
  plus:"<path d=\"M5 12h14\"/><path d=\"M12 5v14\"/>",
  minus:"<path d=\"M5 12h14\"/>",
  "arrow-down":"<path d=\"M12 5v14\"/><path d=\"m19 12-7 7-7-7\"/>",
  "arrow-right":"<path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/>",
  "arrow-left":"<path d=\"m12 19-7-7 7-7\"/><path d=\"M19 12H5\"/>",
  "chevron-left":"<path d=\"m15 18-6-6 6-6\"/>",
  "chevron-right":"<path d=\"m9 18 6-6-6-6\"/>",
  pause:"<rect x=\"14\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/><rect x=\"5\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/>",
  maximize:"<path d=\"M8 3H5a2 2 0 0 0-2 2v3\"/><path d=\"M21 8V5a2 2 0 0 0-2-2h-3\"/><path d=\"M3 16v3a2 2 0 0 0 2 2h3\"/><path d=\"M16 21h3a2 2 0 0 0 2-2v-3\"/>"
};
/* render a Lucide icon by name into the shared stroke wrapper */
const lucide = (name,stroke,sz=16,fill='none') =>
  `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${LUCIDE[name]||''}</svg>`;
/* destination icons now resolve through Lucide too: ICONS[d.icon] is a Lucide key */
const svgIcon = (name,stroke,sz=16) => lucide(name,stroke,sz);
/* deterministic ticket serial from id */
const serial = id => 'ST-' + id.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3).padEnd(3,'X') + '·' +
  (id.length*37 % 900 + 100);
/* stylized QR (deterministic from seed) — finder patterns + seeded modules */
function qrSvg(seed,px=52){
  const N=21, cell=px/N;
  let s=0; for(const ch of seed) s=(s*31+ch.charCodeAt(0))>>>0;
  const rnd=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
  const finder=(r,c)=>{ // returns true/false if inside any finder block, else null
    for(const [R,C] of [[0,0],[0,N-7],[N-7,0]]){
      const lr=r-R, lc=c-C;
      if(lr>=0&&lc>=0&&lr<7&&lc<7){
        if(lr===0||lr===6||lc===0||lc===6) return true;       // outer ring
        return (lr>=2&&lr<=4&&lc>=2&&lc<=4);                   // inner 3x3
      }
    }
    return null;
  };
  let m='';
  for(let r=0;r<N;r++) for(let c=0;c<N;c++){
    const f=finder(r,c); let on;
    if(f!==null) on=f;
    else if((r<8&&c<8)||(r<8&&c>=N-8)||(r>=N-8&&c<8)) on=false; // quiet zone by finders
    else on=rnd()>0.52;
    if(on) m+=`<rect x="${(c*cell).toFixed(2)}" y="${(r*cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
  }
  return `<svg viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" fill="currentColor" shape-rendering="crispEdges">${m}</svg>`;
}

/* ---- actions ---- */
function setState(patch){ Object.assign(state,patch); render(); }

function answer(qi,oi){
  const answers = state.answers.slice(); answers[qi]=oi;
  let recId = state.recId; const seaBy = {...state.seaBy};
  if(answers[0]!=null && answers[1]!=null){
    const score = {tham_quan:0,kham_pha:0,thu_thach:0};
    [0,1].forEach(i=>{ const s=QUIZ[i].opts[answers[i]].s||{}; for(const k in s) score[k]+=s[k]; });
    recId = Object.keys(score).sort((a,b)=>score[b]-score[a])[0];
  }
  if(answers[2]!=null && recId){ seaBy[recId]=QUIZ[2].opts[answers[2]].sea; }
  setState({answers,recId,seaBy});
}
function viewRec(){
  const id=state.recId; if(!id) return;
  const el=document.getElementById('card-'+id);
  if(el){ const y=el.getBoundingClientRect().top+window.scrollY-90; window.scrollTo({top:y,behavior:'smooth'}); }
  selectCombo(id);
}
function toggleSea(id){ const seaBy={...state.seaBy}; seaBy[id]=!seaBy[id]; setState({seaBy}); }
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
/* select a combo — commit state, then play the tear on the fresh card.
   Committing first means the re-rendered card owns the animation, so its
   end frame lands exactly on the .sel resting transform with no snap. */
function selectCombo(id){
  if(state.selectedId===id) return;
  setState({selectedId:id});
  if(reducedMotion()) return;
  const card=document.getElementById('card-'+id);
  const stub=card && card.querySelector('.tear-stub');
  if(!stub) return;
  // start the stub un-torn, then animate it into the torn resting position
  card.classList.add('tearing');
  stub.addEventListener('animationend', ()=>card.classList.remove('tearing'), {once:true});
}
function toast(msg){
  setState({toast:msg}); clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>setState({toast:null}),2600);
}
function qty(type,delta){
  let {adults,children}=state;
  if(type==='adult') adults=Math.max(1,adults+delta); else children=Math.max(0,children+delta);
  setState({adults,children});
}
function buy(){
  if(!state.selectedId){ toast('Hãy chọn một combo trước nhé'); window.scrollTo({top:0,behavior:'smooth'}); return; }
  toast('Đã thêm '+comboOf(state.selectedId).name+' vào giỏ — demo UI');
}

/* ---- VR / explore / journey ---- */
const playlist = j => { const c=comboOf(j.comboId); let d=c.dest.slice(); if(state.seaBy[c.id]) d=d.concat(SEA_DEST); return d; };
function openPano(id){ setState({vr:{id}}); }
function closeVR(){ setState({vr:null}); }
function openExplore(id){ setState({exploreId:id||state.selectedId||state.recId||COMBOS[0].id}); }
function closeExplore(){ setState({exploreId:null}); }

function openJourney(id){ stopTimer(); setState({journey:{comboId:id,index:0,mode:'cinematic',playing:false,immersive:false}}); }
function closeJourney(){ stopTimer(); setState({journey:null}); }
function setMode(m){ setState({journey:{...state.journey,mode:m}}); }
function jNext(){ if(!state.journey) return; const pl=playlist(state.journey); setState({journey:{...state.journey,index:Math.min(state.journey.index+1,pl.length-1)}}); }
function jPrev(){ if(!state.journey) return; setState({journey:{...state.journey,index:Math.max(0,state.journey.index-1)}}); }
function jGoto(i){ setState({journey:{...state.journey,index:i}}); }
function toggleImmersive(){ setState({journey:{...state.journey,immersive:!state.journey.immersive}}); }
function togglePlay(){
  const playing=!state.journey.playing;
  setState({journey:{...state.journey,playing}});
  if(playing) startTimer(); else stopTimer();
}
function startTimer(){
  stopTimer();
  jTimer=setInterval(()=>{
    const j=state.journey; if(!j){ stopTimer(); return; }
    const pl=playlist(j);
    if(j.index>=pl.length-1){ stopTimer(); setState({journey:{...state.journey,playing:false}}); return; }
    jNext();
  },3800);
}
function stopTimer(){ if(jTimer){ clearInterval(jTimer); jTimer=null; } }
function journeyBuy(){ const c=comboOf(state.journey.comboId); stopTimer(); setState({selectedId:c.id,journey:null}); toast('Đã chọn '+c.name); }

/* ---- event delegation ---- */
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-act]'); if(!t) return;
  const act = t.dataset.act, id = t.dataset.id, qi=+t.dataset.qi, oi=+t.dataset.oi;
  switch(act){
    case 'answer': answer(qi,oi); break;
    case 'viewRec': viewRec(); break;
    case 'select': selectCombo(id); break;
    case 'sea': e.stopPropagation(); toggleSea(id); break;
    case 'sheet': e.stopPropagation(); setState({sheetId:id}); break;
    case 'closeSheet': setState({sheetId:null}); break;
    case 'sheetStop': e.stopPropagation(); break;
    case 'journey': e.stopPropagation(); openJourney(id); break;
    case 'explore': e.stopPropagation(); openExplore(id); break;
    case 'portal': e.stopPropagation(); openPano(id); break;
    case 'closeVR': closeVR(); break;
    case 'closeExplore': closeExplore(); break;
    case 'closeJourney': closeJourney(); break;
    case 'jBuy': journeyBuy(); break;
    case 'mode': setMode(t.dataset.mode); break;
    case 'jNext': jNext(); break;
    case 'jPrev': jPrev(); break;
    case 'jGoto': jGoto(+t.dataset.i); break;
    case 'jPlay': togglePlay(); break;
    case 'immersive': toggleImmersive(); break;
    case 'audio': toast('Đang phát giới thiệu: '+DEST[id].name); break;
    case 'adultAdd': qty('adult',1); break;
    case 'adultSub': qty('adult',-1); break;
    case 'childAdd': if(!comboOf(state.selectedId||'')?.childLocked) qty('child',1); break;
    case 'childSub': if(!comboOf(state.selectedId||'')?.childLocked) qty('child',-1); break;
    case 'buy': buy(); break;
  }
});
document.addEventListener('keydown', e=>{
  const t=e.target.closest('[data-key]'); if(!t) return;
  if(e.key==='Enter'||e.key===' '){ e.preventDefault(); selectCombo(t.dataset.id); }
});

/* ============================================================
   VIEW
   ============================================================ */
function viewTopbar(){
  return `<header class="topbar">
    <div class="brand">
      <span class="mk">Suối Tiên</span>
      <span class="ov">Du lịch Văn hoá</span>
    </div>
    <span class="vrchip"><span class="ring"></span>VR&nbsp;360°&nbsp;PANORAMA</span>
  </header>`;
}

/* dynamic quiz contents (chips + result) — re-rendered on each interaction */
function viewQuizBody(){
  const blocks = QUIZ.map((q,qi)=>`
    <div class="qblock">
      <div class="q"><span class="n">${qi+1}</span>${esc(q.q)}</div>
      <div class="chips">
        ${q.opts.map((o,oi)=>`<button class="chip ${state.answers[qi]===oi?'on':''}" data-act="answer" data-qi="${qi}" data-oi="${oi}">${esc(o.t)}</button>`).join('')}
      </div>
    </div>`).join('');

  let result='';
  if(state.recId){
    const c=comboOf(state.recId);
    const who=state.answers[0]!=null?QUIZ[0].opts[state.answers[0]]:null;
    const mood=state.answers[1]!=null?QUIZ[1].opts[state.answers[1]]:null;
    const seaYes=state.answers[2]!=null?QUIZ[2].opts[state.answers[2]].sea:false;
    let reason='';
    if(who&&mood) reason='Vì bạn đi cùng '+who.who+' và muốn '+mood.mood+(seaYes?', kèm Biển Tiên Đồng':'')+', nên ';
    reason+=c.name+' là lựa chọn hợp nhất cho hành trình cõi tiên của bạn.';
    const p=priceOf(c,!!state.seaBy[c.id]);
    result=`<div class="result">
      <span class="stamp">GỢI Ý CHO BẠN</span>
      <h3 class="serif">${esc(c.name)}</h3>
      <p>${esc(reason)}</p>
      <div class="go">
        <button class="btn btn-fill" data-act="viewRec">Xem combo này ${lucide('arrow-down','currentColor',14)}</button>
        <span class="serif" style="font-size:18px;color:var(--green-d)">${fmt(p.adult)} <span style="font-size:12px;color:var(--muted);font-family:'Be Vietnam Pro'">/ người lớn</span></span>
      </div>
    </div>`;
  }

  return blocks + result;
}

/* static quiz ticket shell — built once */
function viewQuizShell(){
  return `<div class="ticket">
    <div class="stripe top"></div>
    <div class="ticket-head">
      <div class="kick">
        <span class="tag-mono">${lucide('sparkle','currentColor',13)} Bộ máy gợi ý</span>
        <span class="serial">${serial('quiz')}</span>
      </div>
      <h2 class="serif">Chọn nhanh — chúng tôi tính giúp</h2>
      <p>Trả lời 3 câu, nhận combo điểm cao nhất kèm lý do.</p>
    </div>
    <div class="perf"></div>
    <div id="quizBody" class="ticket-body"></div>
    <div class="stripe bottom"></div>
  </div>`;
}

function viewHero(){
  const radar = `<svg class="radar" viewBox="0 0 200 200" fill="none">
    ${[88,66,44,24].map((r,i)=>`<circle cx="100" cy="100" r="${r}" stroke="#8CC63F" stroke-opacity="${0.5-i*0.08}" stroke-width="1" ${i%2?'stroke-dasharray="3 4"':''}/>`).join('')}
    <circle cx="100" cy="100" r="3" fill="#8CC63F"/>
    <line x1="100" y1="12" x2="100" y2="188" stroke="#8CC63F" stroke-opacity="0.16"/>
    <line x1="12" y1="100" x2="188" y2="100" stroke="#8CC63F" stroke-opacity="0.16"/>
  </svg>`;
  return `<section class="hero">
    ${radar}
    <div class="hero-wrap">
      <div>
        <span class="overline eyebrow"><span class="bar"></span>Vé Combo · Hành trình 360°</span>
        <h1 class="serif">Để chúng tôi gợi ý<br>hành trình <em>cõi tiên</em><br>hợp với bạn</h1>
        <p class="lede">Trả lời <b>3 câu hỏi nhỏ</b> để nhận combo phù hợp kèm lý do — rồi <b>xem trước từng điểm đến bằng VR 360°</b> trước khi mua. Hành trình tự động hoặc khám phá tự do, tuỳ bạn.</p>
        <div class="statstrip">
          <div class="cell"><div class="num serif" data-target="17">0</div><div class="lab">điểm đến<br>360°</div></div>
          <div class="cell"><div class="num serif" data-target="3">0</div><div class="lab">combo<br>linh hoạt</div></div>
          <div class="cell"><div class="num serif" data-target="3">0</div><div class="lab">chế độ<br>hành trình</div></div>
        </div>
      </div>
      ${viewQuizShell()}
    </div>
  </section>`;
}

function viewCombo(c){
  const sea=!!state.seaBy[c.id];
  const p=priceOf(c,sea);
  const total=c.dest.length+(sea?SEA_DEST.length:0);
  const sel=state.selectedId===c.id, rec=state.recId===c.id;
  const childStr = p.child!=null ? fmt(p.child) : 'giá chung';
  const hl=c.dest.slice(0,4).map(id=>{
    const d=DEST[id];
    return `<div class="hl-item">
      <span class="hl-ic">${svgIcon(d.icon,c.accent,15)}</span>
      <span style="min-width:0"><span class="hl-nm">${esc(d.name)}</span><span class="hl-ty">${esc(d.type)}</span></span>
    </div>`;
  }).join('');

  return `<article id="card-${c.id}" class="combo ${sel?'sel':''}" tabindex="0" role="button"
      data-act="select" data-key="1" data-id="${c.id}"
      style="--accent:${c.accent};--soft:${c.soft}">

    <!-- TOP STUB · cuống (xé khi chọn) -->
    <div class="tk-top tear-stub">
      <span class="bl">Vé Combo · ${esc(c.group)}</span>
      <span class="br">${rec?lucide('sparkle','currentColor',12)+' Gợi ý cho bạn':serial(c.id)}</span>
    </div>

    <!-- MIDDLE BODY -->
    <div class="tk-body">
      <div class="kc-head">
        <div style="flex:1;min-width:0">
          <div class="lbl">Tên combo</div>
          <h3 class="cname serif">${esc(c.name)}</h3>
          <div class="aud">${esc(c.audience)}</div>
        </div>
        <div class="tk-qr"><span class="qrbox">${qrSvg(c.id,54)}</span><span class="qrlb mono">Quét 360°</span></div>
      </div>
      <div class="price-row">
        <div><div class="lbl">Người lớn</div><div class="price-big serif">${fmt(p.adult)}</div></div>
        <div><div class="lbl">Trẻ em</div><div class="val">${esc(childStr)}</div></div>
        <span class="chip-meta mono">${total} điểm · VR 360°</span>
      </div>
      <div class="hl-list">${hl}</div>
      <div class="strip">
        <label class="addon-inline ${sea?'on':''}" data-act="sea" data-id="${c.id}">
          <span class="toggle"><span class="knob"></span></span>Thêm Biển Tiên Đồng
        </label>
        <button class="morelink" data-act="sheet" data-id="${c.id}">+${total-4} điểm · Chi tiết ${lucide('arrow-right','currentColor',13)}</button>
      </div>
    </div>

    <!-- BOTTOM STUB · nút bấm -->
    <div class="tk-foot">
      <div class="pair">
        <button class="btn btn-line" style="color:${c.accent}" data-act="journey" data-id="${c.id}">${lucide('play',c.accent,13,c.accent)}Hành trình 360°</button>
        <button class="btn btn-ghost" data-act="explore" data-id="${c.id}">${lucide('layers','#6E7A6C',14)}Khám phá</button>
      </div>
      <button class="btn cta ${sel?'btn-ink':'btn-fill'}" style="${sel?'':'background:'+c.accent}" data-act="select" data-id="${c.id}">${sel?lucide('check','currentColor',15)+' Đang chọn combo này':'Chọn combo này'}</button>
    </div>
  </article>`;
}

function renderCombos(){ return COMBOS.map(viewCombo).join(''); }

function viewCombosShell(){
  return `<section class="section">
    <div class="sec-head">
      <span class="overline eyebrow"><span class="bar"></span>Combo đang mở bán</span>
      <h2 class="serif">So sánh và chọn nhanh</h2>
      <p>Mỗi combo có thể thêm <b>Biển Tiên Đồng</b> (công viên nước). Bấm <b>Hành trình 360°</b> để xem trước, hoặc <b>Khám phá tự do</b> trên bản đồ.</p>
    </div>
    <div id="comboGrid" class="grid"></div>
  </section>`;
}

function viewBuybar(){
  const c=state.selectedId?comboOf(state.selectedId):null;
  const sea=c?!!state.seaBy[c.id]:false;
  const p=c?priceOf(c,sea):{adult:0,child:0};
  const children=c&&c.childLocked?0:state.children;
  const total=c?(state.adults*p.adult + children*(p.child||0)):0;
  const childLocked=c?!!c.childLocked:false;

  const info = c
    ? `<div class="buy-info">
         <div class="grp">${esc(c.group)}</div>
         <div class="nm">${esc(c.name)}</div>
         <div class="sea">${sea?'+ Biển Tiên Đồng':' '}</div>
       </div>`
    : `<div class="buy-empty">Chưa chọn combo — hãy chọn hoặc làm quiz gợi ý.</div>`;

  return `<div class="buybar">
    <div class="buybar-wrap">
      ${info}
      <div class="buy-right">
        <div class="stepper">
          <span class="cap">Người lớn</span>
          <button data-act="adultSub">${lucide('minus','currentColor',16)}</button>
          <span class="v">${state.adults}</span>
          <button data-act="adultAdd">${lucide('plus','currentColor',16)}</button>
        </div>
        <div class="stepper" style="opacity:${childLocked?.4:1}">
          <span class="cap">Trẻ em</span>
          <button data-act="childSub">${lucide('minus','currentColor',16)}</button>
          <span class="v">${children}</span>
          <button data-act="childAdd">${lucide('plus','currentColor',16)}</button>
        </div>
        <div class="total">
          <div class="cap">Tổng tạm tính</div>
          <div class="v">${fmt(total)}</div>
        </div>
        <button class="btn btn-fill" style="padding:13px 26px;font-size:15px" data-act="buy">Mua vé</button>
      </div>
    </div>
  </div>`;
}

function viewSheet(){
  if(!state.sheetId) return '';
  const c=comboOf(state.sheetId); const sea=!!state.seaBy[c.id];
  let ids=c.dest.slice(); if(sea) ids=ids.concat(SEA_DEST);
  const rows=ids.map(id=>{
    const d=DEST[id];
    return `<div class="destrow ${d.sea?'sea':''}">
      <span class="ic">${svgIcon(d.icon,d.sea?'#0E7E85':c.accent,19)}</span>
      <div style="flex:1"><div class="nm">${esc(d.name)}</div><div class="ty">${esc(d.type)}</div></div>
      <button class="portal" data-act="portal" data-id="${id}" title="Xem 360°"><span>360°</span></button>
    </div>`;
  }).join('');
  return `<div class="scrim" data-act="closeSheet">
    <div class="sheet" data-act="sheetStop" style="--accent:${c.accent}">
      <div class="ticket-stub">
        <div class="grp">${esc(c.group)} · Vé combo</div>
        <h3 class="serif">${esc(c.name)}</h3>
        <div class="cnt">${ids.length} điểm đến · 360°</div>
        <div class="stub-qr">${qrSvg(c.id,66)}</div>
        <div class="qrlb">Quét xem 360°</div>
      </div>
      <div class="ticket-main">
        <div class="sheet-head">
          <div>
            <div class="mhd">Điểm đến trong combo</div>
            <div class="msub">Chạm cổng 360° để xem trước từng nơi</div>
          </div>
          <button class="xbtn" data-act="closeSheet">${lucide('x','currentColor',18)}</button>
        </div>
        <div class="dest-grid">${rows}</div>
      </div>
    </div>
  </div>`;
}

function viewToast(){
  return state.toast ? `<div class="toast">${esc(state.toast)}</div>` : '';
}

/* ---- mode icons (Lucide names) ---- */
const MODE_IC = { cinematic:'film', map:'map', family:'users' };

/* ===================== VR VIEWER ===================== */
function viewVR(){
  if(!state.vr) return '';
  const d=DEST[state.vr.id];
  return `<div class="screen vr">
    <div class="vrbg"></div>
    <div class="vr-card">
      <div class="overline" style="color:var(--lime);display:inline-flex;align-items:center;gap:9px"><span class="dotmk"></span>VR 360° · Xem trước</div>
      <h2 class="serif" style="font-size:30px;color:#FCF8EE;margin:13px 0 5px">${esc(d.name)}</h2>
      <div style="font-size:13px;color:var(--lime)">${esc(d.type)}</div>
      <div class="panocode mono">pano_${esc(state.vr.id)}</div>
      <p class="vr-note">Placeholder cảnh 360° — engine 3DVista sẽ render đè vào <b style="color:var(--lime)">#viewer</b> trong cùng cửa sổ.</p>
      <button class="btn ghost-d" data-act="closeVR">${lucide('chevron-left','currentColor',16)} Quay lại combo</button>
    </div>
  </div>`;
}

/* ===================== FREE EXPLORE ===================== */
function viewExplore(){
  if(!state.exploreId) return '';
  const c=comboOf(state.exploreId); const sea=!!state.seaBy[c.id];
  let ids=c.dest.slice(); if(sea) ids=ids.concat(SEA_DEST);

  const pins=ids.map(id=>{
    const d=DEST[id];
    return `<button class="mappin ${d.sea?'sea':''}" data-act="portal" data-id="${id}" title="${esc(d.name)}" style="left:${d.mx}%;top:${d.my}%">
      <span class="head">${svgIcon(d.icon,'#fff',15)}</span>
      <span class="lab">${esc(d.name)}</span>
    </button>`;
  }).join('');

  const tiles=ids.map(id=>{
    const d=DEST[id];
    return `<button class="tile ${d.sea?'sea':''}" data-act="portal" data-id="${id}">
      <span class="ic">${svgIcon(d.icon,d.sea?'#0E7E85':'#0A7C3E',19)}</span>
      <span><span class="nm">${esc(d.name)}</span><span class="ty">${esc(d.type)}</span></span>
      <span class="open mono">Mở 360° ${lucide('arrow-right','currentColor',13)}</span>
    </button>`;
  }).join('');

  return `<div class="screen explore">
    <div class="exp-head">
      <div style="flex:1">
        <div class="overline" style="color:var(--green)">Khám phá tự do · ${esc(c.group)}</div>
        <h2 class="serif" style="font-size:clamp(20px,2.6vw,26px);color:var(--green-d);margin-top:4px">Bản đồ cõi tiên — chạm điểm bất kỳ để mở 360°</h2>
      </div>
      <button class="btn btn-ghost" data-act="closeExplore">${lucide('chevron-left','currentColor',16)} Quay lại</button>
    </div>
    <div class="exp-wrap">
      <div class="mapbox">
        <svg viewBox="0 0 100 68" preserveAspectRatio="none" class="mapsvg">
          <ellipse cx="22" cy="26" rx="24" ry="18" fill="#0A7C3E" opacity="0.08"></ellipse>
          <ellipse cx="80" cy="42" rx="20" ry="20" fill="#E2571E" opacity="0.09"></ellipse>
          <ellipse cx="55" cy="60" rx="30" ry="13" fill="#0E8F6E" opacity="0.16"></ellipse>
          <ellipse cx="50" cy="44" rx="13" ry="7.5" fill="#3FB6BE" opacity="0.32"></ellipse>
          <path d="M13 18 Q 22 30 33 30 T 52 33 Q 70 34 73 44 T 56 60" fill="none" stroke="#6FA52C" stroke-width="0.7" stroke-dasharray="2.2 2.2"></path>
          <text x="14" y="9" font-size="2.5" fill="#0A7C3E" font-family="DM Mono,monospace" opacity="0.7" letter-spacing="0.3">KHU TÂM LINH · VĂN HOÁ</text>
          <text x="70" y="16" font-size="2.5" fill="#E2571E" font-family="DM Mono,monospace" opacity="0.75" letter-spacing="0.3">KHU TRÒ CHƠI</text>
          <text x="40" y="66" font-size="2.5" fill="#0E7E85" font-family="DM Mono,monospace" opacity="0.85" letter-spacing="0.3">BIỂN TIÊN ĐỒNG</text>
        </svg>
        ${pins}
      </div>
      <div class="exp-legend">
        <span><span class="sw" style="background:#E2571E"></span>Điểm trong combo</span>
        <span><span class="sw" style="background:#0E8F6E"></span>Biển Tiên Đồng</span>
        <span style="margin-left:auto;color:var(--muted)">${ids.length} điểm · không theo thứ tự, tuỳ bạn</span>
      </div>
      <div class="tiles">${tiles}</div>
    </div>
  </div>`;
}

/* ===================== JOURNEY 360 ===================== */
function viewJourney(){
  if(!state.journey) return '';
  const j=state.journey, c=comboOf(j.comboId);
  const pl=playlist(j), curId=pl[j.index], cur=DEST[curId];
  const human=j.index+1, total=pl.length, imm=j.immersive;
  const progress=(total>1?(j.index/(total-1)*100):100).toFixed(1)+'%';
  const route=pl.map(id=>DEST[id].mx+','+(DEST[id].my*0.68).toFixed(1)).join(' ');
  const doneRoute=pl.slice(0,human).map(id=>DEST[id].mx+','+(DEST[id].my*0.68).toFixed(1)).join(' ');
  const cine=j.mode==='cinematic', map=j.mode==='map', fam=j.mode==='family';

  const stepState=i=> i<j.index?'done':(i===j.index?'active':'next');

  // timeline chips
  const timeline=pl.map((id,i)=>{
    const st=stepState(i);
    return `<button class="tl-step ${st}" data-act="jGoto" data-i="${i}">
      <span class="n">${i+1}</span>
      <span class="nm">${esc(DEST[id].name)}</span>
    </button>`;
  }).join('');

  // map-mode itinerary
  const itin=pl.map((id,i)=>{
    const st=stepState(i);
    return `<button class="itin ${st}" data-act="jGoto" data-i="${i}">
      <span class="n">${i+1}</span><span class="nm">${esc(DEST[id].name)}</span>
    </button>`;
  }).join('');

  // big map pins
  const bigPins=pl.map((id,i)=>{
    const st=stepState(i);
    return `<button class="bigpin ${st}" data-act="jGoto" data-i="${i}" title="${esc(DEST[id].name)}" style="left:${DEST[id].mx}%;top:${DEST[id].my}%">
      <span class="dot">${i+1}</span>${i===j.index?`<span class="lab">${esc(DEST[id].name)}</span>`:''}
    </button>`;
  }).join('');
  // minimap dots
  const miniDots=pl.map((id,i)=>{
    const st=stepState(i);
    return `<span class="minidot ${st}" style="left:${DEST[id].mx}%;top:${DEST[id].my}%"></span>`;
  }).join('');

  const audioWave=`<span class="wave">${'<i></i>'.repeat(5)}</span>`;

  return `<div class="screen journey">
    <div class="vrbg slow"></div>

    <!-- top bar -->
    <div class="j-top" style="display:${imm?'none':'flex'}">
      <button class="j-ghost" data-act="closeJourney">${lucide('chevron-left','currentColor',16)} Thoát</button>
      <div class="j-title">
        <div class="mono kk">${esc(c.group)} · Hành trình 360°</div>
        <div class="serif nm">${esc(c.name)}</div>
      </div>
      <button class="btn" style="background:var(--lime);color:var(--forest-2);padding:9px 16px;font-size:13px" data-act="jBuy">Mua combo</button>
    </div>

    <!-- mode tabs -->
    <div class="j-tabs" style="display:${imm?'none':'flex'}">
      ${[['cinematic','Điện ảnh'],['map','Bản đồ'],['family','Gia đình']].map(([m,lab])=>
        `<button class="j-tab ${j.mode===m?'on':''}" data-act="mode" data-mode="${m}">${lucide(MODE_IC[m],j.mode===m?'var(--forest-2)':'#CFE3D2',15)}${lab}</button>`).join('')}
    </div>

    <!-- stage -->
    <div class="j-stage">
      <!-- cinematic center title -->
      <div class="cine-title" style="display:${cine?'block':'none'}">
        <div class="mono kk">Đang xem điểm ${human}/${total}</div>
        <div class="serif big">${esc(cur.name)}</div>
        <div class="ty">${esc(cur.type)}</div>
      </div>
      <span class="hotspot" style="display:${cine?'block':'none'};left:34%;top:54%"></span>
      <span class="hotspot d" style="display:${cine?'block':'none'};left:66%;top:44%"></span>

      <!-- cinematic minimap -->
      <div class="minimap" style="display:${cine&&!imm?'block':'none'}">
        <div class="mono kk" style="margin-bottom:8px">Sơ đồ hành trình</div>
        <div class="minibox">
          <svg viewBox="0 0 100 68" preserveAspectRatio="none" class="mapsvg"><polyline points="${route}" fill="none" stroke="rgba(140,198,63,.6)" stroke-width="0.8" stroke-dasharray="2 2"></polyline></svg>
          ${miniDots}
        </div>
        <div class="mini-legend"><span><span class="sw" style="background:var(--lime)"></span>Hiện tại</span><span><span class="sw" style="background:var(--orange)"></span>Sắp tới</span></div>
      </div>

      <!-- cinematic audio -->
      <div class="audiobox" style="display:${cine&&!imm?'flex':'none'}">
        <span class="spk">${lucide('volume','var(--lime)',20)}</span>
        <div><div class="mono kk">Đang giới thiệu</div><div class="nm">${esc(cur.name)}</div></div>
        ${audioWave}
      </div>

      <!-- map mode -->
      <div class="mapmode" style="display:${map&&!imm?'flex':'none'}">
        <div class="itinbox">
          <div class="mono kk" style="margin-bottom:10px">Lộ trình gợi ý</div>
          ${itin}
        </div>
        <div class="bigmap">
          <svg viewBox="0 0 100 68" preserveAspectRatio="none" class="mapsvg">
            <ellipse cx="22" cy="26" rx="24" ry="18" fill="#8CC63F" opacity="0.07"></ellipse>
            <ellipse cx="80" cy="42" rx="20" ry="20" fill="#E2571E" opacity="0.12"></ellipse>
            <ellipse cx="55" cy="60" rx="30" ry="13" fill="#0E8F6E" opacity="0.2"></ellipse>
            <polyline points="${route}" fill="none" stroke="rgba(140,198,63,.85)" stroke-width="0.7" stroke-dasharray="2.2 2"></polyline>
            <polyline points="${doneRoute}" fill="none" stroke="#8CC63F" stroke-width="1.1"></polyline>
          </svg>
          ${bigPins}
          <div class="pip"><div class="pipbg"></div><div class="piplabel">${lucide('pin','currentColor',14)} ${esc(cur.name)}</div></div>
        </div>
      </div>

      <!-- family mode -->
      <div class="fammode" style="display:${fam&&!imm?'flex':'none'}">
        <div class="mono" style="font-size:16px;letter-spacing:.06em;color:var(--lime);font-weight:600">Điểm ${human} / ${total}</div>
        <div class="serif famname">${esc(cur.name)}</div>
        <div class="famtype">${esc(cur.type)}</div>
        <button class="fam-audio" data-act="audio" data-id="${curId}">${lucide('volume','var(--forest-2)',22)} Nghe giới thiệu</button>
        <div class="fam-nav">
          <button class="fam-circ ghost" data-act="jPrev">${lucide('chevron-left','currentColor',32)}</button>
          <span class="mono" style="font-size:14px;color:#9DBCA9;min-width:90px;text-align:center">Điểm trước · sau</span>
          <button class="fam-circ fill" data-act="jNext">${lucide('chevron-right','currentColor',32)}</button>
        </div>
      </div>

      <!-- immersive FAB -->
      <button class="j-fab" style="display:${imm?'flex':'none'}" data-act="immersive">${lucide('maximize','currentColor',22)}</button>
    </div>

    <!-- timeline -->
    <div class="j-timeline" style="display:${(cine||map)&&!imm?'flex':'none'}">
      <div class="tl-bar"><span class="mono" style="font-size:12px;color:#9DBCA9">${human} / ${total}</span><div class="tl-track"><div class="tl-fill" style="width:${progress}"></div></div></div>
      <div class="tl-steps">${timeline}</div>
      <div class="tl-actions">
        <button class="btn" style="background:var(--green);color:#fff" data-act="jPlay">${j.playing?lucide('pause','currentColor',14,'currentColor')+' Tạm dừng':lucide('play','currentColor',14,'currentColor')+' Tự động'}</button>
        <button class="j-ghost-btn" data-act="jPrev">${lucide('chevron-left','currentColor',15)} Trước</button>
        <button class="j-ghost-btn" data-act="jNext">Tiếp ${lucide('chevron-right','currentColor',15)}</button>
        <button class="j-ghost-btn" style="color:var(--lime)" data-act="immersive">${lucide('maximize','currentColor',15)} Toàn cảnh</button>
      </div>
    </div>
  </div>`;
}

/* ---- targeted re-render: only the dynamic regions ---- */
function render(){
  const qb=document.getElementById('quizBody'); if(qb) qb.innerHTML=viewQuizBody();
  const cg=document.getElementById('comboGrid'); if(cg) cg.innerHTML=renderCombos();
  const bs=document.getElementById('buyslot'); if(bs){ bs.innerHTML=viewBuybar(); measureChrome(); }
  const ov=document.getElementById('overlays'); if(ov) ov.innerHTML=viewSheet()+viewExplore()+viewJourney()+viewVR()+viewToast();
}

/* keep hero height = viewport minus the sticky topbar & fixed buy bar */
function measureChrome(){
  const root=document.documentElement;
  const tb=document.querySelector('.topbar');
  const bb=document.querySelector('.buybar');
  if(tb) root.style.setProperty('--topbar', Math.round(tb.offsetHeight)+'px');
  if(bb) root.style.setProperty('--buybar', Math.round(bb.offsetHeight)+'px');
}

/* count-up the hero stats once */
function animateStats(){
  document.querySelectorAll('.statstrip .num').forEach(el=>{
    const target=+el.dataset.target||0, dur=1200, t0=performance.now();
    const tick=now=>{ const p=Math.min(1,(now-t0)/dur);
      el.textContent=Math.round(target*(1-Math.pow(1-p,3)));
      if(p<1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

/* reveal section header + stagger combo cards when scrolled into view */
function setupReveal(){
  if(!('IntersectionObserver' in window)){ document.querySelector('.sec-head')?.classList.add('reveal'); return; }
  const io=new IntersectionObserver((ents,obs)=>{
    ents.forEach(e=>{ if(!e.isIntersecting) return;
      e.target.classList.add('reveal');
      if(e.target.id==='comboGrid') setTimeout(()=>e.target.classList.remove('reveal'),1400);
      obs.unobserve(e.target);
    });
  },{threshold:.16});
  ['.sec-head','#comboGrid'].forEach(s=>{ const el=document.querySelector(s); if(el) io.observe(el); });
}

/* ---- build the static shell once, then fill dynamic regions ---- */
function mount(){
  const app=document.getElementById('app');
  app.innerHTML =
    viewTopbar() +
    `<div style="overflow-x:hidden">` + viewHero() + viewCombosShell() + `</div>` +
    `<div id="buyslot"></div>` +
    `<div id="overlays"></div>`;
  render();
  measureChrome();
  animateStats();
  setupReveal();
  // drop the intro gate after the entrance plays so interactions don't replay it
  setTimeout(()=>app.classList.remove('intro'), 1700);
}
fetch("data.json")
  .then(r => r.json())
  .then(d => { ICONS=d.ICONS; DEST=d.DEST; SEA_DEST=d.SEA_DEST; COMBOS=d.COMBOS; QUIZ=d.QUIZ; mount(); })
  .catch(e => { document.getElementById("app").innerHTML = "<p style=padding:40px>Khong tai duoc data.json (can chay qua server/Live Server).</p>"; console.error(e); });
window.addEventListener('resize', measureChrome);
