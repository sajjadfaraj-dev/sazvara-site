
/* ===== SOURCE: sazvara-experience.js ===== */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('svx');

  const ASSET_BASE = '/assets/experience/';
  const qs=(s,c=document)=>c.querySelector(s);
  const qsa=(s,c=document)=>[...c.querySelectorAll(s)];

  // 1) Upgrade the primary textual SAZVARA home link into a compact mark + wordmark.
  const brandCandidate = qsa('a').find(a => /^\s*SAZVARA\s*$/i.test(a.textContent || ''));
  if (brandCandidate) {
    brandCandidate.classList.add('svx-brand');
    brandCandidate.innerHTML = `<img src="${ASSET_BASE}sazvara-mark.svg" alt=""><span class="svx-brand-word">SAZVARA</span>`;
  }

  // 2) Global reading/scroll progress.
  const meter=document.createElement('div');
  meter.className='svx-scroll-meter'; meter.setAttribute('aria-hidden','true');
  document.body.appendChild(meter);

  // 3) Reveal only meaningful blocks; CSS is a progressive enhancement.
  const blocks=qsa('main > section, main > article, main section > div').filter((el,i)=>i<42);
  blocks.forEach(el=>el.classList.add('svx-reveal'));
  if ('IntersectionObserver' in window && !reduced) {
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('svx-in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    blocks.forEach(el=>io.observe(el));
  } else blocks.forEach(el=>el.classList.add('svx-in'));

  // 4) Project imagery on /work/ without changing evidence/copy.
  if (/\/work\/?$/.test(location.pathname)) {
    const map = {
      'loom':'loom.svg',
      'rahro':'rahro.svg',
      'cmrp':'cmrp.svg',
      'editorial notices':'editorial-notices.svg'
    };
    qsa('h2,h3').forEach(h=>{
      const key=(h.textContent||'').trim().toLowerCase();
      const file=map[key]; if(!file) return;
      const host=h.closest('section,article,div')||h.parentElement;
      if(!host || qs('.svx-project-art',host)) return;
      const fig=document.createElement('figure');
      fig.className='svx-project-art svx-reveal svx-in';
      fig.setAttribute('aria-hidden','true');
      fig.innerHTML=`<img src="${ASSET_BASE}visuals/${file}" alt="">`;
      h.insertAdjacentElement('afterend',fig);
    });
  }

  // 5) Homepage cinematic hero field. It reuses the existing hero and copy.
  if (location.pathname==='/' || location.pathname==='/index.html') {
    const h1=qs('main h1');
    if(h1){
      let hero=h1.closest('section')||h1.parentElement;
      hero.classList.add('svx-hero-shell');

      const k=document.createElement('div');
      k.className='svx-kicker'; k.textContent='Systems that move from ambiguity to evidence';
      h1.insertAdjacentElement('beforebegin',k);

      const index=document.createElement('div');
      index.className='svx-hero-index'; index.setAttribute('aria-hidden','true');
      index.innerHTML='<b>RESCUE</b><b>AUTOMATE</b><b>BUILD</b>';
      hero.appendChild(index);
      const labels=[...index.children];

      const canvas=document.createElement('canvas'); canvas.setAttribute('aria-hidden','true');
      hero.prepend(canvas);
      const ctx=canvas.getContext('2d',{alpha:true});
      let W=0,H=0,DPR=1,scrollP=0,mouseX=.5,mouseY=.5,t=0,raf=0;

      function resize(){
        DPR=Math.min(devicePixelRatio||1,1.6); W=hero.clientWidth; H=hero.clientHeight;
        canvas.width=Math.max(1,Math.round(W*DPR)); canvas.height=Math.max(1,Math.round(H*DPR));
        ctx.setTransform(DPR,0,0,DPR,0,0);
      }
      function mix(a,b,p){return a+(b-a)*p}
      function draw(){
        raf=0; if(!ctx) return; t+=reduced?0:.007;
        ctx.clearRect(0,0,W,H);
        const p=scrollP, cx=W*(.68+(.5-mouseX)*.025), cy=H*(.42+(.5-mouseY)*.025);
        const nodes=72, rings=3;
        for(let r=0;r<rings;r++){
          ctx.beginPath();
          for(let i=0;i<nodes;i++){
            const q=i/(nodes-1), ang=q*Math.PI*2*(1.15+r*.11)+t*(r%2?-.6:.5);
            const spiralR=(90+r*58)+q*(110+r*24);
            const gx=mix(cx+Math.cos(ang)*spiralR, W*(.18+.64*q), p);
            const gy=mix(cy+Math.sin(ang)*spiralR*.62, H*(.24+.52*((i+r*7)%18)/17), p);
            const wobble=Math.sin(q*12+t*2+r)*14*(1-p);
            const x=gx, y=gy+wobble;
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          }
          const grad=ctx.createLinearGradient(W*.2,H*.2,W*.86,H*.7);
          grad.addColorStop(0,'rgba(232,255,138,.16)');
          grad.addColorStop(.5,'rgba(166,246,219,.34)');
          grad.addColorStop(1,'rgba(174,184,255,.13)');
          ctx.strokeStyle=grad; ctx.lineWidth=1.15+r*.25; ctx.stroke();
        }
        for(let i=0;i<38;i++){
          const q=i/37, a=q*Math.PI*5.6+t*.7;
          const x=mix(cx+Math.cos(a)*(90+q*270),W*(.2+.62*q),p);
          const y=mix(cy+Math.sin(a)*(50+q*150),H*(.28+.44*((i*7)%19)/18),p);
          ctx.fillStyle=i%7===0?'rgba(232,255,138,.78)':'rgba(244,242,234,.23)';
          ctx.beginPath();ctx.arc(x,y,i%7===0?2.5:1.25,0,Math.PI*2);ctx.fill();
        }
        if(!reduced) raf=requestAnimationFrame(draw);
      }
      function start(){ if(!raf) raf=requestAnimationFrame(draw) }
      function update(){
        const heroRect=hero.getBoundingClientRect();
        scrollP=Math.max(0,Math.min(1,-heroRect.top/Math.max(1,heroRect.height*.72)));
        const phase=Math.min(2,Math.floor(scrollP*3));
        labels.forEach((b,i)=>b.classList.toggle('is-active',i===phase));
        start();
      }
      addEventListener('resize',()=>{resize();start()},{passive:true});
      addEventListener('pointermove',e=>{mouseX=e.clientX/innerWidth;mouseY=e.clientY/innerHeight;start()},{passive:true});
      resize(); update(); draw();
    }
  }

  // 6) One animation loop for scroll-reactive values.
  let ticking=false;
  function onScroll(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{
      const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
      meter.style.transform=`scaleX(${Math.max(0,Math.min(1,scrollY/max))})`;
      qsa('.svx-project-art').forEach(fig=>{
        const r=fig.getBoundingClientRect();
        const p=Math.max(-1,Math.min(1,(r.top+r.height/2-innerHeight/2)/innerHeight));
        fig.style.setProperty('--svx-shift',`${p*-34}px`);
      });
      window.dispatchEvent(new Event('svx:scroll'));
      ticking=false;
    });
  }
  addEventListener('scroll',onScroll,{passive:true}); onScroll();

  // Hero scroll update without a second permanent animation listener.
  if(!reduced){
    const hero=qs('.svx-hero-shell');
    if(hero){
      addEventListener('scroll',()=>{
        const r=hero.getBoundingClientRect();
        const p=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height*.72)));
        const labels=qsa('.svx-hero-index b',hero), phase=Math.min(2,Math.floor(p*3));
        labels.forEach((b,i)=>b.classList.toggle('is-active',i===phase));
      },{passive:true});
    }
  }
})();


