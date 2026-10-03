(() => {
  const allowedPaths = new Set(['/', '/branch-login']);
  if (!allowedPaths.has(window.location.pathname)) return;

  const findByText = (root, text) =>
    Array.from(root.querySelectorAll('*')).find((el) =>
      (el.textContent || '').trim().includes(text)
    );

  const findSection = (el, predicate) => {
    let current = el;
    while (current && current !== document.body) {
      if (predicate(current)) return current;
      current = current.parentElement;
    }
    return null;
  };

  function applyApprovedLayout() {
    const form = document.querySelector('form');
    const catBlock = document.querySelector('.branch-login-approved-cat-device');
    if (!form || !catBlock) return false;

    const cardContent = form.parentElement;
    if (!cardContent) return false;

    const creatorText = findByText(cardContent, 'This web app was created by Mujeeb Sardar in 2025.');
    const creatorBlock = creatorText
      ? findSection(creatorText, (el) => el.tagName === 'DIV' && (el.className || '').toString().includes('bg-gradient-to-r'))
      : null;

    const demoButton = Array.from(cardContent.querySelectorAll('button')).find((button) =>
      (button.textContent || '').includes('Branch Demo')
    );
    const demoBlock = demoButton ? demoButton.parentElement : null;

    if (!creatorBlock || !demoBlock) return false;

    const pageRoot = document.querySelector('.min-h-screen');
    if (pageRoot instanceof HTMLElement) {
      pageRoot.style.background = 'radial-gradient(circle at 50% 38%, rgba(126,34,206,.48), transparent 34%), radial-gradient(circle at 15% 65%, rgba(168,85,247,.32), transparent 32%), radial-gradient(circle at 86% 72%, rgba(37,99,235,.22), transparent 28%), linear-gradient(135deg, #111936 0%, #401070 48%, #071936 100%)';
    }

    const cubeStage = document.querySelector('.branch-login-cube-stage');
    if (cubeStage instanceof HTMLElement) {
      cubeStage.style.setProperty('--cube-size', '96px');
      cubeStage.style.marginBottom = '12px';
    }

    const card = cardContent.closest('[class*="max-w-sm"]');
    if (card instanceof HTMLElement) {
      card.style.boxShadow = '0 24px 70px rgba(24, 7, 55, .45), 0 0 36px rgba(168,85,247,.14)';
      card.style.borderColor = 'rgba(168,85,247,.42)';
    }

    catBlock.style.display = 'flex';
    catBlock.style.width = '100%';
    catBlock.style.maxWidth = '100%';
    catBlock.style.margin = '18px auto 0';
    catBlock.style.justifyContent = 'center';

    const catImage = catBlock.querySelector('img');
    if (catImage instanceof HTMLElement) {
      catImage.style.width = '100%';
      catImage.style.maxWidth = '340px';
      catImage.style.height = 'auto';
      catImage.style.display = 'block';
      catImage.style.margin = '0 auto';
      catImage.style.borderRadius = '14px';
      catImage.style.boxShadow = '0 0 28px rgba(124,58,237,.48)';
    }

    let tagline = document.getElementById('branch-login-approved-tagline');
    if (!tagline) {
      tagline = document.createElement('section');
      tagline.id = 'branch-login-approved-tagline';
      tagline.style.textAlign = 'center';
      tagline.style.padding = '14px 4px 2px';
      tagline.innerHTML = `
        <h2 style="font-size:clamp(20px,4.8vw,28px);font-weight:800;line-height:1.16;color:#fff;margin:0;letter-spacing:-.02em;">
          <span style="color:#facc15;">Smarter pest control</span> starts<br/>with smart monitoring.
        </h2>
        <p style="margin:10px 0 0;color:#e2e8f0;font-size:13px;line-height:1.45;">Stay informed, act quickly and keep your premises protected.</p>
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(192,132,252,.75),transparent);margin:15px 0 0;"></div>
      `;
    }

    creatorBlock.style.marginTop = '12px';
    creatorBlock.style.padding = '14px';
    creatorBlock.style.borderRadius = '12px';
    creatorBlock.style.boxShadow = '0 8px 24px rgba(190,24,93,.18)';

    demoBlock.style.marginTop = '12px';
    demoBlock.style.padding = '14px';
    demoBlock.style.border = '1px solid rgba(56,189,248,.22)';
    demoBlock.style.borderRadius = '12px';
    demoBlock.style.background = 'rgba(15,23,42,.38)';

    cardContent.appendChild(catBlock);
    cardContent.appendChild(tagline);
    cardContent.appendChild(creatorBlock);
    cardContent.appendChild(demoBlock);

    return true;
  }

  function start() {
    if (applyApprovedLayout()) return;
    const observer = new MutationObserver(() => {
      if (applyApprovedLayout()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
