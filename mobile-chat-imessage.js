/* Bell & Lyons — iMessage mobile chat JS overrides
   Product pages only — CSS-only layout + JS keyboard handling
   Deployed by Viktor 2026-04-17 */
(function() {
    function init() {
        if (window.innerWidth > 768) return;
        var body = document.body;
        if (!body || body.classList.contains('home') || body.classList.contains('error404') || !body.hasAttribute('data-assistant-type')) return;
        if (body.getAttribute('data-assistant-type') === 'general') return;

        var meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
            meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
        }

        applyOverrides();
        setTimeout(applyOverrides, 1000);
        setTimeout(applyOverrides, 3000);

        /* iMessage-style keyboard handling */
        var shell = document.querySelector('.site-shell');
        var log = document.querySelector('.assistant-log');
        if (!shell) return;

        /* Store initial viewport height */
        var stableH = window.innerHeight;

        /* Set shell height using CSS custom property */
        function setShellHeight(h) {
            shell.style.setProperty('height', h + 'px', 'important');
        }
        setShellHeight(stableH);

        /* Listen to visualViewport resize — fires when iOS keyboard opens/closes */
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', function() {
                var vpH = window.visualViewport.height;
                var vpOffset = window.visualViewport.offsetTop;

                /* Update shell height to match visible viewport */
                setShellHeight(vpH);

                /* Pin to top of visible viewport */
                shell.style.setProperty('top', vpOffset + 'px', 'important');

                /* Scroll chat log to bottom so user sees latest messages */
                if (log) {
                    setTimeout(function() { log.scrollTop = log.scrollHeight; }, 30);
                }

                /* Kill any page scroll iOS might have added */
                window.scrollTo(0, 0);
            });

            window.visualViewport.addEventListener('scroll', function() {
                /* Keep shell pinned to visible viewport top */
                shell.style.setProperty('top', window.visualViewport.offsetTop + 'px', 'important');
                window.scrollTo(0, 0);
            });
        }

        /* Prevent body/html scroll on touch (iOS rubber-band prevention) */
        document.addEventListener('touchmove', function(e) {
            /* Allow scroll inside the chat log */
            var target = e.target;
            while (target && target !== document.body) {
                if (target.classList && target.classList.contains('assistant-log')) return;
                target = target.parentElement;
            }
            e.preventDefault();
        }, { passive: false });
    }

    function applyOverrides() {
        var main = document.querySelector('.site-shell > main');
        if (main) {
            Array.from(main.children).forEach(function(c) {
                if (c.classList.contains('top-leo-chat-section') || c.id === 'leo-stage' || c.id === 'page-chatbot') {
                    c.style.setProperty('display', 'flex', 'important');
                } else {
                    c.style.setProperty('display', 'none', 'important');
                }
            });
        }
        document.querySelectorAll('.assistant-log').forEach(function(l) {
            l.style.setProperty('max-height', 'none', 'important');
            l.style.setProperty('min-height', '0', 'important');
            l.style.setProperty('flex', '1 1 0%', 'important');
            l.style.setProperty('margin', '0', 'important');
            l.style.setProperty('border', 'none', 'important');
        });
        document.querySelectorAll('.chatbot-panel-head').forEach(function(h) {
            h.style.setProperty('margin-bottom', '0', 'important');
            h.style.setProperty('border-bottom', 'none', 'important');
        });
        document.querySelectorAll('.bl-social-proof-strip').forEach(function(el) {
            el.innerHTML = el.innerHTML.replace('4.9', '5.0');
        });
        document.querySelectorAll('.assistant-input, form.assistant-input').forEach(function(el) {
            el.style.setProperty('border', 'none', 'important');
            el.style.setProperty('border-top', 'none', 'important');
            el.style.setProperty('box-shadow', 'none', 'important');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();