/* ===== SOURCE: sazvara-polish-v2.js ===== */
(() => {
  'use strict';

  const header = document.querySelector('header');
  if (!header) return;

  const allLinks = [...header.querySelectorAll('a')];

  // Mark the existing primary CTA for mobile hiding and visual restyling.
  const cta = allLinks.find(a => /start (with )?a diagnostic/i.test((a.textContent || '').trim()));
  if (cta) cta.classList.add('svx-header-cta');

  // Upgrade the existing logo asset if v1 brand enhancement is present.
  const brand = header.querySelector('.svx-brand');
  const brandImg = brand && brand.querySelector('img');
  if (brandImg) brandImg.src = '/assets/experience/sazvara-mark.svg';

  if (header.querySelector('.svx-menu-toggle')) return;

  const unique = [];
  const seen = new Set();

  allLinks.forEach(a => {
    if (a.classList.contains('svx-brand')) return;
    const label = (a.textContent || '').trim();
    const href = a.getAttribute('href');
    if (!href || !label) return;
    const k = href + '|' + label.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    unique.push({href,label,isCta: a === cta || /start (with )?a diagnostic/i.test(label)});
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'svx-menu-toggle';
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-controls','svx-mobile-menu');
  toggle.textContent = 'Menu';

  const panel = document.createElement('div');
  panel.id = 'svx-mobile-menu';
  panel.className = 'svx-mobile-menu';
  panel.setAttribute('aria-hidden','true');

  const links = unique.filter(x => !x.isCta);
  const primary = unique.find(x => x.isCta);

  panel.innerHTML = `
    <div class="svx-mobile-menu-links">
      ${links.map(x => `<a href="${x.href}">${x.label}</a>`).join('')}
    </div>
    ${primary ? `<a class="svx-mobile-primary" href="${primary.href}">${primary.label}</a>` : ''}
  `;

  function setOpen(open){
    panel.classList.toggle('is-open',open);
    document.body.classList.toggle('svx-menu-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    panel.setAttribute('aria-hidden',String(!open));
    toggle.textContent = open ? 'Close' : 'Menu';
  }

  toggle.addEventListener('click',() => setOpen(!panel.classList.contains('is-open')));
  panel.addEventListener('click',e => {
    if (e.target.closest('a')) setOpen(false);
  });
  addEventListener('keydown',e => {
    if (e.key === 'Escape') setOpen(false);
  });

  header.append(toggle,panel);
})();


/* ===== SOURCE: sazvara-story-v3.js ===== */
(() => {
  'use strict';

  const $ = (s,c=document) => c.querySelector(s);
  const $$ = (s,c=document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Use the cleaner free-standing mark.
  const brandImg = $('.svx-brand img');
  if (brandImg) brandImg.src = '/assets/experience/sazvara-mark-v3.svg';

  // ---------- Homepage: explicit scroll narrative ----------
  if (location.pathname === '/' || location.pathname === '/index.html') {
    const hero = $('.svx-hero-shell');
    if (hero && !$('.svx-process-story')) {
      const story = document.createElement('section');
      story.className = 'svx-process-story';
      story.setAttribute('aria-label','Sazvara process');

      const steps = [
        {
          key:'RESCUE',
          title:'Take over what is stuck.',
          text:'Stalled builds, inherited WordPress problems and difficult integrations.'
        },
        {
          key:'AUTOMATE',
          title:'Remove the bottlenecks.',
          text:'Turn repeated friction and difficult handoffs into a clearer working flow.'
        },
        {
          key:'BUILD',
          title:'Finish with evidence.',
          text:'Return the work tested, documented and ready to move forward.'
        }
      ];

      story.innerHTML = `
        <div class="svx-story-inner">
          <div class="svx-story-copy">
            ${steps.map((s,i)=>`
              <article class="svx-story-step${i===0?' is-active':''}" data-v3-step="${i}">
                <div class="svx-story-eyebrow"><span>0${i+1}</span>${s.key}</div>
                <h2>${s.title}</h2>
                <p>${s.text}</p>
              </article>
            `).join('')}
          </div>
          <div class="svx-story-visual-wrap" aria-hidden="true">
            <div class="svx-story-visual">
              <canvas></canvas>
              <div class="svx-story-status">
                <div>
                  <strong>RESCUE</strong>
                  <small>SYSTEM STATE / 01</small>
                </div>
                <div class="svx-story-counter">01 / 03</div>
              </div>
            </div>
          </div>
        </div>`;

      hero.insertAdjacentElement('afterend',story);

      const canvas = $('canvas',story);
      const ctx = canvas.getContext('2d');
      const visual = $('.svx-story-visual',story);
      const status = $('.svx-story-status strong',story);
      const small = $('.svx-story-status small',story);
      const counter = $('.svx-story-counter',story);
      const cards = $$('.svx-story-step',story);
      let W=0,H=0,DPR=1,active=0,target=0,phase=0,raf=0,t=0;

      function resize(){
        const r=visual.getBoundingClientRect();
        W=Math.max(1,r.width); H=Math.max(1,r.height);
        DPR=Math.min(devicePixelRatio||1,1.5);
        canvas.width=Math.round(W*DPR); canvas.height=Math.round(H*DPR);
        ctx.setTransform(DPR,0,0,DPR,0,0);
      }
      function line(x1,y1,x2,y2,a=.18,w=1){
        ctx.strokeStyle=`rgba(245,243,236,${a})`;
        ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      }
      function node(x,y,r=3,accent=false){
        ctx.fillStyle=accent?'rgba(232,255,138,.84)':'rgba(245,243,236,.34)';
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      }
      function drawRescue(mix){
        const cx=W*.52, cy=H*.48;
        for(let i=0;i<9;i++){
          const sy=H*(.15+i*.085);
          const wobble=Math.sin(t*1.4+i)*34;
          ctx.beginPath();
          ctx.moveTo(W*.08,sy);
          ctx.bezierCurveTo(W*.28,sy+wobble,W*.26,cy+(i-4)*15,cx,cy+(i-4)*8);
          ctx.bezierCurveTo(W*.7,cy+(i-4)*8,W*.76,H*(.2+i*.06),W*.92,H*(.25+i*.052));
          ctx.strokeStyle=`rgba(${i%3===0?'166,246,219':'245,243,236'},${.08+.035*(i%3)})`;
          ctx.lineWidth=i%3===0?1.4:1;
          ctx.stroke();
        }
        node(cx,cy,5,true);
        for(let i=0;i<14;i++){
          node(W*(.12+((i*17)%79)/100),H*(.18+((i*31)%68)/100),1.6,i%6===0);
        }
      }
      function drawAutomate(){
        for(let i=0;i<6;i++){
          const y=H*(.2+i*.115);
          const start=W*.09,end=W*.91;
          line(start,y,end,y,.12,1);
          for(let j=0;j<5;j++){
            const p=(j/5 + (t*.055*(i%2?1:-1)))%1;
            const x=start+(end-start)*(p<0?p+1:p);
            node(x,y,i===2?3:2,(j+i)%5===0);
          }
        }
        for(let i=0;i<4;i++){
          const x=W*(.22+i*.19);
          line(x,H*.2,x,H*.775,.065,.8);
        }
      }
      function drawBuild(){
        const cols=4,rows=4,gap=12;
        const size=Math.min((W*.7-gap*(cols-1))/cols,(H*.62-gap*(rows-1))/rows);
        const ox=(W-(cols*size+(cols-1)*gap))/2;
        const oy=(H-(rows*size+(rows-1)*gap))/2;
        for(let r=0;r<rows;r++){
          for(let c=0;c<cols;c++){
            const i=r*cols+c;
            const pulse=.5+.5*Math.sin(t*2+i*.47);
            const x=ox+c*(size+gap), y=oy+r*(size+gap);
            ctx.fillStyle=i%5===0?`rgba(166,246,219,${.05+.08*pulse})`:`rgba(245,243,236,${.018+.025*pulse})`;
            ctx.strokeStyle=i%5===0?'rgba(166,246,219,.32)':'rgba(245,243,236,.12)';
            ctx.lineWidth=1;
            ctx.beginPath();
            const rr=12;
            ctx.roundRect(x,y,size,size,rr);
            ctx.fill();ctx.stroke();
            if(i%5===0) node(x+size*.5,y+size*.5,2.5,true);
          }
        }
      }
      function draw(){
        raf=0;t+=reduced?0:.012;
        phase += (target-phase)*(reduced?1:.075);
        ctx.clearRect(0,0,W,H);

        const grad=ctx.createRadialGradient(W*.56,H*.46,0,W*.56,H*.46,Math.max(W,H)*.7);
        grad.addColorStop(0,'rgba(166,246,219,.035)');
        grad.addColorStop(1,'rgba(8,10,13,0)');
        ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);

        // Crossfade adjacent scene drawings.
        const base=Math.floor(phase), frac=phase-base;
        ctx.save();ctx.globalAlpha=1-frac;
        (base<=0?drawRescue:base===1?drawAutomate:drawBuild)(1-frac);
        ctx.restore();
        if(frac>.001 && base<2){
          ctx.save();ctx.globalAlpha=frac;
          (base+1===1?drawAutomate:drawBuild)();
          ctx.restore();
        }
        if(!reduced) raf=requestAnimationFrame(draw);
      }
      function start(){ if(!raf) raf=requestAnimationFrame(draw); }
      function setActive(i){
        if(i===active && target===i)return;
        active=i;target=i;
        cards.forEach((c,n)=>c.classList.toggle('is-active',n===i));
        status.textContent=steps[i].key;
        small.textContent=`SYSTEM STATE / 0${i+1}`;
        counter.textContent=`0${i+1} / 03`;
        start();
      }
      const io=new IntersectionObserver(entries=>{
        entries.forEach(e=>{
          if(e.isIntersecting){
            const i=Number(e.target.dataset.v3Step||0);
            setActive(i);
          }
        });
      },{threshold:.52});
      cards.forEach(c=>io.observe(c));
      addEventListener('resize',()=>{resize();start()},{passive:true});
      resize();draw();
    }
  }

  // ---------- Work page: sticky visual changes by active case ----------
  if (/\/work\/?$/.test(location.pathname)) {
    document.body.classList.add('svx-work-story');

    const projects = [
      ['loom','Loom','loom.svg'],
      ['rahro','Rahro','rahro.svg'],
      ['cmrp','CMRP','cmrp.svg'],
      ['editorial notices','Editorial Notices','editorial-notices.svg']
    ];

    const heads = $$('h2,h3').map(h=>{
      const k=(h.textContent||'').trim().toLowerCase();
      const p=projects.find(x=>x[0]===k);
      return p ? {h,p} : null;
    }).filter(Boolean);

    if(heads.length && !$('.svx-work-stage')){
      const stage=document.createElement('aside');
      stage.className='svx-work-stage';
      stage.setAttribute('aria-hidden','true');
      stage.innerHTML=`
        <div class="svx-work-rail"><i></i></div>
        <div class="svx-work-stage-frame">
          <img src="/assets/experience/visuals/${heads[0].p[2]}" alt="">
          <div class="svx-work-stage-meta">
            <div class="svx-work-stage-title">${heads[0].p[1]}</div>
            <div class="svx-work-stage-index">01 / 0${heads.length}</div>
          </div>
        </div>`;
      document.body.appendChild(stage);

      const img=$('img',stage);
      const title=$('.svx-work-stage-title',stage);
      const index=$('.svx-work-stage-index',stage);
      const rail=$('.svx-work-rail i',stage);
      let active=0;

      function activate(i){
        if(i===active && stage.classList.contains('is-visible')) return;
        active=i;
        const p=heads[i].p;
        stage.classList.add('is-changing');
        setTimeout(()=>{
          img.src=`/assets/experience/visuals/${p[2]}`;
          title.textContent=p[1];
          index.textContent=`0${i+1} / 0${heads.length}`;
          rail.style.setProperty('--v3-rail',`${i*100}%`);
          requestAnimationFrame(()=>stage.classList.remove('is-changing'));
        },120);
      }

      const io=new IntersectionObserver(entries=>{
        const visible=entries
          .filter(e=>e.isIntersecting)
          .sort((a,b)=>Math.abs(a.boundingClientRect.top-innerHeight*.4)-Math.abs(b.boundingClientRect.top-innerHeight*.4));
        if(!visible.length)return;
        const i=heads.findIndex(x=>x.h===visible[0].target);
        if(i>=0)activate(i);
      },{rootMargin:'-18% 0px -56% 0px',threshold:0});

      heads.forEach(x=>io.observe(x.h));

      function visibility(){
        const first=heads[0].h.getBoundingClientRect();
        const last=heads[heads.length-1].h.getBoundingClientRect();
        const on=first.top<innerHeight*.68 && last.top>innerHeight*.12;
        stage.classList.toggle('is-visible',on);
      }
      addEventListener('scroll',visibility,{passive:true});
      addEventListener('resize',visibility,{passive:true});
      visibility();
    }
  }
})();


/* ===== SOURCE: sazvara-refinement-v4.js ===== */
(() => {
  'use strict';

  const $ = (s,c=document) => c.querySelector(s);
  const $$ = (s,c=document) => [...c.querySelectorAll(s)];

  document.body.classList.add('sv4-refined');

  const rawPath = location.pathname.replace(/\/+$/,'') || '/';
  const map = {
    '/':'home',
    '/work':'work',
    '/services':'services',
    '/agencies':'agencies',
    '/ai-builder-os':'method',
    '/insights':'insights',
    '/sajjad':'founder'
  };
  const page = map[rawPath];
  if (page) document.body.classList.add(`svx-page-${page}`);

  // Work: the cinematic stage should begin only once the cases are actually reached.
  if (page === 'work') {
    const stage = $('.svx-work-stage');
    const selected = $$('h1,h2,h3').find(
      h => /^\s*selected cases\s*$/i.test(h.textContent || '')
    );
    const projectHeads = $$('h2,h3').filter(
      h => /^(loom|rahro|cmrp|editorial notices)$/i.test((h.textContent || '').trim())
    );
    const last = projectHeads[projectHeads.length - 1];

    if (stage && selected) {
      const updateStageGate = () => {
        const r = selected.getBoundingClientRect();
        const lastR = last ? last.getBoundingClientRect() : null;
        const enteredCases = r.top < innerHeight * .38;
        const beforeEnd = !lastR || lastR.top > innerHeight * .08;
        stage.classList.toggle('sv4-stage-ready', enteredCases && beforeEnd);
      };

      addEventListener('scroll', updateStageGate, {passive:true});
      addEventListener('resize', updateStageGate, {passive:true});
      updateStageGate();
    }
  }

  // Insights: its original header nests the brand inside nav. V2 hides nav on
  // mobile, which also hid the logo. Move the existing brand out without
  // replacing its content, then complete the same navigation used elsewhere.
  if (page === 'insights') {
    const header = $('header');
    const nav = header && $('nav', header);
    const brand = header && $('.svx-brand', header);

    if (header && nav && brand && nav.contains(brand)) {
      header.insertBefore(brand, nav);
    }

    const linksHost = header && $('.insight-links', header);
    const cta = header && [...header.querySelectorAll('a')].find(
      a => /start (with )?a diagnostic/i.test((a.textContent || '').trim())
    );

    if (cta) cta.classList.add('svx-header-cta');

    function hasHref(href){
      return !!(header && header.querySelector(`a[href="${href}"]`));
    }

    function makeLink(href,label,cls=''){
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (cls) a.className = cls;
      return a;
    }

    if (linksHost) {
      const insightsLink = linksHost.querySelector('a[href="/insights/"]');
      const founderLink = linksHost.querySelector('a[href="/sajjad/"]');

      if (!hasHref('/agencies/')) {
        const a = makeLink('/agencies/','For Agencies');
        if (insightsLink) linksHost.insertBefore(a, insightsLink);
        else linksHost.appendChild(a);
      }

      if (!hasHref('/ai-builder-os/')) {
        const a = makeLink('/ai-builder-os/','Method');
        if (founderLink) linksHost.insertBefore(a, founderLink);
        else linksHost.appendChild(a);
      }

      if (!hasHref('/fa/')) {
        const a = makeLink('/fa/','FA','sv4-lang-link');
        if (cta && cta.parentElement === linksHost) linksHost.insertBefore(a, cta);
        else linksHost.appendChild(a);
      }
    }

    // V2 built the mobile menu before V4 added the missing Insights links.
    // Add only the missing routes, preserving the existing panel and behavior.
    const mobileLinks = $('.svx-mobile-menu-links');
    if (mobileLinks) {
      const desired = [
        ['/services/','Services'],
        ['/work/','Work'],
        ['/agencies/','For Agencies'],
        ['/insights/','Insights'],
        ['/ai-builder-os/','Method'],
        ['/sajjad/','Founder'],
        ['/fa/','FA']
      ];

      desired.forEach(([href,label]) => {
        if (!mobileLinks.querySelector(`a[href="${href}"]`)) {
          mobileLinks.appendChild(makeLink(href,label));
        }
      });
    }
  }
})();


/* ===== SOURCE: sazvara-polish-v4-3.js ===== */
(() => {
  'use strict';

  const $ = (s,c=document) => c.querySelector(s);
  const $$ = (s,c=document) => [...c.querySelectorAll(s)];

  document.body.classList.add('sv43-polish');

  const path = location.pathname.replace(/\/+$/,'') || '/';

  // Homepage: classify meaningful interactive blocks and add cursor-aware glow.
  if (path === '/') {
    const labels = [
      /rescue a system/i,
      /remove friction/i,
      /build the product/i,
      /^loom$/i,
      /^rahro$/i,
      /^cmrp$/i,
      /editorial notices/i
    ];

    $$('main a').forEach(a => {
      const text = (a.textContent || '').replace(/\s+/g,' ').trim();

      if (/diagnostic|for agencies|agency support|see services|describe the problem/i.test(text)) {
        a.classList.add('sv43-home-cta');
      }

      if (labels.some(rx => rx.test(text))) {
        let host = a;

        // Prefer the card-like wrapper if the link sits inside one.
        for (let i=0; i<3 && host.parentElement && host.parentElement !== document.body; i++) {
          const p = host.parentElement;
          const style = getComputedStyle(p);
          const looksCard =
            parseFloat(style.borderTopWidth || 0) > 0 ||
            style.borderRadius !== '0px' ||
            p.matches('article,li,[class*="card"],[class*="tile"],[class*="case"]');

          if (looksCard) {
            host = p;
            break;
          }
          host = p;
        }

        host.classList.add('sv43-hover-card');
      }
    });

    $$('.sv43-hover-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX-r.left}px`);
        card.style.setProperty('--my', `${e.clientY-r.top}px`);
      }, {passive:true});
    });
  }

  // Work: find the actual case-copy ancestry instead of relying on nth-child
  // guesses. Remove only the vertical reserve between Loom and its first
  // Problem paragraph.
  if (path === '/work') {
    const headings = $$('h1,h2,h3,h4');

    const selected = headings.find(
      h => /^\s*selected cases\s*$/i.test(h.textContent || '')
    );

    const loom = headings.find(
      h => /^\s*loom\s*$/i.test(h.textContent || '')
    );

    const problem = $$('p').find(
      p => /^\s*problem\./i.test((p.textContent || '').trim())
    );

    if (selected) {
      const section = selected.closest('section');
      if (section) section.classList.add('sv43-cases-section');
    }

    if (problem) {
      const copy = problem.parentElement || problem;
      copy.classList.add('sv43-first-case-copy');

      const stop = selected?.closest('section') || $('main');
      let n = copy.parentElement;

      while (n && n !== stop && n !== document.body) {
        n.classList.add('sv43-case-bridge');
        n = n.parentElement;
      }
    }

    // If the Loom heading has an intermediate wrapper with a forced height,
    // collapse that wrapper too, without touching the whole section.
    if (loom && selected) {
      const section = selected.closest('section');
      let n = loom.parentElement;

      while (n && n !== section && n !== document.body) {
        n.classList.add('sv43-case-bridge');
        n = n.parentElement;
      }
    }
  }
})();


