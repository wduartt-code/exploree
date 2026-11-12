// Refina os bairros da cena canto-centro a partir das marcações do usuário (traços extraídos dos prints),
// trabalhando em raster na resolução da imagem para garantir:
//  • nenhum bairro cruza a BR-101 (fronteira rígida pelo traçado da BR);
//  • vizinhos compartilham exatamente a mesma divisa (partição de pixels → contornos coincidentes);
//  • vãos estreitos entre bairros vizinhos (ou entre bairro e BR) são preenchidos.
// Uso: node tools/refine-hoods.mjs <strokes.json> <probe.json> <base-scenes.json>
import {readFileSync,writeFileSync} from 'node:fs';
const [,,strokesFile,probeFile,baseFile]=process.argv;
const f=new URL('../dist/renders/scenes.json',import.meta.url),S=JSON.parse(readFileSync(f,'utf8')),sc=S.scenes['canto-centro'];
const W=sc.width,H=sc.height,N=W*H,base=JSON.parse(readFileSync(baseFile,'utf8')).scenes['canto-centro'];
const ST=JSON.parse(readFileSync(strokesFile,'utf8'));

// ——— homografia imagem → tela (ajuste por mínimos quadrados nos pontos de sonda) ———
const solve=(A,b)=>{const n=b.length;A=A.map(r=>r.slice());b=b.slice();for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;[A[i],A[p]]=[A[p],A[i]];[b[i],b[p]]=[b[p],b[i]];for(let r=i+1;r<n;r++){const k=A[r][i]/A[i][i];for(let c=i;c<n;c++)A[r][c]-=k*A[i][c];b[r]-=k*b[i];}}const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=b[i];for(let c=i+1;c<n;c++)s-=A[i][c]*x[c];x[i]=s/A[i][i];}return x;};
function fitH(pairs){const R=[],B=[];for(const [x,y,u,v] of pairs){R.push([x,y,1,0,0,0,-u*x,-u*y]);B.push(u);R.push([0,0,0,x,y,1,-v*x,-v*y]);B.push(v);}
 const AtA=[...Array(8)].map((_,i)=>[...Array(8)].map((_,j)=>R.reduce((s,r)=>s+r[i]*r[j],0))),Atb=[...Array(8)].map((_,i)=>R.reduce((s,r,q)=>s+r[i]*B[q],0)),h=solve(AtA,Atb);
 return ([x,y])=>{const w=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w];};}
const probe=JSON.parse(readFileSync(probeFile,'utf8'));
const toScr=fitH(probe),toImg=fitH(probe.map(([x,y,u,v])=>[u,v,x,y]));
const err=Math.max(...probe.map(([x,y,u,v])=>{const q=toScr([x,y]);return Math.hypot(q[0]-u,q[1]-v);}));

// ——— máscaras de tela (grade 2px) dos traços ———
const SW=1240,SH=848,smask=()=>new Uint8Array((SW>>1)*(SH>>1));
const setS=(m,x,y)=>{if(x>=0&&y>=0&&x<SW&&y<SH)m[(y>>1)*(SW>>1)+(x>>1)]=1;},getS=(m,x,y)=>x>=0&&y>=0&&x<SW&&y<SH&&m[(y>>1)*(SW>>1)+(x>>1)];
const sm={};for(const [k,pts] of Object.entries(ST)){sm[k]=smask();for(const [x,y] of pts)setS(sm[k],x,y);}
// região interna de um laço (preenche o que não é alcançável a partir da borda)
function loopRegion(m){const w=SW>>1,h=SH>>1,out=new Uint8Array(w*h),seen=new Uint8Array(w*h),q=[];
 const dil=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(m[y*w+x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<w&&Y<h)dil[Y*w+X]=1;}
 for(let x=0;x<w;x++){q.push([x,0],[x,h-1]);}for(let y=0;y<h;y++){q.push([0,y],[w-1,y]);}
 while(q.length){const [x,y]=q.pop();if(x<0||y<0||x>=w||y>=h)continue;const i=y*w+x;if(seen[i]||dil[i])continue;seen[i]=1;q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}
 for(let i=0;i<w*h;i++)if(!seen[i])out[i]=1;return out;}
