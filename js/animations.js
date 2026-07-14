(function () {
    if (window.Animations) return;

    let observer = null;

    function createObserver() {
        if (observer) observer.disconnect();
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    }

    function observeAnimatedElements() {
        if (!observer) createObserver();
        document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .fade-in-scale').forEach(el => {
            observer.observe(el);
        });
    }

    function initScrollReveal() {
        createObserver();
        observeAnimatedElements();
    }

    function initBackToTop() {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function initAnimations() {
        initScrollReveal();
        initBackToTop();

        const root = document.getElementById('header-root') || document.body;
        const mo = new MutationObserver(() => {
            observeAnimatedElements();
        });
        mo.observe(root, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }

    window.Animations = { initAnimations, initScrollReveal, initBackToTop, observeAnimatedElements };
})();