/* ===== SOURCE: sazvara-consolidation-v4-4.js ===== */
(() => {
  'use strict';

  const $ = (s,c=document) => c.querySelector(s);
  const $$ = (s,c=document) => [...c.querySelectorAll(s)];

  document.body.classList.add('sv44');

  const raw = location.pathname.replace(/\/+$/,'') || '/';
  const pageMap = {
    '/':'home',
    '/work':'work',
    '/services':'services',
    '/agencies':'agencies',
    '/ai-builder-os':'method',
    '/insights':'insights',
    '/sajjad':'founder'
  };
  const page = pageMap[raw];
  if (page) document.body.classList.add(`svx-page-${page}`);

  // Use the simplified production-size mark everywhere.
  const brandImg = $('.svx-brand img');
  if (brandImg) {
    brandImg.src = '/assets/experience/sazvara-mark-v4.svg';
  }

  // Ensure old reveal states cannot leave content invisible.
  $$('.svx-reveal').forEach(el => {
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
    el.style.removeProperty('visibility');
  });

  // Homepage premium hover system.
  if (page === 'home') {
    const cardLabels = [
      /^rescue a system/i,
      /^remove friction/i,
      /^build the product/i,
      /^loom/i,
      /^rahro/i,
      /^cmrp/i,
      /^editorial notices/i
    ];

    function cardHost(a){
      let node = a;
      for (let i=0;i<5 && node && node !== document.body;i++) {
        if (
          node.matches?.(
            'article,li,[class*="card"],[class*="tile"],[class*="case"],[class*="service"]'
          )
        ) return node;

        const s = getComputedStyle(node);
        if (
          parseFloat(s.borderTopWidth || 0) > 0 &&
          parseFloat(s.borderRadius || 0) > 8
        ) return node;

        node = node.parentElement;
      }
      return a;
    }

    $$('main a').forEach(a => {
      const label = (a.textContent || '').replace(/\s+/g,' ').trim();
      if (!cardLabels.some(rx => rx.test(label))) return;

      const host = cardHost(a);
      host.classList.add('sv44-home-card');

      const arrow = [...host.querySelectorAll('*')].find(
        el => ['↗','→','➜','⟶'].includes((el.textContent || '').trim())
      );
      if (arrow) arrow.classList.add('sv44-arrow');
    });

    $$('.sv44-home-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX-r.left}px`);
        card.style.setProperty('--my', `${e.clientY-r.top}px`);
      }, {passive:true});
    });
  }

  // Work: remove forced-height wrappers between Loom and its first case copy.
  if (page === 'work') {
    const headings = $$('h1,h2,h3,h4');
    const selected = headings.find(
      h => /^\s*selected cases\s*$/i.test(h.textContent || '')
    );
    const loom = headings.find(
      h => /^\s*loom\s*$/i.test(h.textContent || '')
    );

    const paragraphs = $$('p,div');
    const problem = paragraphs.find(el => {
      const t = (el.textContent || '').replace(/\s+/g,' ').trim();
      return /^problem\./i.test(t) && t.length > 20;
    });

    const section =
      selected?.closest('section') ||
      loom?.closest('section') ||
      problem?.closest('section');

    if (section) section.classList.add('sv44-case-section');

    if (problem && section) {
      let node = problem;
      node.classList.add('sv44-case-copy');

      while (node.parentElement && node.parentElement !== section) {
        node = node.parentElement;
        node.classList.add('sv44-case-bridge');
      }
    }

    if (loom && section) {
      let node = loom.parentElement;
      while (node && node !== section) {
        node.classList.add('sv44-case-bridge');
        node = node.parentElement;
      }
    }
  }
})();


