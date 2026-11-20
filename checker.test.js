// شغّلها بـ: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  analyze, analyzeLink, extractLink, splitHost, punyDecode, toUnicodeHost, skeleton, editDistance, normalizeArabic, LABELS,
} from './checker.js';
import { BRANDS, SHORTENERS, RISKY_TLDS, HOSTING_SUFFIXES, MULTI_SUFFIXES, MESSAGE_SIGNS } from './lists.js';

const ids = (t) => analyze(t).findings.map((f) => f.id);
const level = (t) => analyze(t).level;

test('النطاقات الرسمية تطلع رسمية وبدون علامات خطر', () => {
  for (const u of ['https://www.absher.sa/', 'https://alrajhibank.com.sa/personal', 'https://www.paypal.com/signin', 'https://accounts.google.com/', 'https://splonline.com.sa/ar/', 'https://wa.me/966500000000']) {
    const r = analyze(u);
    assert.equal(r.level, 0, `${u} أخذ ${r.level}: ${ids(u)}`);
    assert.ok(ids(u).includes('official'), u);
  }
});

test('النطاق الحقيقي ينحسب صح', () => {
  assert.equal(splitHost('www.absher.sa').registered, 'absher.sa');
  assert.equal(splitHost('a.b.alrajhibank.com.sa').registered, 'alrajhibank.com.sa');
  assert.equal(splitHost('a.b.alrajhibank.com.sa').sub, 'a.b');
  assert.equal(splitHost('absher.sa.tahdeeth.top').registered, 'tahdeeth.top');
  assert.equal(splitHost('hosam382.github.io').registered, 'hosam382.github.io');
  assert.equal(splitHost('hosam382.github.io').hosting, 'github.io');
  assert.equal(splitHost('x.y.pages.dev').registered, 'y.pages.dev');
  assert.equal(splitHost('noor.moe.gov.sa').registered, 'moe.gov.sa');
  assert.equal(splitHost('localhost').registered, 'localhost');
});

test('نطاق رسمي مكتوب في أول الرابط كخدعة', () => {
  const r = analyze('https://absher.sa.tahdeeth-bayanat.top/login');
  assert.equal(r.level, 3);
  assert.ok(ids('https://absher.sa.tahdeeth-bayanat.top/login').includes('nested'));
  assert.equal(r.registered, 'tahdeeth-bayanat.top');
  assert.equal(r.official, null);
});

test('اسم جهة معروفة في نطاق مو نطاقها', () => {
  for (const u of ['https://absher-sa.co/verify', 'http://stc-pay.offers.net', 'https://alrajhi-update.com', 'https://paypal.account-check.info', 'https://absher.github.io/', 'https://my-whatsapp-gold.com']) {
    assert.ok(ids(u).includes('brand'), `${u}: ${ids(u)}`);
    assert.equal(level(u), 3, u);
  }
});

test('كلمة عادية فيها اسم قصير ما تنحسب انتحال', () => {
  for (const u of ['https://pineapple-farm.com', 'https://afternoon-tea.org', 'https://noor-store.com', 'https://bestcars.com', 'https://offices.com']) {
    assert.ok(!ids(u).includes('brand') && !ids(u).includes('lookalike'), `${u}: ${ids(u)}`);
  }
});

test('الأسماء المتشابهة: حرف مبدّل أو ناقص أو زايد', () => {
  for (const u of ['https://paypa1.com', 'https://g00gle.com/login', 'https://arnazon.com', 'https://abshar.sa', 'https://abshir.sa', 'https://netfilx.com', 'https://lnstagram.com', 'https://micros0ft.com']) {
    assert.ok(ids(u).includes('lookalike'), `${u}: ${ids(u)}`);
    assert.equal(level(u), 3, u);
  }
  assert.equal(skeleton('paypa1'), skeleton('paypal'));
  assert.equal(skeleton('arnazon'), skeleton('amazon'));
  assert.equal(editDistance('absher', 'abshar'), 1);
  assert.equal(editDistance('netflix', 'netfilx'), 1);
  assert.equal(editDistance('google', 'google'), 0);
  assert.ok(editDistance('absher', 'example') > 1);
});

test('الروابط المختصرة', () => {
  for (const u of ['bit.ly/3xK9pQ', 'https://tinyurl.com/abc', 'http://cutt.ly/x', 'https://t.co/AbC']) {
    assert.ok(ids(u).includes('shortener'), u);
    assert.ok(level(u) >= 1, u);
  }
});

