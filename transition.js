/* ページ遷移ローディング: 積載車が画面を走り抜ける */
/* 方針: 積載車は「出発側（タップした瞬間）」に走らせる。
   truck.png は今いるページに既に読み込み済みなので、タップ即・待ち時間ゼロで走り出す。
   古いページは新ページが描画されるまで積載車のtransformを合成し続けるので、
   走行アニメがそのまま読み込み時間を覆い隠す。到着側は積載車を出さず、
   白カバーを素早くフェードアウトするだけにする（＝1回の走行・二重走行なし）。 */
(function () {
  var loader = document.getElementById('page-loader');
  if (!loader) return;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // スマホ（または reduced-motion）は遷移をキビキビ短く
  var mobile = window.matchMedia && window.matchMedia('(max-width: 840px)').matches;

  // ============================================================
  // 到着側: 直前ページから来たら、積載車は出さずカバーをすぐ消す
  // ============================================================
  // pl-arriving は <head> のインラインスクリプトが pl-nav から付与し、
  // クリティカルCSSで #page-loader を初描画前から表示している。
  // ここでは積載車を走らせず（走行は出発側で済んでいる）、できるだけ早く
  // カバーを外す。万一このスクリプトが遅れても下のフェイルセーフで必ず外れる。
  var arrived = false;
  try { arrived = sessionStorage.getItem('pl-nav') === '1'; } catch (e) {}
  // pl-nav は1回で消費（リロード等で再発火しないように）
  try { sessionStorage.removeItem('pl-nav'); } catch (e) {}

  // 到着カバーを外す処理（何度呼んでも安全）
  function uncover() {
    root.classList.remove('pl-arriving');
    loader.classList.remove('show', 'run');
  }

  if (arrived) {
    // 次フレーム（最初の描画後）に短くフェードアウト。
    // 積載車は付けない＝二重走行しない。タイマー依存を最小化し、
    // 確実に解除されるよう load / フォールバックも張る。
    var fade = function () { uncover(); };
    if (window.requestAnimationFrame) {
      requestAnimationFrame(function () { requestAnimationFrame(fade); });
    } else {
      setTimeout(fade, 16);
    }
    // フェイルセーフ: 何かでrAFが回らなくても必ずカバーを外す
    setTimeout(uncover, 600);
  } else {
    // 通常表示・直リンク到着など: カバーが残っていたら外す
    uncover();
  }

  // ============================================================
  // 出発側: 内部リンクのクリックを横取りして、積載車を即走らせてから遷移
  // ============================================================
  var navigating = false;  // 二度押し・タイマー重複ガード

  document.addEventListener('click', function (e) {
    // --- ここから下の preventDefault までは、除外条件のフィルタ ---
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
    // --- フィルタ通過: ここで初めて横取り ---

    e.preventDefault();
    if (navigating) return;   // 連打しても遷移は1回だけ
    navigating = true;

    try { sessionStorage.setItem('pl-nav', '1'); } catch (e2) {}

    var done = false;
    var go = function () { if (done) return; done = true; window.location = url; };

    if (reduce) {
      // reduced-motion: 積載車は走らせない。カバーだけ出してすぐ遷移。
      loader.classList.add('show');
      setTimeout(go, 60);
      return;
    }

    // 新ページの取得をすぐ開始（積載車の走行と"並行"させる＝待ちの足し算を消す）
    try {
      var pf = document.createElement('link');
      pf.rel = 'prefetch'; pf.href = url;
      document.head.appendChild(pf);
    } catch (e3) {}

    // 積載車を即・走らせる（truck.png はこのページに読込済み＝待ちゼロ）
    loader.classList.add('show', 'run');
    // ひと走りだけ見せてから遷移を開始。以降の読み込みは古いページ上で
    // 走り続ける積載車が覆い隠す（アニメとロードを並列化）。新ページの
    // 描画が遅いほど積載車が長く走り、速ければ短く切り替わる＝待ちは最小。
    setTimeout(go, mobile ? 150 : 220);
  });

  // bfcache等で戻ったときに、カバー／走行クラスが残らないようにする
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) {
      navigating = false;
      loader.classList.remove('show', 'run');
      root.classList.remove('pl-arriving');
    }
  });
})();
