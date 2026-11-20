# فاحص الروابط | Arabic Phishing Link Checker
**By [Hassam](https://github.com/hosam382)**

جرّبها هنا: **https://hosam382.github.io/link-checker-ar/**

أداة تعليمية عربية: تلصق فيها الرابط (أو الرسالة كاملة) قبل ما تضغط، وتوريك **وين الموقع الحقيقي** في الرابط، وتشرح لك بالعربي علامات التصيّد اللي فيه. تشتغل كلها داخل المتصفح، وما تفتح الرابط ولا ترسله لأحد.

## وش يسوي

- يعطي الرابط واحدة من أربع نتايج: «ما لقينا علامات خطر»، «انتبه»، «مشبوه»، «لا تضغط».
- يقسم الرابط لأجزاء ويلوّن **الموقع الحقيقي** (النطاق المسجّل) عشان تتعلم تقرأ أي رابط بنفسك.
- يشرح كل علامة لقاها، ويعطيك وش تسوي بعدها.
- لو لصقت الرسالة كاملة، يطلّع الرابط منها ويفحص نص الرسالة معه.

## وش يكشف

- **نطاق رسمي مكتوب في أول الرابط كخدعة**: `absher.sa.tahdeeth-bayanat.top` موقعه الحقيقي `tahdeeth-bayanat.top`.
- **اسم جهة معروفة في نطاق مو نطاقها**: مثل `absher-sa.co` و `alrajhi-update.com`. القائمة فيها جهات سعودية (أبشر، نفاذ، سبل، stc، الراجحي، الأهلي، مدرستي…) وعالمية (PayPal، Apple، Google، واتساب…).
- **اسم يشبه الأصلي**: حرف مبدّل أو ناقص أو زايد، مثل `paypa1.com` و `arnazon.com` و `netfilx.com`.
- **حروف من لغة ثانية تشبه الإنجليزية** (Punycode / IDN): مثل `аpple.com` وأول حرف فيها سيريلي.
- **الروابط المختصرة**: `bit.ly` و `tinyurl.com` وغيرها، لأنها تخبّي الوجهة.
- **علامة `@`** قبل اسم الموقع، و**عنوان بالأرقام** (IP) بدل الاسم.
- **امتدادات رخيصة** تكثر في التصيّد (`.top` `.xyz` `.click` …)، ومنفذ غير معتاد، ورابط داخله رابط ثاني.
- **رابط ينزّل برنامج**: `.apk` و `.exe` وغيرها.
- **كود بدل الرابط**: `javascript:` و `data:`.
- **في نص الرسالة**: الاستعجال والتهديد، وطلب البيانات السرّية ورمز التحقق، والجوائز، ورسايل «شحنتك» مع رسوم، والرسالة اللي تتكلم باسم جهة ورابطها لنطاق ثاني.
- **الجانب المطمئن**: النطاقات الرسمية للجهات اللي في القائمة، ونطاقات `gov.sa` و `edu.sa`.

## الخصوصية

- الفاحص **ما يفتح الرابط**. يقرأ نصه بس، في `checker.js` داخل متصفحك.
- الصفحة ما تطلب أي شي من الإنترنت: الخطوط والصور داخل المشروع، وما فيه تحليلات ولا مكتبات خارجية.
- الصفحة فيها `Content-Security-Policy` مع `connect-src 'none'`، يعني المتصفح نفسه يمنعها من إرسال أي بيانات.
- ما نحفظ شي: لا `localStorage` ولا كوكيز.
- فيه اختبار يتأكد إن الكود ما فيه أي أداة إرسال أو حفظ أو فتح روابط، ويشتغل مع باقي الاختبارات.

## حدود الأداة

- الفاحص يقرأ **شكل** الرابط بس، وما يعرف وش داخل الصفحة. «ما لقينا علامات خطر» مو معناها إن الرابط آمن.
- الرابط المختصر ما نقدر نعرف وجهته، لأن معرفتها تحتاج فتحه.
- قائمة الجهات صغيرة ومكتوبة باليد في `lists.js`. موقع تصيّد بنطاق جديد ما فيه اسم جهة ممكن يعدّي.
- ممكن يطلع تنبيه على رابط سليم (مثلاً موقع عادي على امتداد `.xyz`). النتيجة مساعدة لك، مو حكم نهائي.

## تشغيل الاختبارات

تحتاج [Node.js](https://nodejs.org) 20 أو أحدث، وما فيه مكتبات تنزّلها:

```
node --test
```

ولتشغيل الصفحة على جهازك (لازم سيرفر محلي لأن الصفحة تستخدم ES modules):

```
python -m http.server 8000
```

وبعدين افتح `http://localhost:8000`

## English

An educational, Arabic-first phishing link checker that runs **100% in the browser**. Paste a link or a whole SMS; it highlights the registrable domain (the real site), explains each phishing sign in plain Arabic, and never opens or sends the link. No server, no analytics, no external requests, and the page ships a `Content-Security-Policy` with `connect-src 'none'`.

What it detects: an official domain placed in the subdomain as a decoy, brand names (Saudi and global) used in a non-official domain, lookalike names (homoglyph skeleton and edit distance 1), IDN homographs (with a built-in Punycode decoder), URL shorteners, userinfo `@` tricks, raw IP hosts, cheap TLDs, odd ports, embedded redirects, executable downloads, `javascript:` / `data:` schemes, and urgency, credential, prize and delivery-fee wording in the Arabic message text.

It only reads the shape of the link. "No warning signs found" does not mean a link is safe. Run the tests with `node --test` (Node.js 20+, no dependencies).

بُني بمساعدة الذكاء الاصطناعي (Claude) وراجعه حسام

Built with AI assistance (Claude), reviewed by Hassam.

## License

MIT. See [LICENSE](LICENSE).