const reg={green1:loopRegion(sm.green1),white0:loopRegion(sm.white0),white1:loopRegion(sm.white1),red0:loopRegion(sm.red0)};
// pixel de imagem → amostra a máscara de tela
const scrOf=new Float32Array(N*2);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const q=toScr([x+.5,y+.5]),i=(y*W+x)*2;scrOf[i]=q[0];scrOf[i+1]=q[1];}
const imgMask=m=>{const o=new Uint8Array(N);for(let i=0;i<N;i++){const x=Math.round(scrOf[2*i]),y=Math.round(scrOf[2*i+1]);if(getS(m,x,y))o[i]=1;}return o;};
const dilate=(m,r)=>{let a=m;for(let k=0;k<r;k++){const b=a.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(a[i])continue;if(a[i-1]||a[i+1]||a[i-W]||a[i+W])b[i]=1;}a=b;}return a;};
const erode=(m,r)=>{let a=m;for(let k=0;k<r;k++){const b=a.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!a[i])continue;if(!a[i-1]||!a[i+1]||!a[i-W]||!a[i+W])b[i]=0;}a=b;}return a;};

// ——— polilinhas: ordenação de um traço (caminho mais longo no grafo de pontos) ———
function polyline(pts){const cell=new Map();for(const [x,y] of pts){const k=(x/6|0)+','+(y/6|0);const c=cell.get(k)||[0,0,0];c[0]+=x;c[1]+=y;c[2]++;cell.set(k,c);}
 const P=[...cell.values()].map(c=>[c[0]/c[2],c[1]/c[2]]),adj=P.map((p,i)=>P.map((q,j)=>j).filter(j=>j!==i&&Math.hypot(P[j][0]-p[0],P[j][1]-p[1])<10));
 const far=s=>{const d=P.map(()=>Infinity),pr=P.map(()=>-1);d[s]=0;const q=[s];while(q.length){const i=q.shift();for(const j of adj[i]){const nd=d[i]+Math.hypot(P[j][0]-P[i][0],P[j][1]-P[i][1]);if(nd<d[j]){d[j]=nd;pr[j]=i;q.push(j);}}}let b=s;for(let i=0;i<P.length;i++)if(d[i]<Infinity&&d[i]>d[b])b=i;return {b,pr};};
 const a=far(0).b,{b,pr}=far(a),path=[];for(let i=b;i!==-1;i=pr[i])path.push(P[i]);return path;}
const lineImg=pl=>pl.map(p=>toImg(p));
const rasterLine=(m,pl,r=1)=>{for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2)+1;for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const X=Math.round(x+dx),Y=Math.round(y+dy);if(X>=0&&Y>=0&&X<W&&Y<H)m[Y*W+X]=1;}}}};
const ptIn=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const fillPoly=(poly)=>{const m=new Uint8Array(N),ys=poly.map(p=>p[1]);for(let y=Math.max(0,Math.floor(Math.min(...ys)));y<=Math.min(H-1,Math.ceil(Math.max(...ys)));y++){const xs=[];for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(W-1,Math.floor(xs[k+1]-.5));x++)m[y*W+x]=1;}return m;};
const flood=(barrier,seed,limit=N)=>{const m=new Uint8Array(N),q=[seed[1]*W+seed[0]];let n=0;while(q.length){const i=q.pop();if(m[i]||barrier[i])continue;m[i]=1;n++;if(n>limit)return null;const x=i%W,y=i/W|0;if(x>0)q.push(i-1);if(x<W-1)q.push(i+1);if(y>0)q.push(i-W);if(y<H-1)q.push(i+W);}return m;};
const seedImg=p=>toImg(p).map(Math.round);

