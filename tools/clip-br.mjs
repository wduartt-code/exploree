// Encaixa os bairros de uma cena na BR-101 (<cena>.br101). Regras:
//  • nenhum bairro cruza a rodovia;
//  • todo trecho de borda que passa da BR ou chega a menos de TOL px dela vira o próprio traçado da BR
//    (sem vão e sem sobreposição);
//  • bairro com parte relevante dos dois lados (>15% da área) vira duas partes, uma de cada lado
//    (a menor marcada como part:true, sem rótulo).
// Uso: node tools/clip-br.mjs <cena> [TOL=22]
import {readFileSync,writeFileSync} from 'node:fs';
const id=process.argv[2],TOL=+(process.argv[3]||22);
const f=new URL('../dist/renders/scenes.json',import.meta.url),s=JSON.parse(readFileSync(f,'utf8')),sc=s.scenes[id],W=sc.width,H=sc.height;
const px=p=>[p[0]*W,p[1]*H],un=p=>[+(p[0]/W).toFixed(4),+(p[1]/H).toFixed(4)];
const br=sc.br101.map(px),cum=[0];for(let i=1;i<br.length;i++)cum[i]=cum[i-1]+Math.hypot(br[i][0]-br[i-1][0],br[i][1]-br[i-1][1]);
const ext=(a,b)=>[a[0]+(a[0]-b[0])*60,a[1]+(a[1]-b[1])*60],line=[ext(br[0],br[1]),...br,ext(br.at(-1),br.at(-2))],far=1e6;
const sideA=[...line,[far,line.at(-1)[1]],[far,-far],[-far,-far],[line[0][0],-far]]; // lado do mar
const inside=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const proj=p=>{let best={d:1e18};for(let i=0;i<br.length-1;i++){const a=br[i],b=br[i+1],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(L*L))),q=[a[0]+t*dx,a[1]+t*dy],d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<best.d)best={d,q,s:cum[i]+t*L};}return best;};
const along=(s1,s2)=>{const o=[];for(let i=0;i<br.length;i++){const c=cum[i];if((s1<s2&&c>s1&&c<s2)||(s1>s2&&c<s1&&c>s2))o.push(br[i]);}return s1<s2?o:o.reverse();};
const dens=(poly,step=2)=>{const o=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}return o;};
const simp=(pts,tol=.7)=>{if(pts.length<4)return pts;const o=[pts[0]];for(let i=1;i<pts.length-1;i++){const a=o.at(-1),b=pts[i+1],p=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;if(Math.abs((p[0]-a[0])*dy-(p[1]-a[1])*dx)/L>tol)o.push(p);}o.push(pts.at(-1));return o;};
// trecho de borda "na BR": do lado errado, ou do lado certo mas colado nela
function onSide(P,wantA){const inA=P.map(p=>inside(p,sideA)),j=P.map(proj),flag=P.map((p,i)=>inA[i]!==wantA||j[i].d<TOL);
 if(flag.every(Boolean))return [];let start=flag.findIndex(v=>!v);const out=[],n=P.length;
 for(let k=0;k<n;){const i=(start+k)%n;if(!flag[i]){out.push(P[i]);k++;continue;}
  let e=k;while(e<n&&flag[(start+e)%n])e++;const a=j[(start+k)%n],b=j[(start+e-1)%n];out.push(a.q,...along(a.s,b.s),b.q);k=e;}
 return simp(out);}
const area=pts=>Math.abs(pts.reduce((a,p,i)=>{const q=pts[(i+1)%pts.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2);
const out=[],rep=[];
for(const h of sc.hoods){const poly=h.area.map(px),P=dens(poly),xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);let aa=0,ab=0;
 for(let x=Math.min(...xs);x<=Math.max(...xs);x+=3)for(let y=Math.min(...ys);y<=Math.max(...ys);y+=3){const q=[x,y];if(!inside(q,poly))continue;if(inside(q,sideA))aa++;else ab++;}
 const tot=aa+ab||1,mainA=aa>=ab,main=onSide(P,mainA);
 if(main.length>2)out.push({...h,area:main.map(un)});
 if(!h.part&&Math.min(aa,ab)/tot>.15){const other=onSide(P,!mainA);if(other.length>2&&area(other)>400)out.push({name:h.name,part:true,area:other.map(un)});rep.push(`${h.name}: 2 partes, uma de cada lado da BR`);}
 else rep.push(`${h.name}: lado ${mainA?'mar':'interior'}`);}
sc.hoods=out;writeFileSync(f,JSON.stringify(s,null,2));console.log(rep.join('\n'));