test('عنوان بالأرقام، وعلامة @، والكود بدل الرابط', () => {
  assert.ok(ids('http://185.20.30.40/absher').includes('ip'));
  assert.equal(level('http://185.20.30.40/absher'), 3);
  const r = analyze('https://google.com@evil-site.top/x');
  assert.ok(r.findings.some((f) => f.id === 'userinfo'));
  assert.equal(r.registered, 'evil-site.top');
  assert.equal(r.parts[1].kind, 'trap');
  assert.equal(analyze('javascript:alert(1)').level, 3);
  assert.equal(analyze('data:text/html,<h1>x</h1>').findings[0].id, 'code');
});

test('حروف من لغة ثانية تشبه الإنجليزية', () => {
  assert.equal(punyDecode('pple-43d'), 'аpple'); // أول حرف سيريلي
  assert.equal(toUnicodeHost('xn--pple-43d.com'), 'аpple.com');
  assert.equal(punyDecode('mgbh0fb'), 'مثال');
  assert.ok(ids('https://xn--pple-43d.com').includes('homograph'));
  assert.equal(level('https://аpple.com'), 3);
  assert.ok(ids('https://xn--mgbh0fb.com').includes('idn-ar'));
  assert.equal(level('https://xn--mgbh0fb.com'), 0);
});

test('الامتدادات الرخيصة، والمنافذ، والملفات، والتحويل', () => {
  assert.ok(ids('https://my-shop.xyz').includes('tld'));
  assert.ok(ids('https://example.com:8443/a').includes('port'));
  assert.ok(ids('https://example.com/app.apk').includes('file'));
  assert.equal(level('https://example.com/app.apk'), 3);
  assert.ok(ids('https://example.com/go?url=https://evil.top').includes('redirect'));
  assert.ok(ids('http://example.com').includes('http'));
  assert.ok(!ids('example.com').includes('http'), 'ما نحاسب على http إذا ما انكتب');
  assert.ok(ids('https://secure-login-update.com').includes('bait'));
  assert.ok(ids('https://a.b.c.example.com').includes('subdomains'));
  assert.ok(ids('https://www.bank.com.verify-now.net').includes('fake-suffix'));
});

test('الاستضافة المجانية ملاحظة بس، وتصير خطر مع اسم جهة', () => {
  const r = analyze('https://hosam382.github.io/password-checker-ar/');
  assert.equal(r.level, 0);
  assert.ok(r.findings.some((f) => f.id === 'hosting'));
  assert.equal(level('https://absher-login.netlify.app'), 3);
});

test('النطاقات الحكومية والتعليمية', () => {
  assert.ok(ids('https://www.spa.gov.sa/').includes('gov'));
  assert.equal(level('https://www.spa.gov.sa/'), 0);
  assert.ok(ids('https://www.kau.edu.sa/').includes('gov'));
});

test('اسم الجهة بعد الشرطة المايلة', () => {
  const u = 'https://sites.google.com/view/absher-login';
  assert.ok(ids(u).includes('brand-path'));
  assert.equal(level(u), 2);
  assert.ok(!ids('https://www.absher.sa/absher/login').includes('brand-path'));
});

test('استخراج الرابط من الرسالة', () => {
  assert.equal(extractLink('ادخل هنا https://a.example/x. وشكراً').raw, 'https://a.example/x');
  assert.equal(extractLink('الرابط: bit.ly/abc، بسرعة').raw, 'bit.ly/abc');
  assert.equal(extractLink('www.example.com').raw, 'www.example.com');
  assert.equal(extractLink('راسلني على name@gmail.com'), null);
  assert.equal(extractLink('ما فيه رابط هنا'), null);
  assert.equal(analyze('ما فيه رابط هنا').kind, 'none');
  assert.equal(analyze('   ').kind, 'empty');
});

test('علامات الرسالة: استعجال، بيانات، جائزة، شحنة', () => {
  const m = 'عزيزي العميل، تم إيقاف حسابك في أبشر. حدّث بياناتك خلال 24 ساعة: https://absher.sa.tahdeeth-bayanat.top/login';
  const r = analyze(m);
  assert.equal(r.level, 3);
  for (const id of ['nested', 'msg-urgency', 'msg-data']) assert.ok(r.findings.some((f) => f.id === id), id);
  assert.ok(ids('شحنتك متوقفة بسبب عنوان غير مكتمل. ادفع رسوم التوصيل: bit.ly/3xK9pQ').includes('msg-delivery'));
  assert.ok(ids('مبروك ربحت جوال! استلم جائزتك https://example.com').includes('msg-prize'));
  assert.equal(level('شحنتك متوقفة بسبب عنوان غير مكتمل. ادفع رسوم التوصيل: bit.ly/3xK9pQ'), 2);
  assert.equal(normalizeArabic('حدِّث بياناتكَ خلال ٢٤ ساعة'), 'حدث بياناتك خلال 24 ساعه');
});