/* ===== SOURCE: sazvara-final-tuning-v4-5.js ===== */
(() => {
  'use strict';

  const $ = (s,c=document) => c.querySelector(s);
  const $$ = (s,c=document) => [...c.querySelectorAll(s)];

  document.body.classList.add('sv45');

  const raw = location.pathname.replace(/\/+$/,'') || '/';
  const pageMap = {
    '/':'home',
    '/work':'work',
    '/services':'services',
    '/agencies':'agencies',
    '/ai-builder-os':'method',
    '/insights':'insights',
    '/sajjad':'founder'
  };
  const page = pageMap[raw];
  if (page) document.body.classList.add(`svx-page-${page}`);

  // ---------- HOME ----------
  if (page === 'home') {
    const labels = [
      'Rescue a system',
      'Remove friction',
      'Build the product'
    ];

    function findCardByText(label){
      const leaf = $$('main *').find(
        el =>
          el.children.length === 0 &&
          (el.textContent || '').trim().toLowerCase() === label.toLowerCase()
      );
      if (!leaf) return null;

      let node = leaf;
      while (node && node !== document.body) {
        const r = node.getBoundingClientRect();
        const s = getComputedStyle(node);

        if (
          r.width >= 180 &&
          r.height >= 100 &&
          r.height <= 520 &&
          (
            node.matches('article,li,a,[class*="card"],[class*="tile"]') ||
            parseFloat(s.borderTopWidth || 0) > 0 ||
            parseFloat(s.borderRadius || 0) > 8
          )
        ) {
          return node;
        }
        node = node.parentElement;
      }
      return null;
    }

    labels.forEach(label => {
      const card = findCardByText(label);
      if (!card) return;

      card.classList.add('sv45-home-card');

      // Inline important state deliberately defeats older pale hover rules.
      card.addEventListener('pointerenter', () => {
        card.style.setProperty('background-color','#0b0e11','important');
        card.style.setProperty('color','#f5f3ec','important');
      });

      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('background-color');
        card.style.removeProperty('color');
      });

      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--sv45-mx', `${e.clientX-r.left}px`);
        card.style.setProperty('--sv45-my', `${e.clientY-r.top}px`);
      }, {passive:true});

      [...card.querySelectorAll('*')].forEach(el => {
        const t = (el.textContent || '').trim();
        if (['↗','→','➜','⟶'].includes(t)) {
          el.classList.add('sv45-arrow');
        }
      });
    });
  }

  // ---------- WORK ----------
  if (page === 'work') {
    const names = /^(loom|rahro|cmrp|editorial notices)$/i;
    const heads = $$('h2,h3,h4').filter(
      h => names.test((h.textContent || '').trim())
    );

    const section = heads[0]?.closest('section');

    heads.forEach((h, index) => {
      h.classList.add('sv45-case-title');

      let candidate = h.parentElement;
      let selected = null;

      while (candidate && candidate !== section && candidate !== document.body) {
        const projectHeadCount = [...candidate.querySelectorAll('h2,h3,h4')]
          .filter(x => names.test((x.textContent || '').trim())).length;

        const hasProblem = [...candidate.querySelectorAll('p,div')]
          .some(x => /^problem\./i.test((x.textContent || '').replace(/\s+/g,' ').trim()));

        if (projectHeadCount === 1 && hasProblem) {
          selected = candidate;
          break;
        }
        candidate = candidate.parentElement;
      }

      if (!selected) {
        selected = h.parentElement;
      }

      selected.classList.add('sv45-case');

      const copy = [...selected.querySelectorAll('p,div')]
        .find(x => /^problem\./i.test((x.textContent || '').replace(/\s+/g,' ').trim()));

      if (copy) {
        const host =
          copy.parentElement &&
          copy.parentElement !== selected
            ? copy.parentElement
            : copy;
        host.classList.add('sv45-case-copy');
      }
    });
  }

  // ---------- SERVICES ----------
  if (page === 'services') {
    const headings = $$('h1,h2,h3');
    const receive = headings.find(
      h => /^\s*what you receive\s*$/i.test(h.textContent || '')
    );
    const paid = headings.find(
      h => /paid diagnostic before a large commitment/i.test(h.textContent || '')
    );

    receive?.closest('section')?.classList.add('sv45-what-you-receive');
    paid?.closest('section')?.classList.add('sv45-paid-diagnostic');
  }

  // ---------- FOUNDER ----------
  if (page === 'founder') {
    $$('main p').forEach(p => {
      if (p.textContent.trim().length > 120) {
        p.classList.add('sv45-founder-copy');
      }
    });
  }

  // ---------- AGENCIES ----------
  if (page === 'agencies') {
    $$('main article, main [class*="card"], main [class*="tile"]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 180 && r.height > 90 && r.height < 520) {
        el.classList.add('sv45-agency-card');
      }
    });
  }
})();


