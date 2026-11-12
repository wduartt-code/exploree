// Copia os contornos dos bairros (desenhados na cena itapema) para as cenas de bairro:
// imagem itapema → lat/lng (inversa da homografia) → imagem da cena. Uso: node tools/hoods-to-scenes.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {makeH} from './geo.mjs';
const f=new URL('../dist/renders/scenes.json',import.meta.url),s=JSON.parse(readFileSync(f,'utf8')),src=s.scenes.itapema,Hs=makeH(src.geo);
const inv=([u,v])=>{let g=[src.geo.mx,src.geo.my];for(let i=0;i<30;i++){const q=Hs(g),e=1e-6,a=Hs([g[0]+e,g[1]]),b=Hs([g[0],g[1]+e]);
 const J=[[(a[0]-q[0])/e,(b[0]-q[0])/e],[(a[1]-q[1])/e,(b[1]-q[1])/e]],dt=J[0][0]*J[1][1]-J[0][1]*J[1][0],dx=u-q[0],dy=v-q[1];g=[g[0]+(J[1][1]*dx-J[0][1]*dy)/dt,g[1]+(-J[1][0]*dx+J[0][0]*dy)/dt];}return g;};
const dens=(poly,step=.004)=>{const o=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}return o;};
const geoHoods=src.hoods.map(h=>({name:h.name,geo:dens(h.area).map(inv)}));
for(const [id,sc] of Object.entries(s.scenes)){if(id==='itapema'||!sc.geo)continue;const H=makeH(sc.geo),out=[];
 const manual=new Set(sc.hoodsManual||[]),keep=(sc.hoods||[]).filter(h=>manual.has(h.name));
 for(const h of geoHoods){if(manual.has(h.name))continue;const pts=h.geo.map(H);if(pts.some(([x,y])=>!isFinite(x)||x<-1||x>2||y<-1||y>2))continue;
  const c=[pts.reduce((a,p)=>a+p[0],0)/pts.length,pts.reduce((a,p)=>a+p[1],0)/pts.length];if(c[0]<0||c[0]>1||c[1]<0||c[1]>1)continue;
  out.push({name:h.name,area:pts.map(p=>p.map(v=>+v.toFixed(4)))});}
 sc.hoods=[...keep,...out];console.log(id+': '+out.map(h=>h.name).join(', '));}
writeFileSync(f,JSON.stringify(s,null,2));
