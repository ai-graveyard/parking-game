/* Local development workbench. Never included in src/ or the upload ZIP. */
(function () {
  'use strict';
  const devices = [
    {id:'compact', name:'紧凑小屏', width:320, height:568},
    {id:'classic', name:'经典比例', width:375, height:667},
    {id:'android', name:'安卓常用', width:360, height:800},
    {id:'standard', name:'标准全面屏', width:390, height:844},
    {id:'android-large', name:'安卓大屏', width:412, height:915},
    {id:'large', name:'大号全面屏', width:430, height:932}
  ];
  const selected = new Set(['compact','classic','standard','large']);
  const $ = id => document.getElementById(id);
  const cards = new Map();
  let automatic = true;
  window.ParkingChallenges.levels.forEach(level => {
    const option = document.createElement('option');
    option.value = level.id; option.textContent = String(level.id).padStart(2,'0') + ' ' + level.title;
    $('level').appendChild(option);
  });
  function frameUrl(device) {
    const safe = $('safeArea').value.split(',');
    const url = new URL('/', location.href);
    url.search = new URLSearchParams({simulate:'1',embed:'1',device:device.id,safeTop:safe[0],safeBottom:safe[1]}).toString();
    return url.href;
  }
  function status() {
    const loaded = Array.from(cards.values()).filter(card => card.ready).length;
    $('status').textContent = loaded === cards.size ? cards.size + ($('scene').value.indexOf('share-')===0 ? ' 张分享图 · 720 × 960' : ' 块屏幕 · 可独立操作') : '加载中 ' + loaded + ' / ' + cards.size;
  }
  async function align(card) {
    card.ready = false; status();
    const level = Number($('level').value), scene = $('scene').value;
    const sharing = scene.indexOf('share-') === 0;
    $('shareNotice').hidden = !sharing;
    const revision = (card.revision || 0) + 1; card.revision = revision;
    for (let attempt=0;attempt<100;attempt++) {
      if (!card.element.isConnected || card.revision !== revision) return;
      try {
        const preview = card.frame.contentWindow.ParkingLocalPreview;
        if (preview && Array.from(card.frame.contentDocument.images).every(image=>image.complete) &&
            (sharing ? typeof preview.screenShare==='function' : typeof preview.screenScene==='function')) {
          const result = sharing ? preview.screenShare(level,scene==='share-success') : preview.screenScene(level,scene);
          if (result) {
            card.element.classList.toggle('is-sharing',sharing);card.share.hidden=!sharing;card.shareLink.hidden=!sharing;
            if(sharing){
              card.share.src=result.image;
              card.share.dataset.sourceWidth=result.sourceWidth;card.share.dataset.sourceHeight=result.sourceHeight;
              card.share.dataset.scaleX=result.drawWidth/result.sourceWidth;card.share.dataset.scaleY=result.drawHeight/result.sourceHeight;
              card.shareLink.href=result.image;
              card.shareLink.download='parking-share-'+card.device.width+'x'+card.device.height+'-'+scene+'.png';
            }
            card.ready=true;fit();status();return;
          }
        }
      } catch (_) { /* The next document may still be loading. */ }
      await new Promise(resolve => setTimeout(resolve,100));
    }
    $('status').textContent='部分屏幕未加载完成，请点全部刷新';
  }
  function fit() {
    cards.forEach(card => {
      const available = card.stage.clientWidth - 28;
      const height = Math.max(360, innerHeight - 315);
      const scale = automatic ? Math.min(1,available/card.device.width,height/card.device.height) : Number($('zoom').value)/100;
      card.phone.style.width = (card.device.width*scale+10)+'px';
      card.phone.style.height = (card.device.height*scale+10)+'px';
      card.frame.style.transform = 'scale('+scale+')';
      card.ratio.textContent = card.share.hidden ? Math.round(scale*100)+'% · '+card.device.width+' × '+card.device.height : '720 × 960 · 场地等比缩放';
    });
    $('zoomLabel').textContent=automatic?'自动适应':$('zoom').value+'%';
    $('autoFit').classList.toggle('active',automatic);
    $('autoFit').setAttribute('aria-pressed',String(automatic));
  }
  function render() {
    devices.forEach(device => {
      if (!selected.has(device.id)) {
        const old=cards.get(device.id);
        if(old){old.revision++;old.element.remove();cards.delete(device.id);}
      } else if(!cards.has(device.id)) {
        const element=document.createElement('article');element.className='screen-card';element.dataset.device=device.id;
        element.innerHTML='<div class="screen-caption"><h2></h2><span></span></div><div class="screen-stage"><div class="phone"><iframe></iframe></div><img class="share-card" alt="" hidden></div><div class="screen-footer"><span></span><a class="share-download" hidden>下载原图 ↓</a><a class="open-screen" target="_blank" rel="noopener">单独打开 ↗</a></div>';
        element.querySelector('h2').textContent=device.name;
        element.querySelector('.screen-caption span').textContent=device.width+' × '+device.height;
        const frame=element.querySelector('iframe');frame.title=device.name+' '+device.width+' × '+device.height+' 游戏预览';frame.width=device.width;frame.height=device.height;
        const share=element.querySelector('.share-card');share.alt=device.width+' × '+device.height+' 视口生成的 3:4 分享图';
        const card={device,element,frame,share,shareLink:element.querySelector('.share-download'),stage:element.querySelector('.screen-stage'),phone:element.querySelector('.phone'),ratio:element.querySelector('.screen-footer span'),ready:false,revision:0};
        cards.set(device.id,card);
        frame.addEventListener('load',()=>align(card));
        frame.src=frameUrl(device);element.querySelector('.open-screen').href=frame.src;
      }
    });
    devices.filter(device=>selected.has(device.id)).forEach(device=>$('screens').appendChild(cards.get(device.id).element));
    $('screens').style.setProperty('--screen-count',cards.size > 4 ? Math.ceil(cards.size / 2) : cards.size);
    $('deviceOptions').querySelectorAll('button').forEach(button=>{button.setAttribute('aria-pressed',String(selected.has(button.dataset.device)));button.disabled=selected.size===1&&selected.has(button.dataset.device);});
    fit();status();
  }
  devices.forEach(device=>{
    const button=document.createElement('button');button.type='button';button.className='device-choice';button.dataset.device=device.id;button.textContent=device.width+' × '+device.height;
    button.addEventListener('click',()=>{if(selected.has(device.id)){if(selected.size>1)selected.delete(device.id);}else selected.add(device.id);render();});
    $('deviceOptions').appendChild(button);
  });
  function refresh(){cards.forEach(card=>{card.ready=false;card.revision++;card.frame.src=frameUrl(card.device);card.element.querySelector('.open-screen').href=card.frame.src;});status();}
  $('refresh').addEventListener('click',refresh);
  $('safeArea').addEventListener('change',refresh);
  $('apply').addEventListener('click',()=>cards.forEach(align));
  ['scene','level'].forEach(id=>$(id).addEventListener('change',()=>cards.forEach(align)));
  $('zoom').addEventListener('input',()=>{automatic=false;fit();});
  $('autoFit').addEventListener('click',()=>{automatic=true;fit();});
  new ResizeObserver(fit).observe($('screens'));
  window.addEventListener('resize',fit);
  render();
})();