// ——— BR-101 nova (anexo 1) ———
const brScr=polyline(ST.br);if(brScr[0][1]>brScr.at(-1)[1])brScr.reverse(); // de cima (norte) para baixo/leste
const br=lineImg(brScr);
const ext=(a,b)=>[a[0]+(a[0]-b[0])*80,a[1]+(a[1]-b[1])*80],brL=[ext(br[0],br[1]),...br,ext(br.at(-1),br.at(-2))],far=1e6;
const sideMar=fillPoly([...brL,[far,brL.at(-1)[1]],[far,-far],[-far,-far],[brL[0][0],-far]].map(([x,y])=>[Math.max(-5,Math.min(W+5,x)),Math.max(-5,Math.min(H+5,y))]));
// (recorte do polígono ao retângulo pode distorcer longe; refaz por teste de ponto exato)
const side=new Uint8Array(N);{const poly=[...brL,[far,brL.at(-1)[1]],[far,-far],[-far,-far],[brL[0][0],-far]];for(let y=0;y<H;y++){const xs=[];for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(W-1,Math.floor(xs[k+1]-.5));x++)side[y*W+x]=1;}}
const brMask=new Uint8Array(N);rasterLine(brMask,br,1);

// ——— rótulos ———
const NAMES=['Canto da Praia','Centro','Ilhota','Sertãozinho','Alto São Bento','Casa Branca','Várzea','Tabuleiro'],ID=Object.fromEntries(NAMES.map((n,i)=>[n,i+1]));
const SIDE={1:1,2:1,3:-1,4:0,5:0,6:0,7:0,8:0}; // 1 mar, 0 interior, -1 ambos
const L=new Uint8Array(N),px=a=>a.map(([x,y])=>[x*W,y*H]);
const prio=['Tabuleiro','Várzea','Casa Branca','Sertãozinho','Alto São Bento','Ilhota','Centro','Canto da Praia']; // o último ganha
for(const n of prio){const h=base.hoods.find(x=>x.name===n);if(!h)continue;const m=fillPoly(px(h.area));for(let i=0;i<N;i++)if(m[i])L[i]=ID[n];}

// marcações em espaço de imagem
const IM={};for(const k of ['green0','green2','green3','green4','black5','black6','white0','white1','red0','green1'])IM[k]=imgMask(sm[k]);
const RG={};for(const k in reg)RG[k]=imgMask(reg[k]);
const PL={};for(const k of ['green0','green2','green3','green4','black6'])PL[k]=lineImg(polyline(ST[k]));

// 1) Canto/Ilhota: verde-1 (faixa de casas da península) entra no Canto; verde-0 é a divisa Canto (abaixo) × Ilhota (acima)
for(let i=0;i<N;i++)if(RG.green1[i]&&side[i])L[i]=ID['Canto da Praia'];
{const g=PL.green0.slice().sort((a,b)=>a[0]-b[0]),yAt=x=>{for(let k=0;k<g.length-1;k++)if(x>=g[k][0]&&x<=g[k+1][0]){const t=(x-g[k][0])/((g[k+1][0]-g[k][0])||1);return g[k][1]+t*(g[k+1][1]-g[k][1]);}return null;};
 for(let x=Math.ceil(g[0][0]);x<=Math.floor(g.at(-1)[0]);x++){const y0=yAt(x);if(y0==null)continue;
  // acima da linha: o que era Canto vira Ilhota; vão até a Ilhota é preenchido
  let hitI=-1;for(let y=Math.floor(y0);y>=0;y--){const i=y*W+x;if(!side[i])break;if(L[i]===ID['Ilhota']){hitI=y;break;}}
  for(let y=Math.floor(y0);y>=0;y--){const i=y*W+x;if(!side[i])break;if(L[i]===ID['Canto da Praia']||(hitI>=0&&y>hitI))L[i]=ID['Ilhota'];if(hitI>=0&&y<=hitI)break;}
  // abaixo da linha: Ilhota vira Canto; vão até o Canto é preenchido
  let hitC=-1;for(let y=Math.ceil(y0);y<H;y++){const i=y*W+x;if(!side[i])break;if(L[i]===ID['Canto da Praia']){hitC=y;break;}}
  for(let y=Math.ceil(y0);y<H;y++){const i=y*W+x;if(!side[i])break;if(L[i]===ID['Ilhota']||(hitC>=0&&y<hitC))L[i]=ID['Canto da Praia'];if(hitC>=0&&y>=hitC)break;}}}

