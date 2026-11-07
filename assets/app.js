'use strict';
const LABELS = [
  {id:'cardboard',vi:'Bìa carton',icon:'📦',guide:'Bìa carton: thu gom sạch, khô theo hướng dẫn của điểm tiếp nhận.'},
  {id:'glass',vi:'Thủy tinh',icon:'🫙',guide:'Thủy tinh: tránh mảnh sắc, thu gom riêng theo quy định tại nơi tiếp nhận.'},
  {id:'metal',vi:'Kim loại',icon:'🥫',guide:'Kim loại: thu gom riêng khi sạch và phù hợp quy định.'},
  {id:'paper',vi:'Giấy',icon:'📄',guide:'Giấy: ưu tiên giữ khô; giấy bẩn có thể cần xử lý khác.'},
  {id:'plastic',vi:'Nhựa',icon:'🧴',guide:'Nhựa: kiểm tra loại nhựa và hệ thống phân loại tại địa phương.'},
  {id:'trash',vi:'Rác khác',icon:'🗑️',guide:'Rác khác: cần kiểm tra thủ công trước khi đưa vào luồng xử lý.'}
];
const $ = (id) => document.getElementById(id);
const state = {model:'improved', imageFile:null, imageUrl:null, models:{baseline:false,improved:false}, uploaded:{baseline:null,improved:null},worker:null,processing:false,requestId:0};
function setStatus(msg,kind='missing'){$('statusText').textContent=msg;$('statusDot').className=`status-indicator ${kind}`;}
function changeView(which){
  document.querySelectorAll('.side-nav').forEach(b=>{const active=b.dataset.nav===which;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('is-active',v.id===`view-${which}`));
  scrollTo({top:0,behavior:'smooth'});
}
function updateModelUI(){
  document.querySelectorAll('.model-tab').forEach(b=>{const is=b.dataset.model===state.model;b.classList.toggle('active',is);b.setAttribute('aria-pressed',String(is));});
  $('modelDescription').textContent=state.model==='improved'?'HOG, HSV, màu theo vùng, LBP + SVM RBF; xác suất tham khảo được hiệu chỉnh.':'HOG + histogram RGB + Logistic Regression nhiều lớp (baseline BTC).';
  const ready=Boolean(state.models[state.model]||state.uploaded[state.model]);
  $('modelMissing').hidden=ready;
  $('neededModelFile').textContent=state.model+'.joblib';
  $('analyzeBtn').disabled=!ready||!state.imageFile||state.processing;
  if(ready) setStatus(`Đã có mô hình ${state.model==='improved'?'cải tiến':'baseline'}. Có thể phân tích ảnh.`, 'ready');
  else setStatus(`Chưa có file ${state.model}.joblib — hãy huấn luyện và xuất mô hình trước khi demo.`, 'missing');
}
function showSection(section){['resultEmpty','resultLoading','resultError','resultData'].forEach(id=>$(id).hidden=id!==section);}
function setupImage(file){
  if(!file) return;
  const isImage=['image/png','image/jpeg','image/webp','image/bmp'].includes(file.type)||/\.(jpg|jpeg|png|bmp|webp)$/i.test(file.name);
  if(!isImage){alert('Chỉ nhận ảnh JPG, PNG, BMP hoặc WEBP.');return;}
  if(file.size>10*1024*1024){alert('Ảnh vượt quá 10 MB. Hãy chọn ảnh nhỏ hơn.');return;}
  if(state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageFile=file;state.imageUrl=URL.createObjectURL(file);
  const preview=$('imagePreview');preview.onload=()=>{if(!preview.naturalWidth||!preview.naturalHeight){clearImage('Không đọc được kích thước ảnh.');}};
  preview.onerror=()=>clearImage('Ảnh bị lỗi hoặc không được trình duyệt hỗ trợ.');
  preview.src=state.imageUrl;preview.hidden=false;
  $('dropPlaceholder').hidden=true;$('changeImageBtn').hidden=false;$('dropzone').classList.add('has-image');
  $('fileMeta').textContent=`✓ ${file.name}  ·  ${(file.size/1024).toFixed(1)} KB`;
  showSection('resultEmpty');updateModelUI();
}
function clearImage(msg){if(state.imageUrl) URL.revokeObjectURL(state.imageUrl);state.imageFile=null;state.imageUrl=null;$('imagePreview').hidden=true;$('imagePreview').removeAttribute('src');$('dropPlaceholder').hidden=false;$('changeImageBtn').hidden=true;$('dropzone').classList.remove('has-image');$('fileMeta').textContent=msg||'Chưa có ảnh được chọn.';updateModelUI();}
function onResult(result){
  if(!result||!LABELS.some(x=>x.id===result.label)||!result.probabilities) throw Error('Mô hình trả về nhãn hoặc xác suất không hợp lệ.');
  const item=LABELS.find(x=>x.id===result.label);
  $('predLabel').textContent=item.vi;$('predEnglish').textContent=item.id;$('predIcon').textContent=item.icon;
  $('resultModelName').textContent=state.model==='improved'?'SVM cải tiến':'Baseline';
  const confidence=Number(result.confidence);
  $('confidencePct').textContent=Number.isFinite(confidence)?(confidence*100).toFixed(1)+'%':'—';
  $('recommendationText').textContent=item.guide;
  const scores=LABELS.map(o=>({info:o,value:Math.max(0,Math.min(1,Number(result.probabilities[o.id])||0))})).sort((a,b)=>b.value-a.value);
  const parent=$('probabilityBars');parent.replaceChildren();
  for(const {info,value} of scores){const row=document.createElement('div');row.className='proba-row';const label=document.createElement('span');label.className='proba-name';label.textContent=info.id;const track=document.createElement('div');track.className='bar-track';const fill=document.createElement('div');fill.className='bar-fill'+(info.id===result.label?' is-leading':'');fill.style.width=(value*100).toFixed(2)+'%';track.append(fill);const valueText=document.createElement('span');valueText.className='proba-value';valueText.textContent=(value*100).toFixed(1)+'%';row.append(label,track,valueText);parent.append(row);}
  $('uncertaintyWarning').hidden=!(confidence<.55||(scores.length>1&&scores[0].value-scores[1].value<.12));
  showSection('resultData');
}
function ensureWorker(){if(state.worker) return state.worker;const worker=new Worker('./worker.js');state.worker=worker;worker.onmessage=(ev)=>{
  const data=ev.data||{};if(data.id!==state.requestId) return;
  if(data.type==='status'){$('loadingTitle').textContent=data.title;$('loadingDetail').textContent=data.detail;setStatus(data.title,'missing');}
  else if(data.type==='result') {state.processing=false;try{onResult(data.result);setStatus('Phân tích hoàn tất. Mọi xử lý đều diễn ra trong trình duyệt.','ready');}catch(ex){showError(ex.message);}updateModelUI();}
  else if(data.type==='error'){state.processing=false;showError(data.message);updateModelUI();}
};worker.onerror=(ev)=>{state.processing=false;showError('Bộ xử lý AI gặp lỗi. Hãy tải lại trang và kiểm tra Internet. '+(ev.message||''));updateModelUI();};return worker;}
function showError(message){$('errorMessage').textContent=message;showSection('resultError');setStatus('Lỗi chạy mô hình. Xem chi tiết bên phải.','error');}
async function analyze(){if(!state.imageFile||state.processing) return;const hasModel=state.models[state.model]||state.uploaded[state.model];if(!hasModel){updateModelUI();return;}state.processing=true;$('analyzeBtn').disabled=true;showSection('resultLoading');$('loadingTitle').textContent='Đang chuẩn bị xử lý...';$('loadingDetail').textContent='Nếu đây là lần đầu, hệ thống cần tải thư viện Python từ CDN (có thể tốn dung lượng).';
  const id=++state.requestId;
  try {const imageBytes=await state.imageFile.arrayBuffer();let modelBytes=null;if(state.uploaded[state.model]) modelBytes=await state.uploaded[state.model].arrayBuffer();const payload={type:'predict',id,slot:state.model,imageBytes,modelBytes};const transfers=[imageBytes];if(modelBytes) transfers.push(modelBytes);ensureWorker().postMessage(payload,transfers);}catch(ex){state.processing=false;showError(ex.message||String(ex));updateModelUI();}
}
async function readManifest(){try{const response=await fetch('./models/manifest.json',{cache:'no-store'});if(!response.ok)throw Error('manifest');const m=await response.json();if(m.models && typeof m.models==='object'){state.models.baseline=Boolean(m.models.baseline);state.models.improved=Boolean(m.models.improved);}}catch(ex){state.models={baseline:false,improved:false};}updateModelUI();}
function init(){
  $('categoryGrid').replaceChildren(...LABELS.map(item=>{const card=document.createElement('div');card.className='category-item';const icon=document.createElement('div');icon.className='category-emoji';icon.textContent=item.icon;const name=document.createElement('h3');name.textContent=item.vi;const en=document.createElement('p');en.textContent=item.id;card.append(icon,name,en);return card;}));
  document.querySelectorAll('.side-nav').forEach(b=>b.addEventListener('click',()=>changeView(b.dataset.nav)));
  document.querySelectorAll('.model-tab').forEach(b=>b.addEventListener('click',()=>{if(!state.processing){state.model=b.dataset.model;showSection('resultEmpty');updateModelUI();}}));
  const zone=$('dropzone');zone.addEventListener('click',ev=>{if(ev.target===$('changeImageBtn'))return;$('imageInput').click();});
  zone.addEventListener('keydown',ev=>{if((ev.key==='Enter'||ev.key===' ')&&!state.processing){ev.preventDefault();$('imageInput').click();}});
  $('changeImageBtn').addEventListener('click',ev=>{ev.stopPropagation();$('imageInput').click();});
  $('imageInput').addEventListener('change',ev=>{if(ev.target.files[0])setupImage(ev.target.files[0]);ev.target.value='';});
  ['dragenter','dragover'].forEach(type=>zone.addEventListener(type,ev=>{ev.preventDefault();zone.classList.add('is-dragging');}));
  ['dragleave','dragend','drop'].forEach(type=>zone.addEventListener(type,ev=>{ev.preventDefault();zone.classList.remove('is-dragging');}));
  zone.addEventListener('drop',ev=>{if(ev.dataTransfer.files[0])setupImage(ev.dataTransfer.files[0]);});
  $('modelUpload').addEventListener('change',ev=>{const file=ev.target.files[0];if(!file)return;if(!file.name.toLowerCase().endsWith('.joblib')){alert('Chỉ nhận tệp .joblib.');return;}if(file.size>200*1024*1024){alert('Mô hình lớn hơn giới hạn 200 MB.');return;}if(!confirm('Chỉ nạp .joblib do đội tự huấn luyện hoặc nguồn đáng tin cậy. Tệp joblib có thể chứa mã thực thi. Tiếp tục?'))return;state.uploaded[state.model]=file;state.worker?.terminate();state.worker=null;updateModelUI();ev.target.value='';});
  $('analyzeBtn').addEventListener('click',analyze);readManifest();
}
document.addEventListener('DOMContentLoaded',init);
