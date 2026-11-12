// Itapema Vista — navegação por vistas aéreas renderizadas (Cidade → Bairro → Empreendimento).
// Cada cena é uma imagem pré-renderizada (dia e noite) com áreas e pinos posicionados em
// coordenadas relativas (0–1) lidas de renders/scenes.json, gerado por tools/render-scenes.mjs.
import {buildings,places,districts,scenes,distance,formatDistance,nearby} from './data.js';
import {icon,logo} from './graphics.js';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const extra={whatsapp:'<path d="M4.6 19.4l1.1-3.5A8 8 0 1 1 8.3 18.4Z"/><path d="M9.2 8.6c-.2 2.9 2.6 6 5.9 6.1l.9-1.4-1.8-.9-.8.8c-1.1-.4-2.1-1.4-2.6-2.5l.8-.9-.8-1.8Z"/>',
 star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z"/>',
 share:'<path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7L12 7"/><path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7L12 17"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 map:'<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14m6-12v14"/>',
 rotate:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'
};
const ico=n=>extra[n]?`<svg viewBox="0 0 24 24" aria-hidden="true">${extra[n]}</svg>`:icon(n);
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d;}catch{return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};

let manifest,scene=null,route=null,cardFor=null;
let navigating=false,queued=false;
let night=store.get('itapema-night',false),favs=new Set(store.get('itapema-favs',[]));
const view={s:1,x:0,y:0,w:0,h:0};
const districtOf=id=>districts.find(d=>d.buildings.includes(id));
const sceneData=id=>manifest.scenes[id];
const hi=()=>true;

