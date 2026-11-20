// فاحص الروابط: يقرأ شكل الرابط (ونص الرسالة لو لصقتها) ويطلّع علامات التصيّد.
// ما يفتح الرابط ولا يتصل بأي مكان: كل شي حساب على النص نفسه.
import {
  MULTI_SUFFIXES, HOSTING_SUFFIXES, SHORTENERS, RISKY_TLDS, RISKY_FILES, BRANDS, BAIT_WORDS, MESSAGE_SIGNS,
} from './lists.js';

export const LABELS = ['ما لقينا علامات خطر', 'انتبه', 'مشبوه', 'لا تضغط'];
const POINTS = { high: 40, medium: 15, low: 5, good: 0 };

// ---------- أدوات صغيرة ----------

// توحيد الحروف العربية عشان المقارنة: بدون تشكيل، والهمزات والتاء المربوطة بشكل واحد، والأرقام إنجليزية
export function normalizeArabic(s) {
  return String(s)
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

// فك ترميز Punycode (RFC 3492) لجزء واحد من النطاق بعد «xn--»
export function punyDecode(input) {
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
  let n = 128, i = 0, bias = 72;
  const out = [];
  const b = Math.max(0, input.lastIndexOf('-'));
  for (let j = 0; j < b; j++) out.push(input.charCodeAt(j));
  for (let idx = b > 0 ? b + 1 : 0; idx < input.length;) {
    const oldi = i;
    let w = 1;
    for (let k = base; ; k += base) {
      if (idx >= input.length) throw new Error('punycode ناقص');
      const c = input.charCodeAt(idx++);
      let digit;
      if (c >= 48 && c <= 57) digit = c - 22;
      else if (c >= 65 && c <= 90) digit = c - 65;
      else if (c >= 97 && c <= 122) digit = c - 97;
      else throw new Error('punycode غلط');
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) break;
      w *= base - t;
    }
    const len = out.length + 1;
    let delta = i - oldi;
    delta = oldi === 0 ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / len);
    let k2 = 0;
    while (delta > ((base - tMin) * tMax) >> 1) { delta = Math.floor(delta / (base - tMin)); k2 += base; }
    bias = k2 + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
    n += Math.floor(i / len);
    i %= len;
    out.splice(i++, 0, n);
  }
  return String.fromCodePoint(...out);
}

// النطاق كما يشوفه الإنسان (xn--… ترجع لحروفها)
export function toUnicodeHost(host) {
  return host.split('.').map((l) => {
    if (!l.startsWith('xn--')) return l;
    try { return punyDecode(l.slice(4)); } catch { return l; }
  }).join('.');
}

// يقسم النطاق: النطاق المسجّل (الموقع الحقيقي)، والامتداد، والنطاق الفرعي
export function splitHost(host) {
  const labels = host.split('.');
  if (labels.length < 2) return { registered: host, suffix: '', sub: '', hosting: null };
  for (const h of HOSTING_SUFFIXES) {
    const n = h.split('.').length;
    if (host.endsWith('.' + h) && labels.length > n) {
      return { registered: labels.slice(-(n + 1)).join('.'), suffix: h, sub: labels.slice(0, -(n + 1)).join('.'), hosting: h };
    }
  }
  const n = MULTI_SUFFIXES.has(labels.slice(-2).join('.')) && labels.length >= 3 ? 3 : 2;
  return { registered: labels.slice(-n).join('.'), suffix: labels.slice(-(n - 1)).join('.'), sub: labels.slice(0, -n).join('.'), hosting: null };
}

// «هيكل» الاسم: الحروف والأرقام اللي تتشابه بالعين تصير شكل واحد (paypa1 = paypal، arnazon = amazon)
export function skeleton(s) {
  return s.toLowerCase().replace(/-/g, '')
    .replace(/0/g, 'o').replace(/[1i|]/g, 'l').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/7/g, 't').replace(/8/g, 'b').replace(/9/g, 'g')
    .replace(/rn/g, 'm').replace(/vv/g, 'w');
}

// مسافة التعديل (مع تبديل حرفين متجاورين كخطوة وحدة)
export function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

