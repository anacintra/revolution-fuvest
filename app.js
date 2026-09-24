
const D=window.REVOLUTION_DATA;
const KEY="revolution_fuvest2026_v1";
const app=document.getElementById("app");
const letters=["A","B","C","D","E"];
let state=load()||{
  started:false,current:0,answers:{},answeredAt:{},startedAt:null,
  finished:false,finishedAt:null,remaining:D.durationMinutes*60
};
let tick=null;

function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function load(){try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmt(sec){sec=Math.max(0,Math.floor(sec));let h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return [h,m,s].map(x=>String(x).padStart(2,"0")).join(":")}
function startTimer(){
  clearInterval(tick);
  tick=setInterval(()=>{
    if(!state.started||state.finished)return;
    const elapsed=Math.floor((Date.now()-state.startedAt)/1000);
    state.remaining=Math.max(0,D.durationMinutes*60-elapsed);
    const el=document.getElementById("timer");if(el)el.textContent=fmt(state.remaining);
    if(state.remaining<=0){finish()}
    save();
  },1000)
}
function home(){
  clearInterval(tick);
  const resume=state.started&&!state.finished;
  app.innerHTML=`
  <section class="hero">
    <div class="hero-head">
      <div class="eyebrow">Simulado Revolution</div>
      <h1>FUVEST 2026 • 1ª fase</h1>
      <p>Prova V1 transformada em experiência interativa, questão por questão.</p>
    </div>
    <div class="hero-body">
      <div class="notice"><b>Como funciona:</b> você responde uma questão e recebe a correção imediatamente, no mesmo estilo do simulador de referência. A questão 3 foi anulada e conta como ponto para todos.</div>
      <div class="grid">
        <div class="info"><b>📄 PROVA</b><span>90 questões objetivas<br>5 alternativas por questão</span></div>
        <div class="info"><b>⏱ TEMPO OFICIAL</b><span>5 horas<br>cronômetro regressivo</span></div>
        <div class="info"><b>✅ CORREÇÃO</b><span>Gabarito final/retificado<br>feedback após cada resposta</span></div>
        <div class="info"><b>💾 PROGRESSO</b><span>Salvo neste aparelho<br>pode fechar e continuar</span></div>
      </div>
      <button class="primary big" id="start">${resume?"Continuar simulado →":"Entendi — iniciar simulado →"}</button>
      ${state.finished?`<button class="secondary" style="width:100%;margin-top:10px" id="resultBtn">Ver meu último resultado</button>`:""}
    </div>
  </section>`;
  document.getElementById("start").onclick=()=>{
    if(!state.started||state.finished){
      state={started:true,current:0,answers:{},answeredAt:{},startedAt:Date.now(),finished:false,finishedAt:null,remaining:D.durationMinutes*60};
      save()
    }
    renderQ()
  };
  const rb=document.getElementById("resultBtn");if(rb)rb.onclick=renderResult;
}
function renderQ(){
  state.started=true;save();startTimer();
  const q=D.questions[state.current];
  const chosen=state.answers[q.n]??null;
  const locked=chosen!==null || q.annulled;
  let feedback="";
  if(q.annulled){
    feedback=`<div class="feedback"><b>Questão anulada.</b> ${esc(q.comment)}</div>`;
  }else if(chosen!==null){
    const ok=chosen===q.answer;
    feedback=`<div class="feedback ${ok?"good":"bad"}"><b>${ok?"✓ Você acertou.":"✕ Você marcou "+chosen+". A correta é "+q.answer+"."}</b><br>${esc(q.comment)}</div>`;
  }
  const opts=q.imageChoices
    ? letters.map(l=>`<button class="option ${choiceClass(q,l,chosen)} ${locked?"locked":""}" data-l="${l}"><span class="letter">${l}</span><span class="option-text">Alternativa ${l}</span></button>`).join("")
    : q.options.map((txt,i)=>{const l=letters[i];return `<button class="option ${choiceClass(q,l,chosen)} ${locked?"locked":""}" data-l="${l}"><span class="letter">${l}</span><span class="option-text">${esc(txt)}</span></button>`}).join("");

  app.innerHTML=`<section class="test-shell">
    <div class="test-head">
      <div class="test-meta"><span class="chip">FUVEST 2026</span><span class="chip">V1</span><span class="chip">1ª fase</span></div>
      <div class="timer" id="timer">${fmt(state.remaining)}</div>
    </div>
    <article class="question-card">
      <div class="question-top"><span class="area">Conhecimentos Gerais</span><span class="counter">Questão ${q.n} de ${D.questionCount}</span></div>
      ${q.context?`<img class="source-img context-img zoomable" src="${q.context}" alt="Texto-base das questões">`:""}
      <img class="source-img zoomable" src="${q.image}" alt="Enunciado da questão ${q.n}">
      <div class="zoom-note">Toque na imagem para ampliar.</div>
      <div class="option-list">${opts}</div>
      ${feedback}
      <div class="navrow">
        <div><button class="secondary" id="prev" ${state.current===0?"disabled":""}>← Anterior</button></div>
        <span class="progress">${q.n}/${D.questionCount}</span>
        <button class="primary next" id="next">${state.current===D.questionCount-1?"Ver resultado →":"Próxima →"}</button>
      </div>
    </article>
  </section>`;

  document.querySelectorAll(".option").forEach(btn=>btn.onclick=()=>{
    if(locked||q.annulled)return;
    const l=btn.dataset.l;
    state.answers[q.n]=l;
    state.answeredAt[q.n]=Date.now();
    save();renderQ();
  });
  document.getElementById("prev").onclick=()=>{if(state.current>0){state.current--;save();renderQ()}};
  document.getElementById("next").onclick=()=>{
    if(state.current<D.questionCount-1){state.current++;save();renderQ()}
    else finish()
  };
  document.querySelectorAll(".zoomable").forEach(img=>img.onclick=()=>openImg(img.src));
}
function choiceClass(q,l,chosen){
  if(q.annulled)return "";
  if(chosen===null)return "";
  if(l===q.answer)return "correct";
  if(l===chosen && chosen!==q.answer)return "wrong";
  return "";
}
function finish(){
  state.finished=true;state.finishedAt=Date.now();save();clearInterval(tick);renderResult();
}
function renderResult(){
  clearInterval(tick);
  let correct=0,wrong=0,blank=0,ann=0;
  const rows=[];
  D.questions.forEach(q=>{
    const ch=state.answers[q.n]??null;
    if(q.annulled){ann++;correct++;rows.push([q.n,"ANULADA","ann"]);return}
    if(ch===null){blank++;rows.push([q.n,"Em branco • correta "+q.answer,"no"])}
    else if(ch===q.answer){correct++;rows.push([q.n,"Correta • "+q.answer,"ok"])}
    else{wrong++;rows.push([q.n,"Você "+ch+" • correta "+q.answer,"no"])}
  });
  const pct=Math.round(correct/D.questionCount*1000)/10;
  const used=Math.max(0,D.durationMinutes*60-state.remaining);
  app.innerHTML=`<section class="result">
    <div class="score-card">
      <div class="eyebrow">Resultado Revolution</div>
      <div class="score-big">${correct}<span> / ${D.questionCount}</span></div>
      <div class="score-sub">${pct}% de aproveitamento • FUVEST 2026 V1</div>
      <div class="stats">
        <div class="stat"><b>${wrong}</b><small>erros</small></div>
        <div class="stat"><b>${blank}</b><small>em branco</small></div>
        <div class="stat"><b>${fmt(used)}</b><small>tempo usado</small></div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin:14px 0">
      <button class="primary" id="review">Revisar questões</button>
      <button class="secondary" id="restart">Refazer do zero</button>
    </div>
    <div class="result-list">${rows.map(r=>`<div class="result-item"><b>Questão ${r[0]}</b><span class="${r[2]}">${esc(r[1])}</span></div>`).join("")}</div>
  </section>`;
  document.getElementById("review").onclick=()=>{state.current=0;save();renderQ()};
  document.getElementById("restart").onclick=()=>{localStorage.removeItem(KEY);state={started:false,current:0,answers:{},answeredAt:{},startedAt:null,finished:false,finishedAt:null,remaining:D.durationMinutes*60};home()};
}
function openImg(src){
  const m=document.getElementById("imageModal"),im=document.getElementById("modalImg");im.src=src;m.hidden=false;document.body.style.overflow="hidden";
}
document.getElementById("closeModal").onclick=()=>{document.getElementById("imageModal").hidden=true;document.body.style.overflow=""};
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
state.finished?home():home();
