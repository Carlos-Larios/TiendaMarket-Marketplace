
(()=>{const KEY='tiendapro_public_theme';const valid=v=>v==='light'||v==='dark';
function apply(v){const theme=valid(v)?v:'light';document.documentElement.setAttribute('data-public-theme',theme);localStorage.setItem(KEY,theme);window.dispatchEvent(new CustomEvent('tiendapro:public-theme',{detail:{theme}}));return theme}
function current(){return valid(localStorage.getItem(KEY))?localStorage.getItem(KEY):'light'}
window.TiendaProPublicTheme={apply,current};
apply(current());
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-public-theme-choice]').forEach(b=>{const sync=()=>b.classList.toggle('active',b.dataset.publicThemeChoice===current());sync();b.addEventListener('click',()=>{apply(b.dataset.publicThemeChoice);document.querySelectorAll('[data-public-theme-choice]').forEach(x=>x.classList.toggle('active',x.dataset.publicThemeChoice===current()))})})});
})();