test('الرسالة باسم جهة والرابط لنطاق ثاني', () => {
  const r = analyze('رسالة من الراجحي: يرجى تأكيد بياناتك https://secure-bank-sa.com/a');
  assert.ok(r.findings.some((f) => f.id === 'msg-brand' && f.severity === 'high'));
  assert.equal(r.level, 3);
  const ok = analyze('من الراجحي: كشف حسابك جاهز https://www.alrajhibank.com.sa/');
  assert.ok(!ok.findings.some((f) => f.id === 'msg-brand'));
  // كلمة داخل كلمة ما تنحسب: «مقابل» مو «ابل»
  assert.ok(!ids('ادفع مقابل الخدمة https://example.com').includes('msg-brand'));
});

test('أجزاء الرابط مرتبة والموقع الحقيقي معلَّم', () => {
  const r = analyze('https://absher.sa.tahdeeth-bayanat.top/login');
  assert.deepEqual(r.parts.map((p) => p.kind), ['scheme', 'sub', 'domain', 'path']);
  assert.equal(r.parts[2].t, 'tahdeeth-bayanat.top');
  assert.equal(analyze('example.com').parts.length, 1);
});

test('النصايح والنتيجة', () => {
  const bad = analyze('https://paypa1.com');
  assert.equal(bad.label, LABELS[3]);
  assert.ok(bad.tips.some((t) => t.includes('330330')));
  const fine = analyze('https://www.absher.sa/');
  assert.equal(fine.label, LABELS[0]);
  assert.ok(fine.tips.length >= 2);
  assert.ok(analyze('https://example.org').sub.includes('مو ضمان'));
});

test('ما ينهار مع مدخلات غريبة', () => {
  for (const t of ['http://', 'https://%%%', '....', 'a.b', 'https://[::1]/x', 'x'.repeat(2000), 'http://example.com/' + 'a'.repeat(500), '🙂 https://example.com 🙂', 'HTTPS://WWW.ABSHER.SA']) {
    assert.doesNotThrow(() => analyze(t), t.slice(0, 30));
  }
  assert.equal(analyze('HTTPS://WWW.ABSHER.SA').level, 0);
  assert.equal(analyzeLink('https://%%%'), null);
});

test('القوائم سليمة', () => {
  assert.ok(BRANDS.length >= 20);
  assert.equal(new Set(BRANDS.map((b) => b.id)).size, BRANDS.length);
  const all = BRANDS.flatMap((b) => b.domains);
  assert.equal(new Set(all).size, all.length, 'نطاق مكرر بين جهتين');
  for (const d of all) assert.match(d, /^[a-z0-9-]+(\.[a-z]+){1,2}$/);
  for (const d of all) assert.equal(splitHost('www.' + d).registered, d, d);
  for (const b of BRANDS) for (const k of b.arKeys) assert.equal(normalizeArabic(k), k, `«${k}» لازم تكون بالشكل الموحّد`);
  for (const s of MESSAGE_SIGNS) assert.equal(new Set(s.words.map(normalizeArabic)).size, s.words.length, s.id);
  assert.ok(SHORTENERS.size >= 20 && RISKY_TLDS.size >= 20 && HOSTING_SUFFIXES.length >= 15 && MULTI_SUFFIXES.has('com.sa'));
  for (const s of SHORTENERS) assert.ok(!all.includes(s) || s === 't.co', s);
});

test('الكود ما يفتح الرابط ولا يرسله ولا يحفظه', () => {
  for (const file of ['checker.js', 'app.js', 'lists.js']) {
    const src = readFileSync(new URL(file, import.meta.url), 'utf8');
    for (const bad of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'window.open', 'location.href', '.href =', 'innerHTML']) {
      assert.ok(!src.includes(bad), `${file} فيه ${bad}`);
    }
  }
  const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
  assert.match(html, /connect-src 'none'/);
  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]).filter((h) => /^https?:/.test(h));
  assert.deepEqual(links, ['https://github.com/hosam382/link-checker-ar']);
});
