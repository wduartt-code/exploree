// Encaixa os trajetos (scenes.json → itapema.paths) na BR-101 (itapema.br101):
// do primeiro ao último ponto do traçado que encosta na BR (< TOL px), o trajeto passa a ser exatamente a BR.
// Uso: node tools/snap-routes.mjs   (rodar depois de desenhar novas rotas ou ajustar a BR)
import {readFileSync,writeFileSync} from 'node:fs';
const f=new URL('../dist/renders/scenes.json',import.meta.url),s=JSON.parse(readFileSync(f,'utf8')),sc=s.scenes.itapema,W=sc.width,H=sc.height,TOL=18;
const br=sc.br101.map(([x,y])=>[x*W,y*H]),cum=[0];for(let i=1;i<br.length;i++)cum[i]=cum[i-1]+Math.hypot(br[i][0]-br[i-1][0],br[i][1]-br[i-1][1]);
const proj=p=>{let best={d:1e9};for(let i=0;i<br.length-1;i++){const a=br[i],b=br[i+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))),q=[a[0]+t*dx,a[1]+t*dy],d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<best.d)best={d,q,s:cum[i]+t*Math.hypot(dx,dy)};}return best;};
const between=(s1,s2)=>{const out=[];for(let i=0;i<br.length;i++){const c=cum[i];if((s1<s2&&c>s1&&c<s2)||(s1>s2&&c<s1&&c>s2))out.push(br[i]);}return s1<s2?out:out.reverse();};
const rep=[];
for(const dst of Object.values(sc.paths||{}))for(const [k,path] of Object.entries(dst)){
 const px=path.map(([x,y])=>[x*W,y*H]),j=px.map(proj),on=j.map((x,i)=>x.d<TOL?i:-1).filter(i=>i>=0);
 if(on.length<2||Math.abs(j[on[0]].s-j[on.at(-1)].s)<30){rep.push(k+': fora da BR');continue;}
 const a=on[0],b=on.at(-1),out=[...px.slice(0,a),j[a].q,...between(j[a].s,j[b].s),j[b].q,...px.slice(b+1)];
 dst[k]=out.map(([x,y])=>[+(x/W).toFixed(4),+(y/H).toFixed(4)]);rep.push(`${k}: BR de ${Math.round(j[a].s)} a ${Math.round(j[b].s)} px`);}
writeFileSync(f,JSON.stringify(s,null,2));console.log(rep.join('\n'));