// ——— Enquadramento: a imagem sempre cobre a tela; zoom entre 1× e 3,5× ———
function layout(){const d=sceneData(scene.id),aspect=d.width/d.height;view.w=Math.max(innerWidth,innerHeight*aspect);view.h=view.w/aspect;$('world').style.width=view.w+'px';$('world').style.height=view.h+'px';}
function clamp(){view.s=Math.min(3.5,Math.max(1,view.s));view.x=Math.min(0,Math.max(innerWidth-view.w*view.s,view.x));view.y=Math.min(0,Math.max(innerHeight-view.h*view.s,view.y));}
function apply(){clamp();const w=$('world');w.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.s})`;w.style.setProperty('--inv',1/view.s);
 for(const el of $('pins').querySelectorAll('.pin.building'))el.style.setProperty('--stem',Math.max(26,el.dataset.lift*view.h*view.s-46)+'px');}
// Ponto de interesse da cena: média dos prédios (ou dos bairros), para telas estreitas não cortarem o principal.
function focus(){const d=sceneData(scene.id),pts=d.buildings.length?d.buildings.map(b=>b.ground):d.districts.map(a=>a.label);if(!pts.length)return[.5,.5];const xs=pts.map(p=>p[0]);
 // Se nem todos cabem na largura visível (celular em pé), foca no primeiro.
 if(Math.max(...xs)-Math.min(...xs)>innerWidth/view.w*.8)return pts[0];return[xs.reduce((a,x)=>a+x,0)/xs.length,pts.reduce((a,p)=>a+p[1],0)/pts.length];}
function center(nx,ny,s){view.s=s;view.x=innerWidth/2-nx*view.w*s;view.y=innerHeight/2-ny*view.h*s;apply();}
function zoomAt(cx,cy,f){const s=Math.min(3.5,Math.max(1,view.s*f));const k=s/view.s;view.x=cx-(cx-view.x)*k;view.y=cy-(cy-view.y)*k;view.s=s;apply();}
let flight=0;
function flyTo(nx,ny,scale,ms=1400){
 const token=++flight,from={...view};view.s=scale;view.x=innerWidth/2-nx*view.w*scale;view.y=innerHeight/2-ny*view.h*scale;clamp();const to={...view};Object.assign(view,from);
 return new Promise(resolve=>{const start=performance.now();function tick(now){if(token!==flight){resolve();return;}const t=reduced?1:Math.min(1,(now-start)/ms),e=t*t*(3-2*t);view.s=from.s+(to.s-from.s)*e;view.x=from.x+(to.x-from.x)*e;view.y=from.y+(to.y-from.y)*e;apply();if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
}
const animated=(fn,ms=700)=>{const from={...view};fn();const target={...view};Object.assign(view,from);return flyTo((innerWidth/2-target.x)/(target.w*target.s),(innerHeight/2-target.y)/(target.h*target.s),target.s,ms);};
const decoded=new Map();
function prepare(src){if(!decoded.has(src)){const img=new Image();img.src=src;decoded.set(src,img.decode().then(()=>img).catch(()=>{decoded.delete(src);return null;}));}return decoded.get(src);}

// ——— Arrastar, pinçar e rolar ———
const pointers=new Map();let moved=0,pinch=0;
$('stage').addEventListener('pointerdown',e=>{if(e.button)return;flight++;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;pinch=sep();});
$('stage').addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 if(pointers.size>1){const n=sep(),m=mid();if(pinch)zoomAt(m.x,m.y,n/pinch);pinch=n;moved+=10;return;}
 moved+=Math.abs(dx)+Math.abs(dy);if(moved>4){if(!$('stage').classList.contains('dragging'))$('stage').setPointerCapture?.(e.pointerId);$('stage').classList.add('dragging');view.x+=dx;view.y+=dy;apply();}});
const release=e=>{pointers.delete(e.pointerId);pinch=sep();if(!pointers.size)$('stage').classList.remove('dragging');};
$('stage').addEventListener('pointerup',release);$('stage').addEventListener('pointercancel',release);
$('stage').addEventListener('click',e=>{if(moved>6){e.stopPropagation();e.preventDefault();}},true);
$('stage').addEventListener('wheel',e=>{e.preventDefault();flight++;zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*(e.ctrlKey?.01:.0018)));},{passive:false});
$('stage').addEventListener('dblclick',e=>{if(e.target.closest('.pin,.area'))return;animated(()=>zoomAt(e.clientX,e.clientY,1.8),500);});
function sep(){const a=[...pointers.values()];return a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;}
function mid(){const a=[...pointers.values()];return{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};}

// ——— Imagens das cenas ———
function load(img,src){return new Promise(r=>{if(img.getAttribute('src')===src&&img.complete)return r();img.onload=()=>(img.decode?img.decode().catch(()=>{}):Promise.resolve()).then(r);img.onerror=()=>{toast('Não foi possível carregar esta imagem. Recarregue a página.');r();};img.src=src;});}
function plates(id){const i=sceneData(id).images;return{day:hi()?i.day:i.daySm,night:hi()?i.night:i.nightSm};}
async function showPlates(id){const p=plates(id);await load($('imgDay'),p.day);if(night)await load($('imgNight'),p.night);else{$('imgNight').removeAttribute('src');}glassPlate();}
// ——— Vidro dos marcadores sem custo por quadro ———
// Em vez de backdrop-filter ao vivo (recalculado a cada quadro com as nuvens em movimento; ~15 FPS em GPU integrada),
// gera UMA cópia desfocada da imagem da cena e usa como fundo de cada marcador, alinhada ao que está atrás dele.
const glassCache={};
function glassSize(){const w=$('world');w.style.setProperty('--W',w.offsetWidth);w.style.setProperty('--H',w.offsetHeight);}
async function glassPlate(){const img=night&&$('imgNight').getAttribute('src')?$('imgNight'):$('imgDay'),src=img.getAttribute('src');if(!src)return;glassSize();
 glassCache[src]??=(async()=>{const im=sceneData(scene.id).images,g=(src.includes('night')?im.nightSm:im.daySm).replace('-sm.webp','-glass.jpg'),i=new Image();i.src=g;await i.decode().catch(()=>{});return g;})(); // pré-gerado por tools/make-glass.mjs
 $('world').style.setProperty('--glass',`url(${await glassCache[src]})`);}
function glassOffsets(){for(const el of $('pins').querySelectorAll('.pin.place .dot,.pin.building .medal,.pin.lotpin .tag,.pin .kmtag')){const p=el.closest('.pin');el.style.setProperty('--ox',el.offsetLeft-p.offsetWidth/2);el.style.setProperty('--oy',el.offsetTop-p.offsetHeight);}}
addEventListener('resize',()=>{glassSize();glassOffsets();});

// ——— Rotas: linha tracejada animada do ponto turístico até cada empreendimento da cena ———
function routes(from,targets){const svg=$('routes');if(!targets.length)return;const W=$('world').offsetWidth,H=$('world').offsetHeight;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 svg.innerHTML=targets.map((b,i)=>{const x1=from[0]*W,y1=from[1]*H,x2=b.ground[0]*W,y2=b.ground[1]*H,len=Math.hypot(x2-x1,y2-y1),c=`M${x1} ${y1}Q${(x1+x2)/2} ${(y1+y2)/2-len*.22} ${x2} ${y2}`;
  return `<mask id="rm${i}" maskUnits="userSpaceOnUse"><path class="reveal" d="${c}"/></mask><path class="route" d="${c}" mask="url(#rm${i})"/>`;}).join('');
 for(const p of svg.querySelectorAll('.reveal'))p.style.setProperty('--len',p.getTotalLength());
 svg.classList.remove('on');void svg.offsetWidth;svg.classList.add('on');}

// ——— Áreas e pinos da cena ———
// nomes dos bairros no mapa: quebras e abreviações para leitura
const HOOD_TXT={'Canto da Praia':'Canto<br>da Praia','Alto São Bento':'A. São Bento','Jardim Praia Mar':'Jardim<br>Praia Mar'};
function drawScene(){
 const d=sceneData(scene.id);document.body.className=document.body.className.replace(/\bscene-\S+/g,'').trim();document.body.classList.add('scene-'+scene.id);
 $('areas').innerHTML=(d.hoods||[]).map(h=>`<polygon class="hood" data-hood="${h.name}" points="${h.area.map(p=>p.join(',')).join(' ')}"/>`).join('')+(d.lots||[]).map(b=>`<polygon class="lot" data-lot="${b.id}" points="${b.lot.map(p=>p.join(',')).join(' ')}"/>`).join('')+d.districts.map(a=>`<polygon class="area" data-go="${a.id}" points="${a.area.map(p=>p.join(',')).join(' ')}"><title>${districts.find(x=>x.id===a.id).name}</title></polygon>`).join('');
 const pos=([x,y])=>`left:${x*100}%;top:${y*100}%;--fx:${x};--fy:${y}`;
 $('pins').innerHTML=[
  ...d.places.map(p=>{const pl=places.find(x=>x.id===p.id);return`<button class="pin place" data-place="${p.id}" style="${pos(p.pos)}" aria-label="${pl.name}"><span class="dot">${icon(pl.icon)}</span><span class="label">${pl.name}</span><i class="stem"></i><i class="base"></i></button>`;}),
  ...(d.hoods||[]).filter(h=>!h.part).map(h=>{const c=h.label||[h.area.reduce((a,q)=>a+q[0],0)/h.area.length,h.area.reduce((a,q)=>a+q[1],0)/h.area.length];return`<span class="pin hoodlabel" data-hood="${h.name}" style="${pos(c)}">${HOOD_TXT[h.name]||h.name}</span>`;}),
  ...(d.lots||[]).map(l=>{const b=buildings.find(x=>x.id===l.id),c=[l.lot.reduce((a,q)=>a+q[0],0)/l.lot.length,l.lot.reduce((a,q)=>a+q[1],0)/l.lot.length];return`<button class="pin lotpin" data-go="${districtOf(l.id).id}" data-b="${l.id}" style="${pos(c)}" aria-label="Ver ${b.name} no bairro"><span class="tag">${logo(b.id)}${b.name}</span><i class="stem"></i><i class="base"></i></button>`;}),
  ...d.districts.map(a=>`<button class="pin district" data-go="${a.id}" style="${pos(a.label)}">${districts.find(x=>x.id===a.id).name}</button>`),
  ...d.buildings.map(p=>{const b=buildings.find(x=>x.id===p.id);return`<button class="pin building${favs.has(b.id)?' fav':''}" data-go="${b.id}" data-lift="${(p.ground[1]-p.pos[1]).toFixed(4)}" style="${pos(p.ground)}" aria-label="Abrir ${b.name}"><span class="medal"><b>${logo(b.id)}${b.name}</b><small>${b.region.toUpperCase()}</small></span><span class="stem"></span><span class="base"></span></button>`;})
 ].join('');
 for(const el of $('areas').querySelectorAll('.area')){const pill=$('pins').querySelector(`.district[data-go="${el.dataset.go}"]`);el.onmouseenter=()=>pill?.classList.add('hover');el.onmouseleave=()=>pill?.classList.remove('hover');pill&&(pill.onmouseenter=()=>el.classList.add('hover'),pill.onmouseleave=()=>el.classList.remove('hover'));}
 for(const el of $('pins').querySelectorAll('.pin.building,.pin.lotpin')){const lot=$('areas').querySelector(`[data-lot="${el.dataset.b||el.dataset.go}"]`);el.onmouseenter=()=>lot?.classList.add('hover');el.onmouseleave=()=>lot?.classList.remove('hover');}
 for(const el of $('areas').querySelectorAll('.hood')){const lb=$('pins').querySelector(`.hoodlabel[data-hood="${el.dataset.hood}"]`);el.onmouseenter=()=>{el.classList.add('hover');lb?.classList.add('hover');};el.onmouseleave=()=>{el.classList.remove('hover');lb?.classList.remove('hover');};}
 for(const id of ['pins','areas']){const e=$(id);e.style.animation='none';void e.offsetWidth;e.style.animation='';}
 glassOffsets();document.fonts?.ready.then(glassOffsets);
 $('needle').style.transform=`rotate(${-scene.camera.bearing}deg)`;
 clouds();
 const links=d.districts.length?d.districts.map(a=>({id:a.id,name:districts.find(x=>x.id===a.id).name,sub:'2 empreendimentos'})):d.buildings.map(p=>({id:p.id,name:buildings.find(b=>b.id===p.id).name,sub:'Conhecer empreendimento'}));
 smooth($('journey'),()=>{$('journey').innerHTML=links.map(a=>`<button data-go="${a.id}"><span><small>${a.sub}</small>${a.name}</span><b>↗</b></button>`).join('');});
}
// Nuvens no padrão da referência: dentro do mapa (acompanham zoom/arraste), 16 em duas faixas.
// Profundidade: maior = mais opaca, nítida, rápida e com balanço maior; menor = translúcida, levemente desfocada e lenta.
function clouds(){const box=$('wclouds');if(box.children.length||reduced)return;const R=Math.random,imgs=['clouds/aerial-cloud.webp','clouds/premium-cloud.webp'];
 for(let i=0;i<16;i++){const k=R(),w=.05+k*.12,top=i<10?.01+R()*.22:.7+R()*.22,dur=11.45/w,bob=18+R()*16,d=document.createElement('div');
  d.className='cdrift';d.style.cssText=`top:${(top*100).toFixed(2)}%;width:${(w*100).toFixed(2)}%;--to:${(100/w).toFixed(1)}%;animation-duration:${dur.toFixed(1)}s;animation-delay:-${(R()*dur).toFixed(1)}s`;
  d.innerHTML=`<div class="cbob" style="animation-duration:${bob.toFixed(1)}s;animation-delay:-${(R()*bob*2).toFixed(1)}s"><img src="${imgs[i%2]}" alt="" style="opacity:${(.22+k*.56).toFixed(2)};filter:blur(${((1-k)*2.5).toFixed(2)}px);${R()<.6?'transform:scaleX(-1)':''}"></div>`;box.appendChild(d);}}

// ——— Barra superior e ferramentas ———
// anima a mudança de tamanho do container quando o conteúdo troca (FLIP)
function smooth(el,update){const had=el.children.length,a=el.getBoundingClientRect();update();if(reduced||!had||!a.width)return;const b=el.getBoundingClientRect();if(Math.abs(a.width-b.width)<1&&Math.abs(a.height-b.height)<1)return;
 el.animate([{width:a.width+'px',height:a.height+'px'},{width:b.width+'px',height:b.height+'px'}],{duration:480,easing:'cubic-bezier(.4,0,.2,1)'});}
function crumbs(){const parts=[['#/','Itapema']];if(route.type==='scene'&&scene.parent)parts.push([`#/${scene.id}`,scene.name]);if(route.type==='project'){const d=districtOf(route.id);parts.push([`#/${d.id}`,d.name],[`#/${route.id}`,buildings.find(b=>b.id===route.id).name]);}
 smooth($('crumbs'),()=>{$('crumbs').innerHTML=parts.map(([h,t],i)=>i===parts.length-1?`<span>${t}</span>`:`<a href="${h}">${t}</a><i>▸</i>`).join('');});$('back').disabled=parts.length<2;$('crumbs').classList.toggle('solo',parts.length<2);}
