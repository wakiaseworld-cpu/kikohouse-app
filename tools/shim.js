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
  function post(fn,args){var n=READ.test(fn)?3:0;var go=function(){return once(fn,args).catch(function(e){if(n-->0)return wait(n===2?800:2500).then(go);throw e;});};return go();}
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
  function setHash(h){try{history.replaceState(null,'',h?'#'+h:location.pathname);}catch(_){}}
  window.google={script:{
    get run(){return runner();},
    url:{getLocation:function(cb){cb({hash:location.hash.slice(1),parameter:{},parameters:{}});}},
    history:{replace:function(s,o,h){setHash(h);},push:function(s,o,h){setHash(h);},setChangeHandler:function(){}}
  }};
})();
