export const buildings = [
 {id:'brisa',number:'01',name:'Brisa do Canto',region:'Canto da Praia',coords:[-48.6114738,-27.0908666],floors:24,height:82,color:'#c8d9c0',type:'Varandas & natureza',description:'Uma torre conceitual próxima ao Canto da Praia, criada para explorar a relação entre o bairro, o mirante e a orla.',shape:0},
 {id:'vista',number:'02',name:'Vista Central',region:'Centro',coords:[-48.6153468,-27.1017386],floors:32,height:109,color:'#e9c89e',type:'A cidade ao redor',description:'Um edifício de demonstração no Centro. Explore os pontos da cidade e compare a proximidade de cada atração.',shape:1},
 {id:'horizonte',number:'03',name:'Horizonte',region:'Meia Praia · norte',coords:[-48.6072954,-27.1204246],floors:38,height:129,color:'#a9cdd6',type:'Entre a cidade e o mar',description:'Uma proposta ilustrativa na região norte da Meia Praia, com uma maquete interativa e conexões aos pontos turísticos.',shape:2},
 {id:'atlantico',number:'04',name:'Atlântico Sul',region:'Meia Praia · sul',coords:[-48.5947649,-27.1395142],floors:45,height:152,color:'#d4c6df',type:'Um novo horizonte',description:'Uma torre fictícia na porção sul da Meia Praia. Um ponto de partida para descobrir a cidade de uma nova perspectiva.',shape:3}
];
export const places = [
 {id:'mirante',name:'Mirante do Encanto',category:'Mirante',icon:'view',coords:[-48.6036115,-27.0876797],description:'Do alto do Morro do Cabeço, a enseada inteira cabe num olhar. O fim de tarde aqui tem plateia fiel.',source:'https://www.openstreetmap.org/node/4310268362'},
 {id:'teleferico',name:'Teleférico',category:'Lazer',icon:'cable',coords:[-48.5993183,-27.089568],description:'Uma subida tranquila sobre a mata, com o mar se abrindo a cada metro. O jeito mais bonito de chegar ao mirante.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'marina',name:'Marina Canto da Praia',category:'Lazer',icon:'anchor',coords:[-48.6047622,-27.0919787],description:'Barcos, brisa e o mar calmo do Canto. Ponto de partida para passear pela enseada.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'central',name:'Praia do Centro',category:'Praia',icon:'wave',coords:[-48.6139739,-27.0993254],description:'A praia de quem vive a cidade: calçadão, cafés e mar a poucos passos de tudo.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'meia',name:'Alargamento da Praia',category:'Praia',icon:'wave',coords:[-48.6031897,-27.124887],description:'Faixa de areia larga e novinha, com espaço de sobra para o sol, a caminhada e o futebol de fim de tarde.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'parque',name:'Parque das Capivaras',category:'Natureza',icon:'leaf',coords:[-48.592959,-27.1419063],description:'Verde, silêncio e capivaras à beira do rio. Um respiro de natureza dentro da cidade.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'pier',name:'Pier O Porto',category:'Lazer',icon:'rock',coords:[-48.5856612,-27.1441229],description:'Um passeio sobre o mar, com a orla inteira à vista. Fica ainda melhor ao pôr do sol.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'roda',name:'Roda Gigante',category:'Lazer',icon:'wheel',coords:[-48.5856612,-27.1441229],description:'Alguns minutos lá em cima e Itapema aparece de outro jeito: praia, morros e o mar até o horizonte.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'},
 {id:'garden',name:'Garden Open Mall',category:'Compras',icon:'shop',coords:[-48.6012715,-27.1287625],description:'Compras, gastronomia e encontros a céu aberto, a poucas quadras da praia.',source:'https://www.itapema.sc.gov.br/turismo/nossas-praias/'}
];
export function distance(a,b){const rad=x=>x*Math.PI/180;const p=rad(b[1]-a[1]),l=rad(b[0]-a[0]);const h=Math.sin(p/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(l/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function formatDistance(m){return m<1000?`${Math.round(m/10)*10} m`:`${(m/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} km`;}
export function nearby(building){return places.map(p=>({...p,distance:distance(building.coords,p.coords)})).sort((a,b)=>a.distance-b.distance);}
// Bairros e cenas renderizadas. As câmeras são usadas por render.html para gerar as imagens em renders/.
export const districts = [
 {id:'canto-centro',name:'Canto da Praia & Centro',center:[-48.6095,-27.0950],radius:850,buildings:['brisa','vista'],places:['mirante','teleferico','marina','central']},
 {id:'meia-praia',name:'Meia Praia',center:[-48.6000,-27.1320],radius:1500,buildings:['horizonte','atlantico'],places:['meia','parque','pier','roda','garden']}
];
export const scenes = [
 {id:'itapema',name:'Itapema',camera:{center:[-48.6010,-27.1170],zoom:13.6,pitch:54,bearing:68},districts:['canto-centro','meia-praia'],places:places.map(p=>p.id)},
 {id:'canto-centro',name:'Canto da Praia & Centro',parent:'itapema',camera:{center:[-48.6075,-27.0960],zoom:15.05,pitch:63,bearing:62},buildings:['brisa','vista'],places:['mirante','teleferico','marina','central']},
 {id:'meia-praia',name:'Meia Praia',parent:'itapema',camera:{center:[-48.5990,-27.1330],zoom:14.45,pitch:63,bearing:72},buildings:['horizonte','atlantico'],places:['meia','parque','pier','roda','garden']}
];
