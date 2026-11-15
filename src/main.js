// Štart appky Bystrá hlava
// Písma sú súčasťou appky (offline). Len latinka so slovenskými znakmi.
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-ext-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-ext-600.css';
import '@fontsource/cormorant-garamond/latin-600-italic.css';
import '@fontsource/cormorant-garamond/latin-ext-600-italic.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-ext-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-ext-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-ext-700.css';
import './styly/zaklad.css';
import './styly/komponenty.css';
import './styly/obrazovky.css';
import './styly/zahrada.css';
import './styly/hra.css';

import { PATICKA } from './texty.js';
import { prejdi } from './navigacia.js';
import { sledujNecinnost } from './relacia.js';
import { maPersonalPin } from './ulozisko/hraci.js';

document.getElementById('paticka-text').textContent = PATICKA;

sledujNecinnost(() =>
  prejdi('uvod', { sprava: 'Po dlhšej chvíli bez ťuknutia sme vás pre istotu odhlásili.' })
);

// Offline režim: service worker sa zapína len v zostavenej appke (nie pri vývoji)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* bez offline režimu appka funguje ďalej */
    });
  });
}

(async () => {
  prejdi((await maPersonalPin()) ? 'uvod' : 'prvySpustenie');
})();
