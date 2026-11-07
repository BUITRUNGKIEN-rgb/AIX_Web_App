(() => {
  'use strict';
  const config = window.AI02_CONFIG || {};
  const links = [document.querySelector('#repo-top'), document.querySelector('#repo-footer')];
  const repo = safeHttps(config.repositoryUrl);
  if (repo) links.forEach(a => { if (a) a.href = repo; });
  const cloud = safeHttps(config.streamlitUrl);
  const deploy = document.querySelector('#deploy-state');
  if (cloud && deploy) { deploy.textContent = 'Ứng dụng nhận diện đã được kết nối'; }
  const dialog = document.querySelector('#connect-dialog');
  const openDialog = () => {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
  };
  const closeDialog = () => { if (!dialog) return; if(typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); };
  document.querySelectorAll('[data-open-app]').forEach(el => el.addEventListener('click', () => {
    if (cloud) { window.open(cloud, '_blank', 'noopener,noreferrer'); }
    else { openDialog(); }
  }));
  document.querySelector('#dialog-close')?.addEventListener('click',closeDialog);
  document.querySelector('#dialog-ok')?.addEventListener('click',closeDialog);
  dialog?.addEventListener('click',ev=>{ if(ev.target===dialog) closeDialog(); });
  function safeHttps(value){
    if(typeof value!=='string'||!value.trim())return '';
    try {const u=new URL(value); if(u.protocol!=='https:')return '';return u.href;}
    catch{return '';}
  }
})();
