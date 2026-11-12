// Conversão lat/lng → posição na imagem da cena itapema (homografia ajustada por mínimos quadrados
// sobre pontos de controle: marcadores posicionados no mapa + suas coordenadas reais).
export const GEO={
 mirante:[-48.6036115,-27.0876797],teleferico:[-48.5993183,-27.089568],marina:[-48.6047622,-27.0919787],central:[-48.6139739,-27.0993254],
 meia:[-48.6031897,-27.124887],garden:[-48.6012715,-27.1287625],parque:[-48.592959,-27.1419063],pier:[-48.5856612,-27.1441229],roda:[-48.5856612,-27.1441229],
 atlantico:[-48.5947649,-27.1395142],horizonte:[-48.6072954,-27.1204246],vista:[-48.6153468,-27.1017386],brisa:[-48.6114738,-27.0908666]};
const solve=(A,b)=>{const n=b.length;for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;[A[i],A[p]]=[A[p],A[i]];[b[i],b[p]]=[b[p],b[i]];for(let r=i+1;r<n;r++){const f=A[r][i]/A[i][i];for(let c=i;c<n;c++)A[r][c]-=f*A[i][c];b[r]-=f*b[i];}}const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=b[i];for(let c=i+1;c<n;c++)s-=A[i][c]*x[c];x[i]=s/A[i][i];}return x;};
export function fitHomography(pairs){// pairs: [[lng,lat],[u,v]] ; normaliza p/ estabilidade
 const mx=pairs.reduce((s,p)=>s+p[0][0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[0][1],0)/pairs.length,k=100;
 const N=([x,y])=>[(x-mx)*k,(y-my)*k];const rows=[],rhs=[];
 for(const [g,[u,v]] of pairs){const [x,y]=N(g);rows.push([x,y,1,0,0,0,-u*x,-u*y]);rhs.push(u);rows.push([0,0,0,x,y,1,-v*x,-v*y]);rhs.push(v);}
 const AtA=Array.from({length:8},(_,i)=>Array.from({length:8},(_,j)=>rows.reduce((s,r)=>s+r[i]*r[j],0))),Atb=Array.from({length:8},(_,i)=>rows.reduce((s,r,q)=>s+r[i]*rhs[q],0));
 const h=solve(AtA,Atb);return g=>{const [x,y]=N(g),w=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w];};}

// Homografia parametrizada (8 valores) com normalização fixa
export const makeH=(P)=>{const {mx,my,k,h}=P;return g=>{const x=(g[0]-mx)*k,y=(g[1]-my)*k,w=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w];};};
// Ajuste fino: rodovia real (OSM) deve cair sobre a BR traçada na imagem + marcadores como âncora fraca
export function refine(P0,brGeo,brImg,pairs,W,H,wPairs=.35){
 const segD=(p)=>{let d=1e9;for(let i=0;i<brImg.length-1;i++){const a=brImg[i],b=brImg[i+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))),e=Math.hypot(a[0]+t*dx-p[0],a[1]+t*dy-p[1]);if(e<d)d=e;}return d;};
 const res=(h,keep)=>{const f=makeH({...P0,h});const r=[];for(const g of keep){const q=f(g);r.push(segD([q[0]*W,q[1]*H]));}for(const [g,uv] of pairs){const q=f(g);r.push(wPairs*(q[0]-uv[0])*W,wPairs*(q[1]-uv[1])*H);}return r;};
 let h=P0.h.slice(),keep=brGeo;
 for(let it=0;it<25;it++){const f=makeH({...P0,h});keep=brGeo.filter(g=>{const q=f(g);return q[0]>0&&q[0]<1&&q[1]>0&&q[1]<1&&segD([q[0]*W,q[1]*H])<60;});
  const r0=res(h,keep),J=h.map((_,k)=>{const e=Math.max(Math.abs(h[k])*1e-4,1e-7),h2=h.slice();h2[k]+=e;return res(h2,keep).map((v,i)=>(v-r0[i])/e);});
  const A=J.map(a=>J.map(b=>a.reduce((s,v,i)=>s+v*b[i],0))),b=J.map(a=>-a.reduce((s,v,i)=>s+v*r0[i],0));for(let i=0;i<8;i++)A[i][i]*=1.0001;
  const n=8,M=A.map(r=>r.slice()),v=b.slice();for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;[M[i],M[p]]=[M[p],M[i]];[v[i],v[p]]=[v[p],v[i]];for(let r=i+1;r<n;r++){const fct=M[r][i]/M[i][i];for(let c=i;c<n;c++)M[r][c]-=fct*M[i][c];v[r]-=fct*v[i];}}
  const d=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=v[i];for(let c=i+1;c<n;c++)s-=M[i][c]*d[c];d[i]=s/M[i][i];}h=h.map((x,i)=>x+d[i]);}
 const f=makeH({...P0,h}),brErr=keep.map(g=>{const q=f(g);return segD([q[0]*W,q[1]*H]);}).sort((a,b)=>a-b);
 return {P:{...P0,h},n:keep.length,mediana:brErr[brErr.length>>1],p90:brErr[Math.floor(brErr.length*.9)]};}

