"use strict";

const airportEl = document.querySelector('#season-airport');
const yearEl = document.querySelector('#season-year');
const metricEl = document.querySelector('#season-metric');
const statusEl = document.querySelector('#season-status');
const resultsEl = document.querySelector('#season-results');
const statsEl = document.querySelector('#season-stats');
const barsEl = document.querySelector('#season-bars');
const donutEl = document.querySelector('#season-donut');
const legendEl = document.querySelector('#season-share-legend');
const tableBodyEl = document.querySelector('#season-table-body');
const tableValueEl = document.querySelector('#season-table-value');
const downloadEl = document.querySelector('#season-download');
const nf = new Intl.NumberFormat('pl-PL');
const colors = ['#2b8ad8', '#0d3b6e', '#16b8d9', '#7195d0'];
let records = [];
let current = null;

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const columns = lines.shift().split(';').map(x => x.trim());
  const required = ['port_lotniczy', 'rok', 'kwartal', 'liczba_pasazerow', 'liczba_operacji_pasazerskich'];
  if (!required.every(k => columns.includes(k))) throw new Error('Nieprawidłowe kolumny w LOTY.csv.');
  return lines.filter(line => line.trim()).map(line => {
    const parts = line.split(';');
    const get = key => (parts[columns.indexOf(key)] || '').trim();
    const number = value => value === '' ? null : Number(value);
    return {airport: get('port_lotniczy'), year: Number(get('rok')),
      quarter: Number(get('kwartal')), pasazerowie: number(get('liczba_pasazerow')),
      operacje: number(get('liczba_operacji_pasazerskich'))};
  }).filter(r => r.airport && Number.isInteger(r.year) && Number.isInteger(r.quarter) &&
    r.quarter >= 1 && r.quarter <= 4 &&
    [r.pasazerowie, r.operacje].every(v => v === null || (Number.isFinite(v) && v >= 0)));
}

function addOptions(select, items) {
  select.replaceChildren();
  for (const [value, label] of items) {
    const option = document.createElement('option'); option.value = String(value);
    option.textContent = String(label); select.append(option);
  }
}

function node(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}

