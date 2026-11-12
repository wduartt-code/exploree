// Utilitários de bairros em raster: rasterizar, distância/lado da BR, mapeamento geográfico entre cenas e
// vetorização topológica (cada divisa simplificada uma vez para os dois vizinhos; suavizada, sem serrilhado).
export const fillPoly=(poly,W,H)=>{const o=new Uint8Array(W*H),ys=poly.map(p=>p[1]);for(let y=Math.max(0,Math.floor(Math.min(...ys)));y<=Math.min(H-1,Math.ceil(Math.max(...ys)));y++){const xs=[];for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(W-1,Math.floor(xs[k+1]-.5));x++)o[y*W+x]=1;}return o;};
export function raster(sc,names){const W=sc.width,H=sc.height,L=new Uint8Array(W*H);for(const h of sc.hoods){const f=fillPoly(h.area.map(([x,y])=>[x*W,y*H]),W,H),id=names.indexOf(h.name)+1;for(let i=0;i<W*H;i++)if(f[i])L[i]=id;}return L;}
export function distBR(sc){const W=sc.width,H=sc.height,br=sc.br101.map(([x,y])=>[x*W,y*H]),d=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let m=1e9;for(let k=0;k<br.length-1;k++){const a=br[k],b=br[k+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy))),e=Math.hypot(a[0]+t*dx-x,a[1]+t*dy-y);if(e<m)m=e;}d[y*W+x]=m;}return d;}
// lado da BR (sinal do produto vetorial com o segmento mais próximo; pontas estendidas)
export function sideBR(sc){const W=sc.width,H=sc.height,br=sc.br101.map(([x,y])=>[x*W,y*H]),s=new Int8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let m=1e9,sg=0;for(let k=0;k<br.length-1;k++){const a=br[k],b=br[k+1],dx=b[0]-a[0],dy=b[1]-a[1],tr=((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),t=Math.max(k===0?-50:0,Math.min(k===br.length-2?50:1,tr)),e=Math.hypot(a[0]+t*dx-x,a[1]+t*dy-y);if(e<m){m=e;sg=Math.sign(dx*(y-a[1])-dy*(x-a[0]));}}s[y*W+x]=sg;}return s;}
export function comps(L,W,H,id){const N=W*H,seen=new Uint8Array(N),out=[];for(let i=0;i<N;i++){if(L[i]!==id||seen[i])continue;const c=[],q=[i];seen[i]=1;while(q.length){const k=q.pop();c.push(k);const x=k%W,y=k/W|0;for(const j of [x>0?k-1:-1,x<W-1?k+1:-1,y>0?k-W:-1,y<H-1?k+W:-1])if(j>=0&&!seen[j]&&L[j]===id){seen[j]=1;q.push(j);}}out.push(c);}return out.sort((a,b)=>b.length-a.length);}
function trace(set,W,H){const N=W*H,inS=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&set.has(y*W+x);let s=Infinity;for(const i of set)if(i<s)s=i;const sx=s%W,sy=s/W|0,pts=[];let x=sx,y=sy,dir=0;const step=[[1,0],[0,1],[-1,0],[0,-1]];let g=0;
 do{pts.push([x,y]);for(const d of [(dir+3)%4,dir,(dir+1)%4,(dir+2)%4]){const [dx,dy]=step[d];const rx=d===0?x:d===1?x-1:d===2?x-1:x,ry=d===0?y:d===1?y:d===2?y-1:y-1,lx=d===0?x:d===1?x:d===2?x-1:x-1,ly=d===0?y-1:d===1?y:d===2?y:y-1;if(inS(rx,ry)&&!inS(lx,ly)){dir=d;x+=dx;y+=dy;break;}}if(++g>4*N)throw new Error('trace');}while(!(x===sx&&y===sy));return pts;}
const rdp=(pts,eps)=>{if(pts.length<3)return pts;let d=0,k=0;const a=pts[0],b=pts.at(-1),L2=Math.hypot(b[0]-a[0],b[1]-a[1])||1;for(let i=1;i<pts.length-1;i++){const p=pts[i],e=Math.abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))/L2;if(e>d){d=e;k=i;}}return d>eps?[...rdp(pts.slice(0,k+1),eps).slice(0,-1),...rdp(pts.slice(k),eps)]:[a,b];};
// raster → polígonos (descarta fragmentos < min; maxParts por bairro)
export function vectorize(L,W,H,names,{min=600,maxParts={}}={}){const out=[];for(const n of names){const id=names.indexOf(n)+1,cs=comps(L,W,H,id),k=maxParts[n]??1;cs.forEach((c,i)=>{if(i>0&&(c.length<min||i>=k)){c.forEach(j=>L[j]=0);}});
 comps(L,W,H,id).forEach((c,ix)=>{if(c.length<300)return;const set=new Set(c),ring=trace(set,W,H),half=ring.length>>1;const simp=[...rdp(ring.slice(0,half+1),.9).slice(0,-1),...rdp(ring.slice(half).concat([ring[0]]),.9).slice(0,-1)];const o={name:n,area:simp.map(([x,y])=>[+(x/W).toFixed(4),+(y/H).toFixed(4)])};if(ix>0)o.part=true;out.push(o);});}return out;}