// 2) Centro: áreas brancas entram (sem tomar o Canto); trapiche (X vermelho) sai
for(let i=0;i<N;i++)if((RG.white0[i]||RG.white1[i]||IM.white0[i]||IM.white1[i])&&side[i]&&L[i]!==ID['Canto da Praia'])L[i]=ID['Centro'];
{const zone=dilate(RG.red0,6),c=new Uint8Array(N);for(let i=0;i<N;i++)c[i]=L[i]===ID['Centro']?1:0;const op=dilate(erode(c,9),9);for(let i=0;i<N;i++)if(zone[i]&&c[i]&&!op[i])L[i]=0;}

// 3) Casa Branca: contorno = verde-2 (topo) + BR + verde-4 (base) + lado leste do campo + verde-3 (oeste, sem o campo)
{const bar=new Uint8Array(N);for(const k of ['green2','green3','green4'])for(let i=0;i<N;i++)if(IM[k][i])bar[i]=1;
 for(let i=0;i<N;i++)if(brMask[i]||!side[i]===false&&false)bar[i]=1;
 // BR e lado do mar como barreira
 for(let i=0;i<N;i++)if(brMask[i]||side[i])bar[i]=1;
 const nearest=(pl,p)=>pl.reduce((b,q)=>Math.hypot(q[0]-p[0],q[1]-p[1])<Math.hypot(b[0]-p[0],b[1]-p[1])?q:b);
 const g2=PL.green2,g3=PL.green3,g4=PL.green4,brN=p=>{let best=null,d=1e9;for(let k=0;k<br.length-1;k++){const a=br[k],b=br[k+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))),q=[a[0]+t*dx,a[1]+t*dy],e=Math.hypot(q[0]-p[0],q[1]-p[1]);if(e<d){d=e;best=q;}}return best;};
 const conn=[];for(const pl of [g2,g4]){const e=[pl[0],pl.at(-1)].sort((p,q)=>Math.hypot(brN(p)[0]-p[0],brN(p)[1]-p[1])-Math.hypot(brN(q)[0]-q[0],brN(q)[1]-q[1]))[0];conn.push([e,brN(e)]);}
 // fecha à esquerda (borda da tela) entre as pontas ocidentais de verde-2 e verde-3
 const w2=[g2[0],g2.at(-1)].sort((a,b)=>a[0]-b[0])[0],w3=[g3[0],g3.at(-1)].sort((a,b)=>a[0]-b[0])[0];conn.push([w2,w3]);
 // campo: da ponta leste do braço do verde-3 desce até o verde-4
 const armEnd=[g3[0],g3.at(-1)].sort((a,b)=>b[0]-a[0])[0];conn.push([armEnd,nearest(g4,[armEnd[0],armEnd[1]+200])]);
 for(const [a,b] of conn)rasterLine(bar,[a,b],2);
 const seed=seedImg([240,520]),R=flood(dilate(bar,1),seed,N/4);
 if(!R)throw new Error('Casa Branca vazou');
 for(let i=0;i<N;i++){if(L[i]===ID['Casa Branca']&&!R[i])L[i]=0;if(R[i])L[i]=ID['Casa Branca'];}
 // traço verde em si pertence à divisa: distribui ao vizinho mais próximo depois (gap fill)
}

