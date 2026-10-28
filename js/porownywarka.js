"use strict";
// AeroStat: porównanie 2–3 lotnisk w wybranym zakresie lat, rocznie lub kwartalnie.
(() => {
  const $ = id => document.getElementById(id);
  const airports = [1, 2, 3].map(i => $(`por-airport-${i}`));
  const metricSelect = $('por-metric');
  const metricLabel = () => metricSelect.value === 'operacje' ? 'Liczba operacji pasażerskich' : 'Liczba pasażerów';
  const from = $('por-from'), to = $('por-to'), granularity = $('por-granularity');
  const status = $('por-status'), svg = $('por-chart'), legend = $('por-legend');
  const tableHead = $('por-table-head'), tableBody = $('por-table-body');
  const download = $('por-download');
  const colors = ['#1763aa', '#e07a22', '#148579'];
  const number = new Intl.NumberFormat('pl-PL');
  let data = [], current = null;

  function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    const headers = lines.shift().split(';').map(s => s.trim());
    for (const k of ['port_lotniczy','rok','kwartal','liczba_pasazerow','liczba_operacji_pasazerskich']) {
      if (!headers.includes(k)) throw new Error(`Brak kolumny: ${k}`);
    }
    return lines.filter(Boolean).map(line => {
      const cols = line.split(';');
      const raw = Object.fromEntries(headers.map((h,i) => [h, (cols[i]||'').trim()]));
      return {airport:raw.port_lotniczy, year:Number(raw.rok), quarter:Number(raw.kwartal), pasazerowie:raw.liczba_pasazerow === '' ? null : Number(raw.liczba_pasazerow), operacje:raw.liczba_operacji_pasazerskich === '' ? null : Number(raw.liczba_operacji_pasazerskich)};
    }).filter(d => d.airport && Number.isInteger(d.year) && d.quarter >= 1 && d.quarter <= 4 &&
      [d.pasazerowie,d.operacje].every(v => v === null || (Number.isFinite(v) && v >= 0)));
  }
  function option(value, title) { const o=document.createElement('option'); o.value=String(value); o.textContent=title; return o; }
  function populate() {
    const names = [...new Set(data.map(d=>d.airport))].sort((a,b)=>a.localeCompare(b,'pl'));
    const years = [...new Set(data.map(d=>d.year))].sort((a,b)=>a-b);
    airports.forEach((select,i) => {
      select.replaceChildren();
      if (i===2) select.append(option('','Bez trzeciego lotniska'));
      names.forEach(name=>select.append(option(name,name)));
    });
    airports[0].value=names.includes('Lotnisko Chopina w Warszawie')?'Lotnisko Chopina w Warszawie':names[0];
    airports[1].value=names.includes('Kraków - Balice')?'Kraków - Balice':names[1];
    airports[2].value='';
    from.replaceChildren(...years.map(y=>option(y,y)));
    to.replaceChildren(...years.map(y=>option(y,y)));
    from.value=String(Math.max(years[0],years.at(-1)-5)); to.value=String(years.at(-1));
    [...airports,from,to,granularity,metricSelect].forEach(el=>el.addEventListener('change',render));
    download.addEventListener('click',exportCSV);
    render();
  }
  const escapeCSV = v => `"${String(v).replaceAll('"','""')}"`;
  function exportCSV() {
    if(!current) return;
    const lines=[[`Okres (${metricLabel()})`,...current.names].map(escapeCSV).join(';')];
    for (let i=0;i<current.periods.length;i++) {
      lines.push([current.periods[i].label,...current.series.map(s=>s.values[i]===null?'':s.values[i])].map(escapeCSV).join(';'));
    }
    const csv='\uFEFF'+lines.join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download=`AeroStat_porownanie_${from.value}-${to.value}_${granularity.value}_${metricSelect.value}.csv`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function periodsBetween(start,end,quarterly) {
    const periods=[];
    for(let y=start;y<=end;y++) {
      if(quarterly) for(let q=1;q<=4;q++) periods.push({year:y,quarter:q,label:`${y} Q${q}`});
      else periods.push({year:y,quarter:null,label:String(y)});
    }
    return periods;
  }
  function buildSeries(names,periods,quarterly) {
    const indexed=new Map();
    for(const row of data) indexed.set(`${row.airport}|${row.year}|${row.quarter}`,row[metricSelect.value]);
    let incomplete=0;
    const series=names.map((name,j)=>({name,color:colors[j],values:periods.map(p=>{
      if(quarterly) return indexed.get(`${name}|${p.year}|${p.quarter}`)??null;
      const values=[1,2,3,4].map(q=>indexed.get(`${name}|${p.year}|${q}`));
      if(values.some(v=>v===undefined || v===null)) { if(values.some(v=>v!==undefined && v!==null)) incomplete++;return null; }
      return values.reduce((sum,v)=>sum+v,0);
    })}));
    return {series,incomplete};
  }
  function node(type,attrs={},value) {
    const el=document.createElementNS('http://www.w3.org/2000/svg',type);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    if(value!==undefined)el.textContent=value;
    return el;
  }
  function chart(periods,series) {
    svg.replaceChildren();
    svg.setAttribute('aria-label', `Wykres: ${metricLabel().toLowerCase()}`);
    const w=900,h=370,left=95,right=28,top=25,bottom=74;
    const plotW=w-left-right,plotH=h-top-bottom;
    const vals=series.flatMap(s=>s.values).filter(v=>v!==null);
    if(!vals.length) {
      svg.append(node('text',{x:w/2,y:h/2,'text-anchor':'middle',fill:'#4f6380'},'Brak danych w wybranym zakresie'));
      return;
    }
    const ymax=Math.max(...vals)*1.12||1;
    const y=v=>top+plotH*(1-v/ymax);
    const x=i=>left+(periods.length===1?plotW/2:i*plotW/(periods.length-1));
    for(let i=0;i<=4;i++) {
      const value=ymax*i/4,Y=y(value);
      svg.append(node('line',{x1:left,y1:Y,x2:w-right,y2:Y,stroke:'#d6e3ee','stroke-width':1}));
      svg.append(node('text',{x:left-10,y:Y+4,'text-anchor':'end','font-size':12,fill:'#526784'},number.format(Math.round(value))));
    }
    const interval=Math.max(1,Math.ceil(periods.length/9));
    periods.forEach((p,i)=>{
      if(i%interval!==0 && i!==periods.length-1)return;
      svg.append(node('text',{x:x(i),y:h-bottom+25,'text-anchor':'middle','font-size':12,fill:'#526784'},p.label));
    });
    series.forEach(s=>{
      // Nie łączymy linii przez brakujące okresy.
      let segment=[];
      const drawSegment=()=>{
        if(segment.length>1)svg.append(node('polyline',{points:segment.map(p=>p.join(',')).join(' '),fill:'none',stroke:s.color,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));
        segment=[];
      };
      s.values.forEach((v,i)=>{
        if(v===null) {drawSegment();return;}
        segment.push([x(i),y(v)]);
        const circle=node('circle',{cx:x(i),cy:y(v),r:periods.length>24?3:4,fill:s.color,stroke:'#fff','stroke-width':1.5});
        circle.append(node('title',{},`${s.name} — ${periods[i].label}: ${number.format(v)} — ${metricLabel().toLowerCase()}`));
        svg.append(circle);
      });drawSegment();
    });
    svg.append(node('text',{x:17,y:h/2,transform:`rotate(-90 17 ${h/2})`,'text-anchor':'middle','font-size':12,fill:'#526784'},metricLabel()));
  }
  function render() {
    const names=airports.map(s=>s.value).filter(Boolean);
    const start=Number(from.value),end=Number(to.value),quarterly=granularity.value==='quarter';
    current=null;download.disabled=true;
    if(new Set(names).size!==names.length) {status.textContent='Wybierz różne lotniska (bez powtórzeń).';svg.replaceChildren();tableBody.replaceChildren();legend.replaceChildren();return;}
    if(start>end){status.textContent='Rok początkowy nie może być późniejszy niż końcowy.';svg.replaceChildren();tableBody.replaceChildren();legend.replaceChildren();return;}
    const periods=periodsBetween(start,end,quarterly);
    const {series,incomplete}=buildSeries(names,periods,quarterly);
    const missing=series.reduce((acc,s)=>acc+s.values.filter(v=>v===null).length,0);
    status.textContent=`${metricLabel()}: porównanie ${names.length} lotnisk, ${start}–${end}, dane ${quarterly?'kwartalne':'roczne'}.`+
      (missing?` Brak pełnych danych dla ${missing} pozycji — przerwy na wykresie.`:'')+
      (!quarterly&&incomplete?` ${incomplete} rocznych wartości ma niekompletne kwartały.`:'');
    legend.replaceChildren();
    series.forEach(s=>{const item=document.createElement('span');item.className='por-legend-item';
      const dot=document.createElement('i');dot.style.background=s.color;item.append(dot,document.createTextNode(s.name));legend.append(item);});
    chart(periods,series);
    tableHead.replaceChildren();
    for(const name of ['Okres',...names]) {const th=document.createElement('th');th.textContent=name;tableHead.append(th);}
    tableBody.replaceChildren();
    periods.forEach((p,i)=>{const tr=document.createElement('tr');
      [p.label,...series.map(s=>s.values[i]===null?'Brak danych':number.format(s.values[i]))].forEach(v=>{
        const td=document.createElement('td');td.textContent=v;tr.append(td);
      });tableBody.append(tr);
    });
    current={names,periods,series};download.disabled=false;
  }
  async function init() {
    try {
      const response=await fetch('data/LOTY.csv');
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      data=parseCSV(await response.text());
      if(!data.length)throw new Error('Plik nie zawiera danych');
      populate();
    }catch(e){status.textContent='Nie udało się wczytać data/LOTY.csv. Sprawdź nazwę pliku i uruchom stronę przez Live Server.';console.error(e);}
  }
  init();
})();
