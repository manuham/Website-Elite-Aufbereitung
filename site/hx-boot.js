/* The switch every stylesheet keys its start states on (was an inline <script>; the live CSP allows
   no inline script). Loaded in the <head>, before anything paints. */
document.documentElement.classList.add('hx-js');