/* ===== SOURCE: sazvara-hover-v4-5-1.js ===== */
(() => {
  'use strict';

  const cards = [...document.querySelectorAll('a')].filter(a => {
    const text = (a.textContent || '').replace(/\s+/g,' ').trim();
    return /(?:^|\s)(Rescue a system|Remove friction|Build the product)(?:\s|$)/i.test(text);
  });

  cards.forEach(card => {
    card.classList.add('sv45-home-card', 'sv451-home-card');

    // Keep the interaction on the actual link itself. These homepage entries
    // are full-card anchors, so no ancestor guessing is needed.
    card.addEventListener('pointerenter', () => {
      card.style.setProperty('background-color', '#0b0e11', 'important');
      card.style.setProperty('color', '#f5f3ec', 'important');
    });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('background-color');
      card.style.removeProperty('color');
    });

    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = `${e.clientX - r.left}px`;
      const y = `${e.clientY - r.top}px`;
      card.style.setProperty('--sv45-mx', x);
      card.style.setProperty('--sv45-my', y);
    }, {passive:true});

    [...card.querySelectorAll('*')].forEach(el => {
      const t = (el.textContent || '').trim();
      if (['↗','→','➜','⟶'].includes(t)) {
        el.classList.add('sv45-arrow');
      }
    });
  });

  document.documentElement.dataset.sv451HomeCards = String(cards.length);
})();


