(function(){
  if(!('Notification' in window)||!('serviceWorker' in navigator)||!window.firebase)return;
  var CFG=__FIREBASE__,VAPID='__VAPID__';
  var list=document.getElementById('pgList');if(!list)return;
  var get=function(k){try{return localStorage.getItem(k);}catch(_){return null;}};
  var set=function(k,v){try{localStorage.setItem(k,v);}catch(_){}};
  var on=function(){return Notification.permission==='granted'&&!!get('kh-push');};
  // ホームの「その他」にも同じボタンを置く
  var bell='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#30271f" d="M7 1h1v1h-1zM8 1h1v1h-1zM6 2h1v1h-1zM9 2h1v1h-1zM5 3h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM10 3h1v1h-1zM4 4h1v1h-1zM11 4h1v1h-1zM4 5h1v1h-1zM11 5h1v1h-1zM3 6h1v1h-1zM12 6h1v1h-1zM3 7h1v1h-1zM12 7h1v1h-1zM3 8h1v1h-1zM12 8h1v1h-1zM2 9h1v1h-1zM13 9h1v1h-1zM2 10h1v1h-1zM13 10h1v1h-1zM1 11h1v1h-1zM14 11h1v1h-1zM1 12h1v1h-1zM2 12h1v1h-1zM3 12h1v1h-1zM4 12h1v1h-1zM5 12h1v1h-1zM6 12h1v1h-1zM7 12h1v1h-1zM8 12h1v1h-1zM9 12h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM12 12h1v1h-1zM13 12h1v1h-1zM14 12h1v1h-1zM6 13h1v1h-1zM9 13h1v1h-1zM7 14h1v1h-1zM8 14h1v1h-1z"/><path fill="#f3c84b" d="M7 2h1v1h-1zM8 2h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM6 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM9 5h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM10 8h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM10 9h1v1h-1zM11 9h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM2 11h1v1h-1zM3 11h1v1h-1zM4 11h1v1h-1zM5 11h1v1h-1zM6 11h1v1h-1zM7 11h1v1h-1zM8 11h1v1h-1zM9 11h1v1h-1zM10 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1z"/><path fill="#fff3c4" d="M5 4h1v1h-1zM5 5h1v1h-1zM4 6h1v1h-1zM4 7h1v1h-1zM4 8h1v1h-1zM3 9h1v1h-1zM3 10h1v1h-1z"/><path fill="#d39a2a" d="M10 4h1v1h-1zM10 5h1v1h-1zM11 6h1v1h-1zM11 7h1v1h-1zM11 8h1v1h-1zM12 9h1v1h-1zM12 10h1v1h-1zM13 11h1v1h-1zM7 13h1v1h-1zM8 13h1v1h-1z"/></svg>');
  var b=document.createElement('button');b.type='button';b.className='pill';var bi=document.createElement('img');bi.className='pxi';bi.src=bell;bi.alt='';var bl=document.createElement('span');b.append(bi,bl);
  var folder=document.querySelector('#fdr .fdrapps'),fb=null,fl=null;
  if(folder){fb=document.createElement('button');fb.type='button';fb.className='app';var ic=document.createElement('span');ic.className='ai p-push';var im=document.createElement('img');im.className='pxi';im.src=bell;im.alt='';ic.append(im);fl=document.createElement('span');fl.className='al';fb.append(ic,fl);folder.append(fb);}
  var label=function(){var t=on()?'通知のテスト':'通知をオン';bl.textContent=t;if(fl)fl.textContent=t;};
  label();list.append(b);
  var say=function(t){var el=document.getElementById('toast');if(!el)return;el.textContent=t;el.classList.remove('err');el.classList.add('show');clearTimeout(say.t);say.t=setTimeout(function(){el.classList.remove('show');},2600);};
  var listening=false;
  var token=function(){return navigator.serviceWorker.register('sw.js').then(function(reg){
    if(!firebase.apps.length)firebase.initializeApp(CFG);
    var m=firebase.messaging();
    // アプリを開いているときに届いた通知も、通知として出す
    if(!listening){listening=true;m.onMessage(function(p){var n=(p&&p.notification)||{};
      reg.showNotification(n.title||'キコハウス',{body:n.body||'',icon:'icon-192.png',data:{go:(p&&p.data&&p.data.go)||''}}).catch(function(){say((n.title||'')+' '+(n.body||''));});});}
    return m.getToken({vapidKey:VAPID,serviceWorkerRegistration:reg});});};
  var save=function(t){return window.__khApi('__push',[t]).then(function(){set('kh-push',t);label();});};
  var press=function(){
    if(on()){window.__khApi('__pushTest').then(function(n){say(n?'テストの通知を送りました':'届け先が見つかりません');},function(e){say('送れませんでした（'+e.message+'）');});return;}
    Notification.requestPermission().then(function(p){
      if(p!=='granted'){say('通知が許可されていません');return;}
      return token().then(save).then(function(){say('通知をオンにしました');});
    }).catch(function(e){say('通知をオンにできませんでした（'+((e&&e.message)||e)+'）');});
  };
  b.addEventListener('click',press);if(fb)fb.addEventListener('click',press);
  if(on())setTimeout(function(){token().then(function(t){if(t&&t!==get('kh-push'))save(t);}).catch(function(){});},4000);
})();
