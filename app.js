// ربط الصفحة بالفاحص في checker.js. ما فيه أي اتصال بالإنترنت، والرابط ما ينفتح ولا ينحفظ.
import { analyze } from './checker.js';

const $ = (id) => document.getElementById(id);
const SEV_AR = { high: 'خطير', medium: 'مشبوه', low: 'ملاحظة', good: 'مطمئن' };

// أمثلة للتجربة: نطاقات مخترعة للشرح، وتنعرض كنص بس
const SAMPLES = [
  'عزيزي العميل، تم إيقاف حسابك في أبشر. حدّث بياناتك خلال 24 ساعة: https://absher.sa.tahdeeth-bayanat.top/login',
  'شحنتك متوقفة بسبب عنوان غير مكتمل. ادفع رسوم التوصيل 12 ريال: bit.ly/3xK9pQ',
  'https://paypa1.com/signin',
  'https://www.absher.sa/',
];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

let liveTimer;
function render() {
  const v = $('inp').value;
  // المربع يكبر مع النص عشان الرابط يبان كامل
  $('inp').style.height = 'auto';
  $('inp').style.height = Math.min($('inp').scrollHeight + 2, 320) + 'px';
  const r = analyze(v);
  const empty = r.kind === 'empty', none = r.kind === 'none';
  $('clear').hidden = empty;

  const res = document.querySelector('.result');
  const lvl = empty || none ? '-1' : String(r.level);
  $('meter').dataset.level = lvl;
  if (lvl === '-1') { delete $('label').dataset.level; delete res.dataset.level; } else { $('label').dataset.level = lvl; res.dataset.level = lvl; }
  $('label').textContent = empty ? 'الصق عشان نفحص' : r.label;
  $('label').classList.toggle('empty', empty || none);
  $('vsub').textContent = empty ? 'النتيجة تطلع أول ما تلصق' : r.sub;

  $('readCard').hidden = !r.parts.length;
  $('parts').replaceChildren(...r.parts.map((p) => {
    const li = el('li', p.kind);
    li.append(el('bdi', 'tok', p.t), el('span', 'kind', p.ar));
    return li;
  }));

  $('findCard').hidden = !r.findings.length;
  $('findings').replaceChildren(...r.findings.map((f) => {
    const li = el('li');
    li.dataset.sev = f.severity;
    const text = el('span', '', f.ar);
    if (f.match) text.append(el('bdi', /[؀-ۿ]/.test(f.match) ? 'm ar' : 'm', f.match));
    li.append(el('span', 'sev', SEV_AR[f.severity]), text);
    return li;
  }));

  $('tipsCard').hidden = !r.tips.length;
  $('tips').replaceChildren(...r.tips.map((t) => el('li', '', t)));

  // قارئ الشاشة: نعلن النتيجة بعد ما توقف عن الكتابة
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { $('live').textContent = empty ? '' : `النتيجة: ${r.label}. ${r.sub}`; }, 700);
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2400);
}

$('inp').value = '';
$('inp').addEventListener('input', render);
$('clear').addEventListener('click', () => { $('inp').value = ''; render(); $('inp').focus(); });
$('paste').addEventListener('click', async () => {
  try {
    const t = await navigator.clipboard.readText();
    if (!t) return toast('الحافظة فاضية');
    $('inp').value = t.slice(0, 2000);
    render();
  } catch {
    toast('المتصفح ما سمح. اضغط مطوّل داخل المربع واختر «لصق»');
    $('inp').focus();
  }
});
$('samples').addEventListener('click', (e) => {
  const b = e.target.closest('[data-s]');
  if (!b) return;
  $('inp').value = SAMPLES[Number(b.dataset.s)];
  render();
});
render();
