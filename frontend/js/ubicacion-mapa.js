(()=>{
function coordenadas(value){let text=String(value||'').trim(),pair;
try{if(/^https:\/\//i.test(text)){const url=new URL(text);if(!['www.google.com','google.com','maps.google.com'].includes(url.hostname))return null;const marker=text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);text=marker?marker[1]+','+marker[2]:(url.searchParams.get('query')||url.searchParams.get('q')||'');}}
catch{return null;}
pair=text.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);if(!pair)return null;const lat=Number(pair[1]),lng=Number(pair[2]);return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null;
}
function crear(lat,lng,label='Ubicación de la tienda'){
const point=coordenadas(lat+','+lng);if(!point)return null;const query=point.lat+','+point.lng,wrapper=document.createElement('div');wrapper.className='store-map';
const iframe=document.createElement('iframe');iframe.src='https://maps.google.com/maps?q='+encodeURIComponent(query)+'&z=16&output=embed';iframe.title='Mapa: '+label;iframe.loading='lazy';iframe.referrerPolicy='no-referrer-when-downgrade';iframe.tabIndex=-1;
const link=document.createElement('a');link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);link.target='_blank';link.rel='noopener noreferrer';link.className='store-map-link';link.setAttribute('aria-label','Abrir ubicación exacta en Google Maps');const badge=document.createElement('span');badge.textContent='Ver ubicación en Google Maps ↗';link.append(badge);wrapper.append(iframe,link);return wrapper;
}
window.TiendaProMapa={coordenadas,crear};
})();
