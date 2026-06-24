/* ページ遷移ローディング: 積載車が画面を走り抜ける */
(function () {
  var loader = document.getElementById('page-loader');
  if (!loader) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  function play() { loader.classList.add('show', 'run'); }

  // --- 到着側: 直前のページからローダー経由で来たら、走り→フェードアウト ---
  var arrived = false;
  try { arrived = sessionStorage.getItem('pl-nav') === '1'; } catch (e) {}
  if (arrived) {
    try { sessionStorage.removeItem('pl-nav'); } catch (e) {}
    play();
    var hold = reduce ? 140 : 190;
    setTimeout(function () { loader.classList.remove('show'); }, hold);
    setTimeout(function () { loader.classList.remove('run'); root.classList.remove('pl-arriving'); }, hold + 360);
  } else {
    root.classList.remove('pl-arriving');
  }

  // --- 出発側: 内部リンクのクリックを横取りして、走ってから遷移 ---
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
    if (a.host && a.host !== location.host) return;                 // 外部リンクは除外
    var url = a.href;
    if (url.split('#')[0] === location.href.split('#')[0]) return;   // 同一ページ内は除外

    e.preventDefault();
    try { sessionStorage.setItem('pl-nav', '1'); } catch (e2) {}
    loader.classList.add('show');   // 出発時はカバーのみ（積載車は走らせない＝走行は到着側で1回だけ）
    setTimeout(function () { window.location = url; }, reduce ? 60 : 140);
  });

  // bfcache等で戻ったときに残らないように
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) { loader.classList.remove('show', 'run'); root.classList.remove('pl-arriving'); }
  });
})();
