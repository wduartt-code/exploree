// Ajusta a conversão lat/lng → imagem (cena itapema) e grava em scenes.json (itapema.geo).
// Uso: node tools/fit-geo.mjs <arquivo-overpass-br101.json>
import {readFileSync,writeFileSync} from 'node:fs';
import {GEO,refine} from './geo.mjs';
const f=new URL('../dist/renders/scenes.json',import.meta.url),s=JSON.parse(readFileSync(f,'utf8')),sc=s.scenes.itapema,W=sc.width,H=sc.height;
const os=JSON.parse(readFileSync(process.argv[2],'utf8')),brGeo=os.elements.flatMap(e=>e.geometry||[]).map(p=>[p.lon,p.lat]);
const pairs=sc.places.filter(p=>GEO[p.id]&&p.id!=='roda').map(p=>[GEO[p.id],p.pos]);
const mx=pairs.reduce((a,p)=>a+p[0][0],0)/pairs.length,my=pairs.reduce((a,p)=>a+p[0][1],0)/pairs.length,k=100;
// chute inicial: ajuste linear (afim) pelos marcadores
const rows=pairs.map(([g])=>[(g[0]-mx)*k,(g[1]-my)*k,1]),solve3=t=>{const A=[0,1,2].map(i=>[0,1,2].map(j=>rows.reduce((a,r)=>a+r[i]*r[j],0))),b=[0,1,2].map(i=>rows.reduce((a,r,q)=>a+r[i]*t[q],0));
 const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]),D=det(A);return [0,1,2].map(c=>det(A.map((r,i)=>r.map((v,j)=>j===c?b[i]:v)))/D);};
const ax=solve3(pairs.map(p=>p[1][0])),ay=solve3(pairs.map(p=>p[1][1]));
const r=refine({mx,my,k,h:[...ax,...ay,0,0]},brGeo,sc.br101.map(([x,y])=>[x*W,y*H]),pairs,W,H);
sc.geo=r.P;writeFileSync(f,JSON.stringify(s,null,2));
console.log(`BR-101 real sobre a imagem: ${r.n} pontos, erro mediano ${r.mediana.toFixed(1)} px, 90% abaixo de ${r.p90.toFixed(1)} px`);
