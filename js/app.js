/* Boot: load data, register shared views, mount the demo panel, start routing. */
(function () {
  const BP = (window.BP = window.BP || {});
  const { html, icon, iconTile } = BP.ui;

  BP.views.notFound = {
    role: null, chrome: 'none', title: 'Not found',
    render() {
      return html`<div class="center-page"><div class="center-card">
        <div class="card stack gap-6 t-center items-center">
          ${iconTile('ghost', 'neutral', 'lg')}
          <div class="stack gap-2">
            <h1 class="t-h1">Page not found</h1>
            <p class="t-body t-muted">This page does not exist or is no longer available.</p>
          </div>
          <button type="button" class="btn btn--primary btn--block" data-act="home">${icon('home')}Go to Home</button>
        </div>
      </div></div>`;
    },
    actions: {
      home() {
        const role = BP.store.state.session.role || 'user';
        BP.router.go(BP.router.DEFAULT_ROUTE[role]);
      },
    },
  };

  BP.actions['skip-to-main'] = function () {
    const main = document.getElementById('main');
    if (main) { main.setAttribute('tabindex', '-1'); main.focus(); }
  };

  BP.store.load();
  BP.demo.mount();
  BP.router.start();
})();