/* ===== SOURCE: sazvara-hover-v4-5-2.js ===== */
(() => {
  'use strict';

  const norm = s => (s || '').replace(/\s+/g,' ').trim();

  function visible(el){
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 &&
           r.height > 1 &&
           s.display !== 'none' &&
           s.visibility !== 'hidden';
  }

  function findTitle(label){
    const want = label.toLowerCase();

    const exact = [...document.querySelectorAll('body *')]
      .filter(el => visible(el))
      .filter(el => norm(el.textContent).toLowerCase() === want)
      .sort((a,b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (ar.width*ar.height) - (br.width*br.height);
      });

    return exact[0] || null;
  }

  function cardFor(title){
    if (!title) return null;

    const tr = title.getBoundingClientRect();
    let node = title.parentElement;
    const candidates = [];

    while (node && node !== document.body && node !== document.documentElement) {
      const r = node.getBoundingClientRect();
      const s = getComputedStyle(node);
      const text = norm(node.textContent);

      const containsTitle =
        r.left <= tr.left + 2 &&
        r.right >= tr.right - 2 &&
        r.top <= tr.top + 2 &&
        r.bottom >= tr.bottom - 2;

      const usableSize =
        r.width >= Math.max(180, tr.width * 1.15) &&
        r.width <= 720 &&
        r.height >= 110 &&
        r.height <= 520;

      const hasBody =
        text.length >= norm(title.textContent).length + 20;

      const visualCard =
        parseFloat(s.borderTopWidth || '0') > 0 ||
        parseFloat(s.borderRadius || '0') >= 8 ||
        /card|tile|entry|way|service|option/i.test(node.className || '');

      if (containsTitle && usableSize && hasBody) {
        candidates.push({
          node,
          area:r.width*r.height,
          bonus:visualCard ? -100000 : 0
        });
      }

      node = node.parentElement;
    }

    candidates.sort((a,b) =>
      (a.area + a.bonus) - (b.area + b.bonus)
    );

    return candidates[0]?.node || title.parentElement;
  }

  const labels = [
    'Rescue a system',
    'Remove friction',
    'Build the product'
  ];

  const found = [];

  labels.forEach(label => {
    const title = findTitle(label);
    const card = cardFor(title);

    if (!title || !card) return;

    card.classList.add('sv452-home-card');
    card.dataset.sv452Label = label;

    // Guarantee a stable dark base when hovered, defeating older pale rules.
    card.addEventListener('pointerenter', () => {
      card.style.setProperty('background-color','#0b0e11','important');
      card.style.setProperty('color','#f5f3ec','important');
    });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('background-color');
      card.style.removeProperty('color');
    });

    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sv452-mx', `${e.clientX-r.left}px`);
      card.style.setProperty('--sv452-my', `${e.clientY-r.top}px`);
    }, {passive:true});

    [...card.querySelectorAll('*')].forEach(el => {
      const t = norm(el.textContent);
      if (['↗','→','➜','⟶'].includes(t)) {
        el.classList.add('sv452-arrow');
      }
    });

    found.push({
      label,
      tag:card.tagName,
      cls:card.className,
      width:Math.round(card.getBoundingClientRect().width),
      height:Math.round(card.getBoundingClientRect().height)
    });
  });

  document.documentElement.dataset.sv452HomeCards = String(found.length);
  document.documentElement.dataset.sv452Bound = JSON.stringify(found);
})();


