// القوائم اللي يعتمد عليها الفاحص. كلها صغيرة ومكتوبة باليد، وتقدر تزيد عليها.

// امتدادات من جزأين: النطاق المسجّل قبلها بكلمة وحدة (مثل absher.gov.sa)
export const MULTI_SUFFIXES = new Set([
  'com.sa', 'gov.sa', 'edu.sa', 'net.sa', 'org.sa', 'med.sa', 'sch.sa', 'pub.sa',
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.eg', 'gov.eg', 'com.kw', 'com.qa', 'com.bh', 'com.om',
  'com.jo', 'com.lb', 'com.tr', 'com.au', 'co.in', 'co.jp', 'com.br', 'com.cn', 'co.za', 'com.pk',
  'co.ae', 'gov.ae', 'ac.ae',
]);

// استضافات مجانية: أي أحد يقدر يفتح عليها صفحة باسم يختاره
export const HOSTING_SUFFIXES = [
  'github.io', 'netlify.app', 'vercel.app', 'pages.dev', 'workers.dev', 'web.app', 'firebaseapp.com',
  'blogspot.com', 'weebly.com', 'wixsite.com', 'herokuapp.com', 'glitch.me', 'onrender.com',
  'duckdns.org', '000webhostapp.com', 'ngrok-free.app', 'ngrok.io', 'r2.dev', 'surge.sh', 'replit.app',
  'godaddysites.com', 'square.site', 'webflow.io', 'framer.app', 'carrd.co', 'my.canva.site',
];

// خدمات اختصار الروابط
export const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'rb.gy', 'shorturl.at', 'tiny.cc', 'ow.ly',
  'goo.gl', 'rebrand.ly', 't.ly', 's.id', 'lnkd.in', 'buff.ly', 'shorter.me', 'v.gd', 'bl.ink',
  'short.io', 'qr.ae', 'soo.gd', 'clck.ru', 'u.to', 'x.gd', 'urlz.fr', 'linktr.ee', 'surl.li', '2u.pw',
]);

// امتدادات رخيصة أو مجانية تكثر في روابط التصيّد
export const RISKY_TLDS = new Set([
  'top', 'xyz', 'click', 'link', 'live', 'icu', 'cfd', 'sbs', 'rest', 'buzz', 'tk', 'ml', 'ga', 'cf',
  'gq', 'zip', 'mov', 'cam', 'monster', 'quest', 'cyou', 'bond', 'lol', 'pw', 'work', 'support',
  'vip', 'win', 'loan', 'men', 'date', 'stream', 'gdn', 'bid', 'rip',
]);

// ملفات لو نزلت من رابط في رسالة فهي خطر
export const RISKY_FILES = ['apk', 'exe', 'scr', 'bat', 'cmd', 'msi', 'js', 'vbs', 'jar', 'dmg', 'pkg', 'ipa', 'lnk', 'iso'];

