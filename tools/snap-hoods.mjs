// Fecha vãos entre bairros vizinhos e encosta na BR-101 (cena itapema em dist/renders/scenes.json).
// Vértice a menos de TOL de uma borda vizinha (ou da BR) é movido para cima dela. Uso: node tools/snap-hoods.mjs
// ponytail: só corrige vãos pequenos (< TOL); sobreposições maiores precisam de novo desenho.
import {readFileSync,writeFileSync} from 'node:fs';
const f=new URL('../dist/renders/scenes.json',import.meta.url),s=JSON.parse(readFileSync(f,'utf8')),sc=s.scenes[process.argv[2]||'itapema'],TOL=+(process.argv[3]||.012);
const near=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return [a[0]+t*dx,a[1]+t*dy];};
const snapTo=(p,line,closed)=>{let best=null,d=TOL;for(let i=0;i<line.length-(closed?0:1);i++){const q=near(p,line[i],line[(i+1)%line.length]),e=Math.hypot(q[0]-p[0],q[1]-p[1]);if(e<d){d=e;best=q;}}return best;};
let moved=0;
for(const h of sc.hoods)h.area=h.area.map(p=>{const q=sc.br101&&snapTo(p,sc.br101,false);if(q){moved++;return q;}return p;});
for(const h of sc.hoods)for(const o of sc.hoods)if(o!==h)h.area=h.area.map(p=>{const q=snapTo(p,o.area,true);if(q&&Math.hypot(q[0]-p[0],q[1]-p[1])>1e-6){moved++;return q;}return p;});
for(const h of sc.hoods)h.area=h.area.map(p=>p.map(v=>+v.toFixed(4)));
writeFileSync(f,JSON.stringify(s,null,2));console.log('vértices ajustados:',moved);
