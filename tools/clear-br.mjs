// Uso: node tools/clear-br.mjs [meia largura em metros, padrão 21]
// Nada sobre a BR-101: cada bairro termina na beira da pista (meia largura real da rodovia, convertida de metros para pixels em cada ponto da imagem)
import fs from 'node:fs';
const F=new URL('../dist/renders/scenes.json',import.meta.url),HALF_M=+(process.argv[2]||21);
const lib=await import('./hood-topo.mjs');const S=JSON.parse(fs.readFileSync(F,'utf8'));
// largura medida na imagem de cada cena (a escala geográfica da Meia Praia subestima a pista)
const SCALE={'meia-praia':2.6};
for(const [id,sc] of Object.entries(S.scenes)){const W=sc.width,H=sc.height,N=W*H,NAMES=[...new Set(sc.hoods.map(h=>h.name))],L=lib.raster(sc,NAMES),dBR=lib.distBR(sc),G=lib.geoFns(sc.geo);
 const pxm=(x,y)=>{const [lng,lat]=G.inv([x/W,y/H]),d=20/111320,a=G.fwd([lng+d/Math.cos(lat*Math.PI/180),lat]),b=G.fwd([lng,lat+d]);return (Math.hypot((a[0]-x/W)*W,(a[1]-y/H)*H)+Math.hypot((b[0]-x/W)*W,(b[1]-y/H)*H))/2/20;};
 const GS=16,gw=Math.ceil(W/GS)+1,gh=Math.ceil(H/GS)+1,hw=new Float32Array(gw*gh);for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)hw[j*gw+i]=HALF_M*(SCALE[id]||1)*pxm(Math.min(W-1,i*GS),Math.min(H-1,j*GS));
 // interpolação bilinear (sem degraus a cada célula da grade → sem serrilhado)
 const half=i=>{const fx=(i%W)/GS,fy=(i/W|0)/GS,x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,g=(a,b)=>hw[Math.min(gh-1,b)*gw+Math.min(gw-1,a)];return (g(x0,y0)*(1-tx)+g(x0+1,y0)*tx)*(1-ty)+(g(x0,y0+1)*(1-tx)+g(x0+1,y0+1)*tx)*ty;};
 let cut=0;for(let i=0;i<N;i++)if(L[i]&&dBR[i]<half(i)){L[i]=0;cut++;}
 // lascas que sobraram entre pista e bairro
 const R=id==='itapema'?1:4,er=M=>{let a=M;for(let k=0;k<R;k++){const b=a.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(a[i]&&(!a[i-1]||!a[i+1]||!a[i-W]||!a[i+W]))b[i]=0;}a=b;}return a;},di=M=>{let a=M;for(let k=0;k<R;k++){const b=a.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!a[i]&&(a[i-1]||a[i+1]||a[i-W]||a[i+W]))b[i]=1;}a=b;}return a;};
 for(let l=1;l<=NAMES.length;l++){const M=new Uint8Array(N);for(let i=0;i<N;i++)if(L[i]===l)M[i]=1;const O=di(er(M));for(let i=0;i<N;i++)if(L[i]===l&&!O[i]&&dBR[i]<half(i)+18){L[i]=0;cut++;}}
 sc.hoods=lib.vectorizeTopo(L,W,H,NAMES,{heavy:[],eps:1.5,maxParts:{Ilhota:3,"Meia Praia":2},nearBR:(px,py)=>{const i=Math.min(H-1,py)*W+Math.min(W-1,px);return dBR[i]<half(i)+4;}});
 const c=new Uint8Array(N);let ov=0,on=0;for(const hd of sc.hoods){const f=lib.fillPoly(hd.area.map(([x,y])=>[x*W,y*H]),W,H);for(let i=0;i<N;i++)if(f[i]){if(c[i])ov++;c[i]=1;if(dBR[i]<half(i)*.8)on++;}}
 console.log(id,'meia largura px: topo',half(W*40+W/2|0).toFixed(1),'meio',half((H/2|0)*W+W/2|0).toFixed(1),'base',half((H-40)*W+W/2|0).toFixed(1),'| removidos',cut,'| sobreposição',ov,'| sobre a pista',on);}
fs.writeFileSync(F,JSON.stringify(S,null,2));console.log('gravado');