// homografia geográfica da cena (lng,lat → fração da imagem) e inversa
export function geoFns(g){const [a,b,c,d,e,f,h7,h8]=g.h,M=[[a,b,c],[d,e,f],[h7,h8,1]];
 const fwd=([lng,lat])=>{const x=(lng-g.mx)*g.k,y=(lat-g.my)*g.k,w=h7*x+h8*y+1;return [(a*x+b*y+c)/w,(d*x+e*y+f)/w];};
 const det=M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])-M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])+M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
 const I=[[ (M[1][1]*M[2][2]-M[1][2]*M[2][1])/det,-(M[0][1]*M[2][2]-M[0][2]*M[2][1])/det,(M[0][1]*M[1][2]-M[0][2]*M[1][1])/det],[-(M[1][0]*M[2][2]-M[1][2]*M[2][0])/det,(M[0][0]*M[2][2]-M[0][2]*M[2][0])/det,-(M[0][0]*M[1][2]-M[0][2]*M[1][0])/det],[(M[1][0]*M[2][1]-M[1][1]*M[2][0])/det,-(M[0][0]*M[2][1]-M[0][1]*M[2][0])/det,(M[0][0]*M[1][1]-M[0][1]*M[1][0])/det]];
 const inv=([u,v])=>{const w=I[2][0]*u+I[2][1]*v+I[2][2],x=(I[0][0]*u+I[0][1]*v+I[0][2])/w,y=(I[1][0]*u+I[1][1]*v+I[1][2])/w;return [x/g.k+g.mx,y/g.k+g.my];};return {fwd,inv};}