function tools(){const t=route.type==='project'?[
  ['route','Distâncias','distances'],['map','Localização','locate'],['star',favs.has(route.id)?'Favorito':'Favoritar','fav'],['share','Compartilhar','share']]
 :[['expand','Tela cheia','full'],[night?'sun':'moon',night?'Modo dia':'Modo noite','night'],['star','Favoritos','favs'],['share','Compartilhar','share']];
 smooth($('tools'),()=>{$('tools').innerHTML=t.map(([i,l,a])=>`<button data-tool="${a}" aria-label="${l}"${a==='fav'&&favs.has(route.id)?' class="on"':''}>${ico(i)}<span>${l}</span></button>`).join('');});}

// ——— Prévia do ponto turístico: imagem, carro até o empreendimento escolhido, rota animada ———
let drive={};fetch('drive.json',{cache:'no-cache'}).then(r=>r.json()).then(x=>drive=x).catch(()=>{});
const fmtMin=s=>`${Math.max(1,Math.round(s/60))} min`;
function driveOf(p,b){const m=drive[p.id]?.[b.id];return m?{d:m[0],t:m[1]}:{d:distance(b.coords,p.coords)*1.35,t:distance(b.coords,p.coords)*1.35/8.3};} // fallback: ~30 km/h urbano
function placeShot(pos){const img=$('imgDay'),W=img.naturalWidth||1672,H=img.naturalHeight||941,w=W*.2,h=w*9/16,x0=Math.min(Math.max(pos[0]*W-w/2,0),W-w),y0=Math.min(Math.max(pos[1]*H-h*.6,0),H-h);
 return `background-image:url(${img.getAttribute('src')});background-size:${(W/w*100).toFixed(2)}% auto;background-position:${(x0/(W-w)*100).toFixed(2)}% ${(y0/(H-h)*100).toFixed(2)}%`;}
