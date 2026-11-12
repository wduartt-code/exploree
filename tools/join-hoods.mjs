// Divisa compartilhada entre bairros vizinhos: a borda de B que está a até TOL px de A passa a ser
// exatamente a borda de A (mesmos pontos) → sem vão e sem sobreposição.
// Uso: node tools/join-hoods.mjs <cena> <TOL px> "A|B" "A|B" ...   (A tem prioridade: B se ajusta a A)
import {readFileSync,writeFileSync} from 'node:fs';
const [,,id,tolArg,...pairs]=process.argv,TOL=+tolArg;
const f=new URL('../dist/renders/scenes.json',import.meta.url),s=JSON.parse(readFileSync(f,'utf8')),sc=s.scenes[id],W=sc.width,H=sc.height;
const px=p=>[p[0]*W,p[1]*H],un=p=>[+(p[0]/W).toFixed(4),+(p[1]/H).toFixed(4)];
const dens=(poly,step=2)=>{const o=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}return o;};
const simp=(pts,tol=.7)=>{if(pts.length<4)return pts;const o=[pts[0]];for(let i=1;i<pts.length-1;i++){const a=o.at(-1),b=pts[i+1],p=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;if(Math.abs((p[0]-a[0])*dy-(p[1]-a[1])*dx)/L>tol)o.push(p);}o.push(pts.at(-1));return o;};
const rep=[];
for(const pr of pairs){const [an,bn,tp]=pr.split('|'),TOLp=tp?+tp:TOL,A=sc.hoods.find(h=>h.name===an&&!h.part),B=sc.hoods.find(h=>h.name===bn&&!h.part);if(!A||!B){rep.push(pr+': não encontrado');continue;}
 const ring=A.area.map(px),cum=[0];for(let i=1;i<=ring.length;i++){const a=ring[i-1],b=ring[i%ring.length];cum[i]=cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]);}const L=cum.at(-1);
 const proj=p=>{let best={d:1e18};for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(l*l))),q=[a[0]+t*dx,a[1]+t*dy],d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<best.d)best={d,q,s:cum[i]+t*l};}return best;};
 // caminho mais curto pela borda de A entre s1 e s2
 const path=(s1,s2)=>{const fwd=((s2-s1)%L+L)%L,dir=fwd<=L/2?1:-1,out=[];const n=ring.length;
  if(dir>0){for(let i=0;i<n;i++){const c=cum[i],rel=((c-s1)%L+L)%L;if(rel>0&&rel<fwd)out.push([rel,ring[i]]);}out.sort((a,b)=>a[0]-b[0]);}
  else{const back=L-fwd;for(let i=0;i<n;i++){const c=cum[i],rel=((s1-c)%L+L)%L;if(rel>0&&rel<back)out.push([rel,ring[i]]);}out.sort((a,b)=>a[0]-b[0]);}
  return out.map(x=>x[1]);};
 const P=dens(B.area.map(px)),j=P.map(proj),flag=j.map(x=>x.d<TOLp);if(!flag.some(Boolean)){rep.push(pr+': sem divisa próxima');continue;}
 let start=flag.findIndex(v=>!v);if(start<0)start=0;const out=[],n=P.length;let moved=0;
 for(let k=0;k<n;){const i=(start+k)%n;if(!flag[i]){out.push(P[i]);k++;continue;}let e=k;while(e<n&&flag[(start+e)%n])e++;
  const a=j[(start+k)%n],b=j[(start+e-1)%n];out.push(a.q,...path(a.s,b.s),b.q);moved+=e-k;k=e;}
 B.area=simp(out).map(un);rep.push(`${bn} ← ${an}: ${Math.round(moved*2)} px de divisa compartilhada`);}
writeFileSync(f,JSON.stringify(s,null,2));console.log(rep.join('\n'));