// ——— vetorização topológica: cada divisa entre dois bairros é simplificada UMA vez e usada pelos dois lados ———
// (vizinhos continuam com a mesma linha; junções de 3+ áreas ficam fixas). eps maior = linhas mais retas.
export function vectorizeTopo(L,W,H,names,{eps=3.5,epsBR=1.6,SMOOTH=16,heavy=null,min=600,maxParts={},nearBR=()=>false}={}){
 const lab=(x,y)=>x<0||y<0||x>=W||y>=H?0:L[y*W+x],CW=W+1;
 // limpa fragmentos
 // ilhas: parte secundária cercada por um único bairro passa a ser desse bairro
 for(let pass=0;pass<2;pass++)for(const n of names){const id=names.indexOf(n)+1;comps(L,W,H,id).forEach((c,i)=>{if(i===0)return;const nb=new Set();for(const k of c){const x=k%W,y=k/W|0;for(const [X,Y] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const v=X<0||Y<0||X>=W||Y>=H?0:L[Y*W+X];if(v!==id)nb.add(v);}}if(nb.size===1&&!nb.has(0)){const t=[...nb][0];c.forEach(j=>L[j]=t);}});}
 for(const n of names){const id=names.indexOf(n)+1,cs=comps(L,W,H,id),k=maxParts[n]??1;cs.forEach((c,i)=>{if(i>0&&(c.length<min||i>=k))c.forEach(j=>L[j]=0);});}
 // arestas: 0:→ 1:↓ 2:← 3:↑ a partir do canto (cx,cy)
 const has=(cx,cy,d)=>{if(d===0)return cx<W&&lab(cx,cy-1)!==lab(cx,cy);if(d===2)return cx>0&&lab(cx-1,cy-1)!==lab(cx-1,cy);if(d===1)return cy<H&&lab(cx-1,cy)!==lab(cx,cy);return cy>0&&lab(cx-1,cy-1)!==lab(cx,cy-1);};
 const DX=[1,0,-1,0],DY=[0,1,0,-1],deg=(cx,cy)=>has(cx,cy,0)+has(cx,cy,1)+has(cx,cy,2)+has(cx,cy,3),isNode=(cx,cy)=>{const g=deg(cx,cy);return g!==0&&g!==2;};
 const rdp=(pts,e)=>{if(pts.length<3)return pts;let d=0,k=0;const a=pts[0],b=pts.at(-1),L2=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let i=1;i<pts.length-1;i++){const p=pts[i],q=L2?Math.abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))/L2:Math.hypot(p[0]-a[0],p[1]-a[1]);if(q>d){d=q;k=i;}}return d>e?[...rdp(pts.slice(0,k+1),e).slice(0,-1),...rdp(pts.slice(k),e)]:[a,b];};
 const chains=new Map();
 const chain=(cx,cy,d)=>{const key=(cy*CW+cx)*4+d;if(chains.has(key))return chains.get(key);
  // rótulos dos dois lados da 1ª aresta
  const sides=d===0?[lab(cx,cy-1),lab(cx,cy)]:d===2?[lab(cx-1,cy-1),lab(cx-1,cy)]:d===1?[lab(cx-1,cy),lab(cx,cy)]:[lab(cx-1,cy-1),lab(cx,cy-1)];
  const pts=[[cx,cy]];let x=cx,y=cy,dd=d,n=0;
  do{x+=DX[dd];y+=DY[dd];pts.push([x,y]);n++;if(isNode(x,y))break;const back=(dd+2)%4;let nd=-1;for(let k=0;k<4;k++)if(k!==back&&has(x,y,k)){nd=k;break;}dd=nd;if(x===cx&&y===cy)break;}while(n<4*W*H);
  // tira a escada dos pixels: média móvel (pontas fixas) antes de simplificar
  // traço à mão vira linha limpa: suavização forte (duas passadas de média) longe da BR; leve junto à BR (não corta curva para dentro da pista)
  {const nb=pts.map(([px,py])=>nearBR(px,py));for(let pass=0;pass<3;pass++){const SM=heavy&&!sides.some(v=>heavy.includes(v))?3:SMOOTH;const sm=pts.map((p,i)=>{if(i===0||i===pts.length-1)return p;const K=nb[i]?3:SM,k=Math.min(K,i,pts.length-1-i);let x=0,y=0;for(let j=i-k;j<=i+k;j++){x+=pts[j][0];y+=pts[j][1];}return [x/(2*k+1),y/(2*k+1)];});pts.splice(0,pts.length,...sm);}}
  const simp=[];{let a=0;const f=pts.map(([px,py])=>nearBR(px,py));for(let i=1;i<=pts.length;i++)if(i===pts.length||f[i]!==f[a]){const seg=pts.slice(a,Math.min(i+1,pts.length)),q=rdp(seg,f[a]?epsBR:eps);simp.push(...(simp.length?q.slice(1):q));a=i;}}const rev=(dd+2)%4;
  const c={simp,n};chains.set(key,c);chains.set((y*CW+x)*4+rev,{simp:simp.slice().reverse(),n});return c;};
 const out=[];
 for(const name of names){const id=names.indexOf(name)+1;comps(L,W,H,id).forEach((c,ix)=>{if(c.length<300)return;
  const set=new Set(c),inS=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&set.has(y*W+x);
  let s=Infinity;for(const i of set)if(i<s)s=i;const sx=s%W,sy=s/W|0,ring=[];let x=sx,y=sy,dir=0,g=0;
  do{ring.push([x,y,dir]);let moved=false;for(const d of [(dir+3)%4,dir,(dir+1)%4,(dir+2)%4]){const rx=d===0?x:d===1?x-1:d===2?x-1:x,ry=d===0?y:d===1?y:d===2?y-1:y-1,lx=d===0?x:d===1?x:d===2?x-1:x-1,ly=d===0?y-1:d===1?y:d===2?y:y-1;if(inS(rx,ry)&&!inS(lx,ly)){dir=d;ring[ring.length-1][2]=d;x+=DX[d];y+=DY[d];moved=true;break;}}if(!moved||++g>4*W*H)throw new Error('trace');}while(!(x===sx&&y===sy));
  let st=ring.findIndex(([x,y])=>isNode(x,y)),poly=[];
  if(st<0){// contorno fechado sem vizinhos: suavização circular (mesma regra das divisas) e simplificação
   let P=ring.map(p=>[p[0],p[1]]);const n=P.length,nb=P.map(([px,py])=>nearBR(px,py));
   for(let pass=0;pass<3;pass++)P=P.map((p,i)=>{const K=nb[i]?3:(heavy&&!heavy.includes(id)?3:SMOOTH);let x=0,y=0;for(let j=-K;j<=K;j++){const q=P[(i+j+n)%n];x+=q[0];y+=q[1];}return [x/(2*K+1),y/(2*K+1)];});
   // corta em dois e simplifica cada metade (rdp precisa de pontas abertas)
   const h=n>>1,e=nb.some(Boolean)?epsBR:eps;poly=[...rdp(P.slice(0,h+1),e).slice(0,-1),...rdp([...P.slice(h),P[0]],e).slice(0,-1)];}
  else{let i=st,guard=0;do{const [x,y,d]=ring[i],ch=chain(x,y,d);poly.push(...ch.simp.slice(0,-1));i=(i+ch.n)%ring.length;if(++guard>ring.length)throw new Error('ring');}while(i!==st);}
  const o={name,area:poly.map(([x,y])=>[+(x/W).toFixed(4),+(y/H).toFixed(4)])};if(ix>0)o.part=true;out.push(o);});}
 return out;}