// Versão robusta: distância nos dois sentidos (real→traçado e traçado→real) impede colapso da projeção.
export function refine2(P0,brGeo,brImg,pairs,W,H,wPairs=.5){
 const segD=(p,poly)=>{let d=1e9;for(let i=0;i<poly.length-1;i++){const a=poly[i],b=poly[i+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/((dx*dx+dy*dy)||1))),e=Math.hypot(a[0]+t*dx-p[0],a[1]+t*dy-p[1]);if(e<d)d=e;}return d;};
 const near=(p,pts)=>{let d=1e9;for(const q of pts){const e=Math.hypot(q[0]-p[0],q[1]-p[1]);if(e<d)d=e;}return d;};
 const res=h=>{const f=makeH({...P0,h}),proj=brGeo.map(g=>{const q=f(g);return [q[0]*W,q[1]*H];}),inImg=proj.filter(([x,y])=>x>-50&&x<W+50&&y>-50&&y<H+50),r=[];
  for(const p of inImg){const d=segD(p,brImg);r.push(Math.min(d,40));}
  for(const p of brImg)r.push(Math.min(near(p,proj),80)*1.5);
  for(const [g,uv] of pairs){const q=f(g);r.push(wPairs*(q[0]-uv[0])*W,wPairs*(q[1]-uv[1])*H);}return r;};
 let h=P0.h.slice(),lam=1e-3,cost=res(h).reduce((s,v)=>s+v*v,0);
 for(let it=0;it<60;it++){const r0=res(h),J=h.map((_,k)=>{const e=Math.max(Math.abs(h[k])*1e-4,1e-7),h2=h.slice();h2[k]+=e;return res(h2).map((v,i)=>(v-r0[i])/e);});
  const n=Math.min(...J.map(c=>c.length),r0.length);const A=J.map(a=>J.map(b=>{let s=0;for(let i=0;i<n;i++)s+=a[i]*b[i];return s;})),g=J.map(a=>{let s=0;for(let i=0;i<n;i++)s-=a[i]*r0[i];return s;});
  const M=A.map((r,i)=>r.map((v,j)=>i===j?v*(1+lam):v)),v=g.slice();for(let i=0;i<8;i++){let p=i;for(let q=i+1;q<8;q++)if(Math.abs(M[q][i])>Math.abs(M[p][i]))p=q;[M[i],M[p]]=[M[p],M[i]];[v[i],v[p]]=[v[p],v[i]];for(let q=i+1;q<8;q++){const fc=M[q][i]/M[i][i];for(let c=i;c<8;c++)M[q][c]-=fc*M[i][c];v[q]-=fc*v[i];}}
  const d=Array(8).fill(0);for(let i=7;i>=0;i--){let s=v[i];for(let c=i+1;c<8;c++)s-=M[i][c]*d[c];d[i]=s/M[i][i];}
  const h2=h.map((x,i)=>x+d[i]),c2=res(h2).reduce((s,x)=>s+x*x,0);if(c2<cost){h=h2;cost=c2;lam*=.3;}else lam*=10;}
 const f=makeH({...P0,h}),proj=brGeo.map(g=>{const q=f(g);return [q[0]*W,q[1]*H];}).filter(([x,y])=>x>0&&x<W&&y>0&&y<H),e1=proj.map(p=>segD(p,brImg)).sort((a,b)=>a-b),e2=brImg.map(p=>near(p,proj)).sort((a,b)=>a-b);
 return {P:{...P0,h},n:proj.length,mediana:e1[e1.length>>1],p90:e1[Math.floor(e1.length*.9)],cobertura:e2[e2.length>>1]};}

