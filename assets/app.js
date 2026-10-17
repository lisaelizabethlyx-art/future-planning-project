import { checkCopy, checkLanguages, checkImage } from './validation.js';
import { translations, projects, career, growthTasks, scenarios } from './content.js';
import { classifyMail, releaseReadiness, releaseSteps, mockMails } from './workflows.js';
const $ = id => document.getElementById(id);
let language = 'zh', route = 'overview', projectFilter = 'all', labTab = 'checker', currentCase = null;
let reportData = null, runId = 0, mailFilter = 'all';
let handled = new Set(), releaseCompleted = new Set(['scope', 'assets']);
const storageKey = 'yixin-workspace-v1';
let state = { tasks: [], reflection: '' }, storageAvailable = true;
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (stored && typeof stored === 'object') state = {
    tasks: Array.isArray(stored.tasks) ? stored.tasks.filter(id => growthTasks.some(task => task.id === id)) : [],
    reflection: typeof stored.reflection === 'string' ? stored.reflection : ''
  };
} catch { storageAvailable = false; }
const t = (zh,en) => language === 'zh' ? zh : en;
const pick = value => value[language === 'zh' ? 0 : 1];
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let toastTimeout;
function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('toast').classList.remove('visible'), 3500); }
function saveState() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('save-status').textContent = storageAvailable ? t('已保存在本机浏览器', 'Saved in this browser') : t('无法保存到浏览器；请导出记录，以免丢失。', 'Browser storage unavailable. Export your notes to keep them.');
}
function art(project) {
 const top = `<div class="visual-top"><span>${project.id === 'ps' ? 'PUBLISHING TOOLKIT' : project.id === 'mail' ? 'INBOX / ROUTING SYSTEM' : project.id === 'release' ? 'ORBIT GARDEN / RELEASE PLAN' : project.id === 'knowledge' ? 'KNOWLEDGE / PLAYBOOKS' : 'CONFIGURATION / VALIDATION'}</span><span>↗</span></div>`;
 let body;
 if (['core','copy'].includes(project.id)) body = '<div class="spec-window"><div class="window-header"><span>delivery.check</span><span class="window-dots">● ● ●</span></div><div class="spec-line"><span>copy.length</span><span class="ok">PASS</span></div><div class="spec-line"><span>locale.coverage</span><span class="warn">REVIEW</span></div><div class="spec-line"><span>asset.dimensions</span><span class="ok">PASS</span></div></div>';
 else if(project.id === 'mail') body = '<div class="mock-mails"><div class="mock-mail"><i>↗</i><span>Action required: deadline</span><b>P0</b></div><div class="mock-mail"><i>⌁</i><span>Review feedback</span><b>P1</b></div><div class="mock-mail"><i>≋</i><span>Weekly digest</span><b>P2</b></div></div>';
 else if(project.id === 'ps') body = '<div class="visual-code"><span>const</span> workflow = {<br>&nbsp; collect: <em>"observe"</em>,<br>&nbsp; validate: <em>"check"</em>,<br>&nbsp; confirm: <em>"human"</em><br>};</div>';
 else if(project.id === 'release') body = '<div class="mock-steps"><div><small>01 / PLAN</small>Scope<br>confirmed ✓</div><div><small>02 / REVIEW</small>Dependencies<br>visible ⌁</div><div><small>03 / HANDOFF</small>Ready<br>to deliver ↗</div></div>';
 else body = '<div class="spec-window"><div class="window-header">TEAM PLAYBOOK / 001</div><div class="spec-line">01 · Prerequisites ↗</div><div class="spec-line">02 · Steps & checkpoints</div><div class="spec-line">03 · Exceptions & handoff</div></div>';
 return `<div class="project-art art-${project.art}" aria-hidden="true">${top}${body}<div class="visual-bottom"><span>${project.id==='mail'?'CLASSIFY → ROUTE → REVIEW':project.id==='release'?'PLAN → CHECK → DELIVER':'BUSINESS KNOWLEDGE, MADE EXECUTABLE.'}</span><span>✳︎</span></div></div>`;
}
function projectCard(project) {
 return `<article class="project-card"><button data-case="${project.id}" aria-label="${esc(t('查看案例：','View case: ')+pick(project.name))}">${art(project)}<div class="project-meta"><span>${project.label}</span><span>${t('案例档案','FIELD NOTES')}</span></div><h3>${pick(project.name)}<span>↗</span></h3><p>${pick(project.summary)}</p><div class="project-tags">${project.tags.map(tag=>`<span>${tag}</span>`).join('')}</div></button></article>`;
}
function renderProjects() {
 $('featured-projects').innerHTML = projects.slice(0,2).map(projectCard).join('');
 const visible = projects.filter(project => projectFilter === 'all' || project.category === projectFilter);
 $('project-grid').innerHTML = visible.map(projectCard).join('');
 $('project-count').textContent = `${String(visible.length).padStart(2,'0')} ${t('项案例','PROJECTS')}`;
 document.querySelectorAll('[data-filter]').forEach(button=>{button.classList.toggle('active',button.dataset.filter===projectFilter);button.setAttribute('aria-pressed',String(button.dataset.filter===projectFilter));});
 $('career-timeline').innerHTML = career.map(item=>`<article class="career-item"><small>${item.date}</small><h3>${pick(item.title)}</h3><p>${pick(item.text)}</p></article>`).join('');
}
function renderCase(id) {
 const project = projects.find(p=>p.id===id); if(!project) return;
 currentCase = id;
 $('case-body').innerHTML = `<article class="case-content"><p class="eyebrow">${project.label}</p><h2 id="case-title">${pick(project.name)}</h2><p class="case-lead">${pick(project.summary)}</p>${art(project)}<div class="case-sections">${[
 [t('01 / 问题背景','01 / CONTEXT'),project.problem], [t('02 / 方案与取舍','02 / APPROACH'),project.approach], [t('03 / 成果与证据','03 / EVIDENCE'),project.result], [t('04 / 可迁移的经验','04 / TAKEAWAYS'),project.lesson]
 ].map(([heading,body])=>`<section><h3>${heading}</h3><p>${pick(body)}</p></section>`).join('')}</div><p class="case-boundary">${t('资料来源：用户提供的简历与项目总结。贡献范围及 AI 参与方式仍需补充确认；本页不公开公司代码、非公开规格或真实业务数据。','Source: the supplied résumé and project summaries. Individual contribution and AI involvement still need clarification. No company code, restricted specifications, or real operational data are published.')}</p>${project.demo?`<a class="button primary" data-close-dialog href="#lab/${project.demo}">${t('体验独立制作的模拟演示','Try the independently built demo')} ↗</a>`:''}</article>`;
}
document.addEventListener('click',event=>{
 const caseButton = event.target.closest('[data-case]');
 if(caseButton) { renderCase(caseButton.dataset.case); $('case-dialog').showModal(); }
 if(event.target.closest('[data-close-dialog]')) $('case-dialog').close();
});
$('close-case').addEventListener('click',()=> $('case-dialog').close());
$('case-dialog').addEventListener('click',event=> { if(event.target === $('case-dialog')) { const r=$('case-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) $('case-dialog').close(); } });
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{projectFilter=button.dataset.filter;renderProjects();}));
function setLabTab(tab) {
 labTab = ['checker','mail','release'].includes(tab) ? tab : 'checker';
 document.querySelectorAll('[data-lab]').forEach(button=>{
  const selected=button.dataset.lab===labTab;
  button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
  $(`panel-${button.dataset.lab}`).hidden=!selected;
 });
}
document.querySelectorAll('[data-lab]').forEach(button=>button.addEventListener('click',()=>{setLabTab(button.dataset.lab);history.replaceState(null,'',`#lab/${labTab}`);}));
document.querySelector('.lab-tabs').addEventListener('keydown',event=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
 event.preventDefault();const tabs=['checker','mail','release'];let index=tabs.indexOf(labTab);
 index=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:-1)+3)%3;
 setLabTab(tabs[index]);$(`tab-${labTab}`).focus();history.replaceState(null,'',`#lab/${labTab}`);
});
function navigate() {
 const [requested,tab] = location.hash.slice(1).split('/');
 route = ['overview','projects','lab','growth'].includes(requested) ? requested : 'overview';
 document.querySelectorAll('.view').forEach(view=>view.hidden=view.id!==`view-${route}`);
 document.querySelectorAll('[data-route]').forEach(link=>{const active=link.dataset.route===route;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 $('crumb').textContent=pick(translations[route]);
 document.title=`${pick(translations[route])} — Yixin Liang`;
 if(route==='lab') setLabTab(tab || labTab);
 if(route!=='growth') { stopTimer(); if('speechSynthesis' in window) speechSynthesis.cancel(); }
 window.scrollTo({top:0,behavior:'instant'}); $('main').focus({preventScroll:true});
}
window.addEventListener('hashchange',navigate);
function renderReport() {
 if(!reportData) {
 $('report').innerHTML=`<div class="empty-report"><div class="empty-symbol">{ ✓ }</div><h3>${t('把不确定，变成检查项。','Turn uncertainty into a checklist.')}</h3><p>${t('载入示例或输入自己的内容，查看通过、需处理与未执行的结果。','Load the example or enter content to see passed, needs attention, and unrun checks.')}</p></div>`;return;
 }
 const data=reportData;
 const rows=[
 {state:data.copy.pass?'pass':'fail',title:t('文案长度','Copy length'),detail:data.copy.empty?t('文案为空，请补充内容。','Copy is empty. Add some text.'):`${data.copy.count} / ${data.copy.limit} ${data.unit==='bytes'?t('UTF-8 字节','UTF-8 bytes'):t('Unicode 码点','Unicode code points')}`},
 {state:data.languages.pass?'pass':'fail',title:t('语言覆盖','Language coverage'),detail:data.languages.pass?t('示例必需语言均已提供。','All example required languages are present.'):t('缺少：','Missing: ')+data.languages.missing.join(', ')},
 {state:data.image.state,title:t('图片素材','Image asset'),detail:data.image.error?t('无法读取图片，请选择有效的 PNG/JPEG/WebP 图片（不超过 5 MiB）。','Unable to read image. Select a valid PNG/JPEG/WebP file up to 5 MiB.'):data.image.state==='skip'?t('未选择图片，此项未执行。','No image selected. This check was not run.'):`${data.image.width} × ${data.image.height} px · ${(data.image.size/1024/1024).toFixed(2)} MiB`+(data.image.state==='fail'?t('；未满足示例要求。','; does not meet the example rules.'):'')}
 ];
 $('report').innerHTML=rows.map(row=>`<div class="result-row"><span class="badge ${row.state}">${row.state==='pass'?t('通过','Passed'):row.state==='fail'?t('需处理','Needs attention'):t('未执行','Not run')}</span><strong>${row.title}</strong><p>${esc(row.detail)}</p></div>`).join('');
}
$('sample').addEventListener('click',()=>{ $('copy').value='新的冒险，即刻启程。';$('limit').value='20';$('unit').value='bytes';$('languages').value='en-US, zh-CN';$('image').value='';toast(t('已载入示例，点击运行检查。','Example loaded. Run the checks.')); });
async function readImage(file) {
 if(!file) return {state:'skip'};
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024) return {state:'fail',error:true};
 const url=URL.createObjectURL(file);
 try { const img=new Image();img.src=url;await img.decode();const details={type:file.type,size:file.size,width:img.naturalWidth,height:img.naturalHeight};return {...details,state:checkImage(details).pass?'pass':'fail'}; }
 catch {return {state:'fail',error:true};}finally{URL.revokeObjectURL(url);}
}
$('checker-form').addEventListener('submit',async event=>{
 event.preventDefault();const currentRun=++runId;const unit=$('unit').value;
 const data={copy:checkCopy($('copy').value,Number($('limit').value),unit),unit,languages:checkLanguages($('languages').value),image:await readImage($('image').files[0])};
 if(currentRun!==runId)return;reportData=data;renderReport();
});
function renderMail() {
 $('mail-stats').innerHTML=[['P0',t('需优先处理','Priority actions')],['P1',t('审核待跟进','Review follow-ups')],['P2',t('常规信息','Routine information')]].map(([priority,label])=>`<div class="mail-stat"><strong>${mockMails.filter(mail=>classifyMail(mail.subject)===priority&&!handled.has(mail.id)).length}</strong>${priority} / ${label}</div>`).join('');
 const mails=mockMails.filter(mail=>mailFilter==='all'||classifyMail(mail.subject)===mailFilter);
 $('mail-list').innerHTML=mails.map(mail=>`<article class="mail-item ${handled.has(mail.id)?'mail-done':''}"><div class="mail-avatar">${mail.initial}</div><div class="mail-item-content"><small>${mail.from} · ${mail.time}</small><h3>${mail.subject}</h3><p>${pick(mail.description)}</p><small><span class="priority ${classifyMail(mail.subject)}">${classifyMail(mail.subject)}</span>${t('模拟消息 · 关键词规则','Synthetic message · Keyword rules')}</small></div><button data-handle-mail="${mail.id}" aria-pressed="${handled.has(mail.id)}">${handled.has(mail.id)?t('已处理 ✓','Handled ✓'):t('标记处理','Mark handled')}</button></article>`).join('');
 document.querySelectorAll('[data-mail-filter]').forEach(button=>{button.classList.toggle('active',button.dataset.mailFilter===mailFilter);button.setAttribute('aria-pressed',String(button.dataset.mailFilter===mailFilter));});
}
$('mail-filters').addEventListener('click',event=>{const button=event.target.closest('[data-mail-filter]');if(button){mailFilter=button.dataset.mailFilter;renderMail();}});
$('mail-list').addEventListener('click',event=>{const button=event.target.closest('[data-handle-mail]');if(button){const id=Number(button.dataset.handleMail);handled.has(id)?handled.delete(id):handled.add(id);renderMail();$('mail-list').querySelector(`[data-handle-mail="${id}"]`)?.focus();}});
$('reset-mail').addEventListener('click',()=>{handled.clear();mailFilter='all';renderMail();});
function renderRelease() {
 const result=releaseReadiness(releaseCompleted);
 $('release-list').innerHTML=releaseSteps.map((step,index)=>{
  const status=result.states[step.id];
  return `<label class="release-task"><input type="checkbox" data-release="${step.id}" ${releaseCompleted.has(step.id)?'checked':''}><div><h3>${String(index+1).padStart(2,'0')} / ${pick(step.title)}</h3><p>${pick(step.detail)}</p><span class="badge ${status==='done'?'pass':status==='blocked'?'fail':'skip'}">${status==='done'?t('已就绪','Ready'):status==='blocked'?t('前置依赖未完成','Dependency incomplete'):t('待完成','Pending')}</span></div></label>`;
 }).join('');
 $('release-summary').innerHTML=`<p class="eyebrow">ORBIT GARDEN / READINESS</p><strong>${result.percent}<small>%</small></strong><div class="progress-track"><div style="width:${result.percent}%"></div></div><h3>${result.ready?t('依赖已齐备，等待人工确认','Dependencies complete. Human confirmation next.'):t('上线前，还有事项需要闭环。','There are still open items before handoff.')}</h3><p>${t('有效完成','Effectively complete')}: ${result.done} / ${releaseSteps.length}</p><p>${t('只有前置依赖也已完成，任务才计入就绪进度。勾选不能代替真实评审和最终决定。','A task counts only when its dependencies are complete too. Checkmarks do not replace real review or the final decision.')}</p>`;
}
$('release-list').addEventListener('change',event=>{const id=event.target.dataset.release;if(id){event.target.checked?releaseCompleted.add(id):releaseCompleted.delete(id);renderRelease();$('release-list').querySelector(`[data-release="${id}"]`).focus();}});
$('reset-release').addEventListener('click',()=>{releaseCompleted=new Set(['scope','assets']);renderRelease();});
function renderGrowth() {
 $('roadmap').innerHTML=growthTasks.map(task=>`<label class="task-check ${state.tasks.includes(task.id)?'done':''}"><input type="checkbox" data-task="${task.id}" ${state.tasks.includes(task.id)?'checked':''}><span><strong>${pick(task.title)}</strong><small>${pick(task.detail)}</small></span></label>`).join('');
 $('progress-count').textContent=`${state.tasks.length} / ${growthTasks.length}`;
 $('progress-fill').style.width=`${state.tasks.length/growthTasks.length*100}%`;
}
$('roadmap').addEventListener('change',event=>{const id=event.target.dataset.task;if(!id)return;state.tasks=event.target.checked?[...new Set([...state.tasks,id])]:state.tasks.filter(task=>task!==id);saveState();renderGrowth();$('roadmap').querySelector(`[data-task="${id}"]`).focus();});
$('reflection').value=state.reflection;
$('reflection').addEventListener('input',()=>{state.reflection=$('reflection').value;saveState();});
$('reset-progress').addEventListener('click',()=>{
 if(!confirm(t('重置六项任务的勾选进度？学习笔记会保留。','Reset the six task checkmarks? Your learning notes will be kept.')))return;
 state.tasks=[];saveState();renderGrowth();toast(t('已重置勾选进度，笔记已保留。','Checkmarks reset. Notes kept.'));
});
$('export-notes').addEventListener('click',()=>{
 const text=`# Yixin / Growth workspace\n\n${growthTasks.map(task=>`- [${state.tasks.includes(task.id)?'x':' '}] ${pick(task.title)}`).join('\n')}\n\n## ${t('学习笔记','Learning notes')}\n\n${state.reflection}\n`;
 const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='yixin-growth-notes.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(t('已导出 Markdown 记录。','Markdown notes exported.'));
});
function renderScenario() {
 const scenario=scenarios[$('scenario').value];
 $('scenario-content').innerHTML=`<p class="scenario-prompt">${pick(scenario.prompt)}</p><p class="scenario-help">${pick(scenario.help)}</p>`;
 $('phrase-list').innerHTML=scenario.phrases.map(([en,zh])=>`<div class="phrase-item"><strong>${en}</strong><small>${language==='zh'?zh:t('表达提示','Use this as a starting point for your own words.')}</small></div>`).join('');
 $('speech-status').textContent='';
}
let timer=null,timerEnd=0,remaining=60;
function updateTimerDisplay(){ $('timer-display').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`; $('timer-start').textContent=timer?t('暂停练习','Pause practice'):remaining===0?t('再练习一次','Practice again'):remaining<60?t('继续练习','Resume practice'):pick(translations.startPractice); }
function stopTimer(){ if(timer){remaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));clearInterval(timer);timer=null;}updateTimerDisplay(); }
function resetTimer(){stopTimer();remaining=60;updateTimerDisplay();}
$('timer-start').addEventListener('click',()=>{
 if(timer){stopTimer();return;}
 if(remaining===0)remaining=60;
 timerEnd=Date.now()+remaining*1000;
 timer=setInterval(()=>{remaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));if(remaining===0){clearInterval(timer);timer=null;toast(t('练习结束，记下一个想改进的地方。','Practice complete. Note one thing to improve.'));}updateTimerDisplay();},200);updateTimerDisplay();
});
$('timer-reset').addEventListener('click',resetTimer);
$('scenario').addEventListener('change',()=>{resetTimer();if('speechSynthesis' in window)speechSynthesis.cancel();renderScenario();});
$('listen').addEventListener('click',()=>{
 if(!('speechSynthesis' in window)){ $('speech-status').textContent=t('当前浏览器不支持示例发音。','Speech synthesis is unavailable.');return; }
 speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(scenarios[$('scenario').value].example);utterance.lang='en-US';utterance.rate=.9;
 utterance.onstart=()=>{$('speech-status').textContent=t('正在播放…','Playing…');};
 utterance.onend=()=>{$('speech-status').textContent=t('播放完成','Finished');};
 utterance.onerror=()=>{$('speech-status').textContent=t('播放不可用，请直接朗读示例表达。','Playback unavailable. Read the expressions aloud.');};
 $('speech-status').textContent=t('正在请求语音…','Requesting speech…');speechSynthesis.speak(utterance);
});
function translatePage() {
 document.documentElement.lang=language==='zh'?'zh-CN':'en';
 document.querySelectorAll('[data-i18n]').forEach(element=>{const value=translations[element.dataset.i18n];if(value)element.innerHTML=pick(value);});
 $('language').textContent=language==='zh'?'中文 / EN ↗':'EN / 中文 ↗';$('language').setAttribute('aria-label',language==='zh'?'Switch to English':'切换为中文');
 $('crumb').textContent=pick(translations[route]);document.title=`${pick(translations[route])} — Yixin Liang`;
 renderProjects();renderReport();renderMail();renderRelease();renderGrowth();renderScenario();updateTimerDisplay();
 if($('case-dialog').open&&currentCase)renderCase(currentCase);
 if(!storageAvailable)$('save-status').textContent=t('无法保存到浏览器；请导出记录。','Browser storage unavailable. Export your notes.');
}
$('language').addEventListener('click',()=>{language=language==='zh'?'en':'zh';translatePage();});
translatePage();navigate();
