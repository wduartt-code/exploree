// Itapema Vista — navegação por vistas aéreas renderizadas (Cidade → Bairro → Empreendimento).
// Cada cena é uma imagem pré-renderizada (dia e noite) com áreas e pinos posicionados em
// coordenadas relativas (0–1) lidas de renders/scenes.json, gerado por tools/render-scenes.mjs.
import {buildings,places,districts,scenes,distance,formatDistance,nearby} from './data.js';
import {icon} from './graphics.js';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const extra={
 star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z"/>',
 share:'<path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7L12 7"/><path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 5.7 5.7L12 17"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 map:'<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14m6-12v14"/>',
 rotate:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'
};
const ico=n=>extra[n]?`<svg viewBox="0 0 24 24" aria-hidden="true">${extra[n]}</svg>`:icon(n);
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d;}catch{return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};

let manifest,scene=null,route=null,viewer=null,cardFor=null,modelOpen=false,modelLoading=false;
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
function load(img,src){return new Promise(r=>{if(img.getAttribute('src')===src&&img.complete)return r();img.onload=()=>r();img.onerror=()=>{toast('Não foi possível carregar esta imagem. Recarregue a página.');r();};img.src=src;});}
function plates(id){const i=sceneData(id).images;return{day:hi()?i.day:i.daySm,night:hi()?i.night:i.nightSm};}
async function showPlates(id){const p=plates(id);await load($('imgDay'),p.day);if(night)await load($('imgNight'),p.night);else{$('imgNight').removeAttribute('src');}}

// ——— Áreas e pinos da cena ———
function drawScene(){
 const d=sceneData(scene.id);document.body.className=document.body.className.replace(/\bscene-\S+/g,'').trim();document.body.classList.add('scene-'+scene.id);
 $('areas').innerHTML=d.districts.map(a=>`<polygon class="area" data-go="${a.id}" points="${a.area.map(p=>p.join(',')).join(' ')}"><title>${districts.find(x=>x.id===a.id).name}</title></polygon>`).join('');
 const pos=([x,y])=>`left:${x*100}%;top:${y*100}%`;
 $('pins').innerHTML=[
  ...d.places.map(p=>{const pl=places.find(x=>x.id===p.id);return`<button class="pin place" data-place="${p.id}" style="${pos(p.pos)}" aria-label="${pl.name}"><span class="dot">${icon(pl.icon)}</span><span class="label">${pl.name}</span></button>`;}),
  ...d.districts.map(a=>`<button class="pin district" data-go="${a.id}" style="${pos(a.label)}">${districts.find(x=>x.id===a.id).name}</button>`),
  ...d.buildings.map(p=>{const b=buildings.find(x=>x.id===p.id);return`<button class="pin building${favs.has(b.id)?' fav':''}" data-go="${b.id}" data-lift="${(p.ground[1]-p.pos[1]).toFixed(4)}" style="${pos(p.ground)}" aria-label="Abrir ${b.name}"><span class="medal"><b>${b.name}</b><small>${b.region.toUpperCase()}</small></span><span class="stem"></span><span class="base"></span></button>`;})
 ].join('');
 for(const el of $('areas').querySelectorAll('.area')){const pill=$('pins').querySelector(`.district[data-go="${el.dataset.go}"]`);el.onmouseenter=()=>pill?.classList.add('hover');el.onmouseleave=()=>pill?.classList.remove('hover');pill&&(pill.onmouseenter=()=>el.classList.add('hover'),pill.onmouseleave=()=>el.classList.remove('hover'));}
 $('needle').style.transform=`rotate(${-scene.camera.bearing}deg)`;
 clouds(scene.id==='itapema'?5:2);
 const links=d.districts.length?d.districts.map(a=>({id:a.id,name:districts.find(x=>x.id===a.id).name,sub:'2 empreendimentos'})):d.buildings.map(p=>({id:p.id,name:buildings.find(b=>b.id===p.id).name,sub:'Conhecer empreendimento'}));
 $('journey').innerHTML=links.map(a=>`<button data-go="${a.id}"><span><small>${a.sub}</small>${a.name}</span><b>↗</b></button>`).join('');
}
function clouds(n){const box=$('clouds');if(box.children.length||reduced)return;
 const positions=[[-14,.2],[19,.43],[51,.71],[7,.85],[67,.04]];
 for(let i=0;i<n;i++){const img=new Image();img.src='clouds/aerial-cloud.webp';img.alt='';const dur=105+i*23;
 img.style.cssText=`width:${30+i*4}vw;top:${positions[i][0]}vh;left:0;animation-duration:${dur}s;animation-delay:${-positions[i][1]*dur}s;opacity:${.6+i*.04}`;box.appendChild(img);}}