/* ===== SOURCE: sazvara-hover-v4-5-3.js ===== */
(() => {
  'use strict';

  const norm = s => (s || '').replace(/\s+/g,' ').trim();

  function visible(el){
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (
      r.width > 20 &&
      r.height > 20 &&
      s.display !== 'none' &&
      s.visibility !== 'hidden' &&
      parseFloat(s.opacity || '1') > .01
    );
  }

  function scoreCandidate(el, label){
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const text = norm(el.innerText || el.textContent);

    if (!visible(el)) return null;
    if (!text.toLowerCase().includes(label.toLowerCase())) return null;

    // Reject huge ancestors and tiny text fragments.
    if (r.width < 180 || r.width > 760) return null;
    if (r.height < 90 || r.height > 560) return null;

    const hasBody = text.length >= label.length + 18;
    if (!hasBody) return null;

    const border = parseFloat(s.borderTopWidth || '0') > 0;
    const radius = parseFloat(s.borderRadius || '0') >= 8;
    const semantic = el.matches(
      'article,li,a,div,[class*="card"],[class*="tile"],[class*="entry"],[class*="way"]'
    );

    let score = r.width * r.height;

    // Prefer visually card-like containers.
    if (border) score -= 120000;
    if (radius) score -= 80000;
    if (semantic) score -= 40000;

    // Prefer text that starts relatively close to the target label
    // instead of large wrappers containing lots of unrelated content.
    const pos = text.toLowerCase().indexOf(label.toLowerCase());
    score += Math.max(0, pos) * 400;

    // Penalize very long wrappers.
    score += Math.max(0, text.length - 260) * 600;

    return {el, score, text, r};
  }

  function findCard(label){
    const candidates = [];

    for (const el of document.querySelectorAll('body *')) {
      const scored = scoreCandidate(el, label);
      if (scored) candidates.push(scored);
    }

    candidates.sort((a,b) => a.score - b.score);
    return candidates[0] || null;
  }

  const labels = [
    'Rescue a system',
    'Remove friction',
    'Build the product'
  ];

  const bound = [];

  labels.forEach(label => {
    const match = findCard(label);
    if (!match) return;

    const card = match.el;

    card.classList.add('sv453-home-card');
    card.dataset.sv453Label = label;

    card.addEventListener('pointerenter', () => {
      card.style.setProperty('background-color','#0b0e11','important');
      card.style.setProperty('color','#f5f3ec','important');
    });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('background-color');
      card.style.removeProperty('color');
    });

    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sv453-mx', `${e.clientX-r.left}px`);
      card.style.setProperty('--sv453-my', `${e.clientY-r.top}px`);
    }, {passive:true});

    for (const el of card.querySelectorAll('*')) {
      const t = norm(el.textContent);
      if (['↗','→','➜','⟶'].includes(t)) {
        el.classList.add('sv453-arrow');
      }
    }

    bound.push({
      label,
      tag: card.tagName,
      cls: card.className,
      text: match.text.slice(0,220),
      width: Math.round(match.r.width),
      height: Math.round(match.r.height)
    });
  });

  document.documentElement.dataset.sv453HomeCards = String(bound.length);
  document.documentElement.dataset.sv453Bound = JSON.stringify(bound);
})();

