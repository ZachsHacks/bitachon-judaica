/* External shopping links require a fresh confirmation on each visit. */
(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'external-warning';
  dialog.setAttribute('aria-labelledby', 'external-warning-title');
  dialog.setAttribute('aria-describedby', 'external-warning-body');
  dialog.innerHTML = `<h2 id="external-warning-title">You're leaving Bitachon Judaica</h2>
    <p id="external-warning-body">The website you're about to visit may contain pritzus or other inappropriate content. Bitachon Judaica does not control the content on external websites.</p>
    <div class="external-warning-actions"><button type="button" autofocus>Stay here</button><a class="external-continue" rel="noopener noreferrer">Continue to website</a></div>`;
  document.body.appendChild(dialog);
  const stay = dialog.querySelector('button');
  const proceed = dialog.querySelector('a');
  let originLink;
  function close() { dialog.close(); }
  stay.addEventListener('click', close);
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    proceed.removeAttribute('href');
    if (originLink?.isConnected) originLink.focus();
    originLink = null;
  });
  proceed.addEventListener('click', event => {
    event.preventDefault();
    const href = proceed.href;
    const newTab = proceed.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey;
    close();
    // Open during the visitor's explicit click, never while displaying the warning.
    if (newTab) window.open(href, '_blank', 'noopener,noreferrer');
    else window.location.assign(href);
  });
  function intercept(event) {
    if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || dialog.contains(anchor)) return;
    const url = new URL(anchor.href, location.href);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin === location.origin) return;
    event.preventDefault();
    event.stopPropagation();
    if (dialog.open) return;
    originLink = anchor;
    proceed.href = url.href;
    proceed.target = anchor.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1 ? '_blank' : '_self';
    proceed.rel = 'noopener noreferrer' + (anchor.relList.contains('sponsored') ? ' sponsored' : '');
    dialog.showModal();
  }
  document.addEventListener('click', intercept, true);
  document.addEventListener('auxclick', intercept, true);
})();
