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
const svgIcon = (path,stroke,sz=16) =>
  `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"></path></svg>`;
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
    case 'audio': toast('🔊 Đang phát giới thiệu: '+DEST[id].name); break;
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
        <button class="btn btn-fill" data-act="viewRec">Xem combo này ↓</button>
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
        <span class="tag-mono">✦ Bộ máy gợi ý</span>
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
      <span class="hl-ic">${svgIcon(ICONS[d.icon],c.accent,15)}</span>
      <span style="min-width:0"><span class="hl-nm">${esc(d.name)}</span><span class="hl-ty">${esc(d.type)}</span></span>
    </div>`;
  }).join('');

  return `<article id="card-${c.id}" class="combo ${sel?'sel':''}" tabindex="0" role="button"
      data-act="select" data-key="1" data-id="${c.id}"
      style="--accent:${c.accent};--soft:${c.soft}">

    <!-- TOP STUB · cuống (xé khi chọn) -->
    <div class="tk-top tear-stub">
      <span class="bl">Vé Combo · ${esc(c.group)}</span>
      <span class="br">${rec?'✦ Gợi ý cho bạn':serial(c.id)}</span>
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
        <button class="morelink" data-act="sheet" data-id="${c.id}">+${total-4} điểm · Chi tiết →</button>
      </div>
    </div>

    <!-- BOTTOM STUB · nút bấm -->
    <div class="tk-foot">
      <div class="pair">
        <button class="btn btn-line" style="color:${c.accent}" data-act="journey" data-id="${c.id}">${svgIcon('M8 5v14l11-7z',c.accent,13).replace('fill="none"','fill="'+c.accent+'"')}Hành trình 360°</button>
        <button class="btn btn-ghost" data-act="explore" data-id="${c.id}">${svgIcon('M9 4l-6 3v13l6-3 6 3 6-3V4l-6 3-6-3zM9 4v13M15 7v13','#6E7A6C',14)}Khám phá</button>
      </div>
      <button class="btn cta ${sel?'btn-ink':'btn-fill'}" style="${sel?'':'background:'+c.accent}" data-act="select" data-id="${c.id}">${sel?'✓ Đang chọn combo này':'Chọn combo này'}</button>
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
    <footer class="fine">
      Bản thiết kế giao diện minh hoạ — mỗi cổng tròn 360° gọi <code>open_panorama_by_id(pano_id)</code> để mở cảnh tương ứng. Hình ảnh panorama dùng placeholder, sẵn sàng gắn engine thật vào <code>#viewer</code>.
    </footer>
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
          <button data-act="adultSub">−</button>
          <span class="v">${state.adults}</span>
          <button data-act="adultAdd">+</button>
        </div>
        <div class="stepper" style="opacity:${childLocked?.4:1}">
          <span class="cap">Trẻ em</span>
          <button data-act="childSub">−</button>
          <span class="v">${children}</span>
          <button data-act="childAdd">+</button>
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
      <span class="ic">${svgIcon(ICONS[d.icon],d.sea?'#0E7E85':c.accent,19)}</span>
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
          <button class="xbtn" data-act="closeSheet">✕</button>
        </div>
        <div class="dest-grid">${rows}</div>
      </div>
    </div>
  </div>`;
}

function viewToast(){
  return state.toast ? `<div class="toast">${esc(state.toast)}</div>` : '';
}

/* ---- mode icons (SVG, no emoji) ---- */
const MODE_IC = {
  cinematic:'M4 5h16v14H4zM4 9h16M9 5v14M15 5v14',
  map:'M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5z',
  family:'M9 11a3 3 0 100-6 3 3 0 000 6zM17 10.5a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zM3 20c0-3 2.6-5 6-5s6 2 6 5M15.5 20c0-2 .8-3.6 2-4.4'
};

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
      <button class="btn ghost-d" data-act="closeVR">‹ Quay lại combo</button>
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
      <span class="head">${svgIcon(ICONS[d.icon],'#fff',15)}</span>
      <span class="lab">${esc(d.name)}</span>
    </button>`;
  }).join('');

  const tiles=ids.map(id=>{
    const d=DEST[id];
    return `<button class="tile ${d.sea?'sea':''}" data-act="portal" data-id="${id}">
      <span class="ic">${svgIcon(ICONS[d.icon],d.sea?'#0E7E85':'#0A7C3E',19)}</span>
      <span><span class="nm">${esc(d.name)}</span><span class="ty">${esc(d.type)}</span></span>
      <span class="open mono">Mở 360° →</span>
    </button>`;
  }).join('');

  return `<div class="screen explore">
    <div class="exp-head">
      <div style="flex:1">
        <div class="overline" style="color:var(--green)">Khám phá tự do · ${esc(c.group)}</div>
        <h2 class="serif" style="font-size:clamp(20px,2.6vw,26px);color:var(--green-d);margin-top:4px">Bản đồ cõi tiên — chạm điểm bất kỳ để mở 360°</h2>
      </div>
      <button class="btn btn-ghost" data-act="closeExplore">‹ Quay lại</button>
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
      <button class="j-ghost" data-act="closeJourney">‹ Thoát</button>
      <div class="j-title">
        <div class="mono kk">${esc(c.group)} · Hành trình 360°</div>
        <div class="serif nm">${esc(c.name)}</div>
      </div>
      <button class="btn" style="background:var(--lime);color:var(--forest-2);padding:9px 16px;font-size:13px" data-act="jBuy">Mua combo</button>
    </div>

    <!-- mode tabs -->
    <div class="j-tabs" style="display:${imm?'none':'flex'}">
      ${[['cinematic','Điện ảnh'],['map','Bản đồ'],['family','Gia đình']].map(([m,lab])=>
        `<button class="j-tab ${j.mode===m?'on':''}" data-act="mode" data-mode="${m}">${svgIcon(MODE_IC[m],j.mode===m?'var(--forest-2)':'#CFE3D2',15)}${lab}</button>`).join('')}
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
        <span class="spk">${svgIcon('M4 9v6h4l5 4V5L8 9H4zM16 8a4 4 0 010 8',' var(--lime)',20)}</span>
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
          <div class="pip"><div class="pipbg"></div><div class="piplabel">📍 ${esc(cur.name)}</div></div>
        </div>
      </div>

      <!-- family mode -->
      <div class="fammode" style="display:${fam&&!imm?'flex':'none'}">
        <div class="mono" style="font-size:16px;letter-spacing:.06em;color:var(--lime);font-weight:600">Điểm ${human} / ${total}</div>
        <div class="serif famname">${esc(cur.name)}</div>
        <div class="famtype">${esc(cur.type)}</div>
        <button class="fam-audio" data-act="audio" data-id="${curId}">${svgIcon('M4 9v6h4l5 4V5L8 9H4zM16 8a4 4 0 010 8','var(--forest-2)',22)} Nghe giới thiệu</button>
        <div class="fam-nav">
          <button class="fam-circ ghost" data-act="jPrev">‹</button>
          <span class="mono" style="font-size:14px;color:#9DBCA9;min-width:90px;text-align:center">Điểm trước · sau</span>
          <button class="fam-circ fill" data-act="jNext">›</button>
        </div>
      </div>

      <!-- immersive FAB -->
      <button class="j-fab" style="display:${imm?'flex':'none'}" data-act="immersive">⤢</button>
    </div>

    <!-- timeline -->
    <div class="j-timeline" style="display:${(cine||map)&&!imm?'flex':'none'}">
      <div class="tl-bar"><span class="mono" style="font-size:12px;color:#9DBCA9">${human} / ${total}</span><div class="tl-track"><div class="tl-fill" style="width:${progress}"></div></div></div>
      <div class="tl-steps">${timeline}</div>
      <div class="tl-actions">
        <button class="btn" style="background:var(--green);color:#fff" data-act="jPlay">${j.playing?'⏸ Tạm dừng':'▶ Tự động'}</button>
        <button class="j-ghost-btn" data-act="jPrev">‹ Trước</button>
        <button class="j-ghost-btn" data-act="jNext">Tiếp ›</button>
        <button class="j-ghost-btn" style="color:var(--lime)" data-act="immersive">⤢ Toàn cảnh</button>
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