// أسماء الجهات اللي نقارن عليها التشابه (الطويلة بس، عشان ما نظلم مواقع عادية)
const LOOKALIKE_SKIP = new Set(['office']);
const LOOKALIKES = BRANDS.flatMap((b) => b.domains.map((dm) => ({ name: dm.split('.')[0], brand: b })))
  .filter((x) => x.name.length >= 5 && !LOOKALIKE_SKIP.has(x.name));

// ---------- استخراج الرابط من النص ----------

const URL_RE = /(?:[a-z][a-z0-9+.-]*:\/\/|www\.)[^\s<>"'`،؛]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#][^\s<>"'`،؛]*)?/gi;
const DANGER_SCHEME = /^\s*(javascript|data|vbscript|file|blob)\s*:/i;

export function extractLink(text) {
  const t = String(text);
  for (const m of t.matchAll(URL_RE)) {
    if (m.index > 0 && t[m.index - 1] === '@') continue; // هذا إيميل مو رابط
    const raw = m[0].replace(/[.,;:!?)\]}»"'…]+$/, '');
    if (raw) return { raw, index: m.index, end: m.index + raw.length };
  }
  return null;
}

// ---------- الفحص ----------

function finding(id, severity, ar, match, points) {
  return { id, severity, ar, match: match || '', points: points ?? POINTS[severity] };
}

function hasWord(normText, key) {
  if (key.includes(' ')) return normText.includes(key);
  return normText.split(/[^\u0600-\u06FFa-z0-9]+/).some((w) => w === key || (w.length === key.length + 1 && 'بلوف'.includes(w[0]) && w.slice(1) === key));
}