// ——— Barra superior e ferramentas ———
function crumbs(){const parts=[['#/','Itapema']];if(route.type==='scene'&&scene.parent)parts.push([`#/${scene.id}`,scene.name]);if(route.type==='project'){const d=districtOf(route.id);parts.push([`#/${d.id}`,d.name],[`#/${route.id}`,buildings.find(b=>b.id===route.id).name]);}
 $('crumbs').innerHTML=parts.map(([h,t],i)=>i===parts.length-1?`<span>${t}</span>`:`<a href="${h}">${t}</a><i>▸</i>`).join('');$('back').disabled=parts.length<2;}
function tools(){const t=route.type==='project'?[
  ['rotate',modelOpen?'Ver imagem':'Maquete 3D','spin'],['route','Distâncias','distances'],['map','Localização','locate'],['star',favs.has(route.id)?'Favorito':'Favoritar','fav'],['share','Compartilhar','share']]
 :[['expand','Tela cheia','full'],[night?'sun':'moon',night?'Modo dia':'Modo noite','night'],['eye','Camadas','layers'],['star','Favoritos','favs'],['map','Mapa 2D','map2d'],['share','Compartilhar','share']];
 $('tools').innerHTML=t.map(([i,l,a])=>`<button data-tool="${a}"${a==='fav'&&favs.has(route.id)?' class="on"':''}>${ico(i)}<span>${l}</span></button>`).join('');}

// ——— Cartão de ponto turístico ———
function placeCard(id){const p=places.find(x=>x.id===id);cardFor=id;$('pins').querySelectorAll('.place').forEach(el=>el.classList.toggle('active',el.dataset.place===id));
 const near=buildings.map(b=>({...b,d:distance(b.coords,p.coords)})).sort((a,b)=>a.d-b.d);
 $('card').innerHTML=`<button class="close" data-close aria-label="Fechar">×</button><span class="eyebrow">${p.category}</span><h3>${p.name}</h3><p>${p.description}</p><span class="eyebrow">Distância dos empreendimentos · em linha reta</span><div class="rows">${near.map(b=>`<button class="row" data-go="${b.id}"><span>${b.name}<small>${b.region}</small></span><strong>${formatDistance(b.d)}</strong></button>`).join('')}</div><div class="links"><a class="btn" href="https://www.google.com/maps/search/?api=1&query=${p.coords[1]},${p.coords[0]}" target="_blank" rel="noopener">${ico('external')} Google Maps</a><a class="btn ghost" href="${p.source}" target="_blank" rel="noopener">Fonte</a></div>`;
 $('card').hidden=false;}
function closeCard(){$('card').hidden=true;cardFor=null;$('pins').querySelectorAll('.place.active').forEach(el=>el.classList.remove('active'));}

