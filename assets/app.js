document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

(function () {
  const docLang = (document.documentElement.lang || 'en').toLowerCase();
  const isFa = docLang.startsWith('fa');
  const main = document.querySelector('main');

  if (main) {
    if (!main.id) main.id = 'main-content';
    if (!document.querySelector('.skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#main-content';
      skip.textContent = isFa ? 'پرش به محتوای اصلی' : 'Skip to main content';
      document.body.insertBefore(skip, document.body.firstChild);
    }
  }

  const normalizePath = value => {
    try {
      const u = new URL(value, window.location.href);
      let p = u.pathname.replace(/\/index\.html$/i, '/');
      if (!p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
      return p;
    } catch (_) { return ''; }
  };

  const here = normalizePath(window.location.href);
  document.querySelectorAll('.navlinks a[href]').forEach(a => {
    const target = normalizePath(a.href);
    if (target && target === here && !a.classList.contains('lang-switch')) {
      a.setAttribute('aria-current', 'page');
    }
  });

  document.querySelectorAll('[data-copy-brief]').forEach(button => {
    button.addEventListener('click', async () => {
      const brief = isFa
        ? 'ارزیابی اولیه سازوار\\n\\n۱) الان چه چیزی دارید؟\\n\\n۲) مشکل اصلی چیست؟\\n\\n۳) اگر مسئله حل شود، چه نتیجه‌ای باید ببینید؟\\n\\n۴) چه چیزهایی خط قرمز هستند؟'
        : 'Sazvara system diagnostic\\n\\n1) What exists now?\\n\\n2) What is going wrong?\\n\\n3) What should be true instead?\\n\\n4) What cannot be broken?';
      const status = button.parentElement && button.parentElement.nextElementSibling;
      try {
        await navigator.clipboard.writeText(brief);
        if (status && status.classList.contains('copy-status')) {
          status.textContent = isFa ? 'چک‌لیست کپی شد.' : 'Diagnostic checklist copied.';
        }
      } catch (_) {
        if (status && status.classList.contains('copy-status')) {
          status.textContent = isFa ? 'کپی خودکار در این مرورگر در دسترس نیست.' : 'Clipboard access is unavailable in this browser.';
        }
      }
    });
  });
})();


/* === Sazvara Quality v2: diagnostic intake === */
(function () {
  const isFa = (document.documentElement.lang || '').toLowerCase().startsWith('fa');
  document.querySelectorAll('[data-started-at]').forEach(el => {
    if (!el.value) el.value = String(Math.floor(Date.now() / 1000));
  });

  const status = document.querySelector('[data-form-status]');
  if (!status) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get('sent') === '1') {
    status.classList.add('success');
    status.textContent = isFa
      ? 'درخواست شما ثبت شد. در صورت مناسب بودن مسئله، از طریق ایمیل با شما تماس می‌گیریم.'
      : 'Your diagnostic request was received. If the problem is a fit, we will follow up by email.';
  } else if (params.get('queued') === '1') {
    status.classList.add('success');
    status.textContent = isFa
      ? 'درخواست شما با موفقیت در صف خصوصی ثبت شد.'
      : 'Your request was safely placed in the private intake queue.';
  } else if (params.get('error') === 'validation') {
    status.classList.add('error');
    status.textContent = isFa
      ? 'برخی اطلاعات کامل یا معتبر نیستند. لطفاً فرم را بررسی و دوباره ارسال کنید.'
      : 'Some information is incomplete or invalid. Please review the form and try again.';
  } else if (params.get('error') === 'rate') {
    status.classList.add('error');
    status.textContent = isFa
      ? 'تعداد درخواست‌ها از این اتصال موقتاً زیاد بوده است. کمی بعد دوباره تلاش کنید.'
      : 'Too many requests were received from this connection. Please try again later.';
  } else if (params.get('error') === 'server') {
    status.classList.add('error');
    status.textContent = isFa
      ? 'درخواست ارسال نشد. لطفاً کمی بعد دوباره تلاش کنید.'
      : 'The request could not be accepted. Please try again later.';
  }
})();