// 4) Várzea: contorno = preto (oeste + topo junto à BR) + BR + divisa com Tabuleiro
{const bar=new Uint8Array(N);for(const k of ['black5','black6'])for(let i=0;i<N;i++)if(IM[k][i])bar[i]=1;
 for(let i=0;i<N;i++)if(brMask[i]||side[i])bar[i]=1;
 const tab=base.hoods.find(h=>h.name==='Tabuleiro'),tp=px(tab.area);
 // divisa Várzea|Tabuleiro: lado oeste do Tabuleiro original, estendido até a base da imagem
 const div=tp.filter(p=>p[0]<tp.reduce((a,q)=>Math.min(a,q[0]),1e9)+40).sort((a,b)=>a[1]-b[1]);div.push([div.at(-1)[0],H+10]);
 rasterLine(bar,div,2);const brN2=p=>{let best=null,d=1e9;for(let k=0;k<br.length-1;k++){const a=br[k],b=br[k+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))),q=[a[0]+t*dx,a[1]+t*dy],e=Math.hypot(q[0]-p[0],q[1]-p[1]);if(e<d){d=e;best=q;}}return best;};rasterLine(bar,[div[0],brN2(div[0])],2);
 const b6=PL.black6,low=[b6[0],b6.at(-1)].sort((a,b)=>b[1]-a[1])[0];rasterLine(bar,[low,[low[0],H+10]],2);const top6=[b6[0],b6.at(-1)].sort((a,b)=>a[1]-b[1])[0];rasterLine(bar,[top6,brN2(top6)],2);for(const e of [PL.black6[0],PL.black6.at(-1)])void e;
 const seed=seedImg([520,800]),R=flood(dilate(bar,1),seed,N/3);if(!R)throw new Error('Várzea vazou');
 for(let i=0;i<N;i++){if(L[i]===ID['Várzea']&&!R[i])L[i]=0;if(R[i]&&L[i]!==ID['Tabuleiro'])L[i]=ID['Várzea'];}}

// 5a) Ilhota no lado interior só a oeste do início da BR (nunca a encosta do morro junto à rodovia)
{const xs=toImg(brScr[0])[0];for(let i=0;i<N;i++)if(L[i]===ID['Ilhota']&&!side[i]&&(i%W)>xs-60)L[i]=0;}
// 5) BR: ninguém do lado errado
for(let i=0;i<N;i++){const l=L[i];if(!l)continue;const s=SIDE[l];if(s===1&&!side[i])L[i]=0;else if(s===0&&side[i])L[i]=0;}

// 6) preenche vãos estreitos: entre dois bairros, ou entre bairro e BR (mesmo lado)
{const GAP=32,INF=1e9,dist=new Float32Array(N).fill(INF),lab=new Uint8Array(N),dist2=new Float32Array(N).fill(INF);
 // distância (chamfer) ao bairro mais próximo e ao 2º mais próximo de rótulo diferente
 const q=[];for(let i=0;i<N;i++)if(L[i]){dist[i]=0;lab[i]=L[i];}
 for(let pass=0;pass<2;pass++){const order=pass?[...Array(N).keys()].reverse():[...Array(N).keys()];for(const i of order){const x=i%W,y=i/W|0;const nb=pass?[[1,0,1],[0,1,1],[1,1,1.414],[-1,1,1.414]]:[[-1,0,1],[0,-1,1],[-1,-1,1.414],[1,-1,1.414]];
  for(const [dx,dy,c] of nb){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(dist[j]+c<dist[i]){if(lab[i]&&lab[i]!==lab[j])dist2[i]=Math.min(dist2[i],dist[i]);dist[i]=dist[j]+c;lab[i]=lab[j];}else if(lab[j]&&lab[j]!==lab[i])dist2[i]=Math.min(dist2[i],dist[j]+c);if(dist2[j]+c<dist2[i]&&lab[j]===lab[i])dist2[i]=Math.min(dist2[i],dist2[j]+c);}}}
 const dBR=new Float32Array(N).fill(INF);for(let i=0;i<N;i++)if(brMask[i])dBR[i]=0;
 for(let pass=0;pass<2;pass++){const order=pass?[...Array(N).keys()].reverse():[...Array(N).keys()];for(const i of order){const x=i%W,y=i/W|0;for(const [dx,dy,c] of (pass?[[1,0,1],[0,1,1],[1,1,1.414],[-1,1,1.414]]:[[-1,0,1],[0,-1,1],[-1,-1,1.414],[1,-1,1.414]])){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(dBR[j]+c<dBR[i])dBR[i]=dBR[j]+c;}}}
 const xsI=toImg(brScr[0])[0];let filled=0;for(let i=0;i<N;i++){if(L[i]||!lab[i]||dist[i]>GAP)continue;const s=SIDE[lab[i]],ok=s===-1||(s===1)===!!side[i];if(!ok)continue;if(lab[i]===ID['Ilhota']&&!side[i]&&(i%W)>xsI-60)continue;if(dist2[i]<=GAP||dBR[i]<=GAP){L[i]=lab[i];filled++;}}
 console.log('vãos preenchidos:',filled,'px');}

