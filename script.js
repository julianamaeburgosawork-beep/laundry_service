const KEY='freshfold-simple-pos-v4';
const SAMPLE_XML_URL='sample-data.xml';
const FALLBACK_SAMPLE_XML=`<?xml version="1.0" encoding="UTF-8"?>
<freshfoldData version="1.0"><sales>
<sale id="s1" date="2026-09-21" amount="2480"/>
<sale id="s2" date="2026-09-22" amount="3120"/>
<sale id="s3" date="2026-09-23" amount="2760"/>
<sale id="s4" date="2026-09-24" amount="3540"/>
<sale id="s5" date="2026-09-25" amount="2980"/>
<sale id="s6" date="2026-09-26" amount="2210"/>
<sale id="s7" date="2026-09-13" amount="1860"/>
<sale id="s8" date="2026-09-14" amount="2040"/>
</sales><expenses>
<expense id="e1" date="2026-09-22" category="Detergent &amp; supplies" description="Weekly detergent restock" amount="650"/>
<expense id="e2" date="2026-09-24" category="Utilities" description="Electricity bill" amount="1180"/>
<expense id="e3" date="2026-09-25" category="Others" description="Small maintenance item" amount="240"/>
<expense id="e4" date="2026-09-26" category="Payroll" description="Part-time staff allowance" amount="520"/>
</expenses></freshfoldData>`;
function sampleXmlDocument(){const embedded=document.getElementById('sampleXmlData');const source=embedded?.textContent?.trim();return new DOMParser().parseFromString(source||FALLBACK_SAMPLE_XML,'application/xml')}
function xmlToData(xml){
 const parserError=xml.querySelector('parsererror'); if(parserError) throw new Error('Invalid sample XML.');
 const rows=[];
 xml.querySelectorAll('sales > sale').forEach(node=>rows.push({id:node.getAttribute('id')||`s${Date.now()}${rows.length}`,type:'sale',date:node.getAttribute('date')||'',amount:Number(node.getAttribute('amount')||0)}));
 xml.querySelectorAll('expenses > expense').forEach(node=>rows.push({id:node.getAttribute('id')||`e${Date.now()}${rows.length}`,type:'expense',date:node.getAttribute('date')||'',category:node.getAttribute('category')||'Others',description:node.getAttribute('description')||'',amount:Number(node.getAttribute('amount')||0)}));
 return rows.filter(x=>x.date && x.amount>0);
}
function getEmbeddedSample(){return xmlToData(sampleXmlDocument());}
const today=new Date();
let data=JSON.parse(localStorage.getItem(KEY)||'null');
if(!Array.isArray(data)){data=getEmbeddedSample();save();}
function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function money(n){return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n)||0)}
function dateObj(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
function dateISO(d){const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)}
function startWeek(d){const x=new Date(d);const day=x.getDay();x.setDate(x.getDate()-(day===0?6:day-1));x.setHours(0,0,0,0);return x}
function endWeek(d){const x=startWeek(d);x.setDate(x.getDate()+6);return x}
function sameMonth(s,d){const x=dateObj(s);return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()}
function inFilter(date,period,reference){const d=dateObj(date), now=new Date();if(period==='all')return true;const ref=reference?dateObj(reference):now;if(period==='week'){const a=startWeek(ref),b=endWeek(ref);return d>=a&&d<=b}if(period==='month'){return sameMonth(date,ref)}return true}
function total(type, list=data){return list.filter(x=>x.type===type).reduce((s,x)=>s+Number(x.amount||0),0)}
function incomeRows(){return data.filter(x=>x.type==='sale').sort((a,b)=>b.date.localeCompare(a.date))}
function expenseRows(){return data.filter(x=>x.type==='expense').sort((a,b)=>b.date.localeCompare(a.date))}
function fillDateDefaults(){const t=dateISO(today);$('saleDate').value=t;$('expenseDate').value=t;$('salesMonth').value=t;$('dashMonth').value=t}
function openSale(){ $('saleModal').classList.remove('hidden'); $('saleModal').setAttribute('aria-hidden','false'); fillDateDefaults(); $('saleAmount').focus(); }
function closeSale(){ $('saleModal').classList.add('hidden'); $('saleModal').setAttribute('aria-hidden','true'); }
function setView(view){document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hidden',v.id!==view));
 const meta={dashboard:['Dashboard','Income, expenses and profit at a glance.'],sales:['Total Sales','Enter one total sales amount per day.'],expenses:['Expenses','Track operating expenses separately.']}[view];$('pageTitle').textContent=meta[0];$('pageSubtitle').textContent=meta[1];$('topAddBtn').textContent=view==='expenses'?'+ Add expense':'+ Add daily sale';
 if(view==='expenses')$('topAddBtn').onclick=()=>document.getElementById('expenseDate').scrollIntoView({behavior:'smooth'});else $('topAddBtn').onclick=openSale;
 renderAll(); }
