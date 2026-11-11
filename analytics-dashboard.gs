/** Viewmetrica 360 | Dashboard para Google Sheets
 *  Pegar como archivo nuevo Dashboard.gs dentro del MISMO proyecto Apps Script.
 *  Ejecutar instalarDashboard() una vez desde el editor.
 *  No modificar doPost(e) ni reemplazar Code.gs.
 */
const VM_DASHBOARD_NAME = 'Dashboard';
const VM_SCENES_NAME = 'Por escena';
const VM_AREAS_NAME = 'Por área';
const VM_DAYS_NAME = 'Por día';
const VM_MILLIS = 1000;
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Viewmetrica 360')
    .addItem('Actualizar dashboard', 'actualizarDashboard')
    .addToUi();
}
function instalarDashboard() {
  actualizarDashboard();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const triggerExists = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction()==='actualizarDashboard');
  if (!triggerExists) ScriptApp.newTrigger('actualizarDashboard').timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert('Dashboard creado. Se actualizará automáticamente cada hora. También puedes usar el menú Viewmetrica 360.');
}
function actualizarDashboard() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const source = ss.getSheetByName(SHEET_NAME);
  if (!source) throw new Error('No existe la pestaña Eventos.');
  const data = source.getDataRange().getValues();
  const perScene = new Map(), perArea = new Map(), perDay = new Map();
  const sessions = new Set();
  let clicks=0, drags=0, dragMs=0, stayMs=0, views=0, zooms=0, valid=0;
  const areaOf = scene => {
    const m = String(scene).match(/^(.*)-\d+$/);
    return m ? m[1] : String(scene);
  };
  const newStats = name => ({name,views:0,clicks:0,drags:0,dragMs:0,stayMs:0,zooms:0,sessions:new Set()});
  const get = (map,name) => {
    if (!map.has(name)) map.set(name,newStats(name));
    return map.get(name);
  };
  // De-duplicate exact event replays, not distinct actions with similar durations.
  const seen = new Set();
  for (let i=1;i<data.length;i++) {
    const r=data[i], tour=String(r[2]||''), sid=String(r[3]||'');
    const scene=String(r[4]||''), type=String(r[5]||''), detail=String(r[6]??'');
    const at=String(r[1]||'');
    if (tour!=='grinker'||!sid||!scene||!type) continue;
    const key=[at,tour,sid,scene,type,detail].join('|');
    if(seen.has(key)) continue;
    seen.add(key);valid++;
    sessions.add(sid);
    const s=get(perScene,scene), a=get(perArea,areaOf(scene));
    s.sessions.add(sid);a.sessions.add(sid);
    const d=new Date(at);
    const day=!isNaN(d.getTime()) ? Utilities.formatDate(d,ss.getSpreadsheetTimeZone(),'yyyy-MM-dd') : 'Sin fecha';
    const dayStats=get(perDay,day);dayStats.sessions.add(sid);
    const value=Number(detail);
    for(const o of [s,a,dayStats]){
      if(type==='scene_view')o.views++;
      if(type==='click')o.clicks++;
      if(type==='drag'){o.drags++;if(Number.isFinite(value)&&value>=0)o.dragMs+=value;}
      if(type==='stay'&&Number.isFinite(value)&&value>=0)o.stayMs+=value;
      if(type==='zoom')o.zooms++;
    }
    if(type==='scene_view')views++;
    if(type==='click')clicks++;
    if(type==='drag'){drags++;if(Number.isFinite(value)&&value>=0)dragMs+=value;}
    if(type==='stay'&&Number.isFinite(value)&&value>=0)stayMs+=value;
    if(type==='zoom')zooms++;
  }
  const headers=['Escena / área / fecha','Visualizaciones','Sesiones','Clics','Arrastres','Tiempo arrastre (s)','Permanencia (s)','Zooms'];
  function writeDetail(name,map) {
    const sh=ss.getSheetByName(name)||ss.insertSheet(name);
    sh.clear();sh.getCharts().forEach(c=>sh.removeChart(c));
    const rows=[headers,...[...map.values()].sort((a,b)=>b.views-a.views).map(o=>[
      o.name,o.views,o.sessions.size,o.clicks,o.drags,
      +(o.dragMs/1000).toFixed(2),+(o.stayMs/1000).toFixed(2),o.zooms
    ])];
    sh.getRange(1,1,rows.length,8).setValues(rows);
    sh.getRange(1,1,1,8).setBackground('#17253d').setFontColor('#ffffff').setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(2,2,Math.max(1,rows.length-1),7).setNumberFormat('#,##0.##');
    sh.autoResizeColumns(1,8);
    return sh;
  }
  const sceneSheet=writeDetail(VM_SCENES_NAME,perScene);
  const areaSheet=writeDetail(VM_AREAS_NAME,perArea);
  writeDetail(VM_DAYS_NAME,perDay);
  const dash=ss.getSheetByName(VM_DASHBOARD_NAME)||ss.insertSheet(VM_DASHBOARD_NAME);
  dash.clear();dash.getCharts().forEach(c=>dash.removeChart(c));
  dash.setHiddenGridlines(true);
  dash.getRange('A1:H2').merge().setValue('VIEWMETRICA  |  GRINKER 360 ANALYTICS')
    .setBackground('#101b30').setFontColor('#ffffff').setFontWeight('bold').setFontSize(17)
    .setVerticalAlignment('middle');
  dash.setRowHeights(1,2,27);
  dash.getRange('A4:H4').merge().setValue('Datos agregados · eventos registrados · no representan visitantes únicos')
    .setFontColor('#52647d').setFontSize(10);
  const cards=[
    ['A6:B6','A7:B8','SESIONES',sessions.size],
    ['C6:D6','C7:D8','VISTAS DE ESCENAS',views],
    ['E6:F6','E7:F8','CLICS',clicks],
    ['G6:H6','G7:H8','ARRASTRES',drags],
    ['A10:B10','A11:B12','ARRASTRE TOTAL (s)',+(dragMs/1000).toFixed(1)],
    ['C10:D10','C11:D12','PERMANENCIA (min)',+(stayMs/60000).toFixed(1)],
    ['E10:F10','E11:F12','ZOOMS',zooms],
    ['G10:H10','G11:H12','EVENTOS VÁLIDOS',valid]
  ];
  for(const [labelRange,valueRange,label,value] of cards){
    dash.getRange(labelRange).merge().setValue(label).setBackground('#e9eef8').setFontColor('#42526c').setFontWeight('bold');
    dash.getRange(valueRange).merge().setValue(value).setBackground('#f5f7fc').setFontColor('#17253d')
      .setFontSize(20).setFontWeight('bold').setNumberFormat('#,##0.##');
  }
  dash.getRange('A14:H14').merge().setValue('DETALLE POR ÁREA Y PANORÁMICA')
    .setBackground('#2451ff').setFontColor('#ffffff').setFontWeight('bold');
  dash.getRange('A15:H15').merge().setValue('Consulta las pestañas Por área, Por escena y Por día para revisar cifras y exportarlas a Excel.');
  dash.getRange('A17:H17').merge().setValue('Última actualización: '+Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyy-MM-dd HH:mm:ss'));
  dash.getRange('A18:H18').merge().setValue('Arrastre = duración de gestos; permanencia = tiempo con una escena abierta (no necesariamente atención activa).');
  dash.getRange('A19:H19').merge().setValue('Nota: las sesiones no son personas únicas. La deduplicación elimina eventos exactamente repetidos.');
  dash.getRange('A15:H19').setFontColor('#52647d').setFontSize(10);
  dash.setColumnWidths(1,8,135);
  if(perArea.size){
    const n=Math.min(perArea.size+1,25);
    const chart=dash.newChart().asColumnChart()
      .addRange(areaSheet.getRange(1,1,n,2))
      .setPosition(22,1,0,0)
      .setOption('title','Visualizaciones por área')
      .setOption('legend',{position:'none'})
      .setOption('width',780).setOption('height',360)
      .build();
    dash.insertChart(chart);
  }
  if(perScene.size){
    const n=Math.min(perScene.size+1,25);
    const chart=dash.newChart().asBarChart()
      .addRange(sceneSheet.getRange(1,1,n,2))
      .setPosition(42,1,0,0)
      .setOption('title','Panorámicas más visitadas')
      .setOption('legend',{position:'none'})
      .setOption('width',780).setOption('height',420)
      .build();
    dash.insertChart(chart);
  }
  ss.setActiveSheet(dash);
}
