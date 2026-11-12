// Rotas reais de carro (OSRM/OpenStreetMap) de cada ponto turístico até cada empreendimento,
// projetadas em todas as cenas que têm conversão lat/lng → imagem (scenes.json → <cena>.geo).
// Atualiza: data.js (coordenadas), scenes.json (marcadores, empreendimentos, rotas e destinos de cada cena)
// e drive.json (km/min). As rotas brutas ficam em tools/osrm-cache.json (apague para recalcular).
// Uso: node tools/osm-routes.mjs
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {GEO,makeH} from './geo.mjs';
const root=new URL('../dist/',import.meta.url),sf=new URL('renders/scenes.json',root),cf=new URL('osrm-cache.json',import.meta.url);
const s=JSON.parse(readFileSync(sf,'utf8'));
const PLACES=['mirante','teleferico','marina','central','meia','garden','parque','pier','roda'],BUILD=['brisa','vista','horizonte','atlantico'];
const r4=v=>+v.toFixed(4);

// 1) coordenadas reais em data.js
let d=readFileSync(new URL('data.js',root),'utf8');
for(const id of [...PLACES,...BUILD]){const re=new RegExp("(\\{id:'"+id+"',[^}]*?coords:\\[)[^\\]]*(\\])");if(!re.test(d))throw new Error('data.js sem '+id);d=d.replace(re,`$1${GEO[id][0]},${GEO[id][1]}$2`);}
writeFileSync(new URL('data.js',root),d);

// 2) rotas OSRM (uma vez; cache)
const cache=existsSync(cf)?JSON.parse(readFileSync(cf,'utf8')):{};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(const b of BUILD)for(const p of PLACES){const src=p==='roda'?'pier':p,key=src+'>'+b;if(cache[key])continue;
 const url=`https://router.project-osrm.org/route/v1/driving/${GEO[src].join(',')};${GEO[b].join(',')}?overview=full&geometries=geojson`;
 let j;for(let t=0;t<4;t++){try{j=await (await fetch(url)).json();if(j.code==='Ok')break;}catch{}await sleep(1500);}
 if(j?.code!=='Ok')throw new Error('OSRM falhou: '+key);
 const r=j.routes[0];cache[key]={m:Math.round(r.distance),s:Math.round(r.duration),g:r.geometry.coordinates};await sleep(250);}
writeFileSync(cf,JSON.stringify(cache));
const drive={};for(const p of PLACES){drive[p]={};for(const b of BUILD){const c=cache[(p==='roda'?'pier':p)+'>'+b];drive[p][b]=[c.m,c.s];}}
writeFileSync(new URL('drive.json',root),JSON.stringify(drive));

// 3) projeção em cada cena
for(const [sid,sc] of Object.entries(s.scenes)){if(!sc.geo)continue;const W=sc.width,H=sc.height,toImg=makeH(sc.geo),img=g=>toImg(g).map(r4);
 const P=id=>sc.places.find(p=>p.id===id);
 const rodaOff=P('roda')&&P('pier')?[P('roda').pos[0]-P('pier').pos[0],P('roda').pos[1]-P('pier').pos[1]]:null;
 for(const p of sc.places)p.pos=img(GEO[p.id]);
 if(rodaOff)P('roda').pos=[r4(P('pier').pos[0]+rodaOff[0]),r4(P('pier').pos[1]+rodaOff[1])];
 for(const l of sc.lots||[]){const c=[l.lot.reduce((a,q)=>a+q[0],0)/l.lot.length,l.lot.reduce((a,q)=>a+q[1],0)/l.lot.length],t=img(GEO[l.id]);l.lot=l.lot.map(([x,y])=>[r4(x-c[0]+t[0]),r4(y-c[1]+t[1])]);}
 for(const b of sc.buildings||[]){const lift=[b.ground[0]-b.pos[0],b.ground[1]-b.pos[1]];b.ground=img(GEO[b.id]);b.pos=[r4(b.ground[0]-lift[0]),r4(b.ground[1]-lift[1])];}
 sc.targets=Object.fromEntries(BUILD.map(b=>[b,img(GEO[b])]));
 // trajeto projetado; para no primeiro ponto que sai muito do quadro (evita distorção de perspectiva)
 const ok=([x,y])=>x>-.6&&x<1.6&&y>-.6&&y<1.6,paths={};
 for(const b of BUILD){paths[b]={};for(const p of sc.places.map(x=>x.id)){const c=cache[(p==='roda'?'pier':p)+'>'+b];if(!c)continue;const pts=[];
  for(const g of c.g){const q=toImg(g);if(!ok(q))break;const l=pts.at(-1);if(!l||Math.hypot((q[0]-l[0])*W,(q[1]-l[1])*H)>=2)pts.push(q);}
  paths[b][p]=pts.map(q=>q.map(r4));}}
 sc.paths=paths;console.log(sid+': '+sc.places.length+' pontos, '+Object.keys(sc.targets).length+' destinos');}
writeFileSync(sf,JSON.stringify(s,null,2));