function targetOf(id){const d=sceneData(scene.id);if(d.targets?.[id])return d.targets[id];const l=d.lots?.find(x=>x.id===id);if(l)return [l.lot.reduce((a,q)=>a+q[0],0)/l.lot.length,l.lot.reduce((a,q)=>a+q[1],0)/l.lot.length];return d.buildings.find(x=>x.id===id)?.ground;}
let tripRaf=0;function pickBuilding(id,user){const p=places.find(x=>x.id===cardFor);if(!p)return;const b=buildings.find(x=>x.id===id),m=driveOf(p,b);
 const tr=$('card').querySelector('.trip'),pv={d:+tr.dataset.d||0,t:+tr.dataset.t||0};tr.dataset.d=m.d;tr.dataset.t=m.t;
 tr.innerHTML=`<span>${ico('route')} <b class="vd">${formatDistance(user?pv.d:m.d)}</b></span><i></i><span>${ico('car')} <b class="vt">${fmtMin(user?pv.t:m.t)}</b></span><small>até ${b.name} · de carro, aprox.</small>`;
 // troca de empreendimento: os números correm do valor anterior até o novo, no mesmo tempo e curva do contador de km do mapa
 if(user){cancelAnimationFrame(tripRaf);const vd=tr.querySelector('.vd'),vt=tr.querySelector('.vt'),t0=performance.now(),T=reduced?0:3200,ease=x=>1-Math.pow(1-x,3);
  const step=now=>{const x=T?Math.min(1,(now-t0)/T):1,k=ease(x);vd.textContent=formatDistance(pv.d+(m.d-pv.d)*k);vt.textContent=fmtMin(pv.t+(m.t-pv.t)*k);if(x<1)tripRaf=requestAnimationFrame(step);};tripRaf=requestAnimationFrame(step);}
 $('card').querySelectorAll('[data-pick]').forEach(x=>x.classList.toggle('on',x.dataset.pick===id));
 const from=sceneData(scene.id).places.find(x=>x.id===p.id)?.pos,to=targetOf(id),via=sceneData(scene.id).paths?.[id]?.[p.id];$('routes').innerHTML='';
 kmCount(id,m.d);
 if(from&&to){if(via?.length){const e=via.at(-1),near=Math.hypot(e[0]-to[0],e[1]-to[1])<.03;drawRoute([from,...via,...(near?[to]:[])]);}else routes(from,[{ground:to}]);}}
