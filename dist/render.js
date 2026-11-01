// Estúdio de renders: monta a cena 3D (terreno + imagem aérea + prédios) com a câmera de uma cena
// e publica em window.__render as posições de tela dos pontos clicáveis. Usado por tools/render-scenes.mjs.
// Uso manual: render.html?scene=itapema&night=1
import {buildings,places,districts,scenes} from './data.js';
const q=new URLSearchParams(location.search);
const scene=scenes.find(s=>s.id===q.get('scene'))||scenes[0];
const night=q.get('night')==='1';
const M_PER_DEG=111320;

function feature(geometry,properties={}){return{type:'Feature',geometry,properties};}
function rect(b,w,d,base,height,color,shift=0){const dx=w/2/(M_PER_DEG*Math.cos(b.coords[1]*Math.PI/180)),dy=d/2/M_PER_DEG;const x=b.coords[0]+shift/100000,y=b.coords[1];return feature({type:'Polygon',coordinates:[[[x-dx,y-dy],[x+dx,y-dy],[x+dx,y+dy],[x-dx,y+dy],[x-dx,y-dy]]]},{base,height,color});}
// Torres conceituais: pódio, núcleo de vidro, lajes claras a cada pavimento e coroamento.
function towers(){return{type:'FeatureCollection',features:buildings.flatMap(b=>{const glass=night?'#f3d9a4':'#3f6f7c';const out=[rect(b,46,38,0,10,'#ece8dc'),rect(b,30,23,10,b.height,glass)];for(let n=0;n<b.floors;n++){const y=10+n*(b.height-10)/b.floors;out.push(rect(b,35+b.shape,27,y,y+.7,night?'#fff3d8':'#f4f1e8',b.shape===2?Math.sin(n*.4)*1.5:0));}out.push(rect(b,28,20,b.height,b.height+4,'#f4f1e8'));return out;})};}