export function refine3(P0,lines,pairs,W,H,wPairs=.5){const pr=(f,geo)=>geo.map(g=>{const q=f(g);return [q[0]*W,q[1]*H];});
 const segD=(p,poly)=>{let d=1e9;for(let i=0;i<poly.length-1;i++){const a=poly[i],b=poly[i+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/((dx*dx+dy*dy)||1))),e=Math.hypot(a[0]+t*dx-p[0],a[1]+t*dy-p[1]);if(e<d)d=e;}return d;};
 const near=(p,pts)=>{let d=1e9;for(const q of pts){const e=Math.hypot(q[0]-p[0],q[1]-p[1]);if(e<d)d=e;}return d;};
 const inside=([x,y])=>x>-30&&x<W+30&&y>-30&&y<H+30;
 const res=h=>{const f=makeH({...P0,h}),r=[];for(const L of lines){const P=pr(f,L.geo).filter(inside);for(const p of P)r.push(Math.min(segD(p,L.img),40));for(const p of L.img)r.push(Math.min(near(p,pr(f,L.geo)),80)*1.5);}for(const [g,uv] of pairs){const q=f(g);r.push(wPairs*(q[0]-uv[0])*W,wPairs*(q[1]-uv[1])*H);}return r;};
 let h=P0.h.slice(),lam=1e-3,cost=res(h).reduce((s,v)=>s+v*v,0);
 for(let it=0;it<60;it++){const r0=res(h),J=h.map((_,k)=>{const e=Math.max(Math.abs(h[k])*1e-4,1e-7),h2=h.slice();h2[k]+=e;return res(h2).map((v,i)=>(v-r0[i])/e);});
  const n=Math.min(...J.map(c=>c.length),r0.length),A=J.map(a=>J.map(b=>{let s=0;for(let i=0;i<n;i++)s+=a[i]*b[i];return s;})),gr=J.map(a=>{let s=0;for(let i=0;i<n;i++)s-=a[i]*r0[i];return s;});
  const M=A.map((r,i)=>r.map((v,j)=>i===j?v*(1+lam):v)),v=gr.slice();for(let i=0;i<8;i++){let p=i;for(let q=i+1;q<8;q++)if(Math.abs(M[q][i])>Math.abs(M[p][i]))p=q;[M[i],M[p]]=[M[p],M[i]];[v[i],v[p]]=[v[p],v[i]];for(let q=i+1;q<8;q++){const fc=M[q][i]/M[i][i];for(let c=i;c<8;c++)M[q][c]-=fc*M[i][c];v[q]-=fc*v[i];}}
  const d=Array(8).fill(0);for(let i=7;i>=0;i--){let s=v[i];for(let c=i+1;c<8;c++)s-=M[i][c]*d[c];d[i]=s/M[i][i];}
  const h2=h.map((x,i)=>x+d[i]),c2=res(h2).reduce((s,x)=>s+x*x,0);if(c2<cost){h=h2;cost=c2;lam*=.3;}else lam*=10;}
 const f=makeH({...P0,h});return {P:{...P0,h},erros:lines.map(L=>{const e=L.img.map(p=>near(p,pr(f,L.geo))).sort((a,b)=>a-b);return L.name+' '+e[e.length>>1].toFixed(1)+'px';}).join(', ')};}