// Empreendimentos voltando a aparecer com a prévia aberta: rota e km recomeçam do zero
function replayTrip(){if(!cardFor||document.body.classList.contains('hide-buildings'))return;const on=$('card').querySelector('[data-pick].on');if(on)pickBuilding(on.dataset.pick);}
// Contador de km ao lado do empreendimento: sobe de 0 até a distância no mesmo tempo e curva do traço da rota
let kmRaf=0;const kmFmt=v=>(v/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' km';
function kmCount(id,d){cancelAnimationFrame(kmRaf);for(const o of $('pins').querySelectorAll('.kmtag')){o.classList.add('out');setTimeout(()=>o.remove(),450);}
 if(!id||document.body.classList.contains('hide-buildings'))return;const pin=$('pins').querySelector(`.pin.place[data-place="${cardFor}"]`),lab=pin?.querySelector('.dot');if(!lab)return;
 const k=document.createElement('span');k.className='kmtag';k.innerHTML=`${ico('car')}<b>${kmFmt(0)}</b>`;pin.appendChild(k);
 k.style.left=(lab.offsetLeft+lab.offsetWidth+8)+'px';k.style.top=(lab.offsetTop+(lab.offsetHeight-k.offsetHeight)/2)+'px';
 {const kb=k.getBoundingClientRect(),hit=[...$('pins').querySelectorAll('.pin .dot,.pin .medal,.pin .tag')].some(e=>{if(pin.contains(e))return false;const o=e.getBoundingClientRect();return o.width&&kb.left<o.right&&kb.right>o.left&&kb.top<o.bottom&&kb.bottom>o.top;});if(hit)k.style.left=(lab.offsetLeft-k.offsetWidth-8)+'px';}glassOffsets();
 const b=k.querySelector('b'),t0=performance.now(),T=reduced?0:3200,ease=x=>1-Math.pow(1-x,3);
 const step=now=>{const x=T?Math.min(1,(now-t0)/T):1;b.textContent=kmFmt(d*ease(x));if(x<1)kmRaf=requestAnimationFrame(step);};kmRaf=requestAnimationFrame(step);}
// Trajeto desenhado sobre as ruas: começa rápido e desacelera até o empreendimento (como na referência)
function drawRoute(pts){const svg=$('routes'),W=$('world').offsetWidth,H=$('world').offsetHeight;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 svg.innerHTML=`<path class="trip-line" pathLength="1" d="M${pts.map(([x,y])=>`${(x*W).toFixed(1)} ${(y*H).toFixed(1)}`).join('L')}"/>`;
 svg.classList.remove('on');void svg.offsetWidth;svg.classList.add('on');}
// Troca de conteúdo com a prévia já aberta: o conteúdo atual sai e o novo entra com desfoque sutil (só no conteúdo interno; os vidros ficam parados)
const blurSwap=(els,out)=>Promise.all([...els].map(e=>e.animate(out?[{opacity:1,filter:'blur(0)'},{opacity:0,filter:'blur(6px)'}]:[{opacity:0,filter:'blur(6px)'},{opacity:1,filter:'blur(0)'}],{duration:out?200:420,easing:'cubic-bezier(.4,0,.2,1)',fill:out?'forwards':'none'}).finished.catch(()=>{})));
const cardInner=()=>$('card').querySelectorAll('.shot,.body,.pick>*');let swapTok=0;
async function placeCard(id){const c=$('card'),open=!c.hidden&&!c.classList.contains('leaving')&&cardFor,tok=++swapTok;
 if(open&&cardFor!==id&&!reduced){cardFor=id;await blurSwap(cardInner(),true);if(tok!==swapTok)return;}
 _placeCard(id,open&&!reduced);}
function _placeCard(id,swap){const p=places.find(x=>x.id===id);cardFor=id;$('pins').querySelectorAll('.place').forEach(el=>el.classList.toggle('active',el.dataset.place===id));
 const pos=sceneData(scene.id).places.find(x=>x.id===id)?.pos||[.5,.5],list=buildings.map(b=>({b,m:driveOf(p,b)})).sort((x,y)=>x.m.d-y.m.d);
 $('card').innerHTML=`<button class="close" data-close aria-label="Fechar">×</button><div class="top"><div class="shot" style="${placeShot(pos)}" role="img" aria-label="Vista aérea de ${p.name}"></div><div class="body"><h3>${p.name}</h3><div class="trip"></div><p>${p.description}</p></div></div>
 <div class="pick"><span class="eyebrow">Selecione um empreendimento</span><div class="list">${list.map(({b,m})=>`<button data-pick="${b.id}"><span><span class="nm">${logo(b.id)}${b.name}</span><small>${b.region}</small></span><strong>${formatDistance(m.d)}</strong></button>`).join('')}</div></div>`;
 clearTimeout(closeT);$('card').classList.remove('leaving');{const r=document.querySelector('.pin.place[data-place="'+id+'"]')?.getBoundingClientRect();const L=!!r&&r.left+r.width/2>innerWidth/2;$('card').classList.toggle('left',L);document.body.classList.toggle('card-left',L);}$('card').hidden=false;document.body.classList.add('card-open');pickBuilding(list[0].b.id);if(swap)blurSwap(cardInner());}
// Saída suave: só opacidade (filtro sobre o vidro travava); oculta de fato quando o fade termina
let closeT;function closeCard(){const c=$('card');swapTok++;kmCount(null);c.classList.add('leaving');cardFor=null;document.body.classList.remove('card-open','card-left');clearTimeout(closeT);closeT=setTimeout(()=>{c.hidden=true;c.classList.remove('leaving');$('routes').classList.remove('on');$('routes').innerHTML='';},450);$('pins').querySelectorAll('.place.active').forEach(el=>el.classList.remove('active'));}

// ——— Painéis laterais ———
function panel(html){closePanel();const el=document.createElement('section');el.className='panel glass';el.id='panel';el.innerHTML=`<button class="close" data-close aria-label="Fechar">×</button>${html}`;document.body.appendChild(el);}
function closePanel(){$('panel')?.remove();}
function distancesPanel(b){panel(`<h3>${b.name}</h3><p class="hintline">O melhor de Itapema por perto · distâncias aproximadas em linha reta.</p><div class="rows">${nearby(b).map(p=>`<a class="row" href="https://www.google.com/maps/dir/?api=1&origin=${b.coords[1]},${b.coords[0]}&destination=${p.coords[1]},${p.coords[0]}" target="_blank" rel="noopener"><span>${p.name}<small>${p.category} · traçar rota</small></span><strong>${formatDistance(p.distance)}</strong></a>`).join('')}</div><p class="hintline">Prédio e terreno fictícios. Referências para teste.</p>`);}
function favsPanel(){const list=buildings.filter(b=>favs.has(b.id));panel(`<h3>Favoritos</h3><p class="hintline">${list.length?'Seus empreendimentos salvos neste navegador.':'Abra um empreendimento e toque em “Favoritar” para salvá-lo aqui.'}</p><div class="rows">${list.map(b=>`<button class="row" data-go="${b.id}"><span><span class="nm">${logo(b.id)}${b.name}</span><small>${b.region}</small></span><strong>${ico('go')}</strong></button>`).join('')}</div>`);}

// ——— Página do empreendimento ———
async function openProject(b){
 const d=districtOf(b.id),p=plates(d.id);$('projectBackdrop').style.backgroundImage=`linear-gradient(rgba(0,0,0,.38),rgba(0,0,0,.38)),url(${(night?p.night:p.day).replace(/(-sm)?.webp$/,'-glass.jpg')})`;
 $('projectHero').alt=`Perspectiva arquitetônica ilustrativa de ${b.name}, com paisagismo e vista para o mar`;
 await load($('projectHero'),`renders/architecture/${b.id}-hero.webp`);
 $('projectInfo').innerHTML=`<h1 class="mark">${logo(b.id)}${b.name}</h1><p class="where">${b.region} · Itapema</p><p class="disclaimer">Arquitetura e entorno ilustrativos.</p>`;
 $('project').hidden=false;document.body.classList.add('in-project');

 }

function closeProject(){$('project').hidden=true;document.body.classList.remove('in-project');document.querySelector('.cta')?.remove();}

// ——— Rotas: #/ (cidade), #/<bairro>, #/<empreendimento> ———
function parse(){const h=location.hash.replace(/^#\/?/,'');if(buildings.some(b=>b.id===h))return{type:'project',id:h};if(scenes.some(s=>s.id===h))return{type:'scene',id:h};if(places.some(p=>p.id===h))return{type:'scene',id:'itapema',place:h};return{type:'scene',id:'itapema'};}
async function go(){
 if(navigating){queued=true;return;}
 navigating=true;try{await navigate();}finally{navigating=false;if(queued){queued=false;go();}}
}
async function navigate(){
 const next=parse(),prev=route;closePanel();
 if(prev&&prev.type===next.type&&prev.id===next.id){if(next.place)placeCard(next.place);return;}
 closeCard();
 const nextScene=next.type==='project'?districtOf(next.id).id:next.id;
 const p=plates(nextScene),assets=[prepare(p.day),...(night?[prepare(p.night)]:[])];
 if(next.type==='project')assets.push(prepare(`renders/architecture/${next.id}-hero.webp`));
 // Decode before moving. A slow connection keeps the current view interactive.
 await Promise.all(assets);
 const oldScene=scene;
 const target=prev&&sceneData(scene.id).districts.find(d=>d.id===next.id)?.label;
 const building=prev&&sceneData(scene.id).buildings.find(b=>b.id===next.id)?.ground;
 const point=target||building;

 // Transição da referência: o mapa atual vai a preto sólido (0,45 s), a cena troca por baixo e a nova imagem surge do preto (0,5 s). A interface fica sempre visível.
 if(prev&&!reduced){const tv=$('tveil');tv.classList.remove('hold');tv.style.visibility='visible';await tv.animate([{opacity:0},{opacity:1}],{duration:450,easing:'ease-in-out',fill:'forwards'}).finished;}
 route=next;
 if(next.type==='project'){const b=buildings.find(x=>x.id===next.id);scene=scenes.find(s=>s.id===nextScene);await openProject(b);}
 else{closeProject();scene=scenes.find(s=>s.id===next.id);layout();await showPlates(scene.id);drawScene();const [fx,fy]=focus();center(fx,fy,1);if(next.place)placeCard(next.place);}
 crumbs();tools();document.title=next.type==='project'?`${buildings.find(b=>b.id===next.id).name} · Itapema Vista`:scene.id==='itapema'?'Itapema Vista':`${scene.name} · Itapema Vista`;
 $('curtain').classList.add('out');setTimeout(()=>document.body.classList.add('ready'),1200);
 if(prev&&!reduced){const tv=$('tveil');await new Promise(r=>setTimeout(r,120));await tv.animate([{opacity:1},{opacity:0}],{duration:500,easing:'ease-in-out',fill:'forwards'}).finished;tv.getAnimations().forEach(x=>x.cancel());tv.style.visibility='hidden';}
}

function veil(on){const c=$('curtain');return new Promise(r=>{if(on){c.classList.remove('out');c.classList.add('veil');setTimeout(r,reduced?0:350);}else{c.classList.add('out');setTimeout(()=>{c.classList.remove('veil');r();},reduced?0:450);}});}

// ——— Ações ———
async function toggleNight(){night=!night;store.set('itapema-night',night);if(night&&scene)await load($('imgNight'),plates(scene.id).night);document.body.classList.toggle('night',night);glassPlate();if(route.type==='project'){const p=plates(districtOf(route.id).id);$('projectBackdrop').style.backgroundImage=`linear-gradient(rgba(0,0,0,.38),rgba(0,0,0,.38)),url(${(night?p.night:p.day).replace(/(-sm)?.webp$/,'-glass.jpg')})`;}tools();}
function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').hidden=true,3200);}
const closeShare=()=>{const m=$('shareMenu');if(m)m.hidden=true;document.body.classList.remove('share-open');};
// Compartilhar: submenu com WhatsApp ou Link, logo abaixo do botão
function share(btn){let m=$('shareMenu');if(m&&!m.hidden){closeShare();return;}
 if(!m){m=document.createElement('div');m.id='shareMenu';m.className='share-menu';m.hidden=true;
  m.innerHTML=`<button data-share="wa">${ico('whatsapp')}<span>WhatsApp</span></button><button data-share="link">${ico('share')}<span>Link</span></button>`;document.body.appendChild(m);}
 const b=(btn||document.querySelector('[data-tool="share"]')).getBoundingClientRect();{const T=$('tools').getBoundingClientRect(),up=T.top>innerHeight/2;m.style.top=up?'auto':(T.bottom+12)+'px';m.style.bottom=up?(innerHeight-T.top+12)+'px':'auto';m.style.right=Math.max(16,innerWidth-T.right)+'px';}m.hidden=false;document.body.classList.add('share-open');}
async function shareVia(kind){closeShare();const url=location.href;
 if(kind==='wa'){open('https://wa.me/?text='+encodeURIComponent(document.title+' '+url),'_blank','noopener');return;}
 try{await navigator.clipboard.writeText(url);toast('Link copiado.');}catch{toast(url);}}
async function fullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen();}catch{toast('Use a opção de tela cheia do navegador.');}}
const actions={
 full:fullscreen,night:toggleNight,share,
 layers(){$('filters').hidden=!$('filters').hidden;$('tools').querySelector('[data-tool="layers"]').classList.toggle('on',!$('filters').hidden);},
 favs:favsPanel,
 
 zoomIn(){animated(()=>zoomAt(innerWidth/2,innerHeight/2,1.4),400);},
 zoomOut(){animated(()=>zoomAt(innerWidth/2,innerHeight/2,1/1.4),400);},
 distances(){distancesPanel(buildings.find(b=>b.id===route.id));},
 locate(){location.hash=`#/${districtOf(route.id).id}`;},
 fav(){const id=route.id;favs.has(id)?favs.delete(id):favs.add(id);store.set('itapema-favs',[...favs]);tools();toast(favs.has(id)?'Salvo nos favoritos.':'Removido dos favoritos.');}
};
document.addEventListener('click',e=>{
 {const sv=e.target.closest('[data-share]');if(sv){shareVia(sv.dataset.share);return;}const sm=$('shareMenu');if(sm&&!sm.hidden&&!e.target.closest('[data-tool="share"]'))closeShare();}
 const t=e.target.closest('[data-tool]');if(t){actions[t.dataset.tool]?.(t);return;}
 if(e.target.closest('[data-close]')){const dlg=e.target.closest('dialog');if(dlg)dlg.close();else if(e.target.closest('#card'))closeCard();else closePanel();return;}
 const k=e.target.closest('[data-pick]');if(k){pickBuilding(k.dataset.pick,true);return;}
 const g=e.target.closest('[data-go]');if(g){location.hash=`#/${g.dataset.go}`;return;}
 const p=e.target.closest('[data-place]');if(p){placeCard(p.dataset.place);return;}
 {const ft=e.target.closest('[data-filter-toggle]');if(ft){ft.setAttribute('aria-expanded',!$('filters').classList.toggle('collapsed'));return;}}
 if(e.target.closest('[data-hide-all]')){const bs=[...$('filters').querySelectorAll('[data-layer]')],show=bs.every(b=>!b.classList.contains('on'));for(const b of bs){b.classList.toggle('on',show);document.body.classList.toggle('hide-'+b.dataset.layer,!show);}e.target.closest('[data-hide-all]').textContent=show?'Ocultar tudo':'Mostrar tudo';replayTrip();return;}
 const l=e.target.closest('[data-layer]');if(l){l.classList.toggle('on');document.body.classList.toggle('hide-'+l.dataset.layer,!l.classList.contains('on'));if(l.dataset.layer==='buildings')replayTrip();return;}
 if(e.target.closest('#stage')&&!$('card').hidden)closeCard();
});
$('back').onclick=()=>{if(route.type==='project')location.hash=`#/${districtOf(route.id).id}`;else if(scene.parent)location.hash=`#/${scene.parent}`;};
$('about').onclick=()=>$('aboutDialog').showModal();
$('compass').onclick=()=>toast(`O norte aponta para a seta vermelha · vista voltada a ${Math.round(scene.camera.bearing)}°`);
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea'))return;
 if(e.key==='Escape'){if($('shareMenu')&&!$('shareMenu').hidden){closeShare();return;}if($('panel'))closePanel();else if(!$('card').hidden)closeCard();else if(!$('back').disabled)$('back').click();return;}
 if(route?.type!=='scene')return;const step=80;
 if(e.key==='ArrowLeft')view.x+=step;else if(e.key==='ArrowRight')view.x-=step;else if(e.key==='ArrowUp')view.y+=step;else if(e.key==='ArrowDown')view.y-=step;
 else if(e.key==='+'||e.key==='=')return animated(()=>zoomAt(innerWidth/2,innerHeight/2,1.4),400);else if(e.key==='-')return animated(()=>zoomAt(innerWidth/2,innerHeight/2,1/1.4),400);else return;
 apply();});