// ——— Painéis laterais ———
function panel(html){closePanel();const el=document.createElement('section');el.className='panel glass';el.id='panel';el.innerHTML=`<button class="close" data-close aria-label="Fechar">×</button>${html}`;document.body.appendChild(el);}
function closePanel(){$('panel')?.remove();}
function distancesPanel(b){panel(`<h3>${b.name}</h3><p class="hintline">O melhor de Itapema por perto · distâncias aproximadas em linha reta.</p><div class="rows">${nearby(b).map(p=>`<a class="row" href="https://www.google.com/maps/dir/?api=1&origin=${b.coords[1]},${b.coords[0]}&destination=${p.coords[1]},${p.coords[0]}" target="_blank" rel="noopener"><span>${p.name}<small>${p.category} · traçar rota ↗</small></span><strong>${formatDistance(p.distance)}</strong></a>`).join('')}</div><p class="hintline">Prédio e terreno fictícios. Referências para teste.</p>`);}
function favsPanel(){const list=buildings.filter(b=>favs.has(b.id));panel(`<h3>Favoritos</h3><p class="hintline">${list.length?'Seus empreendimentos salvos neste navegador.':'Abra um empreendimento e toque em “Favoritar” para salvá-lo aqui.'}</p><div class="rows">${list.map(b=>`<button class="row" data-go="${b.id}"><span>${b.name}<small>${b.region}</small></span><strong>↗</strong></button>`).join('')}</div>`);}

// ——— Página do empreendimento ———
async function openProject(b){
 const d=districtOf(b.id),p=plates(d.id);$('projectBackdrop').style.backgroundImage=`url(${night?p.night:p.day})`;
 modelOpen=false;modelLoading=false;viewer?.destroy();viewer=null;$('model').hidden=true;$('project').classList.remove('show-model');
 $('projectHero').alt=`Perspectiva arquitetônica ilustrativa de ${b.name}, com paisagismo e vista para o mar`;
 await load($('projectHero'),`renders/architecture/${b.id}-hero.webp`);
 $('projectInfo').innerHTML=`<span class="eyebrow">${b.region} · Itapema</span><h1 class="mark">${b.name}</h1><p>Clique no prédio para conhecer o empreendimento.</p><a class="btn" href="produto.html?id=${b.id}">Explorar empreendimento ↗</a><p class="disclaimer">Arquitetura e entorno ilustrativos.</p>`;
 $('project').hidden=false;document.body.classList.add('in-project');
 let target=$('buildingTarget');if(!target){const frame=document.createElement('div');frame.className='building-frame';frame.innerHTML='<a id="buildingTarget" class="building-target"><span>Conhecer empreendimento ↗</span></a>';$('project').appendChild(frame);target=$('buildingTarget');}
 target.href=`produto.html?id=${b.id}`;target.setAttribute('aria-label',`Conhecer ${b.name}`);

 }
async function toggleModel(){
 if(modelLoading)return;
 modelOpen=!modelOpen;$('model').hidden=!modelOpen;$('project').classList.toggle('show-model',modelOpen);tools();
 if(!modelOpen){viewer?.destroy();viewer=null;return;}
 const id=route.id;modelLoading=true;
 try{const {createViewer}=await import('./viewer.js');if(route.type!=='project'||route.id!==id||!modelOpen)return;
 $('model').innerHTML='';viewer=createViewer($('model'),buildings.find(b=>b.id===id));}
 catch(e){modelOpen=false;$('model').hidden=true;$('project').classList.remove('show-model');toast('A maquete 3D não está disponível neste navegador.');tools();}
 finally{modelLoading=false;}
}

