export const buildings = [
 {id:'brisa',number:'01',name:'Brisa do Canto',region:'Canto da Praia',coords:[-48.6108,-27.0927],floors:24,height:82,color:'#c8d9c0',type:'Varandas & natureza',description:'Uma torre conceitual próxima ao Canto da Praia, criada para explorar a relação entre o bairro, o mirante e a orla.',shape:0},
 {id:'vista',number:'02',name:'Vista Central',region:'Centro',coords:[-48.6150,-27.1020],floors:32,height:109,color:'#e9c89e',type:'A cidade ao redor',description:'Um edifício de demonstração no Centro. Explore os pontos da cidade e compare a proximidade de cada atração.',shape:1},
 {id:'horizonte',number:'03',name:'Horizonte',region:'Meia Praia · norte',coords:[-48.6062,-27.1226],floors:38,height:129,color:'#a9cdd6',type:'Entre a cidade e o mar',description:'Uma proposta ilustrativa na região norte da Meia Praia, com uma maquete interativa e conexões aos pontos turísticos.',shape:2},
 {id:'atlantico',number:'04',name:'Atlântico Sul',region:'Meia Praia · sul',coords:[-48.5952,-27.1407],floors:45,height:152,color:'#d4c6df',type:'Um novo horizonte',description:'Uma torre fictícia na porção sul da Meia Praia. Um ponto de partida para descobrir a cidade de uma nova perspectiva.',shape:3}
];
export const places = [
 {id:'mirante',name:'Mirante do Encanto',category:'Mirante',icon:'view',coords:[-48.6037,-27.0876],description:'No Morro do Cabeço, uma vista panorâmica da enseada de Itapema e do litoral. Um dos pontos de referência para ver a cidade do alto.',source:'https://www.openstreetmap.org/node/4310268362'},
 {id:'ponte',name:'Ponte dos Suspiros',category:'Patrimônio',icon:'bridge',coords:[-48.61230,-27.094856],description:'A ponte sobre o Rio Bela Cruz conecta a região central ao Canto da Praia e é um dos cartões-postais da cidade.',source:'https://periodicos.udesc.br/index.php/percursos/article/download/17694/12209'},
 {id:'canto',name:'Canto da Praia',category:'Praia',icon:'wave',coords:[-48.60594,-27.091033],description:'O encontro da praia com a tradição pesqueira de Itapema. Um lugar para contemplar a enseada e passear pela orla.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'grossa',name:'Praia Grossa',category:'Natureza',icon:'leaf',coords:[-48.596327,-27.086696],description:'Uma praia cercada de vegetação, acessada por trilha. O marcador indica uma referência na praia, não o início do caminho.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'central',name:'Praia do Centro',category:'Praia',icon:'wave',coords:[-48.613708,-27.098177],description:'A orla central de Itapema, próxima aos serviços e à vida urbana. O marcador representa um ponto de referência na praia.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'meia',name:'Meia Praia',category:'Praia',icon:'wave',coords:[-48.604546,-27.122148],description:'A longa orla da Meia Praia convida a caminhar e conhecer a cidade. As distâncias usam este ponto de referência, não toda a extensão da praia.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'parque',name:'Parque das Capivaras',category:'Natureza',icon:'leaf',coords:[-48.58989,-27.145675],description:'Uma área de lazer e contato com a natureza no sul da Meia Praia, junto à região do Rio Perequê.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'}
];
export function distance(a,b){const rad=x=>x*Math.PI/180;const p=rad(b[1]-a[1]),l=rad(b[0]-a[0]);const h=Math.sin(p/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(l/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function formatDistance(m){return m<1000?`${Math.round(m/10)*10} m`:`${(m/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} km`;}
export function nearby(building){return places.map(p=>({...p,distance:distance(building.coords,p.coords)})).sort((a,b)=>a.distance-b.distance);}
// Bairros e cenas renderizadas. As câmeras são usadas por render.html para gerar as imagens em renders/.
export const districts = [
 {id:'canto-centro',name:'Canto da Praia & Centro',center:[-48.6095,-27.0950],radius:850,buildings:['brisa','vista'],places:['mirante','ponte','canto','grossa','central']},
 {id:'meia-praia',name:'Meia Praia',center:[-48.6000,-27.1320],radius:1500,buildings:['horizonte','atlantico'],places:['meia','parque']}
];
export const scenes = [
 {id:'itapema',name:'Itapema',camera:{center:[-48.6010,-27.1170],zoom:13.6,pitch:54,bearing:68},districts:['canto-centro','meia-praia'],places:places.map(p=>p.id)},
 {id:'canto-centro',name:'Canto da Praia & Centro',parent:'itapema',camera:{center:[-48.6075,-27.0960],zoom:15.05,pitch:63,bearing:62},buildings:['brisa','vista'],places:['mirante','ponte','canto','grossa','central']},
 {id:'meia-praia',name:'Meia Praia',parent:'itapema',camera:{center:[-48.5990,-27.1330],zoom:14.45,pitch:63,bearing:72},buildings:['horizonte','atlantico'],places:['meia','parque']}
];