function renderDashboard(){
 const sales=incomeRows(), expenses=expenseRows();
 $('dashIncome').textContent=money(total('sale'));$('dashExpense').textContent=money(total('expense'));$('dashProfit').textContent=money(total('sale')-total('expense'));$('dashDays').textContent=new Set(sales.map(x=>x.date)).size;
 const byDay={};sales.forEach(x=>byDay[x.date]=(byDay[x.date]||0)+Number(x.amount));const best=Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0];$('dashBestDay').textContent=best?`Busiest: ${best[0]} • ${money(best[1])}`:'No sales yet';
 const type=$('dashType').value, period=$('dashPeriod').value, reference=$('dashMonth').value;
 let rows=data.filter(x=>(type==='all'||(type==='sale'&&x.type==='sale')||(type==='expense'&&x.type==='expense'))&&inFilter(x.date,period,reference)).sort((a,b)=>b.date.localeCompare(a.date));
 const body=$('dashTable');body.innerHTML=rows.length?rows.map(x=>`<tr><td>${x.date}</td><td><span class="pill ${x.type==='expense'?'red':'green'}">${x.type==='sale'?'Daily sale':'Expense'}</span></td><td>${x.type==='sale'?'Total daily sales':`${x.category} — ${x.description}`}</td><td>${money(x.amount)}</td><td><button class="delete" data-delete="${x.id}">Remove</button></td></tr>`).join(''):`<tr><td colspan="5" class="empty">No records match this filter.</td></tr>`;
 drawChart($('dashboardChart'),buildSeries(rows));
}
function buildSeries(rows){
 const dates=[...new Set(rows.map(x=>x.date))].sort(); if(!dates.length){return {labels:[],income:[],expense:[],profit:[]}}
 const map={}; dates.forEach(d=>map[d]={income:0,expense:0}); rows.forEach(x=>map[x.date][x.type==='sale'?'income':'expense']+=Number(x.amount));
 return {labels:dates,income:dates.map(d=>map[d].income),expense:dates.map(d=>map[d].expense),profit:dates.map(d=>map[d].income-map[d].expense)};
}
function renderSales(){
 const period=$('salesPeriod').value, reference=$('salesMonth').value || dateISO(today);
 const rows=incomeRows().filter(x=>inFilter(x.date,period,reference));
 const body=$('salesTable');body.innerHTML=rows.length?rows.map(x=>`<tr><td>${x.date}</td><td>${money(x.amount)}</td><td><button class="delete" data-delete="${x.id}">Remove</button></td></tr>`).join(''):`<tr><td colspan="3" class="empty">No daily sales match this filter.</td></tr>`;
 const weekly=incomeRows().filter(x=>inFilter(x.date,'week',reference)).reduce((s,x)=>s+Number(x.amount),0);
 const monthly=incomeRows().filter(x=>inFilter(x.date,'month',reference)).reduce((s,x)=>s+Number(x.amount),0);
 $('weeklyTotal').textContent=money(weekly);$('monthlyTotal').textContent=money(monthly);
 let label='All dates';
 if(period==='week')label=`Week of ${reference}`;
 if(period==='month'){const [y,m]=reference.split('-').map(Number);label=new Date(y,m-1,1).toLocaleDateString('en-PH',{month:'long',year:'numeric'});}
 $('selectedPeriodLabel').textContent=label;
 $('salesPeriodTotal').value=money(rows.reduce((s,x)=>s+Number(x.amount),0));
 drawChart($('salesChart'),buildSeries(rows));
}
function renderExpenses(){const rows=expenseRows();$('expenseTable').innerHTML=rows.length?rows.map(x=>`<tr><td>${x.date}</td><td><span class="pill red">${x.category}</span></td><td>${x.description}</td><td>${money(x.amount)}</td><td><button class="delete" data-delete="${x.id}">Remove</button></td></tr>`).join(''):`<tr><td colspan="5" class="empty">No expenses recorded yet.</td></tr>`}
function drawChart(canvas,s){const ctx=canvas.getContext('2d'),rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;canvas.width=Math.max(300,rect.width*dpr);canvas.height=Math.max(240,rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);if(!s.labels.length){ctx.fillStyle='#6c8092';ctx.font='12px system-ui';ctx.fillText('No data for this period.',18,30);return}
 const pad={l:46,r:18,t:18,b:42},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;const max=Math.max(1,...s.income,...s.expense,...s.profit);ctx.font='10px system-ui';ctx.textAlign='right';ctx.textBaseline='middle';ctx.strokeStyle='#e8eff5';ctx.fillStyle='#6c8092';for(let i=0;i<=4;i++){const val=max*i/4,y=pad.t+ch-(ch*i/4);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(pad.l+cw,y);ctx.stroke();ctx.fillText(money(val).replace('PHP','₱'),pad.l-7,y)}
 const colors={income:'#1f6feb',expense:'#d94b59',profit:'#1fa463'};const xs=s.labels.length===1?[pad.l+cw/2]:s.labels.map((_,i)=>pad.l+(cw*i/(s.labels.length-1)));
 ['income','expense','profit'].forEach(key=>{ctx.strokeStyle=colors[key];ctx.lineWidth=2.5;ctx.beginPath();s[key].forEach((v,i)=>{const x=xs[i],y=pad.t+ch-(v/max)*ch;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();s[key].forEach((v,i)=>{const x=xs[i],y=pad.t+ch-(v/max)*ch;ctx.fillStyle=colors[key];ctx.beginPath();ctx.arc(x,y,3.2,0,Math.PI*2);ctx.fill()})});
 ctx.fillStyle='#6c8092';ctx.textAlign='center';ctx.textBaseline='top';const step=Math.max(1,Math.ceil(s.labels.length/8));s.labels.forEach((label,i)=>{if(i%step===0||i===s.labels.length-1){const x=xs[i];ctx.fillText(label.slice(5),x,h-pad.b+12)}})
}
function renderAll(){renderDashboard();renderSales();renderExpenses()}
function addSale(e){e.preventDefault();const date=$('saleDate').value,amount=Number($('saleAmount').value);if(!date||!(amount>0))return;const existing=data.find(x=>x.type==='sale'&&x.date===date);if(existing)existing.amount=amount;else data.push({id:'s'+Date.now(),type:'sale',date,amount});save();closeSale();$('saleForm').reset();fillDateDefaults();renderAll();}
function addExpense(e){e.preventDefault();const date=$('expenseDate').value,category=$('expenseCategory').value,description=$('expenseDescription').value.trim(),amount=Number($('expenseAmount').value);if(!date||!description||!(amount>0))return;data.push({id:'e'+Date.now(),type:'expense',date,category,description,amount});save();$('expenseForm').reset();fillDateDefaults();renderAll();}
function remove(id){data=data.filter(x=>x.id!==id);save();renderAll()}

document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('topAddBtn').onclick=openSale;$('dashboardAdd').onclick=openSale;$('salesAdd').onclick=openSale;$('cancelSale').onclick=closeSale;$('closeSale').onclick=closeSale;$('saleForm').addEventListener('submit',addSale);$('expenseForm').addEventListener('submit',addExpense);
$('dashType').addEventListener('change',renderDashboard);$('dashPeriod').addEventListener('change',renderDashboard);$('dashMonth').addEventListener('change',renderDashboard);$('resetDash').addEventListener('click',()=>{$('dashType').value='all';$('dashPeriod').value='all';$('dashMonth').value=dateISO(today);renderDashboard()});
$('salesPeriod').addEventListener('change',renderSales);$('salesMonth').addEventListener('change',renderSales);$('resetSales').addEventListener('click',()=>{$('salesPeriod').value='all';$('salesMonth').value=dateISO(today);renderSales()});
async function loadXmlSample(){
 try{
  let xmlDoc;
  try{const response=await fetch(SAMPLE_XML_URL,{cache:'no-store'});if(!response.ok)throw new Error('XML file unavailable');xmlDoc=new DOMParser().parseFromString(await response.text(),'application/xml');}
  catch(_){xmlDoc=sampleXmlDocument();}
  const sample=xmlToData(xmlDoc); if(!sample.length) throw new Error('No sample records found.');
  data=sample;save();fillDateDefaults();renderAll();
 }catch(error){alert(error.message||'Unable to load sample data.');}
}
$('prototypeBtn').addEventListener('click',loadXmlSample);
document.addEventListener('click',e=>{const id=e.target.dataset.delete;if(id)remove(id)});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSale()});
window.addEventListener('resize',()=>{renderDashboard();renderSales()});fillDateDefaults();renderAll();
