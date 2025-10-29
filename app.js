async function loadJSON(file){const res=await fetch(file+"?_"+Date.now());return await res.json();}
function fmt(n){return new Intl.NumberFormat('he-IL').format(n||0);}
function tableFrom(data){if(!data||!data.length){return '<tr><td>—</td></tr>';}const cols=[...new Set(data.flatMap(o=>Object.keys(o)))];const head='<tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';const rows=data.map(r=>'<tr>'+cols.map(c=>`<td>${r[c]??''}</td>`).join('')+'</tr>').join('');return head+rows;}
function setProgress(id,part,total){const el=document.getElementById(id);if(!el)return;const pct=total>0?Math.min(100,Math.round((part/total)*100)):0;el.style.width=pct+'%';}

function initNav(){const views=['dashboard-view','crm-view','kanban-view'];function show(id){views.forEach(v=>document.getElementById(v).style.display=(v===id?'block':'none'));}document.getElementById('nav-dashboard').onclick=()=>show('dashboard-view');document.getElementById('nav-crm').onclick=()=>show('crm-view');document.getElementById('nav-kanban').onclick=()=>show('kanban-view');}

function parseCSVText(text){const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length===0)return[];const headers=lines.shift().split(',').map(s=>s.trim());return lines.map(line=>{const values=line.split(',');const row={};headers.forEach((h,i)=>row[h]= (values[i]||'').trim());return row;});}
function importCSVFrom(file, cb){const reader=new FileReader();reader.onload=e=>{try{cb(parseCSVText(e.target.result));}catch{alert('שגיאה בפענוח CSV');}};reader.readAsText(file);}

function initKanban(deals){const board=document.getElementById('kanban-board');board.querySelectorAll('.items').forEach(x=>x.innerHTML='');(deals||[]).forEach(d=>{const stage=d.stage||'Discovery';const col=board.querySelector(`.column[data-stage="${stage}"] .items`);if(col){const div=document.createElement('div');div.className='item';div.textContent=`${d.name||''} — ₪${fmt(d.value_ils)}`;div.draggable=true;div.addEventListener('dragstart',()=>div.classList.add('dragging'));div.addEventListener('dragend',()=>div.classList.remove('dragging'));col.appendChild(div);}});board.querySelectorAll('.column').forEach(col=>{col.addEventListener('dragover',e=>{e.preventDefault();const dragging=document.querySelector('.dragging');if(dragging)col.querySelector('.items').appendChild(dragging);});});}

function downloadText(name, text, type='text/plain'){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}

async function main(){initNav();
  const progress=await loadJSON('./progress.json');
  const tasks=await loadJSON('./tasks.json');
  const contacts=await loadJSON('./contacts.json');
  const companies=await loadJSON('./companies.json');
  const deals=await loadJSON('./deals.json');
  const activities=await loadJSON('./activities.json');

  document.getElementById('words-current').textContent=fmt(progress.words_current);
  document.getElementById('words-target').textContent=fmt(progress.words_total_target);
  setProgress('bar-words',progress.words_current,progress.words_total_target);

  const tasksEl=document.getElementById('tasks-table'); tasksEl.innerHTML=tableFrom(tasks);
  document.getElementById('contacts-table').innerHTML=tableFrom(contacts);
  document.getElementById('companies-table').innerHTML=tableFrom(companies);
  const dealsEl=document.getElementById('deals-table'); dealsEl.innerHTML=tableFrom(deals);
  document.getElementById('activities-table').innerHTML=tableFrom(activities);
  initKanban(deals);

  // Quick local updates (not persisted to files; for quick planning)
  document.getElementById('wc-input').addEventListener('change',e=>{progress.words_current=parseInt(e.target.value||'0',10);document.getElementById('words-current').textContent=fmt(progress.words_current);setProgress('bar-words',progress.words_current,progress.words_total_target);localStorage.setItem('progress.json',JSON.stringify(progress));});
  document.getElementById('cd-input').addEventListener('change',e=>{progress.chapters_done=parseInt(e.target.value||'0',10);localStorage.setItem('progress.json',JSON.stringify(progress));});

  // CSV imports
  document.getElementById('import-contacts').addEventListener('change',e=>{const f=e.target.files[0]; if(!f)return; importCSVFrom(f,(rows)=>{document.getElementById('contacts-table').innerHTML=tableFrom(rows);});});
  document.getElementById('import-deals').addEventListener('change',e=>{const f=e.target.files[0]; if(!f)return; importCSVFrom(f,(rows)=>{document.getElementById('deals-table').innerHTML=tableFrom(rows); initKanban(rows);});});

  // Templates
  document.getElementById('download-contacts-template').addEventListener('click',()=>{
    const tpl = 'name,email,phone,role,company,status,tags\nדנה כהן,dana@example.com,+972-50-1234567,פסנתרנית,אקדמיה,Active,פסנתר;מחקר';
    downloadText('contacts_template.csv', tpl, 'text/csv');
  });
  document.getElementById('download-deals-template').addEventListener('click',()=>{
    const tpl = 'name,client,stage,value_ils,due\nסדנת אימון חכם,אקדמיה למוזיקה,Proposal,3500,2025-11-10';
    downloadText('deals_template.csv', tpl, 'text/csv');
  });

  // Export JSON bundle
  document.getElementById('btn-export').addEventListener('click',()=>{
    const lsProg = localStorage.getItem('progress.json');
    const finalProg = lsProg ? JSON.parse(lsProg) : progress;
    const bundle = { 
      "progress.json": finalProg, "tasks.json": tasks, "contacts.json": contacts,
      "companies.json": companies, "deals.json": deals, "activities.json": activities
    };
    downloadText('btk-crm-bundle.json', JSON.stringify(bundle, null, 2), 'application/json');
  });
}
document.addEventListener('DOMContentLoaded', main);