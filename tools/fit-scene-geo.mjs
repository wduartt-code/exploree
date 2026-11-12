// Ajusta lat/lng → imagem para uma cena de bairro: chute inicial pelos marcadores originais
// (coordenadas antigas, que geraram o render) e refinamento casando a BR-101 real (OSM) com a BR traçada na imagem.
// Uso: node tools/fit-scene-geo.mjs <cena> <overpass-br101.json> <dados-antigos.mjs> "x,y x,y ..." (BR em px da imagem)
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {refine2,refine3} from './geo.mjs';
const [,,id,osmFile,oldFile,trace,coastFile,coastTrace]=process.argv;
const f=new URL('../dist/renders/scenes.json',import.meta.url),s=JSON.parse(readFileSync(f,'utf8')),sc=s.scenes[id],W=sc.width,H=sc.height;
const old=await import(pathToFileURL(oldFile).href),oc=Object.fromEntries([...old.places,...old.buildings].map(p=>[p.id,p.coords]));
const pairs=[...sc.places.filter(p=>p.id!=='roda'&&oc[p.id]).map(p=>[oc[p.id],p.pos]),...sc.buildings.map(b=>[oc[b.id],b.ground])];
const brImg=trace.trim().split(/\s+/).map(t=>t.split(',').map(Number));sc.br101=brImg.map(([x,y])=>[+(x/W).toFixed(4),+(y/H).toFixed(4)]);
const brGeo=JSON.parse(readFileSync(osmFile,'utf8')).elements.flatMap(e=>e.geometry||[]).map(p=>[p.lon,p.lat]);
const mx=pairs.reduce((a,p)=>a+p[0][0],0)/pairs.length,my=pairs.reduce((a,p)=>a+p[0][1],0)/pairs.length,k=100;
const rows=pairs.map(([g])=>[(g[0]-mx)*k,(g[1]-my)*k,1]),det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
const lin=t=>{const A=[0,1,2].map(i=>[0,1,2].map(j=>rows.reduce((a,r)=>a+r[i]*r[j],0))),b=[0,1,2].map(i=>rows.reduce((a,r,q)=>a+r[i]*t[q],0)),D=det(A);return [0,1,2].map(c=>det(A.map((r,i)=>r.map((v,j)=>j===c?b[i]:v)))/D);};
const coastImg=(coastTrace||'').trim().split(/\s+/).map(t=>t.split(',').map(Number)),coastGeo=!coastFile?[]:JSON.parse(readFileSync(coastFile,'utf8')).elements.flatMap(e=>e.geometry||[]).map(p=>[p.lon,p.lat]);
const h0=[...lin(pairs.map(p=>p[1][0])),...lin(pairs.map(p=>p[1][1])),0,0],r=!coastFile?(x=>({...x,erros:'BR '+x.mediana.toFixed(1)+'px'}))(refine2({mx,my,k,h:h0},brGeo,brImg,pairs,W,H,.2)):refine3({mx,my,k,h:[...lin(pairs.map(p=>p[1][0])),...lin(pairs.map(p=>p[1][1])),0,0]},[{name:'BR',geo:brGeo,img:brImg},{name:'orla',geo:coastGeo,img:coastImg}],pairs,W,H,.3);
sc.geo=r.P;writeFileSync(f,JSON.stringify(s,null,2));
console.log(id+": erro mediano (traçado → real): "+r.erros);
