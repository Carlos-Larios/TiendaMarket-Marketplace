(()=>{
const form=document.getElementById('perfilForm'),message=document.getElementById('perfilMensaje'),button=document.getElementById('guardarPerfil');
const base=API.replace(/\/api$/,''),saved={};let urls=[];
const socialIcons={"whatsapp": "<svg class=\"p-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 11.5A9 9 0 0 1 7.5 19L2 21l1.8-5A9 9 0 1 1 21 11.5Z\"/><path d=\"M8 7c-3 2 4 10 8 8l-2-3-2 1-2-2 1-2-3-2Z\"/></svg>", "correo_publico": "<svg class=\"p-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"m3 6 9 7 9-7\"/></svg>", "sitio_web": "<svg class=\"p-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><ellipse cx=\"12\" cy=\"12\" rx=\"4\" ry=\"9\"/><path d=\"M3 12h18\"/></svg>", "instagram": "<svg class=\"p-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.5\" cy=\"6.5\" r=\".6\" fill=\"currentColor\"/></svg>", "facebook": "<svg class=\"p-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path fill=\"currentColor\" stroke=\"none\" d=\"M14 22v-9h3l.5-4H14V7c0-1.1.4-2 2-2h2V1.5C17 1.2 16 1 15 1c-3.5 0-5 2-5 5v3H7v4h3v9Z\"/></svg>"};
const extras=['pais','ubicacion','direccion_publica','horario_semana','horario_sabado','horario_domingo','tiempo_respuesta','whatsapp','correo_publico','sitio_web','instagram','facebook','politica_envios','politica_devoluciones','garantia'];
const mapaInput=document.getElementById('mapaCoordenadas');
function actualizarMapa(){
 const value=mapaInput.value.trim(),point=window.TiendaProMapa.coordenadas(value);const host=document.getElementById('mapaPreview');host.replaceChildren();
 form.elements.mapa_latitud.value=point?point.lat:'';form.elements.mapa_longitud.value=point?point.lng:'';
 document.getElementById('mapaEstado').textContent=value&&!point?'Pega las coordenadas del punto exacto (latitud, longitud). Los enlaces cortos deben abrirse en Google Maps antes de copiar las coordenadas.':'';
 mapaInput.setCustomValidity(value&&!point?'Introduce coordenadas válidas para la ubicación exacta.':'');
 if(point)host.append(window.TiendaProMapa.crear(point.lat,point.lng,form.elements.tienda.value));
}
mapaInput.addEventListener('input',actualizarMapa);document.getElementById('quitarMapa').addEventListener('click',()=>{mapaInput.value='';actualizarMapa();});
function render(){
  document.getElementById('previewUbicacion').textContent=[form.elements.ubicacion.value,form.elements.pais.value].filter(Boolean).join(', ')||'Ubicación sin indicar';
  document.getElementById('previewHorario').textContent=form.elements.horario_semana.value||'Horario sin indicar';
  document.getElementById('previewRespuesta').textContent=form.elements.tiempo_respuesta.value||'Respuesta sin indicar';
  const contacto=document.getElementById('previewContacto');contacto.replaceChildren();
  if(form.elements.mostrar_contacto.checked)for(const campo of ['whatsapp','correo_publico','instagram','facebook','sitio_web']){
    const value=form.elements[campo].value.trim();if(!value)continue;
    let href=value;
    if(campo==='correo_publico')href='mailto:'+value;
    else if(campo==='whatsapp'){if(!/^https?:\/\//i.test(value))href='https://wa.me/'+value.replace(/\D/g,'');}
    else if(!/^https?:\/\//i.test(value)){if(campo==='instagram'||campo==='facebook')href='https://www.'+campo+'.com/'+value.replace(/^@/,'');else continue;}
    if(!/^(https?:\/\/|mailto:)/i.test(href))continue;
    const link=document.createElement('a');link.href=href;link.className='social-link '+campo;link.title=campo==='correo_publico'?'Correo electrónico':campo;link.setAttribute('aria-label',link.title);link.target='_blank';link.rel='noopener noreferrer';link.innerHTML=socialIcons[campo];contacto.append(link);
  }
  for(const [name,max] of [['tienda',100],['descripcion_publica',2000]])document.getElementById('count_'+name).textContent=form.elements[name].value.length+'/'+max;
  const initial=document.getElementById('previewInitial');initial.textContent=(form.elements.tienda.value.trim()[0]||'T').toUpperCase();


  urls.forEach(u=>URL.revokeObjectURL(u));urls=[];
  document.getElementById('previewNombre').textContent=form.elements.tienda.value;
  document.getElementById('previewDescripcion').textContent=form.elements.descripcion_publica.value;
  for(const field of ['logo_tienda','banner_tienda']){
    const file=form.elements[field].files[0];let src=saved[field]||'';
    if(form.elements['eliminar_'+field].checked)src='';
    if(file){src=URL.createObjectURL(file);urls.push(src);}
    if(src.startsWith('/uploads/'))src=base+src;
    const edit=document.getElementById('edit_'+field);edit.replaceChildren();if(src){const img=document.createElement('img');img.src=src;img.alt=field==='logo_tienda'?'Foto seleccionada':'Banner seleccionado';edit.append(img);}else edit.textContent=field==='logo_tienda'?(form.elements.tienda.value.trim()[0]||'T').toUpperCase():'Selecciona tu portada';
    const el=document.getElementById(field==='logo_tienda'?'previewLogo':'previewBanner');
    if(field==='logo_tienda'){el.hidden=!src;document.getElementById('previewInitial').hidden=!!src;if(src)el.src=src;else el.removeAttribute('src');}
    else {el.replaceChildren();if(src){const img=document.createElement('img');img.src=src;img.alt='Banner de la tienda';img.style='width:100%;height:100%;object-fit:cover';el.append(img);}}
  }
}
for(const tab of document.querySelectorAll('[data-policy]'))tab.addEventListener('click',()=>{
  for(const other of document.querySelectorAll('[data-policy]')){const active=other===tab;other.setAttribute('aria-selected',String(active));document.getElementById('panel_'+other.dataset.policy).hidden=!active;}
});
function hourValue(day,part){const input=form.querySelector('[data-day="'+day+'"][data-part="'+part+'"]'),period=form.querySelector('[data-day="'+day+'"][data-part="'+part+'_period"]');return input.value.trim()?input.value.trim()+' '+period.value:'';}
function syncHours(){for(const day of ['semana','sabado','domingo']){
 const open=form.querySelector('[data-day="'+day+'"][data-part="open"]'),start=form.querySelector('[data-day="'+day+'"][data-part="start"]'),end=form.querySelector('[data-day="'+day+'"][data-part="end"]');
 start.disabled=end.disabled=false;open.nextElementSibling.textContent=open.checked?'Abierto':'Cerrado';
 form.elements['horario_'+day].value=open.checked?(hourValue(day,'start')+' – '+hourValue(day,'end')):'Cerrado';
}render();}
form.addEventListener('change',e=>{if(e.target.dataset.day){
 if(['start','end','start_period','end_period'].includes(e.target.dataset.part))form.querySelector('[data-day="'+e.target.dataset.day+'"][data-part="open"]').checked=true;
 syncHours();
}});
for(const zone of form.querySelectorAll('.upload-zone')){
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-active');});
  zone.addEventListener('dragleave',()=>zone.classList.remove('drag-active'));
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-active');const file=e.dataTransfer.files[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){message.textContent='Selecciona JPG, PNG o WEBP de máximo 8 MB.';return;}const transfer=new DataTransfer();transfer.items.add(file);const input=zone.querySelector('input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));});
}
const departamentos=['Ahuachapán','Santa Ana','Sonsonate','Chalatenango','La Libertad','San Salvador','Cuscatlán','La Paz','Cabañas','San Vicente','Usulután','San Miguel','Morazán','La Unión'];
const departamentoInput=document.getElementById('departamentoInput'),opciones=document.getElementById('departamentoOpciones');let active=-1;
const normalizar=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function cerrarDepartamentos(){opciones.hidden=true;departamentoInput.setAttribute('aria-expanded','false');departamentoInput.removeAttribute('aria-activedescendant');active=-1;}
function elegirDepartamento(nombre){departamentoInput.value=nombre;cerrarDepartamentos();render();}
function sugerirDepartamentos(){const texto=normalizar(departamentoInput.value.trim());opciones.replaceChildren();active=-1;if(!texto){cerrarDepartamentos();return;}
 for(const nombre of departamentos.filter(nombre=>normalizar(nombre).includes(texto))){const opcion=document.createElement('li');opcion.id='departamento-'+opciones.children.length;opcion.setAttribute('role','option');opcion.setAttribute('aria-selected','false');opcion.textContent=nombre;opcion.addEventListener('mousedown',e=>e.preventDefault());opcion.addEventListener('click',()=>elegirDepartamento(nombre));opciones.append(opcion);}
 opciones.hidden=!opciones.children.length;departamentoInput.setAttribute('aria-expanded',String(!opciones.hidden));
}
departamentoInput.addEventListener('input',sugerirDepartamentos);departamentoInput.addEventListener('focus',sugerirDepartamentos);
departamentoInput.addEventListener('blur',cerrarDepartamentos);
departamentoInput.addEventListener('keydown',e=>{const items=[...opciones.children];if(e.key==='Escape'){cerrarDepartamentos();return;}if(opciones.hidden||!items.length)return;
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===active)));departamentoInput.setAttribute('aria-activedescendant',items[active].id);items[active].scrollIntoView({block:'nearest'});}
 else if(e.key==='Enter'&&active>=0){e.preventDefault();elegirDepartamento(items[active].textContent);}
});
form.addEventListener('input',render);
form.addEventListener('change',event=>{
  const file=event.target.files?.[0];
  if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)){message.textContent='Selecciona JPG, PNG o WEBP de máximo 8 MB.';event.target.value='';}
  render();
});
(async()=>{button.disabled=true;try{
  const r=await fetch(API+'/vendedores/mi-tienda/perfil',{headers:{Authorization:'Bearer '+token}});const d=await r.json();if(!r.ok)throw Error(d.mensaje);
  Object.assign(saved,d.tienda);const publicLink=document.getElementById('verPerfilPublico');publicLink.href='tienda.html?id='+saved.id;publicLink.hidden=false;let perfil={};try{perfil=typeof saved.perfil_publico==='string'?JSON.parse(saved.perfil_publico):saved.perfil_publico||{};}catch(_){}
  if(perfil.mapa_latitud!==undefined&&perfil.mapa_longitud!==undefined)mapaInput.value=perfil.mapa_latitud+', '+perfil.mapa_longitud;actualizarMapa();
  for(const campo of extras)form.elements[campo].value=perfil[campo]||(campo==='pais'?'El Salvador':'');
  for(const campo of ['mostrar_tienda','mostrar_productos','mostrar_contacto'])form.elements[campo].checked=perfil[campo]!==false;
  for(const day of ['semana','sabado','domingo']){
 const value=form.elements['horario_'+day].value;const normalized=window.TiendaProHorario.range(value);const times=normalized.split(' – ');form.querySelector('[data-day="'+day+'"][data-part="open"]').checked=!!value&&!/cerrado/i.test(value);
 for(const [i,part] of ['start','end'].entries()){const input=form.querySelector('[data-day="'+day+'"][data-part="'+part+'"]'),period=form.querySelector('[data-day="'+day+'"][data-part="'+part+'_period"]'),parsed=window.TiendaProHorario.parse(times[i]);input.value=parsed?.time||'';period.value=parsed?.period||'AM';input.disabled=false;}
 if(value&&!/cerrado/i.test(value))form.elements['horario_'+day].value=normalized;
 }
 for(const day of ['semana','sabado','domingo']){const open=form.querySelector('[data-day="'+day+'"][data-part="open"]');open.nextElementSibling.textContent=open.checked?'Abierto':'Cerrado';}
 form.elements.tienda.value=saved.tienda||'';form.elements.descripcion_publica.value=saved.descripcion_publica||'';render();button.disabled=false;
}catch(e){message.textContent=e.message||'No se pudo cargar el perfil';}})();
form.addEventListener('submit',async event=>{event.preventDefault();
for(const day of ['semana','sabado','domingo']){
 const open=form.querySelector('[data-day="'+day+'"][data-part="open"]');
 if(open.checked){const start=form.querySelector('[data-day="'+day+'"][data-part="start"]'),end=form.querySelector('[data-day="'+day+'"][data-part="end"]');if(!start.value||!end.value){message.textContent='Completa la hora de apertura y cierre de cada día marcado como abierto.';(!start.value?start:end).focus();return;}form.elements['horario_'+day].value=hourValue(day,'start')+' – '+hourValue(day,'end');}
 else form.elements['horario_'+day].value='Cerrado';
}
button.disabled=true;message.textContent='Guardando…';try{
  const r=await fetch(API+'/vendedores/mi-tienda/perfil',{method:'PUT',headers:{Authorization:'Bearer '+token},body:new FormData(form)});const d=await r.json();if(!r.ok)throw Error(d.mensaje);
  Object.assign(saved,d.tienda);for(const field of ['logo_tienda','banner_tienda']){form.elements[field].value='';form.elements['eliminar_'+field].checked=false;}render();pintarLogoTienda(saved.logo_tienda,saved.tienda);window.TiendaProVendorTheme?.refreshAccentFromSellerLogo?.();message.textContent=d.mensaje;
}catch(e){message.textContent=e.message||'No se pudo guardar';}finally{button.disabled=false;}});
})();
