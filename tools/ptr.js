(function(){
  // 画面のいちばん上で下に引っぱると、中身を読み直す（保存がまだの変更は先に送りきる）
  var LIM=64,MAX=96,box=document.createElement('div'),busy=false,y0=null,x0=0,d=0,on=false;
  box.id='khPtr';box.setAttribute('aria-hidden','true');
  box.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M20 12a8 8 0 1 1-2.34-5.66"/><path fill="currentColor" d="M21 3v6h-6z"/></svg>';
  var css=document.createElement('style');
  css.textContent='html,body{overscroll-behavior-y:none}'+
    '#khPtr{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) - 48px);z-index:2147483000;width:40px;height:40px;margin-left:-20px;border-radius:50%;'+
    'display:flex;align-items:center;justify-content:center;background:#fffaf0;color:#2f6b4f;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none;opacity:0;will-change:transform}'+
    '#khPtr.go{transition:transform .2s,opacity .2s}#khPtr.spin svg{animation:khPtrSpin .8s linear infinite}'+
    '@keyframes khPtrSpin{to{transform:rotate(360deg)}}'+
    '@media (prefers-color-scheme:dark){#khPtr{background:#2a2422;color:#9fd3b6}}';
  document.head.appendChild(css);document.body.appendChild(box);
  var show=function(px,turn){box.style.transform='translateY('+px+'px)';box.style.opacity=px>8?1:0;box.firstChild.style.transform=turn==null?'':'rotate('+turn+'deg)';};
  var hide=function(){box.classList.add('go');box.classList.remove('spin');show(0);};
  // 指の下にあるものが、もう上まで巻き戻っているか（ダイアログやメニューの中では引っぱらない）
  var top=function(t){
    if(document.querySelector('dialog[open]'))return false;
    for(var e=t&&t.nodeType===1?t:t&&t.parentElement;e&&e!==document.body&&e!==document.documentElement;e=e.parentElement){
      if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)||e.isContentEditable)return false;
      var s=getComputedStyle(e);
      if(s.position==='fixed')return false;
      if(/(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+1&&e.scrollTop>0)return false;
    }
    var r=document.scrollingElement||document.documentElement;return r.scrollTop<=0&&window.scrollY<=0;
  };
  var wait=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
  var refresh=function(){
    busy=true;box.classList.add('go','spin');show(64);
    var t0=Date.now();
    Promise.resolve().then(function(){
      // 入力が保存中・未送信なら、先に保存しきる。送れなければ読み直さない（入力を消さないため）
      if(window.__khNeedSave&&window.__khNeedSave()&&window.__khFlush)return window.__khFlush();
      return true;
    }).then(function(ok){
      if(ok===false)return;
      return Promise.all([window.__khPull&&window.__khPull(),window.__khMoney&&window.__khMoney()]);
    }).catch(function(){}).then(function(){return wait(Math.max(0,600-(Date.now()-t0)));}).then(function(){busy=false;hide();});
  };
  document.addEventListener('touchstart',function(e){
    if(busy||e.touches.length!==1||!top(e.target)){y0=null;return;}
    y0=e.touches[0].clientY;x0=e.touches[0].clientX;d=0;on=false;
  },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(y0==null)return;
    var dy=e.touches[0].clientY-y0,dx=e.touches[0].clientX-x0;
    if(!on){
      if(Math.abs(dx)>Math.abs(dy)||dy<0){if(Math.abs(dx)>8||dy<-4)y0=null;return;}
      if(dy<10)return;
      on=true;box.classList.remove('go');
    }
    if(e.cancelable)e.preventDefault();
    d=Math.min(MAX,Math.max(0,(dy-10)*0.5));
    show(d,d/LIM*270);box.style.opacity=Math.min(1,d/LIM);
  },{passive:false});
  var end=function(){
    if(y0==null)return;y0=null;
    if(!on)return;on=false;
    if(d>=LIM)refresh();else hide();
  };
  document.addEventListener('touchend',end,{passive:true});
  document.addEventListener('touchcancel',function(){if(y0!=null&&on){y0=null;on=false;hide();}else y0=null;},{passive:true});
})();