function refresh() {
  const airport = airportEl.value;
  const year = Number(yearEl.value);
  const metric = metricEl.value;
  const matching = records.filter(r => r.airport === airport && r.year === year);
  const quarterValues = [1,2,3,4].map(q => {
    const rows = matching.filter(r => r.quarter === q && r[metric] !== null);
    return rows.length === 1 ? rows[0][metric] : null; // Brak lub duplikat = nieznane
  });
  const complete = quarterValues.every(v => v !== null);
  const total = complete ? quarterValues.reduce((a,b)=>a+b,0) : null;
  const shares = complete && total > 0 ? quarterValues.map(v => v / total * 100) : null;
  const available = quarterValues.filter(v => v !== null);
  const metricName = metric === 'operacje' ? 'Operacje lotnicze' : 'Pasażerowie';
  current = {airport, year, metricName, quarterValues, shares};

  resultsEl.hidden = false;
  downloadEl.disabled = false;
  statusEl.textContent = complete ?
    (total > 0 ? `Pełne dane dla roku ${year}.` : `Rok ${year}: wartości wynoszą zero, udział procentowy jest nieokreślony.`) :
    `Uwaga: rok ${year} ma brakujące dane kwartalne. Udziały procentowe nie są obliczane.`;
  statsEl.replaceChildren();
  const maxValue = Math.max(0, ...available);
  const minValue = available.length ? Math.min(...available) : null;
  const stats = [
    ['Wynik roczny', complete ? nf.format(total) : 'Niepełny rok'],
    ['Największy kwartał', maxValue > 0 ? `Q${quarterValues.indexOf(maxValue)+1} · ${nf.format(maxValue)}` : 'Brak danych'],
    ['Najmniejszy kwartał', minValue !== null ? `Q${quarterValues.indexOf(minValue)+1} · ${nf.format(minValue)}` : 'Brak danych']
  ];
  for (const [title,value] of stats) {
    const box = node('div','season-stat');
    box.append(node('span','season-stat-label',title),node('strong','season-stat-value',value));
    statsEl.append(box);
  }

  barsEl.replaceChildren();
  const scale = Math.max(1, ...available);
  quarterValues.forEach((value,i) => {
    const bar = node('div','season-bar-row');
    const label = node('span','season-bar-label',`Q${i+1}`);
    const track = node('div','season-bar-track');
    const fill = node('div','season-bar-fill');
    fill.style.width = value === null ? '0%' : `${value/scale*100}%`;
    fill.style.backgroundColor = colors[i];
    track.append(fill);
    bar.append(label,track,node('span','season-bar-number',value === null ? 'Brak danych' : nf.format(value)));
    barsEl.append(bar);
  });
  barsEl.setAttribute('aria-label',quarterValues.map((v,i)=>`Q${i+1}: ${v === null ? 'brak danych' : nf.format(v)}`).join('; '));

  donutEl.replaceChildren(); legendEl.replaceChildren();
  if (shares) {
    let cursor = 0;
    const segments = shares.map((share,i) => {
      const from=cursor; cursor += share;
      return `${colors[i]} ${from.toFixed(4)}% ${cursor.toFixed(4)}%`;
    });
    donutEl.style.background = `conic-gradient(${segments.join(',')})`;
    donutEl.append(node('span','season-donut-center','100%'));
    shares.forEach((share,i) => {
      const item = node('div','season-legend-item');
      const marker=node('span','season-legend-dot'); marker.style.backgroundColor=colors[i];
      item.append(marker,node('span','',`Q${i+1}: ${share.toFixed(1).replace('.',',')}%`)); legendEl.append(item);
    });
    donutEl.setAttribute('aria-label',shares.map((v,i)=>`Q${i+1}: ${v.toFixed(1)} procent`).join('; '));
  } else {
    donutEl.style.background = 'var(--surface-alt)';
    donutEl.append(node('span','season-donut-center','—'));
    legendEl.append(node('p','',complete ? 'Brak udziałów: suma wynosi zero.' : 'Udziały niedostępne: brakuje pełnych danych.'));
    donutEl.setAttribute('aria-label','Udziały kwartalne niedostępne');
  }

  tableValueEl.textContent=metricName;
  tableBodyEl.replaceChildren();
  quarterValues.forEach((value,i)=>{
    const tr=node('tr','');
    const share=shares ? `${shares[i].toFixed(2).replace('.',',')}%` : '—';
    [ `Q${i+1}`, value === null ? 'Brak danych' : nf.format(value), share ].forEach(txt=>tr.append(node('td','',txt)));
    tableBodyEl.append(tr);
  });
}

function download() {
  if (!current) return;
  const header='lotnisko;rok;kwartal;rodzaj_danych;wartosc;udzial_procentowy';
  const escape = v => `"${String(v).replace(/"/g,'""')}"`;
  const lines=current.quarterValues.map((v,i)=>[
    escape(current.airport),current.year,i+1,escape(current.metricName),
    v === null ? '' : v, current.shares ? current.shares[i].toFixed(2).replace('.',',') : ''
  ].join(';'));
  const blob=new Blob(['\uFEFF'+[header,...lines].join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=`sezonowosc-${current.year}.csv`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function init() {
  try {
    const response=await fetch('data/LOTY.csv');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    records=parseCsv(await response.text());
    if (!records.length) throw new Error('Brak prawidłowych danych w CSV.');
    addOptions(airportEl,[...new Set(records.map(r=>r.airport))].sort((a,b)=>a.localeCompare(b,'pl')).map(x=>[x,x]));
    addOptions(yearEl,[...new Set(records.map(r=>r.year))].sort((a,b)=>b-a).map(x=>[x,x]));
    airportEl.addEventListener('change',refresh);
    yearEl.addEventListener('change',refresh);
    metricEl.addEventListener('change',refresh);
    downloadEl.addEventListener('click',download);
    refresh();
  } catch(err) {
    statusEl.textContent=`Nie udało się wczytać danych: ${err.message}. Otwórz stronę przez Live Server i sprawdź data/LOTY.csv.`;
  }
}
init();