// 7) remove ilhas pequenas; Ilhota fica com as 2 maiores (uma de cada lado da BR)
function comps(id){const seen=new Uint8Array(N),out=[];for(let i=0;i<N;i++){if(L[i]!==id||seen[i])continue;const c=[],q=[i];seen[i]=1;while(q.length){const k=q.pop();c.push(k);const x=k%W,y=k/W|0;for(const j of [x>0?k-1:-1,x<W-1?k+1:-1,y>0?k-W:-1,y<H-1?k+W:-1])if(j>=0&&!seen[j]&&L[j]===id){seen[j]=1;q.push(j);}}out.push(c);}return out.sort((a,b)=>b.length-a.length);}
const keep={};for(const n of NAMES){const id=ID[n],cs=comps(id),k=n==='Ilhota'?2:1;cs.slice(k).forEach(c=>c.forEach(i=>L[i]=0));keep[n]=cs.slice(0,k);}

// 8) vetoriza: contorno externo de cada componente (marching squares em bordas de pixel) + simplificação
function trace(set){const inS=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&set.has(y*W+x);
 // começa na aresta superior do pixel mais acima/à esquerda e anda com o interior à direita
 let s=Infinity;for(const i of set)if(i<s)s=i;const sx=s%W,sy=s/W|0;const pts=[];let x=sx,y=sy,dir=0;// 0:→ 1:↓ 2:← 3:↑ (cantos de pixel)
 const step=[[1,0],[0,1],[-1,0],[0,-1]];let guard=0;
 do{pts.push([x,y]);const cand=[(dir+3)%4,dir,(dir+1)%4,(dir+2)%4];for(const d of cand){const [dx,dy]=step[d];// pixel à direita do movimento de (x,y) na direção d
   const rx=d===0?x:d===1?x-1:d===2?x-1:x,ry=d===0?y:d===1?y:d===2?y-1:y-1,lx=d===0?x:d===1?x:d===2?x-1:x-1,ly=d===0?y-1:d===1?y:d===2?y:y-1;
   if(inS(rx,ry)&&!inS(lx,ly)){dir=d;x+=dx;y+=dy;break;}}
  if(++guard>4*N)throw new Error('trace');}while(!(x===sx&&y===sy));return pts;}
const rdp=(pts,eps)=>{if(pts.length<3)return pts;let d=0,k=0;const a=pts[0],b=pts.at(-1),L2=Math.hypot(b[0]-a[0],b[1]-a[1])||1;for(let i=1;i<pts.length-1;i++){const p=pts[i],e=Math.abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))/L2;if(e>d){d=e;k=i;}}return d>eps?[...rdp(pts.slice(0,k+1),eps).slice(0,-1),...rdp(pts.slice(k),eps)]:[a,b];};
const out=[];for(const n of NAMES)keep[n].forEach((c,ix)=>{const set=new Set(c.filter(i=>L[i]===ID[n]));if(set.size<200)return;const ring=trace(set);const half=ring.length>>1;const simp=[...rdp(ring.slice(0,half+1),.9).slice(0,-1),...rdp(ring.slice(half).concat([ring[0]]),.9).slice(0,-1)];
 const o={name:n,area:simp.map(([x,y])=>[+(x/W).toFixed(4),+(y/H).toFixed(4)])};if(ix>0)o.part=true;out.push(o);});
sc.hoods=out;sc.hoodsManual=NAMES;sc.br101=br.filter((p,i)=>i%2===0||i===br.length-1).map(([x,y])=>[+(x/W).toFixed(4),+(y/H).toFixed(4)]);
writeFileSync(f,JSON.stringify(S,null,2));
console.log('homografia: erro máx',err.toFixed(2),'px | bairros:',out.map(h=>h.name+(h.part?'*':'')+' '+h.area.length).join(', '));