function closeProject(){viewer?.destroy();viewer=null;$('project').hidden=true;document.body.classList.remove('in-project');document.querySelector('.cta')?.remove();}

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
 if(point)await flyTo(point[0],point[1],Math.min(view.s*(target?2.25:1.9),3.5),1250);
 const old=document.createElement('div');old.className='scene-outgoing';
 if(prev){if(prev.type==='project')old.appendChild($('projectHero').cloneNode());else {const copy=$('world').cloneNode(true);copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));copy.removeAttribute('id');copy.querySelector('.pins')?.remove();copy.querySelector('.areas')?.remove();old.appendChild(copy);}document.body.appendChild(old);}
 route=next;
 if(next.type==='project'){const b=buildings.find(x=>x.id===next.id);scene=scenes.find(s=>s.id===nextScene);await openProject(b);}
 else{closeProject();scene=scenes.find(s=>s.id===next.id);layout();await showPlates(scene.id);drawScene();const [fx,fy]=focus();center(fx,fy,1);if(next.place)placeCard(next.place);}
 crumbs();tools();document.title=next.type==='project'?`${buildings.find(b=>b.id===next.id).name} · Itapema Vista`:scene.id==='itapema'?'Itapema Vista':`${scene.name} · Itapema Vista`;
 $('curtain').classList.add('out');
 if(prev){const anim=old.animate([{opacity:1},{opacity:0}],{duration:reduced?0:650,easing:'ease-in-out',fill:'forwards'});await anim.finished;old.remove();}
}

function veil(on){const c=$('curtain');return new Promise(r=>{if(on){c.classList.remove('out');c.classList.add('veil');setTimeout(r,reduced?0:350);}else{c.classList.add('out');setTimeout(()=>{c.classList.remove('veil');r();},reduced?0:450);}});}

// ——— Ações ———
async function toggleNight(){night=!night;store.set('itapema-night',night);if(night&&scene)await load($('imgNight'),plates(scene.id).night);document.body.classList.toggle('night',night);if(route.type==='project'){const p=plates(districtOf(route.id).id);$('projectBackdrop').style.backgroundImage=`url(${night?p.night:p.day})`;}tools();}
function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').hidden=true,3200);}
async function share(){const data={title:document.title,url:location.href};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(location.href);toast('Link copiado.');}}catch{}}
async function fullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen();}catch{toast('Use a opção de tela cheia do navegador.');}}
const actions={
 full:fullscreen,night:toggleNight,share,
 layers(){$('filters').hidden=!$('filters').hidden;$('tools').querySelector('[data-tool="layers"]').classList.toggle('on',!$('filters').hidden);},
 favs:favsPanel,map2d(){location.href='mapa.html';},
 spin:toggleModel,
 zoomIn(){animated(()=>zoomAt(innerWidth/2,innerHeight/2,1.4),400);},
 zoomOut(){animated(()=>zoomAt(innerWidth/2,innerHeight/2,1/1.4),400);},
 distances(){distancesPanel(buildings.find(b=>b.id===route.id));},
 locate(){location.hash=`#/${districtOf(route.id).id}`;},
 fav(){const id=route.id;favs.has(id)?favs.delete(id):favs.add(id);store.set('itapema-favs',[...favs]);tools();toast(favs.has(id)?'Salvo nos favoritos.':'Removido dos favoritos.');}
};
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-tool]');if(t){actions[t.dataset.tool]?.(t);return;}
 if(e.target.closest('[data-close]')){const dlg=e.target.closest('dialog');if(dlg)dlg.close();else if(e.target.closest('#card'))closeCard();else closePanel();return;}
 const g=e.target.closest('[data-go]');if(g){location.hash=`#/${g.dataset.go}`;return;}
 const p=e.target.closest('[data-place]');if(p){placeCard(p.dataset.place);return;}
 const l=e.target.closest('[data-layer]');if(l){l.classList.toggle('on');document.body.classList.toggle('hide-'+l.dataset.layer,!l.classList.contains('on'));return;}
 if(e.target.closest('#stage')&&!$('card').hidden)closeCard();
});
$('back').onclick=()=>{if(route.type==='project')location.hash=`#/${districtOf(route.id).id}`;else if(scene.parent)location.hash=`#/${scene.parent}`;};
$('about').onclick=()=>$('aboutDialog').showModal();
$('compass').onclick=()=>toast(`O norte aponta para a seta vermelha · vista voltada a ${Math.round(scene.camera.bearing)}°`);
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea'))return;
 if(e.key==='Escape'){if($('panel'))closePanel();else if(!$('card').hidden)closeCard();else if(!$('back').disabled)$('back').click();return;}
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
