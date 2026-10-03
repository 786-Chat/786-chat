(() => {
  const INTRO_TITLE = '🐾 Smart Pest Monitoring for Your Business';
  const INTRO_TEXT = 'Keep your premises protected with our Food Safety smart monitoring system. Our connected pest-control devices monitor key areas of your business and help alert you when activity is detected, supporting a cleaner, safer and pest-free environment.';
  const DISCLAIMER = 'The cat image is for illustration only — real monitoring is performed by your connected Food Safety devices.';

  function findTextElement(root, text) {
    return Array.from(root.querySelectorAll('*')).find((el) =>
      (el.textContent || '').trim().includes(text)
    );
  }

  function buildReplacement(originalCat, originalInfo) {
    const wrapper = document.createElement('div');
    wrapper.id = 'branch-login-monitoring-intro';
    wrapper.className = 'w-full max-w-sm mx-auto mt-3 space-y-3';

    const catClone = originalCat.cloneNode(true);
    catClone.classList.remove('-mt-1');
    catClone.classList.add('mt-0');
    catClone.removeAttribute('id');
    const catImage = catClone.querySelector('img');
    if (catImage) {
      catImage.alt = 'Food Safety pest monitoring device illustration with cat';
      catImage.style.maxWidth = '270px';
      catImage.style.width = '100%';
      catImage.style.height = 'auto';
      catImage.style.display = 'block';
      catImage.style.margin = '0 auto';
      catImage.style.borderRadius = '12px';
    }
    wrapper.appendChild(catClone);

    const intro = document.createElement('div');
    intro.className = 'rounded-xl border border-purple-400/30 bg-slate-800/70 backdrop-blur-md p-4 text-center shadow-lg';

    const title = document.createElement('div');
    title.className = 'text-base sm:text-lg font-semibold text-white';
    title.textContent = INTRO_TITLE;

    const body = document.createElement('p');
    body.className = 'mt-2 text-sm leading-relaxed text-slate-200';
    body.textContent = INTRO_TEXT;

    const note = document.createElement('p');
    note.className = 'mt-2 text-xs leading-relaxed text-slate-400';
    note.textContent = DISCLAIMER;

    const demoButton = document.createElement('button');
    demoButton.type = 'button';
    demoButton.className = 'mt-4 w-full rounded-lg border-0 bg-gradient-to-r from-green-600 to-teal-600 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:from-green-700 hover:to-teal-700';
    demoButton.textContent = '🏢 Branch Demo';
    demoButton.addEventListener('click', () => {
      window.location.href = '/branch-demo';
    });

    intro.appendChild(title);
    intro.appendChild(body);
    intro.appendChild(note);
    intro.appendChild(demoButton);
    wrapper.appendChild(intro);

    const infoClone = originalInfo.cloneNode(true);
    infoClone.classList.remove('mt-3');
    infoClone.classList.add('mt-3');
    wrapper.appendChild(infoClone);

    return wrapper;
  }

  function applyBranchLoginLayout() {
    const originalCat = document.querySelector('.branch-login-approved-cat-device');
    if (!originalCat) return false;

    const form = document.querySelector('form');
    if (!form) return false;

    const cardContent = form.parentElement;
    if (!cardContent) return false;

    const infoText = findTextElement(cardContent, 'This web app was created by Mujeeb Sardar in 2025.');
    const originalInfo = infoText ? infoText.closest('div.mt-3') || infoText.parentElement : null;
    const demoButton = Array.from(cardContent.querySelectorAll('button')).find((button) =>
      (button.textContent || '').includes('Branch Demo')
    );
    const originalDemo = demoButton ? demoButton.parentElement : null;

    if (!originalInfo || !originalDemo) return false;

    originalCat.style.display = 'none';
    originalInfo.style.display = 'none';
    originalDemo.style.display = 'none';

    let replacement = document.getElementById('branch-login-monitoring-intro');
    if (!replacement) {
      replacement = buildReplacement(originalCat, originalInfo);
      cardContent.appendChild(replacement);
    }

    return true;
  }

  function start() {
    applyBranchLoginLayout();
    const observer = new MutationObserver(() => {
      applyBranchLoginLayout();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