async function init(){
 const style=await fetch('map-style.json').then(r=>r.json());
 style.sources.satellite={type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:19};
 style.sources.dem={type:'raster-dem',tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],tileSize:256,maxzoom:14,encoding:'terrarium'};
 // Só a fotografia aérea, o relevo e os volumes: nada de rótulos ou linhas de mapa no render.
 style.layers=style.layers.filter(l=>l.id==='background'||l.id==='building-3d');
 const b3d=style.layers.find(l=>l.id==='building-3d');
 b3d.paint={'fill-extrusion-color':night?'#c98f52':'#efebe2','fill-extrusion-height':['coalesce',['get','render_height'],12],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':night?.62:.9,'fill-extrusion-vertical-gradient':true};
 style.layers.splice(1,0,{id:'satellite',type:'raster',source:'satellite',paint:night?{'raster-brightness-max':.36,'raster-saturation':-.45,'raster-hue-rotate':200,'raster-contrast':.1}:{'raster-saturation':.08,'raster-contrast':.06,'raster-brightness-max':1}});
 style.terrain={source:'dem',exaggeration:1.25};
 style.sky=night?{'sky-color':'#0b1626','horizon-color':'#20324a','fog-color':'#121e2e','sky-horizon-blend':.6,'horizon-fog-blend':.6,'fog-ground-blend':.35,'atmosphere-blend':.2}
  :{'sky-color':'#7fb2d6','horizon-color':'#e4eef2','fog-color':'#d6e4ea','sky-horizon-blend':.55,'horizon-fog-blend':.7,'fog-ground-blend':.45,'atmosphere-blend':.6};
 style.light={anchor:'map',position:[1.4,250,35],color:night?'#9fb8ff':'#fff4e0',intensity:night?.2:.28};
 const map=new maplibregl.Map({container:'map',style,...scene.camera,maxPitch:85,interactive:q.has('debug'),attributionControl:false,fadeDuration:0,canvasContextAttributes:{antialias:true,preserveDrawingBuffer:true}});
 window.map=map;
 map.on('load',()=>{
  // Unifica o mar: os mosaicos de satélite variam de tom entre níveis de zoom.
  map.addLayer({id:'sea',type:'fill',source:'openmaptiles','source-layer':'water',paint:{'fill-color':night?'#0d2a3a':'#2c8794','fill-opacity':night?.9:.8}},'building-3d');
  // À noite, ruas iluminadas em tom de sódio desenham a malha urbana.
  if(night)for(const [id,width,blur,opacity] of [['street-glow',[12,1.4,16,8],4,.28],['street-light',[12,.35,16,1.8],.4,.7]])map.addLayer({id,type:'line',source:'openmaptiles','source-layer':'transportation',filter:['!',['in',['get','class'],['literal',['path','track','rail','ferry']]]],paint:{'line-color':'#ffb866','line-width':['interpolate',['linear'],['zoom'],width[0],width[1],width[2],width[3]],'line-blur':blur,'line-opacity':opacity}},'building-3d');
  map.addSource('demo',{type:'geojson',data:towers()});
  map.addLayer({id:'demo-towers',type:'fill-extrusion',source:'demo',paint:{'fill-extrusion-color':['get','color'],'fill-extrusion-height':['get','height'],'fill-extrusion-base':['get','base'],'fill-extrusion-opacity':1,'fill-extrusion-vertical-gradient':true}});
  // Remove os prédios reais do OSM sob os terrenos fictícios para a torre não se misturar com eles.
  map.setFilter('building-3d',['!',['any',...buildings.map(b=>['within',{type:'Polygon',coordinates:[circle(b.coords,40)]}])]]);
 });
 map.once('idle',async()=>{await new Promise(r=>setTimeout(r,q.has('debug')?0:2500));await idle(map);window.__render=hotspots(map);document.title='ready';});
}
const idle=map=>new Promise(r=>map.loaded()&&!map.isMoving()?r():map.once('idle',r));
function circle(c,radius,steps=48){const out=[];for(let i=0;i<=steps;i++){const a=i/steps*Math.PI*2;out.push([c[0]+Math.cos(a)*radius/(M_PER_DEG*Math.cos(c[1]*Math.PI/180)),c[1]+Math.sin(a)*radius/M_PER_DEG]);}return out;}
// Às vezes um vértice cai num bloco de relevo ainda não carregado e salta; troca pelo meio dos vizinhos.
function smooth(pts){const n=pts.length-1,step=[];for(let i=0;i<n;i++)step.push(Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]));const med=[...step].sort((a,b)=>a-b)[n>>1];
 for(let i=1;i<n;i++){const a=pts[i-1],b=pts[i+1];if(Math.hypot(pts[i][0]-a[0],pts[i][1]-a[1])>med*4)pts[i]=[+((a[0]+b[0])/2).toFixed(4),+((a[1]+b[1])/2).toFixed(4)];}
 for(let i=1;i<n;i++){const a=pts[i-1],b=pts[i+1];if(Math.hypot(pts[i][0]-a[0],pts[i][1]-a[1])>med*4)pts[i]=[+((a[0]+b[0])/2).toFixed(4),+((a[1]+b[1])/2).toFixed(4)];}
 return pts;}
// Converte posições geográficas em coordenadas relativas da imagem (0–1), para o visualizador posicionar os pinos.
function hotspots(map){
 const c=map.getCanvas(),W=c.clientWidth,H=c.clientHeight;
 const pt=ll=>{const p=map.project(ll);return[+(p.x/W).toFixed(4),+(p.y/H).toFixed(4)];};
 const mpp=78271.517*Math.cos(scene.camera.center[1]*Math.PI/180)/2**map.getZoom();
 const lift=h=>+(h/mpp*Math.sin(map.getPitch()*Math.PI/180)/H).toFixed(4);
 const out={scene:scene.id,night,width:W,height:H,camera:scene.camera,districts:[],buildings:[],places:[]};
 for(const id of scene.districts||[]){const d=districts.find(x=>x.id===id);out.districts.push({id,label:pt(d.center),area:smooth(circle(d.center,d.radius,40).map(pt))});}
 for(const id of scene.buildings||[]){const b=buildings.find(x=>x.id===id);const [x,y]=pt(b.coords);out.buildings.push({id,pos:[x,+(y-lift(b.height+6)).toFixed(4)],ground:[x,y]});}
 for(const id of scene.places||[]){out.places.push({id,pos:pt(places.find(x=>x.id===id).coords)});}
 return out;
}
init();