addEventListener('resize',()=>{if(!scene)return;const cx=(innerWidth/2-view.x)/(view.w*view.s),cy=(innerHeight/2-view.y)/(view.h*view.s);layout();center(cx,cy,view.s);});
addEventListener('hashchange',go);

// ——— Início ———
(async()=>{
 // Links antigos do mapa (#vista) continuam funcionando.
 if(/^#[a-z-]+$/.test(location.hash))history.replaceState(null,'',`#/${location.hash.slice(1)}`);
 try{manifest=await fetch('renders/scenes.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json();});}
 catch{$('curtain').innerHTML='<div class="logo">ITAPEMA<small>VISTA</small></div><p style="color:#aaa;max-width:320px;text-align:center">Os renders ainda não foram gerados. Rode <code>npm run render</code> na pasta do projeto.</p>';return;}
 document.body.classList.toggle('night',night);
 await go();
 if(route.type==='scene'){$('hint').hidden=false;setTimeout(()=>$('hint').hidden=true,4500);}
 // Pré-carrega as outras cenas para as transições serem instantâneas.
 scenes.forEach(s=>{prepare(plates(s.id).day);prepare(plates(s.id).night);});buildings.forEach(b=>prepare(`renders/architecture/${b.id}-hero.webp`));
})();

$('filters').classList.add('collapsed');$('filters').querySelector('[data-filter-toggle]').setAttribute('aria-expanded',!$('filters').classList.contains('collapsed'));

addEventListener('pageshow',e=>{if(e.persisted){const t=$('tveil');t.classList.remove('hold');t.getAnimations().forEach(a=>a.cancel());}});