// جهات معروفة ونطاقاتها الرسمية.
// keys: الكلمة اللي لو طلعت في الرابط نعتبره يدّعي أنه هذي الجهة. arKeys: اسمها في نص الرسالة.
export const BRANDS = [
  { id: 'absher', ar: 'أبشر', domains: ['absher.sa'], keys: ['absher'], arKeys: ['ابشر'] },
  { id: 'nafath', ar: 'نفاذ', domains: ['nafath.sa', 'iam.gov.sa'], keys: ['nafath'], arKeys: ['نفاذ'] },
  { id: 'spl', ar: 'البريد السعودي (سبل)', domains: ['splonline.com.sa', 'sp.com.sa'], keys: ['splonline', 'saudipost', 'spl'], arKeys: ['سبل', 'البريد السعودي'] },
  { id: 'stc', ar: 'stc', domains: ['stc.com.sa', 'stcpay.com.sa'], keys: ['stc', 'stcpay', 'mystc'], arKeys: ['اس تي سي'] },
  { id: 'alrajhi', ar: 'مصرف الراجحي', domains: ['alrajhibank.com.sa'], keys: ['alrajhi', 'alrajhibank', 'rajhi'], arKeys: ['الراجحي'] },
  { id: 'snb', ar: 'البنك الأهلي السعودي', domains: ['alahli.com'], keys: ['alahli', 'snb'], arKeys: ['البنك الاهلي', 'الاهلي السعودي'] },
  { id: 'zatca', ar: 'هيئة الزكاة والضريبة', domains: ['zatca.gov.sa'], keys: ['zatca'], arKeys: ['الزكاه والضريبه'] },
  { id: 'madrasati', ar: 'منصة مدرستي', domains: ['madrasati.sa'], keys: ['madrasati'], arKeys: ['منصه مدرستي'] },
  { id: 'moe', ar: 'وزارة التعليم (نور)', domains: ['moe.gov.sa'], keys: [], arKeys: ['نظام نور'] },
  { id: 'aramex', ar: 'أرامكس', domains: ['aramex.com'], keys: ['aramex'], arKeys: ['ارامكس'] },
  { id: 'smsa', ar: 'سمسا', domains: ['smsaexpress.com'], keys: ['smsa', 'smsaexpress'], arKeys: ['سمسا'] },
  { id: 'dhl', ar: 'DHL', domains: ['dhl.com'], keys: ['dhl'], arKeys: [] },
  { id: 'paypal', ar: 'PayPal', domains: ['paypal.com'], keys: ['paypal'], arKeys: ['باي بال'] },
  { id: 'apple', ar: 'Apple', domains: ['apple.com', 'icloud.com'], keys: ['apple', 'icloud', 'appleid'], arKeys: ['ابل', 'ايكلاود'] },
  { id: 'google', ar: 'Google', domains: ['google.com', 'youtube.com', 'gmail.com'], keys: ['google', 'gmail', 'youtube'], arKeys: ['قوقل', 'جوجل'] },
  { id: 'microsoft', ar: 'Microsoft', domains: ['microsoft.com', 'live.com', 'office.com', 'outlook.com'], keys: ['microsoft', 'outlook', 'office365'], arKeys: ['مايكروسوفت'] },
  { id: 'netflix', ar: 'Netflix', domains: ['netflix.com'], keys: ['netflix'], arKeys: ['نتفلكس'] },
  { id: 'amazon', ar: 'Amazon', domains: ['amazon.com', 'amazon.sa'], keys: ['amazon'], arKeys: ['امازون'] },
  { id: 'noon', ar: 'نون', domains: ['noon.com'], keys: ['noon'], arKeys: [] },
  { id: 'whatsapp', ar: 'واتساب', domains: ['whatsapp.com', 'wa.me'], keys: ['whatsapp'], arKeys: ['واتساب', 'واتس اب'] },
  { id: 'instagram', ar: 'إنستقرام', domains: ['instagram.com'], keys: ['instagram'], arKeys: ['انستقرام', 'انستغرام'] },
  { id: 'snapchat', ar: 'سناب شات', domains: ['snapchat.com'], keys: ['snapchat'], arKeys: ['سناب شات'] },
  { id: 'tiktok', ar: 'تيك توك', domains: ['tiktok.com'], keys: ['tiktok'], arKeys: ['تيك توك'] },
  { id: 'facebook', ar: 'فيسبوك', domains: ['facebook.com', 'fb.com'], keys: ['facebook'], arKeys: ['فيسبوك'] },
  { id: 'telegram', ar: 'تيليجرام', domains: ['telegram.org', 't.me'], keys: ['telegram'], arKeys: ['تيليجرام', 'تلجرام'] },
  { id: 'x', ar: 'X (تويتر)', domains: ['x.com', 'twitter.com'], keys: ['twitter'], arKeys: ['تويتر'] },
];

// كلمات إنجليزية يحبها المحتال في اسم الرابط
export const BAIT_WORDS = [
  'login', 'signin', 'verify', 'verification', 'secure', 'security', 'update', 'confirm', 'account',
  'unlock', 'suspend', 'suspended', 'wallet', 'payment', 'invoice', 'refund', 'gift', 'prize', 'winner',
  'free', 'bonus', 'reward', 'claim', 'recover', 'password', 'otp', 'kyc', 'billing', 'delivery', 'tracking',
];

// عبارات في نص الرسالة. تتوحّد حروفها وقت المقارنة، وكل فئة تطلع ملاحظة وحدة.
export const MESSAGE_SIGNS = [
  { id: 'msg-urgency', severity: 'medium', ar: 'الرسالة تستعجلك أو تهددك، والجهات الرسمية ما تكلمك كذا',
    words: ['عاجل', 'فوراً', 'خلال 24 ساعة', 'خلال ساعة', 'خلال 48 ساعة', 'آخر فرصة', 'آخر تنبيه', 'سيتم إيقاف', 'تم إيقاف', 'تم تعليق', 'سيتم تعليق', 'تم حظر', 'سيتم حظر', 'تم تجميد', 'سيتم إغلاق', 'بيتقفل', 'قبل انتهاء'] },
  { id: 'msg-data', severity: 'high', ar: 'الرسالة تطلب بيانات سرّية، وما فيه جهة رسمية تطلبها برسالة',
    words: ['رمز التحقق', 'الرقم السري', 'كلمة المرور', 'رقم البطاقة', 'بيانات البطاقة', 'تحديث بياناتك', 'حدّث بياناتك', 'تحديث البيانات', 'تأكيد هويتك', 'تأكيد بياناتك', 'رقم الهوية', 'الكود المرسل'] },
  { id: 'msg-prize', severity: 'medium', ar: 'جائزة أو مبلغ ما كنت تنتظره: هذا الطُعم المعتاد',
    words: ['ربحت', 'مبروك', 'جائزة', 'جائزتك', 'هدية مجانية', 'مجاناً', 'تم اختيارك', 'استرداد مبلغ', 'مبلغ مسترد', 'مكافأة'] },
  { id: 'msg-delivery', severity: 'medium', ar: 'رسالة «شحنتك» مع رسوم أو عنوان ناقص من أشهر حيل التصيّد',
    words: ['شحنتك', 'طردك', 'رسوم التوصيل', 'رسوم الشحن', 'رسوم جمركية', 'تعذّر التسليم', 'تعذّر توصيل', 'عنوان غير مكتمل', 'العنوان غير صحيح', 'إعادة جدولة'] },
];
