/** Viewmetrica 360 Analytics — Google Apps Script collector
 *  Create a Google Sheet > Extensions > Apps Script; paste this file.
 *  Deploy > New deployment > Web app > Execute as Me > Anyone.
 *  Use the /exec URL in analytics-config.js.
 *  Keep this spreadsheet private; do not put credentials in GitHub.
 */
const SHEET_NAME = 'Eventos';
const SPREADSHEET_ID = '1L8gjfS9TfC6R5JHUqRKYNphk7_ztkB16KzCo_N46wVc';
function doPost(e) {
  try {
    const data=JSON.parse(e.postData.contents||'{}');
    if(data.tour!=='grinker'||!Array.isArray(data.events))throw new Error('Invalid payload');
    const allowed=['scene_view','click','drag','stay','zoom'];
    const rows=data.events.slice(0,500).filter(x=>
      x&&allowed.includes(x.type)&&
      typeof x.scene==='string'&&x.scene.length<=100&&
      typeof x.session==='string'&&x.session.length<=100
    ).map(x=>[
      new Date(),String(x.at||'').slice(0,35),data.tour,
      String(x.session).slice(0,100),String(x.scene).slice(0,100),
      x.type,String(x.detail??'').slice(0,150)
    ]);
    const lock=LockService.getScriptLock();lock.waitLock(20000);
    try {
      const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet=ss.getSheetByName(SHEET_NAME)||ss.insertSheet(SHEET_NAME);
      if(sheet.getLastRow()===0)sheet.appendRow(['recibido_en','evento_en','tour','sesion','escena','tipo','detalle']);
      if(rows.length)sheet.getRange(sheet.getLastRow()+1,1,rows.length,7).setValues(rows);
    }finally{lock.releaseLock();}
    return ContentService.createTextOutput('ok');
  }catch(err){console.error('Analytics collector:',err && err.stack || err);return ContentService.createTextOutput('error: '+String(err.message||err));}
}
