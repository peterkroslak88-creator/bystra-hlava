// Štart appky Bystrá hlava
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import './styly/zaklad.css';
import './styly/komponenty.css';
import './styly/obrazovky.css';

import { PATICKA } from './texty.js';
import { prejdi } from './navigacia.js';
import { sledujNecinnost } from './relacia.js';
import { maPersonalPin } from './ulozisko/hraci.js';

document.getElementById('paticka-text').textContent = PATICKA;

sledujNecinnost(() =>
  prejdi('uvod', { sprava: 'Po dlhšej chvíli bez ťuknutia sme vás pre istotu odhlásili.' })
);

(async () => {
  prejdi((await maPersonalPin()) ? 'uvod' : 'prvySpustenie');
})();
