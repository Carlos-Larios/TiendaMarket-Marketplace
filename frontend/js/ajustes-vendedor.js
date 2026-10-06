(function(){
  const API='http://localhost:3000/api/vendedores/mi-tienda/envios';
  const themeApi=window.TiendaProVendorTheme;
  const choices=[...document.querySelectorAll('[data-theme-choice]')];
  const state=document.getElementById('themeSaveState'); const code=document.getElementById('accentCode');
  function current(){return themeApi?.getTheme?.()||document.documentElement.dataset.vendorTheme||'light'}
  function paint(){const active=current();choices.forEach(btn=>{const on=btn.dataset.themeChoice===active;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));});const accent=themeApi?.getAccent?.()||'#2563eb';if(code)code.textContent=accent.toUpperCase()}
  choices.forEach(btn=>btn.addEventListener('click',()=>{themeApi?.setTheme(btn.dataset.themeChoice,true);paint();if(state){state.textContent='Preferencia guardada.';state.className='save-state ok';clearTimeout(state._t);state._t=setTimeout(()=>{state.textContent='';state.className='save-state'},1800)}}));
  document.addEventListener('vendorAccentChanged',paint);document.addEventListener('vendorThemeChanged',paint);paint();

  const tabs=[...document.querySelectorAll('[data-settings-tab]')], appearance=document.getElementById('appearanceSettings'), shipping=document.getElementById('shippingSettings');
  tabs.forEach(b=>b.addEventListener('click',()=>{
    tabs.forEach(x=>x.classList.remove('active')); b.classList.add('active');
    const env=b.dataset.settingsTab==='envios'; appearance.hidden=env; shipping.hidden=!env;
    if(env)loadShipping(true); window.scrollTo({top:0,behavior:'smooth'});
  }));

  const departments=['Ahuachapán','Cabañas','Chalatenango','Cuscatlán','La Libertad','La Paz','La Unión','Morazán','San Miguel','San Salvador','San Vicente','Santa Ana','Sonsonate','Usulután'];
  const zones=document.getElementById('zonesList'),shipState=document.getElementById('shippingState');
  const empty=document.getElementById('shippingEmpty'),summary=document.getElementById('shippingSummary'),formWrap=document.getElementById('shippingFormWrap');
  const form=document.getElementById('shippingForm'),saveBtn=document.getElementById('saveShipping');
  const shipName=document.getElementById('shipName'),shipTracking=document.getElementById('shipTracking');
  let method=null, loaded=false, currentActive=true, editing=false;

  zones.innerHTML=departments.map(d=>`<div class="zone-row" data-zone="${d}"><label class="zone-check"><input class="zone-enabled" type="checkbox"><strong>${d}</strong></label><label class="zone-field"><span>Precio ($)</span><input class="zone-price" type="number" min="0" step="0.01" placeholder="0.00"></label><label class="zone-field"><span>Entrega estimada mín. (días)</span><input class="zone-min" type="number" min="1" max="30" value="1"></label><label class="zone-field"><span>Entrega estimada máx. (días)</span><input class="zone-max" type="number" min="1" max="30" value="5"></label></div>`).join('');
  zones.addEventListener('change',e=>{if(e.target.classList.contains('zone-enabled'))e.target.closest('.zone-row').classList.toggle('enabled',e.target.checked)});
  document.getElementById('toggleAllZones').addEventListener('click',e=>{const checks=[...document.querySelectorAll('.zone-enabled')],all=checks.every(c=>c.checked);checks.forEach(c=>{c.checked=!all;c.closest('.zone-row').classList.toggle('enabled',!all)});e.currentTarget.textContent=all?'Seleccionar todos':'Quitar selección'});

  function token(){return localStorage.getItem('token')||''}
  function msg(text,ok=false){shipState.textContent=text;shipState.className='save-state'+(ok?' ok':'')}
  function resetForm(){form.reset();shipTracking.checked=true;currentActive=true;document.querySelectorAll('.zone-row').forEach(row=>{row.classList.remove('enabled');row.querySelector('.zone-enabled').checked=false;row.querySelector('.zone-price').value='';row.querySelector('.zone-min').value=1;row.querySelector('.zone-max').value=5});document.getElementById('toggleAllZones').textContent='Seleccionar todos';msg('')}
  function fillForm(m){resetForm();if(!m)return;shipName.value=m.nombre||'';shipTracking.checked=m.seguimiento!==false;currentActive=!!m.activo;(m.zonas||[]).forEach(z=>{const row=[...document.querySelectorAll('.zone-row')].find(r=>r.dataset.zone===z.departamento);if(!row)return;row.querySelector('.zone-enabled').checked=true;row.classList.add('enabled');row.querySelector('.zone-price').value=Number(z.precio).toFixed(2);row.querySelector('.zone-min').value=z.entrega_min;row.querySelector('.zone-max').value=z.entrega_max})}
  function showEmpty(){empty.hidden=false;summary.hidden=true;formWrap.hidden=true}
  function showSummary(){empty.hidden=true;summary.hidden=false;formWrap.hidden=true;renderCard()}
  function showForm(isEdit){editing=!!isEdit;empty.hidden=true;summary.hidden=true;formWrap.hidden=false;document.getElementById('shippingFormTitle').textContent=editing?'Editar método de envío':'Agregar método de envío';saveBtn.textContent=editing?'Actualizar método de envío':'Guardar método de envío';if(editing)fillForm(method);else resetForm();formWrap.scrollIntoView({behavior:'smooth',block:'start'})}
  function renderCard(){if(!method)return;document.getElementById('methodCardName').textContent=method.nombre||'Método de envío';const pill=document.getElementById('methodCardStatus');pill.textContent=method.activo?'● Activo':'● Inactivo';pill.className='status-pill '+(method.activo?'active':'inactive');const zs=method.zonas||[];const min=zs.length?Math.min(...zs.map(z=>Number(z.entrega_min)||1)):null,max=zs.length?Math.max(...zs.map(z=>Number(z.entrega_max)||1)):null;document.getElementById('methodCardEta').textContent=min==null?'Sin zonas':`${min} - ${max} días`;document.getElementById('methodCardCoverage').textContent=`${zs.length} ${zs.length===1?'departamento':'departamentos'}`;document.getElementById('toggleShippingStatus').textContent=method.activo?'Desactivar':'Activar'}

  async function loadShipping(force=false){if(loaded&&!force){method?showSummary():showEmpty();return}loaded=true;try{const r=await fetch(API,{headers:{Authorization:`Bearer ${token()}`}});const x=await r.json().catch(()=>({}));if(!r.ok)throw new Error(x.mensaje||'No se pudo cargar');method=x.metodo||null;method?showSummary():showEmpty()}catch(e){loaded=false;showEmpty();msg(e.message)}}

  document.getElementById('addShippingMethod').addEventListener('click',()=>showForm(false));
  document.getElementById('editShippingMethod').addEventListener('click',()=>showForm(true));
  function closeForm(){method?showSummary():showEmpty()}
  document.getElementById('closeShippingForm').addEventListener('click',closeForm);document.getElementById('cancelShippingForm').addEventListener('click',closeForm);

  form.addEventListener('submit',async e=>{e.preventDefault();const selected=[...document.querySelectorAll('.zone-row.enabled')];if(!selected.length)return msg('Selecciona al menos un departamento de cobertura.');const zonasData=[];for(const row of selected){const precio=+row.querySelector('.zone-price').value,emin=+row.querySelector('.zone-min').value,emax=+row.querySelector('.zone-max').value;if(!Number.isFinite(precio)||precio<0)return msg(`Ingresa un precio válido para ${row.dataset.zone}.`);if(!Number.isInteger(emin)||emin<1||!Number.isInteger(emax)||emax<emin)return msg(`El rango estimado de entrega de ${row.dataset.zone} no es válido.`);zonasData.push({departamento:row.dataset.zone,precio,entrega_min:emin,entrega_max:emax})}const body={nombre:shipName.value.trim(),seguimiento:shipTracking.checked,activo:method?currentActive:true,zonas:zonasData};if(!body.nombre)return msg('Escribe el nombre del método de envío.');saveBtn.disabled=true;msg(editing?'Actualizando...':'Guardando...');try{const r=await fetch(API,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token()}`},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.mensaje||'No se pudo guardar');loaded=false;await loadShipping(true);msg('')}catch(err){msg(err.message);formWrap.hidden=false;summary.hidden=true;empty.hidden=true}finally{saveBtn.disabled=false}});

  document.getElementById('toggleShippingStatus').addEventListener('click',async()=>{if(!method)return;const btn=document.getElementById('toggleShippingStatus');btn.disabled=true;try{const r=await fetch(API+'/estado',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token()}`},body:JSON.stringify({activo:!method.activo})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.mensaje||'No se pudo cambiar el estado');method.activo=!method.activo;currentActive=method.activo;renderCard()}catch(e){alert(e.message)}finally{btn.disabled=false}});

  const modal=document.getElementById('deleteShippingModal');
  document.getElementById('deleteShippingMethod').addEventListener('click',()=>{modal.hidden=false});
  document.getElementById('cancelDeleteShipping').addEventListener('click',()=>{modal.hidden=true});
  modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
  document.getElementById('confirmDeleteShipping').addEventListener('click',async()=>{const btn=document.getElementById('confirmDeleteShipping');btn.disabled=true;try{const r=await fetch(API,{method:'DELETE',headers:{Authorization:`Bearer ${token()}`}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.mensaje||'No se pudo eliminar');method=null;loaded=true;modal.hidden=true;showEmpty()}catch(e){alert(e.message)}finally{btn.disabled=false}});
})();
