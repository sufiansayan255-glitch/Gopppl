export interface SampleDataset {
  id: string;
  titleUrdu: string;
  titleEnglish: string;
  category: string;
  icon: string;
  description: string;
  content: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'youtube_review',
    titleUrdu: 'یوٹیوب ویڈیو کمنٹس (ٹیک ریویو)',
    titleEnglish: 'YouTube Tech Review Comments',
    category: 'youtube',
    icon: 'youtube',
    description: 'ایک نئے اسمارٹ فون کی ویڈیو پر 25+ صارفین کے دلچسپ کمنٹس اور سوالات',
    content: `@HamzaTech99: بھائی ویڈیو بہت شاندار تھی! لیکن کیا اس کی بیٹری ٹائمنگ گیمنگ میں 6 گھنٹے نکال لیتی ہے؟
@Ayesha_Vlogs: Mashallah brother, camera comparison with S24 was super clear. Thanks for honest review!
@Bilal_Ahmed: Price bohot zyada hai Pakistan mein. 180k for mid-range is too much!
@ZeeshanAli: بھائی کیا اس میں 120Hz AMOLED ڈسپلے واقعی کام کرتا ہے یا لیگ آتا ہے؟
@TariqMehmood: Sound quality per baat nahi ki aap ne, dual speakers hain ya single?
@SaraKhanOfficial: Super helpful video! I was confused between this and Redmi Note 13 Pro, now decided!
@UsmanRaza: بھائی گرم کتنا ہوتا ہے پب جی کھیلتے ہوئے؟ Throttling issue hai koi?
@TechFanatic_PK: Bro microphone sound in review was low, please check your mic audio.
@Noman_007: زبردست بھائی، اگلے ہفتے اس کا بیٹری ڈرین ٹیسٹ ضرور بنائیں۔
@FahadSheikh: کیا یہ واٹر پروف ہے؟ IP68 ریٹنگ ہے یا نہیں؟
@KhurramTech: Fast charging kitni der mein 100% karti hai? Adapter box mein hai ya alag se lena hoga?
@Zoya_Akhtar: Nice editing and presentation style, keep growing!
@Shahid_Khan: Price drops kab expect kar saktay hain Eid sale per?`
  },
  {
    id: 'whatsapp_team',
    titleUrdu: 'واٹس ایپ پروجیکٹ ٹیم چیٹ',
    titleEnglish: 'WhatsApp Project Team Chat',
    category: 'whatsapp',
    icon: 'message-square',
    description: 'ٹیم کی پروجیکٹ ڈیڈ لائن، فیچر اپ ڈیٹس اور بگ فکسز پر بحث',
    content: `[14/08/2024, 10:15 AM] عثمان احمد (ٹیم لیڈ): السلام علیکم ٹیم! آج شام 5 بجے تک کلائنٹ کو نیا ڈیش بورڈ ڈیمو دکھانا ہے۔ کیا پیمنٹ گیٹ وے ٹیسٹ ہو چکا ہے؟
[14/08/2024, 10:17 AM] علی رضا (بیک اینڈ): وعلیکم السلام بھائی، Stripe اور EasyPaisa API دونوں انٹیگریٹ ہو چکے ہیں لیکن ویب ہک میں تھوڑا تاخیر آ رہی ہے۔
[14/08/2024, 10:20 AM] فاطمہ نور (UI ڈیزائنر): عثمان بھائی، موبائل رسپانسو سکرینز کے فائنل فگما ڈیزائنز اپ ڈیٹ کر دیے ہیں۔ پلیز نیویگیشن بار ایک بار چیک کر لیں۔
[14/08/2024, 10:22 AM] حسن فاروق (QA): علی بھائی، جب صارف غلط OTP ڈالتا ہے تو ایپ کریش ہو رہی ہے۔ میں نے Jira پر بگ #402 لاگ کر دیا ہے۔
[14/08/2024, 10:25 AM] علی رضا (بیک اینڈ): اوکے حسن، میں OTP ایرر ہینڈلنگ کو اگلے 30 منٹ میں فکس کر کے نیا بلڈ پش کرتا ہوں۔
[14/08/2024, 10:28 AM] عثمان احمد (ٹیم لیڈ): زبردست۔ فاطمہ، کلائنٹ کا کہنا تھا کہ اردو اور انگلش دونوں زبانوں کا ٹوگل صاف نظر آنا چاہیے۔
[14/08/2024, 10:30 AM] فاطمہ نور (UI ڈیزائنر): جی سر، ہیڈر میں دائیں طرف لینگویج سوئچر شامل کر دیا ہے۔
[14/08/2024, 10:35 AM] عثمان احمد (ٹیم لیڈ): 3 بجے فائنل ریہرسل کال کریں گے۔ سب لوگ اپنا کام 2:30 تک پش کر دیں۔ شکریہ!`
  },
  {
    id: 'customer_support',
    titleUrdu: 'کسٹمر سپورٹ فیڈبیک و شکایات',
    titleEnglish: 'Customer Support Feedback & Complaints',
    category: 'customer',
    icon: 'headphones',
    description: 'ای کامرس پلیٹ فارم کے صارفین کے مسائل، ڈیلیوری فیڈبیک اور ریفنڈ کے پیغامات',
    content: `Customer #1042: السلام علیکم، میرا آرڈر #PK-8891 ابھی تک ڈیلیور نہیں ہوا۔ 5 دن ہو چکے ہیں اور کوریئر ٹریکنگ اپ ڈیٹ نہیں ہو رہی!
Support Rep: وعلیکم السلام محترم کسٹمر، زحمت کے لیے معذرت خواہ ہیں۔ کوریئر پارٹنر کو ارجنٹ فالو اپ بھیج دیا گیا ہے، آج شام تک ڈیلیور ہو جائے گا۔
Customer #1045: I received wrong shirt size (XL instead of Medium). How can I initiate replacement?
Customer #1050: پروڈکٹ کا کوالٹی بہت زبردست ہے! پیکیجنگ بھی کمال تھی، 5 سٹار ریٹنگ۔
Customer #1058: ریفنڈ پالیسی کتنے دنوں کی ہے؟ اگر سوٹ پسند نہ آئے تو کیا پیسے واپس مل جائیں گے؟
Customer #1063: بھائی کیش آن ڈیلیوری میں رائڈر نے اضافی 100 روپے مانگے، پلیز چیک کریں۔
Customer #1070: آپ کی موبائل ایپ میں سرچ فلٹر کام نہیں کر رہا، پلیز فکس کریں۔
Customer #1081: شکریہ آپ کی ٹیم کا، کسٹمر کیئر نے 10 منٹ میں میرا مسئلہ حل کر دیا!`
  },
  {
    id: 'live_webinar',
    titleUrdu: 'آن لائن لائیو سیشن و کورس سوالات',
    titleEnglish: 'Online Webinar & Student Q&A',
    category: 'social',
    icon: 'graduation-cap',
    description: 'اے آئی اور فری لانسنگ ویبینار میں طلبا کے عمومی سوالات اور نوٹس',
    content: `طالب علم 1: سر کیا نان ٹیکنیکل بیک گراؤنڈ والے سٹوڈنٹس بھی پراپٹ انجینئرنگ سیکھ سکتے ہیں؟
طالب علم 2: کلاس کی ریکارڈنگ کب تک پورٹل پر اپ لوڈ ہو گی؟
طالب علم 3: Freelancing platforms per payment withdrawal ke liye kaunsa bank best hai?
طالب علم 4: سر کیا آپ کورس کے بعد سرٹیفکیٹ اور انٹرن شپ اسسٹنس دیں گے؟
طالب علم 5: Gemini API اور OpenAI کے درمیان لاگت اور رفتار کا کیا فرق ہے؟
طالب علم 6: Assignment deadline Friday midnight hai ya Sunday?
طالب علم 7: بہت زبردست پریزنٹیشن سر، سلائیڈز شیئر کر دیں۔`
  }
];
