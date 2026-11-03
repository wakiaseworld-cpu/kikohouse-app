(function(){
  var API='__API_URL__',tok=null,boot=null;
  try{tok=localStorage.getItem('kh-token');boot=JSON.parse(localStorage.getItem('kh-boot')||'null');}catch(_){}
  if(!tok||!boot||!boot.plan){location.replace('./');return;}
  window.__MODE=boot.mode;window.__PLAN=boot.plan;window.__URL=boot.url;window.__NAMES=boot.names;
  function out(){try{localStorage.removeItem('kh-token');}catch(_){}location.replace('./');}
  function once(fn,args){return fetch(API,{method:'POST',body:JSON.stringify({token:tok,fn:fn,args:args})}).then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.json();});}
  // 読み込みだけは、一時的な失敗（アプリを裏にした・GASが混んでいた等）なら少し待ってやり直す
  var READ=/(^|_)get[A-Z]|^__boot$|Status$/;
  function wait(ms){return new Promise(function(res){setTimeout(function(){if(!document.hidden)return res();document.addEventListener('visibilitychange',function v(){if(!document.hidden){document.removeEventListener('visibilitychange',v);res();}});},ms);});}
  function send(fn,args){var n=READ.test(fn)?3:0;var go=function(){return once(fn,args).catch(function(e){if(n-->0)return wait(n===2?800:2500).then(go);throw e;});};return go();}
  // 保存の通信をしている間は、ボタンを押せないようにする（押しても何も起きない）。文字の入力はそのまま続けられる
  var busy=0,dim=null,SAVE=function(fn){return !READ.test(fn)&&!/^(kikoAi|__push)/.test(fn);};
  // 保存している間は、キコログと同じ「保存中…」の画面を出す（終わるまで次へ進めない）
  var veilN=0,veilEl=null;
  function veil(d){veilN=Math.max(0,veilN+d);
    if(!veilEl&&document.body){veilEl=document.createElement('div');veilEl.className='khveil';veilEl.hidden=true;
      veilEl.innerHTML='<div class="khveilbox" role="status" aria-live="polite"><span class="khdots" aria-hidden="true"><i></i><i></i><i></i></span><span>保存中…</span></div>';document.body.appendChild(veilEl);}
    if(veilEl)veilEl.hidden=!veilN;}
  window.__khVeil=veil;
  function hold(d){busy=Math.max(0,busy+d);}
  window.addEventListener('click',function(e){if(busy&&!(e.target&&e.target.type==='file')){e.preventDefault();e.stopImmediatePropagation();}},true);
  try{var st=document.createElement('style');st.textContent='.khveil{position:fixed;inset:0;z-index:10001;display:grid;place-items:center;background:rgba(214,233,207,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}.khveil[hidden]{display:none}@media (prefers-color-scheme:dark){.khveil{background:rgba(28,42,33,.6)}}.khveilbox{display:flex;align-items:center;gap:12px;background:#3f6e51;color:#f6ead2;font-family:"DotGothic16",monospace;font-size:1.15rem;padding:14px 22px;box-shadow:0 0 0 3px #3f6e51,0 0 0 6px #f6ead2,0 0 0 9px #3f6e51,0 10px 24px rgba(0,0,0,.25)}.khdots{display:flex;gap:5px}.khdots i{width:8px;height:8px;background:#f6ead2;animation:khdot .9s steps(1) infinite}.khdots i:nth-child(2){animation-delay:.3s}.khdots i:nth-child(3){animation-delay:.6s}@keyframes khdot{0%{opacity:1}50%{opacity:.2}}@media (prefers-reduced-motion:reduce){.khdots i{animation:none}}';document.head.appendChild(st);}catch(_){}
  function post(fn,args){if(!SAVE(fn))return send(fn,args);var v=!/^kiko_/.test(fn);hold(1);if(v)veil(1);var done=false,end=function(){if(!done){done=true;hold(-1);if(v)veil(-1);}};
    // 通信がとても長引いたときは、20秒で押せるように戻す（保存はそのまま続く）
    var t=setTimeout(end,20000);return send(fn,args).then(function(v){clearTimeout(t);end();return v;},function(e){clearTimeout(t);end();throw e;});}
  function runner(){
    var ok=function(){},ng=function(){},p;
    p=new Proxy({},{get:function(_,k){
      if(k==='withSuccessHandler')return function(f){ok=f;return p;};
      if(k==='withFailureHandler')return function(f){ng=f;return p;};
      if(k==='withUserObject')return function(){return p;};
      return function(){var a=Array.prototype.slice.call(arguments);
        post(k,a).then(function(j){if(j.error==='auth')return out();if(j.error)ng(new Error(j.error));else ok(j.v);},
          function(){ng(new Error('通信できませんでした。電波のよい所でもう一度お試しください。'));});};
    }});
    return p;
  }
  window.__khApi=function(fn,args){return post(fn,args||[]).then(function(j){if(j.error==='auth'){out();throw new Error('auth');}if(j.error)throw new Error(j.error);return j.v;});};
  function setHash(h){try{history.replaceState(history.state,'',h?'#'+h:location.pathname);}catch(_){}}
  window.google={script:{
    get run(){return runner();},
    url:{getLocation:function(cb){cb({hash:location.hash.slice(1),parameter:{},parameters:{}});}},
    history:{replace:function(s,o,h){setHash(h);},push:function(s,o,h){setHash(h);},setChangeHandler:function(){}}
  }};
})();
