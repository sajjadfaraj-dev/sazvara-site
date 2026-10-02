(()=>{
  const app=document.querySelector('[data-booking-app]');
  if(!app) return;
  const state={step:1,venue:'آرنا ونک',sport:'فوتسال',price:'۸۹۰٬۰۰۰',date:'امروز، ۱۰ مهر',slot:'۲۰:۰۰'};
  const q=(s)=>app.querySelector(s), qa=(s)=>[...app.querySelectorAll(s)];
  const faDigit=(n)=>String(n).replace(/1/g,'۱').replace(/2/g,'۲').replace(/3/g,'۳');
  const setPressed=(items,selected)=>items.forEach(el=>el.setAttribute('aria-pressed',String(el===selected)));
  const sync=({focusStep=false}={})=>{
    qa('[data-step]').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===state.step));
    q('[data-step-number]').textContent=faDigit(state.step);
    qa('[data-progress]').forEach(el=>{
      const n=Number(el.dataset.progress);
      el.classList.toggle('active',n===state.step);
      el.classList.toggle('done',n<state.step);
      if(n===state.step) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
    });
    ['summary','review'].forEach(prefix=>{
      const map={venue:state.venue,sport:state.sport,date:state.date,slot:state.slot,price:state.price};
      Object.entries(map).forEach(([k,v])=>{const el=q(`[data-${prefix}-${k}]`);if(el)el.textContent=v;});
    });
    if(focusStep){
      const heading=q(`[data-step="${state.step}"] h3`);
      requestAnimationFrame(()=>heading?.focus({preventScroll:true}));
    }
  };

  qa('[data-venue]').forEach(btn=>btn.addEventListener('click',()=>{
    qa('[data-venue]').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');
    setPressed(qa('[data-venue]'),btn);
    state.venue=btn.dataset.venue;state.sport=btn.dataset.sport;state.price=btn.dataset.price;sync();
  }));
  qa('[data-date]').forEach(btn=>btn.addEventListener('click',()=>{
    qa('[data-date]').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');setPressed(qa('[data-date]'),btn);state.date=btn.dataset.date;sync();
  }));
  qa('[data-slot]').forEach(btn=>btn.addEventListener('click',()=>{
    qa('[data-slot]').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');setPressed(qa('[data-slot]'),btn);state.slot=btn.dataset.slot;sync();
  }));
  qa('[data-next]').forEach(btn=>btn.addEventListener('click',()=>{state.step=Math.min(3,state.step+1);sync({focusStep:true});app.scrollIntoView({behavior:'smooth',block:'center'});}));
  qa('[data-prev]').forEach(btn=>btn.addEventListener('click',()=>{state.step=Math.max(1,state.step-1);sync({focusStep:true});}));

  const overlay=q('[data-success]'), dialog=overlay?.querySelector('[role="dialog"]');
  q('[data-confirm]').addEventListener('click',(e)=>{
    overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>dialog?.focus());
  });
  const closeSuccess=()=>{
    overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');state.step=1;sync({focusStep:true});
  };
  q('[data-reset]').addEventListener('click',closeSuccess);
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&overlay?.getAttribute('aria-hidden')==='false')closeSuccess();});

  sync();
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  }
})();
