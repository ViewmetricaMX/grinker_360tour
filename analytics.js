/* Viewmetrica 360 Analytics v1 — sin datos personales.
   Configure endpoint in analytics-config.js after deploying the Apps Script collector.
   Until configured, metrics remain local to this browser and can be exported as CSV. */
(function(){
  'use strict';
  const cfg=window.VM_ANALYTICS_CONFIG||{};
  const endpoint=typeof cfg.endpoint==='string'?cfg.endpoint.trim():'';
  const sid=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2));
  const started=Date.now(), totals={},events=[];
  let scene=null,sceneStart=performance.now(),dragStart=0,dragScene=null,dragMoved=false,dragPointer=null;
  const now=()=>performance.now();
  const metric=id=>totals[id]||(totals[id]={scene:id,visits:0,clicks:0,drag_ms:0,stay_ms:0,zooms:0});
  function record(type,id,detail){
    if(!id)return;
    events.push({at:new Date().toISOString(),session:sid,scene:id,type,detail:detail||''});
    if(events.length>1500)events.shift();
  }
  function endDrag(){
    if(!dragStart)return;
    if(dragMoved&&dragScene){const ms=Math.max(0,now()-dragStart);metric(dragScene).drag_ms+=ms;record('drag',dragScene,Math.round(ms));}
    dragStart=0;dragScene=null;dragMoved=false;dragPointer=null;
  }
  function endScene(){
    if(!scene)return;
    endDrag();
    metric(scene).stay_ms+=Math.max(0,now()-sceneStart);
    sceneStart=now();
  }
  function enter(id){if(scene===id)return;endScene();scene=id;sceneStart=now();metric(id).visits++;record('scene_view',id);}
  function click(kind,to){if(!scene)return;metric(scene).clicks++;record('click',scene,kind+(to?' -> '+to:''));}
  function down(pointerId){if(!scene)return;endDrag();dragStart=now();dragScene=scene;dragPointer=pointerId;dragMoved=false;}
  function move(pointerId){if(pointerId===dragPointer)dragMoved=true;}
  function up(pointerId){if(pointerId===dragPointer)endDrag();}
  function zoom(){if(!scene)return;metric(scene).zooms++;record('zoom',scene);}
  function snapshot(){endScene();return {version:1,tour:'grinker',session:sid,started_at:new Date(started).toISOString(),collected_at:new Date().toISOString(),scenes:Object.values(totals).map(x=>({...x,drag_seconds:+(x.drag_ms/1000).toFixed(2),stay_seconds:+(x.stay_ms/1000).toFixed(2)})),events:events.splice(0)};}
  function flush(){
    if(!endpoint)return;
    const payload=snapshot();
    if(!payload.events.length)return;
    const body=JSON.stringify(payload);
    // text/plain avoids a CORS preflight; Google Apps Script handles the POST.
    if(navigator.sendBeacon){try{if(navigator.sendBeacon(endpoint,new Blob([body],{type:'text/plain;charset=UTF-8'})))return;}catch(e){}}
    fetch(endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=UTF-8'},body,keepalive:true}).catch(()=>{});
  }
  function exportCSV(){
    const p=snapshot(),cols=['session','scene','visits','clicks','drag_seconds','stay_seconds','zooms','collected_at'];
    const csv=[cols.join(','),...p.scenes.map(s=>[p.session,s.scene,s.visits,s.clicks,s.drag_seconds,s.stay_seconds,s.zooms,p.collected_at].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','))].join('\r\n');
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    a.href=url;a.download='grinker360-analitica-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
  window.addEventListener('pagehide',flush);
  if(endpoint)setInterval(()=>{if(!document.hidden)flush()},30000);
  window.VM360Analytics={enter,click,down,move,up,zoom,flush,exportCSV};
})();