export function analyzeLink(raw) {
  const findings = [];
  const add = (...a) => findings.push(finding(...a));
  const explicitScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
  let u;
  try { u = new URL(explicitScheme ? raw : 'http://' + raw); } catch { return null; }

  const scheme = u.protocol.replace(':', '');
  let host = u.hostname.toLowerCase().replace(/\.$/, '');
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[');
  const hostUnicode = isIp ? host : toUnicodeHost(host);
  const split = isIp ? { registered: host, suffix: '', sub: '', hosting: null } : splitHost(host);
  const { registered, suffix, sub, hosting } = split;
  const name = registered.split('.')[0];
  const tld = host.split('.').pop();
  const pathFull = u.pathname + u.search + u.hash;
  const official = isIp ? null : BRANDS.find((b) => b.domains.includes(registered)) || null;

  // البروتوكول
  if (!/^https?$/.test(scheme)) add('scheme', 'medium', `الرابط يبدأ بـ«${scheme}://» مو رابط موقع عادي`, scheme + '://');
  else if (explicitScheme && scheme === 'http') add('http', 'low', 'الرابط http بدون تشفير: أي شي تكتبه فيه ينقرأ في الطريق', 'http://');

  // «@» قبل اسم الموقع
  if (u.username || u.password) add('userinfo', 'high', 'فيه «@» قبل اسم الموقع: اللي قبلها مجرد خدعة، والموقع الحقيقي هو اللي بعدها', `${decodeURIComponent(u.username)}@`);

  if (isIp) {
    add('ip', 'high', 'الرابط أرقام (عنوان IP) بدون اسم موقع. الجهات الحقيقية ما ترسل روابط كذا', host);
  } else {
    // حروف من لغات ثانية تشبه الإنجليزية
    if (hostUnicode !== host || /[^\x00-\x7f]/.test(host)) {
      const cyr = /[\u0400-\u04FF]/.test(hostUnicode), grk = /[\u0370-\u03FF]/.test(hostUnicode), arb = /[\u0600-\u06FF]/.test(hostUnicode);
      if (cyr || grk) add('homograph', 'high', 'النطاق فيه حروف من لغة ثانية تشبه الحروف الإنجليزية بالعين، وهذي خدعة معروفة', hostUnicode);
      else if (arb) add('idn-ar', 'low', 'النطاق مكتوب بحروف عربية. تأكد إنه نفس الجهة اللي تعرفها', hostUnicode, 0);
      else add('idn', 'medium', 'النطاق فيه حروف غير إنجليزية ممكن تشبه غيرها', hostUnicode);
    }

    if (official) {
      add('official', 'good', `هذا النطاق الرسمي لـ«${official.ar}»`, registered);
    } else {
      const tokens = host.split(/[.\-_]/);
      const flat = host.replace(/[^a-z0-9]/g, '');
      // نطاق رسمي مكتوب في أول الرابط كخدعة: absher.sa.xxxx.top
      const nested = BRANDS.find((b) => b.domains.some((dm) => host.startsWith(dm + '.') || host.includes('.' + dm + '.')));
      // اسم جهة معروفة داخل النطاق
      const claimed = nested || BRANDS.find((b) => b.keys.some((k) => tokens.includes(k) || (k.length >= 6 && flat.includes(k))));
      if (nested) {
        const dm = nested.domains.find((x) => host.startsWith(x + '.') || host.includes('.' + x + '.'));
        add('nested', 'high', `«${dm}» مكتوب في أول الرابط كخدعة. الموقع الحقيقي هو آخر جزء، ومو تابع لـ«${nested.ar}»:`, registered);
      } else if (claimed) {
        add('brand', 'high', `اسم «${claimed.ar}» موجود في الرابط، لكن الموقع الحقيقي مو نطاقها الرسمي (${claimed.domains[0]}):`, registered);
      } else {
        // اسم يشبه جهة معروفة: حرف مبدّل أو ناقص أو زايد
        const cand = [...new Set([name, ...name.split('-')])].filter((x) => x.length >= 4);
        let hit = null;
        for (const c of cand) {
          for (const l of LOOKALIKES) {
            if (c === l.name) continue;
            if (skeleton(c) === skeleton(l.name) || (l.name.length >= 6 && editDistance(c, l.name) === 1)) { hit = { c, l }; break; }
          }
          if (hit) break;
        }
        if (hit) add('lookalike', 'high', `الاسم «${hit.c}» يشبه «${hit.l.name}» (${hit.l.brand.ar}) لكنه مو هو: فيه حرف مبدّل أو ناقص أو زايد`, registered);
      }

      if (SHORTENERS.has(registered) || SHORTENERS.has(host)) {
        add('shortener', 'medium', 'رابط مختصر: يخبّي الموقع الحقيقي، وما نقدر نعرف وين يودّيك', registered, 10);
      }
      if (hosting) add('hosting', 'low', `الصفحة على استضافة مجانية (${hosting}): أي أحد يقدر يفتح عليها صفحة باسم يختاره`, registered, claimed ? 5 : 0);
      if (!hosting && RISKY_TLDS.has(tld)) add('tld', 'medium', `الامتداد «.${tld}» رخيص ويكثر في روابط التصيّد`, '.' + tld, 10);

      const subLabels = sub ? sub.split('.').filter((l) => l !== 'www') : [];
      if (!nested && subLabels.slice(1).some((l) => ['com', 'net', 'org', 'gov', 'sa', 'edu'].includes(l))) {
        add('fake-suffix', 'medium', 'فيه امتداد مكتوب في نص الرابط عشان يبان كأنه موقع ثاني. الموقع الحقيقي:', registered);
      } else if (subLabels.length >= 3) {
        add('subdomains', 'medium', 'نطاقات فرعية كثيرة قبل اسم الموقع. الموقع الحقيقي:', registered, 10);
      }

      const bait = [...new Set(tokens.filter((tk) => BAIT_WORDS.includes(tk)))];
      if (bait.length) add('bait', 'medium', 'اسم الموقع نفسه فيه كلمات يحبها المحتال', bait.join(' · '));
      if (!name.startsWith('xn--') && (name.match(/-/g) || []).length >= 2) add('hyphens', 'low', 'اسم الموقع فيه شرطات كثيرة، وهذا شكل الأسماء الملفّقة', name);
      if (host.length > 45) add('long-host', 'low', 'اسم الموقع طويل بشكل غير طبيعي', '');
    }

    if (!official && (suffix === 'gov.sa' || suffix === 'edu.sa')) {
      add('gov', 'good', suffix === 'gov.sa' ? 'نطاق حكومي سعودي (gov.sa): ما يتسجّل إلا لجهة حكومية' : 'نطاق تعليمي سعودي (edu.sa): ما يتسجّل إلا لجهة تعليمية', registered);
    }
  }

  // اسم جهة في مسار الرابط (بعد الشرطة المايلة) وهي مو صاحبة الموقع
  const pathTokens = pathFull.toLowerCase().split(/[^a-z0-9]+/);
  const pathBrand = BRANDS.find((b) => b !== official && b.keys.some((k) => pathTokens.includes(k)));
  if (pathBrand && !findings.some((f) => f.id === 'brand' || f.id === 'nested')) {
    add('brand-path', 'medium', `اسم «${pathBrand.ar}» مكتوب بعد الشرطة «/»، وهذا مجرد اسم صفحة. الموقع الحقيقي:`, registered);
  }

  if (u.port && !['80', '443'].includes(u.port)) add('port', 'medium', 'الرابط فيه رقم منفذ غير معتاد', ':' + u.port, 10);
  const ext = (u.pathname.match(/\.([a-z0-9]{2,4})$/i) || [])[1];
  if (ext && RISKY_FILES.includes(ext.toLowerCase())) add('file', 'high', `الرابط ينزّل ملف «.${ext.toLowerCase()}»، يعني برنامج يتثبّت على جهازك`, '.' + ext.toLowerCase());
  if (/https?(:|%3a)(\/|%2f){2}/i.test(u.search + u.hash)) add('redirect', 'medium', 'داخل الرابط رابط ثاني: ممكن يحوّلك لموقع غير اللي تشوفه', '', 10);
  if (raw.length > 150) add('long', 'low', 'الرابط طويل جداً، والطول أحياناً يخبّي الجزء المهم', '');

  // كيف ينقرأ الرابط
  const parts = [];
  if (explicitScheme) parts.push({ t: scheme + '://', kind: scheme === 'https' ? 'scheme' : 'scheme bad', ar: scheme === 'https' ? 'اتصال مشفّر' : scheme === 'http' ? 'بدون تشفير' : 'بروتوكول غريب' });
  if (u.username) parts.push({ t: decodeURIComponent(u.username) + '@', kind: 'trap', ar: 'خدعة، مو الموقع' });
  if (sub) parts.push({ t: sub + '.', kind: 'sub', ar: 'نطاق فرعي' });
  parts.push({ t: registered, kind: 'domain', ar: isIp ? 'عنوان بالأرقام' : 'الموقع الحقيقي' });
  if (u.port) parts.push({ t: ':' + u.port, kind: 'sub', ar: 'منفذ' });
  if (pathFull && pathFull !== '/') parts.push({ t: pathFull.length > 48 ? pathFull.slice(0, 46) + '…' : pathFull, kind: 'path', ar: 'اسم الصفحة' });

  return { raw, scheme, host, hostUnicode, registered, suffix, sub, hosting, isIp, official, findings, parts };
}

function messageFindings(text, link) {
  const out = [];
  const norm = normalizeArabic(text);
  if (!/[\u0600-\u06FF]/.test(norm)) return out;
  for (const sign of MESSAGE_SIGNS) {
    const hit = sign.words.find((w) => norm.includes(normalizeArabic(w)));
    if (hit) out.push(finding(sign.id, sign.severity, sign.ar, hit, sign.severity === 'high' ? 20 : 15));
  }
  if (link) {
    const said = BRANDS.find((b) => b.arKeys.some((k) => hasWord(norm, k)));
    if (said && link.official !== said && !link.findings.some((f) => f.id === 'brand' || f.id === 'nested')) {
      const short = link.findings.some((f) => f.id === 'shortener');
      out.push(short
        ? finding('msg-brand', 'medium', `الرسالة باسم «${said.ar}» لكن الرابط مختصر وما يبيّن نطاقها الرسمي (${said.domains[0]})`, '', 20)
        : finding('msg-brand', 'high', `الرسالة تتكلم عن «${said.ar}» ونطاقها الرسمي ${said.domains[0]}، لكن الرابط يودّي لنطاق ثاني:`, link.registered));
    }
  }
  return out;
}

function tipsFor(level, r) {
  const ids = new Set(r.findings.map((f) => f.id));
  const tips = [];
  if (level >= 2) {
    tips.push('لا تفتح الرابط ولا تكتب فيه أي بيانات.');
    tips.push('إذا الرسالة باسم جهة تعرفها، ادخل من تطبيقها الرسمي أو اكتب عنوانها بنفسك في المتصفح.');
    tips.push('بلّغ عن الرسالة: حوّلها للرقم 330330، وبعدها احذفها.');
  } else if (level === 1) {
    tips.push('لا تفتحه إلا إذا تعرف المرسل وكنت تنتظر منه رابط.');
  } else {
    tips.push('اسأل نفسك: هل كنت أنتظر هالرابط؟ إذا لا، لا تفتحه حتى لو شكله سليم.');
  }
  if (ids.has('shortener')) tips.push('الرابط المختصر من رقم غريب لا تفتحه. اطلب من المرسل الرابط الكامل.');
  if (ids.has('file')) tips.push('لا تثبّت أي تطبيق من رابط في رسالة. التطبيقات من المتجر الرسمي بس.');
  tips.push('رمز التحقق اللي يوصلك برسالة ما يطلبه منك أحد. اللي يطلبه محتال.');
  if (level >= 2) tips.push('إذا ضغطت وكتبت بياناتك: غيّر كلمة المرور فوراً، وكلّم البنك أو الجهة.');
  return tips;
}

// الفحص الكامل: تعطيه رابط أو رسالة كاملة
export function analyze(input) {
  const text = String(input ?? '').trim();
  if (!text) return { kind: 'empty', findings: [], tips: [], parts: [], level: 0, points: 0, label: '' };

  if (DANGER_SCHEME.test(text)) {
    const sc = text.match(DANGER_SCHEME)[1].toLowerCase();
    const findings = [finding('code', 'high', `هذا مو رابط موقع. يبدأ بـ«${sc}:» يعني كود أو ملف يشتغل في جهازك`, sc + ':')];
    const r = { kind: 'link', findings, parts: [{ t: sc + ':', kind: 'trap', ar: 'كود، مو موقع' }], level: 3, points: 40, label: LABELS[3], sub: 'لا تلصقه في المتصفح ولا تفتحه.' };
    r.tips = tipsFor(3, r);
    return r;
  }

  const found = extractLink(text);
  const link = found ? analyzeLink(found.raw) : null;
  const rest = found ? (text.slice(0, found.index) + ' ' + text.slice(found.end)).trim() : text;
  const msg = rest.length >= 6 ? messageFindings(rest, link) : [];

  if (!link) {
    const r = { kind: 'none', findings: msg, parts: [], points: 0, level: 0, label: 'ما لقينا رابط', sub: 'الصق الرابط نفسه، أو الرسالة كاملة ومعها الرابط.' };
    r.tips = [];
    return r;
  }

  const findings = [...link.findings, ...msg];
  const order = { high: 0, medium: 1, low: 2, good: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const points = findings.reduce((s, f) => s + f.points, 0);
  const level = points >= 40 ? 3 : points >= 15 ? 2 : points > 0 ? 1 : 0;
  const sub = level === 3 ? 'فيه علامة تصيّد واضحة. لا تفتحه ولا تكتب فيه شي.'
    : level === 2 ? 'فيه أكثر من شي يخلّينا نشك. لا تفتحه إلا إذا تأكدت من المرسل.'
    : level === 1 ? 'ما فيه دليل قوي، بس فيه شي يستاهل تنتبه له.'
    : link.official ? `هذا النطاق الرسمي لـ«${link.official.ar}». وانتبه برضو: هل كنت تنتظر الرسالة؟`
    : 'هذا مو ضمان إن الرابط سليم: الفاحص يقرأ شكل الرابط بس، وما يفتحه.';
  const r = { kind: 'link', ...link, hasMessage: msg.length > 0 || rest.length >= 6, findings, points, level, label: LABELS[level], sub };
  r.tips = tipsFor(level, r);
  return r;
}
