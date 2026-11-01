import * as THREE from './vendor/three.module.js';
export function createViewer(container,b){
 container.innerHTML='';const scene=new THREE.Scene();const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;container.appendChild(renderer.domElement);
 renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',`Maquete 3D de ${b.name}. Arraste ou use as setas para girar, mais e menos para aproximar.`);
 const camera=new THREE.PerspectiveCamera(33,1,.1,1500);const root=new THREE.Group();scene.add(root);
 scene.add(new THREE.HemisphereLight(0xe6f4ff,0x607c6b,2.3));const sun=new THREE.DirectionalLight(0xfff1d5,3.5);sun.position.set(-80,160,100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-110;sun.shadow.camera.right=110;sun.shadow.camera.top=200;sun.shadow.camera.bottom=-100;sun.shadow.camera.far=500;sun.shadow.bias=-.0004;scene.add(sun);const rim=new THREE.DirectionalLight(0xb8dfff,1.5);rim.position.set(80,100,-70);scene.add(rim);
 const mats={stone:new THREE.MeshStandardMaterial({color:b.color,roughness:.65}),white:new THREE.MeshStandardMaterial({color:0xe9e6d7,roughness:.7}),glass:new THREE.MeshPhysicalMaterial({color:0x396975,metalness:.25,roughness:.2,clearcoat:1}),dark:new THREE.MeshStandardMaterial({color:0x193f48,roughness:.3}),wood:new THREE.MeshStandardMaterial({color:0xa08763,roughness:.85}),grass:new THREE.MeshStandardMaterial({color:0x6e8c67,roughness:1}),leaf:new THREE.MeshStandardMaterial({color:0x537d5b,roughness:.9}),trunk:new THREE.MeshStandardMaterial({color:0x8e7a5a}),water:new THREE.MeshPhysicalMaterial({color:0x65c8c9,metalness:.15,roughness:.12,clearcoat:1})};
 const geometries=[];const boxGeo=new THREE.BoxGeometry(1,1,1);geometries.push(boxGeo);
 function box(w,h,d,x,y,z,mat,sh=true){const m=new THREE.Mesh(boxGeo,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=sh;m.receiveShadow=true;root.add(m);return m;}
 const h=b.height*.7,floor=(h-11)/b.floors;
 box(72,1.6,63,0,-1.5,0,mats.dark);box(68,.9,59,0,-.5,0,mats.stone);
 box(47,7.5,37,0,3.75,0,mats.dark);box(50,.9,40,0,7.9,0,mats.white);box(48,1,38,0,8.8,0,mats.stone);
 // Podium glazing, entrance canopy and the landscaped pool deck.
 for(let x=-20;x<=20;x+=5)box(.35,6,38,x,3.5,0,mats.stone);
 box(14,1,8,0,4.9,23,mats.white);box(1,4.5,1,-6,2.25,26,mats.stone);box(1,4.5,1,6,2.25,26,mats.stone);
 box(16,.3,30,-23,.15,0,mats.wood);box(9,.4,21,-24,.35,-1,mats.white);box(7.6,.45,19.6,-24,.4,-1,mats.water);
 for(let z=-10;z<12;z+=5){const chair=box(2,.35,3,-15,.5,z,mats.white);chair.rotation.y=-.1;}
 for(let i=0;i<b.floors;i++){
  const y=10+i*floor;let w=27,d=22,shift=0;
  if(b.shape===1){w=27-(i/b.floors)*4;d=22-(i/b.floors)*2;}
  if(b.shape===2)shift=Math.sin(i*.2)*1.6;
  if(b.shape===3&&i>b.floors*.7){w=24;d=20;}
  box(w,floor-.25,d,shift,y+floor/2,0,mats.glass);
  box(w+3,.32,d+3,shift,y,0,mats.stone);
  for(let x=-w/2+3;x<w/2;x+=4){box(.16,floor-.4,.15,x+shift,y+floor/2,d/2+.05,mats.white,false);box(.16,floor-.4,.15,x+shift,y+floor/2,-d/2-.05,mats.white,false);}
  for(let z=-d/2+3;z<d/2;z+=4)box(.15,floor-.4,.16,w/2+shift+.03,y+floor/2,z,mats.white,false);
  // Balcony rails and planted sky terraces give the concept a distinct silhouette.
  box(w+3,.16,.16,shift,y+.9,d/2+1.5,mats.white,false);
  if(i%7===0){box(5,.6,2,w/2-3+shift,y+.6,d/2+.2,mats.grass);}
 }
 box(29,1.2,24,0,h+.7,0,mats.white);box(20,4,15,0,h+3,-2,mats.dark);box(23,.55,18,0,h+5.2,-2,mats.stone);
 for(let x=-9;x<=9;x+=3)box(.35,2.5,16,x,h+6.7,-2,mats.wood);
 // Reusable low-poly planting, with consistent deterministic positions.
 const trunkGeo=new THREE.CylinderGeometry(.35,.6,4,8),leafGeo=new THREE.IcosahedronGeometry(2.6,1);geometries.push(trunkGeo,leafGeo);
 [[-29,-24],[-29,23],[29,-24],[29,23],[30,13],[30,-12],[-9,-26],[12,-26]].forEach(([x,z],i)=>{const t=new THREE.Mesh(trunkGeo,mats.trunk);t.position.set(x,2,z);t.castShadow=true;root.add(t);const crown=new THREE.Mesh(leafGeo,mats.leaf);crown.position.set(x,5,z);crown.scale.set(1,1.15+(i%3)*.15,1);crown.castShadow=true;root.add(crown);box(6,.5,6,x,.1,z,mats.grass);});
 const groundGeo=new THREE.PlaneGeometry(500,500);geometries.push(groundGeo);const groundMat=new THREE.ShadowMaterial({opacity:.2});const ground=new THREE.Mesh(groundGeo,groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-2.4;ground.receiveShadow=true;scene.add(ground);
 let angle=.6,tilt=.18,auto=!matchMedia('(prefers-reduced-motion: reduce)').matches,dragging=false,lastX=0,lastY=0,zoom=1,frame,disposed=false;let lastTime=performance.now();
 function resize(){const r=container.getBoundingClientRect();if(r.width===0||r.height===0)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(container);resize();
 function render(now){if(disposed)return;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(auto&&!dragging)angle+=dt*.12;root.rotation.y=angle;const dist=Math.max(h*2.4,210)*zoom*(camera.aspect<.8?1.12:1);camera.position.set(dist*.63,dist*(.44+tilt),dist*.82);camera.lookAt(0,h*.45,0);renderer.render(scene,camera);frame=requestAnimationFrame(render);}frame=requestAnimationFrame(render);
 const canvas=renderer.domElement;
 const pointers=new Map();let pinch=0;
 function separation(){const a=[...pointers.values()];return a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;}
 function down(e){dragging=true;lastX=e.clientX;lastY=e.clientY;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=separation();canvas.setPointerCapture(e.pointerId);}
 function move(e){if(!dragging||!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>1){const next=separation();if(pinch>0&&next>0)zoom=Math.max(.65,Math.min(1.7,zoom*pinch/next));pinch=next;}else{angle+=(e.clientX-lastX)*.009;tilt=Math.max(-.2,Math.min(.6,tilt+(e.clientY-lastY)*.003));}lastX=e.clientX;lastY=e.clientY;}
 function up(e){pointers.delete(e.pointerId);dragging=pointers.size>0;const p=[...pointers.values()][0];if(p){lastX=p.x;lastY=p.y;}pinch=0;}
 function wheel(e){e.preventDefault();zoom=Math.max(.65,Math.min(1.7,zoom+e.deltaY*.001));}
 function key(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')tilt=Math.min(.6,tilt+.08);if(e.key==='ArrowDown')tilt=Math.max(-.2,tilt-.08);if(e.key==='+')zoom=Math.max(.65,zoom-.1);if(e.key==='-')zoom=Math.min(1.7,zoom+.1);}}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);
 return{toggle(){auto=!auto;return auto;},destroy(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();geometries.forEach(g=>g.dispose());Object.values(mats).forEach(m=>m.dispose());groundMat.dispose();renderer.dispose();renderer.forceContextLoss();container.innerHTML='';}};
}
