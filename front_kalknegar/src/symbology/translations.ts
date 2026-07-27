/**
 * ترجمه‌های فارسی برای entity ها و modifier های نمادهای نظامی
 */

import type { SymbolSetMap } from "@/symbology/types";

export const entityTranslations: Record<string, string> = {
  // Entity translations
  Unspecified: "نامشخص",
  "Movement and Maneuver": "حرکت و مانور",
  Sustainment: "پشتیبانی و تدارکات",
  Naval: "دریایی",
  "Named Headquarters": "ستاد نام‌گذاری‌شده",
  "Emergency Operation": "عملیات اضطراری",
  "Law Enforcement": "اجرای قانون",
  "{reserved for future use}": "رزرو برای استفادهٔ آینده",
  "{Reserved for future use}": "رزرو برای استفادهٔ آینده",
  "Antitank/Antiarmor": "ضدتانک/ضدزره",
  Armored: "زرهی",
  "Armor/Armored/Mechanized/Self–Propelled/ Tracked": "زرهی/مکانیزه/خودکششی/زنجیری",
  "Armored/Mechanized/Tracked": "زرهی/مکانیزه/زنجیری",
  Reconnaissance: "شناسایی",
  CBT: "رزمی",
  "Infantry Fighting Vehicle": "خودروی رزمی پیاده‌نظام",
  Fires: "آتش",
  Protection: "حفاظت",
  "Command and Control": "فرماندهی و کنترل",
  "Unspecified Command and Control": "فرماندهی و کنترل نامشخص",
  "Broadcast Transmitter Antennae": "آنتن فرستنده پخش",
  "Civil Affairs": "امور غیرنظامی",
  "Civil-Military Cooperation": "همکاری نظامی-مدنی",
  "Information Operations": "عملیات اطلاعاتی",
  "Reconnaissance and Liaison Element": "عنصر شناسایی و ارتباط",
  "Psychological Operations (PSYOPS)": "عملیات روانی",
  Radio: "رادیو",
  "Radio Relay": "رله رادیویی",
  "Radio Teletype Centre": "مرکز تلکس رادیویی",
  Signal: "سیگنال",
  Teletype: "تلکس",
  "Tactical Satellite": "ماهواره تاکتیکی",
  "Video Imagery (Combat Camera)": "تصاویر ویدیویی (دوربین رزمی)",

  // Movement and Maneuver
  "Movement and Manoeuvre": "حرکت و مانور",
  "Air Assault with Organic Lift": "حمله هوایی با بالابر ارگانیک",
  "Air Traffic Services/Airfield Operations": "خدمات ترافیک هوایی/عملیات فرودگاه",
  Amphibious: "آبی‌خاکی",
  "Antitank/Antiarmour": "ضدتانک/ضدزره",
  Armoured: "زرهی",
  Motorized: "موتوریزه",
  "Armour/Armoured/Mechanized/Self-Propelled/ Tracked": "زرهی/مکانیزه/خودکششی/زنجیری",
  "Reconnaissance/Cavalry/Scout": "شناسایی/سواره‌نظام/پیشاهنگ",
  "Army Aviation/Aviation Rotary Wing": "هوانیروز ارتش/هواپیمای بالگردی",
  "Aviation Composite": "هواپیمای ترکیبی",
  "Aviation Fixed Wing": "هواپیمای بال ثابت",
  Combat: "رزمی",
  "Combined Arms": "ترکیبی",
  Infantry: "پیاده‌نظام",
  "Main Gun System": "سیستم توپ اصلی",
  "Mechanised Infantry with Main Gun System": "پیاده‌نظام مکانیزه با سیستم توپ اصلی",
  "Main Gun System/Heavy Weapon": "سیستم توپ اصلی/سلاح سنگین",
  Observer: "ناظر",
  "Reconnaissance and Surveillance": "شناسایی و نظارت",
  Marine: "دریایی",
  "Sea Air Land (SEAL)": "دریایی-هوایی-زمینی",
  Sniper: "تیرانداز",
  Surveillance: "نظارت",
  "Special Forces": "نیروهای ویژه",
  "Special Operations Forces (SOF)": "نیروهای عملیات ویژه",
  "Fixed Wing PSYOPS": "عملیات روانی بال ثابت",
  "Rotary Wing PSYOPS": "عملیات روانی بالگردی",
  "Unmanned Aircraft Systems (UAS)": "سیستم‌های هواپیمای بدون سرنشین",
  "Unmanned Aircraft Systems (UAS) - Fixed Wing":
    "سیستم‌های هواپیمای بدون سرنشین - بال ثابت",
  "Unmanned Aircraft Systems (UAS) - Rotary Wing":
    "سیستم‌های هواپیمای بدون سرنشین - بالگردی",
  "Unmanned Aircraft Systems (UAS) - Lighter Than Air":
    "سیستم‌های هواپیمای بدون سرنشین - سبک‌تر از هوا",
  "Unmanned Aircraft Systems (UAS) - Tethered":
    "سیستم‌های هواپیمای بدون سرنشین - مهار شده",
  "Unmanned Aircraft Systems (UAS) - Unmanned Combat Air Vehicle (UCAV)":
    "سیستم‌های هواپیمای بدون سرنشین - وسیله نقلیه هوایی رزمی بدون سرنشین",
  "Unmanned Aircraft Systems (UAS) - Unmanned Combat Air Vehicle (UCAV) - Fixed Wing":
    "سیستم‌های هواپیمای بدون سرنشین - وسیله نقلیه هوایی رزمی بدون سرنشین - بال ثابت",
  "Unmanned Aircraft Systems (UAS) - Unmanned Combat Air Vehicle (UCAV) - Rotary Wing":
    "سیستم‌های هواپیمای بدون سرنشین - وسیله نقلیه هوایی رزمی بدون سرنشین - بالگردی",
  "Unmanned Aircraft Systems (UAS) - Unmanned Combat Air Vehicle (UCAV) - Lighter Than Air":
    "سیستم‌های هواپیمای بدون سرنشین - وسیله نقلیه هوایی رزمی بدون سرنشین - سبک‌تر از هوا",
  "Unmanned Aircraft Systems (UAS) - Unmanned Combat Air Vehicle (UCAV) - Tethered":
    "سیستم‌های هواپیمای بدون سرنشین - وسیله نقلیه هوایی رزمی بدون سرنشین - مهار شده",

  // Fire Support
  "Fire Support": "پشتیبانی آتش",
  "Air Defence": "دفاع هوایی",
  "Air/Land Naval Gunfire Liaison": "ارتباط آتش توپخانه دریایی هوایی/زمینی",
  Artillery: "توپخانه",
  "Field Artillery": "توپخانه صحرایی",
  Howitzer: "هاویتزر",
  Mortar: "خمپاره",
  "Multiple Rocket Launcher": "پرتابگر موشک چندگانه",
  "Self-Propelled Artillery": "توپخانه خودکششی",
  "Towed Artillery": "توپخانه یدک‌کش",

  // Intelligence
  Intelligence: "اطلاعات",
  "Electronic Warfare": "جنگ الکترونیک",
  "Signals Intelligence": "اطلاعات سیگنال",
  "Signals Intelligence – Space": "اطلاعات سیگنال - فضا",
  "Signals Intelligence – Air": "اطلاعات سیگنال - هوا",
  "Signals Intelligence – Land": "اطلاعات سیگنال - زمین",
  "Signals Intelligence – Surface": "اطلاعات سیگنال - سطح",
  "Signals Intelligence – Subsurface": "اطلاعات سیگنال - زیرسطح",
  Cyberspace: "فضای سایبری",

  // Additional Entity Types
  Liaison: "ارتباط",
  "Nuclear - Type 1": "هسته‌ای - نوع 1",
  "Nuclear - Type 2": "هسته‌ای - نوع 2",
  "Nuclear - Type 3": "هسته‌ای - نوع 3",
};

export const symbolSetTranslations: Record<string, string> = {
  Air: "هوایی",
  "Air missile": "موشک هوایی",
  Space: "فضایی",
  "Space Missile": "موشک فضایی",
  "واحد زمینی": "واحد زمینی", // قبلاً فارسی است
  "Land Unit": "واحد زمینی",
  "Land civilian unit/Organization": "واحد/سازمان غیرنظامی زمینی",
  "Land Equipment": "تجهیزات زمینی",
  "Land equipment": "تجهیزات زمینی",
  "Land Installation": "تأسیسات زمینی",
  "Land installations": "تأسیسات زمینی",
  "Control Measure": "اقدام کنترل",
  "Control measure": "اقدام کنترل",
  "Dismounted Individual": "فرد پیاده",
  "Sea Surface": "سطح دریا",
  "Sea surface": "سطح دریا",
  "Sea Subsurface": "زیر سطح دریا",
  "Sea subsurface": "زیرسطح دریا",
  "Mine Warfare": "جنگ مین",
  "Mine warfare": "جنگ مین",
  "Activity/Event": "فعالیت/رویداد",
  "Signals Intelligence – Space": "اطلاعات سیگنالی فضایی",
  "Signals Intelligence – Air": "اطلاعات سیگنالی هوایی",
  "Signals Intelligence – Land": "اطلاعات سیگنالی زمینی",
  "Signals Intelligence – Surface": "اطلاعات سیگنالی سطحی",
  "Signals Intelligence – Subsurface": "اطلاعات سیگنالی زیرسطحی",
  Cyberspace: "فضای سایبری",
};

export const modifierTranslations: Record<string, string> = {
  // Modifier translations
  Attack: "حمله",
  Biological: "بیولوژیکی",
  Chemical: "شیمیایی",
  Nuclear: "هسته‌ای",
  Combat: "رزمی",
  "Command and Control": "فرماندهی و کنترل",
  Construction: "ساخت‌وساز",
  Decontamination: "ضدعفونی",
  Detention: "بازداشت",
  "Direct Communications": "ارتباطات مستقیم",
  Diving: "غواصی",
  Division: "لشکر",
  Dog: "سگ",
  Drilling: "حفاری",
  "Electro-Optical": "الکترو-اپتیکی",
  Enhanced: "بهبود یافته",
  "Explosive Ordnance Disposal (EOD)": "دفع مهمات انفجاری",
  "Fire Direction Centre": "مرکز هدایت آتش",
  Force: "نیرو",
  Forward: "جلو",
  "Ground Station Module": "ماژول ایستگاه زمینی",
  "Landing Support": "پشتیبانی فرود",
  "Large Extension Node": "گره گسترش بزرگ",
  Maintenance: "نگهداری",
  Meteorological: "هواشناسی",
  "Mine Countermeasure": "ضدمین",
  Missile: "موشک",
  "Mobile Advisor and Support": "مشاور و پشتیبانی متحرک",
  "Mobile Subscriber Equipment": "تجهیزات مشترک متحرک",
  "Mobility Support": "پشتیبانی تحرک",
  "Movement Control Centre": "مرکز کنترل حرکت",
  Multinational: "چندملیتی",
  "Multinational Specialized Unit": "واحد تخصصی چندملیتی",
  "Multiple Rocket Launcher": "پرتابگر موشک چندگانه",
  "NATO Medical Role 1": "نقش پزشکی ناتو 1",
  "NATO Medical Role 2": "نقش پزشکی ناتو 2",
  "NATO Medical Role 3": "نقش پزشکی ناتو 3",
  "NATO Medical Role 4": "نقش پزشکی ناتو 4",
  Naval: "دریایی",
  "Node Centre": "مرکز گره",
  Operations: "عملیات",
  Radar: "رادار",
  "Reserved for Future Use": "محفوظ برای استفاده آینده",
  "Version Extension Flag": "پرچم گسترش نسخه",
  // Modifier 1
  Unspecified: "نامشخص",
  "Air Mobile/Air Assault": "هوایی متحرک/حمله هوایی",
  Area: "منطقه",
  Border: "مرزی",
  Bridging: "پل‌سازی",
  "Close Protection": "حفاظت نزدیک",
  "Communications Contingency Package": "بسته اضطراری ارتباطات",
  "Cross Cultural Communication": "ارتباط بین‌فرهنگی",
  "Crowd and Riot Control": "کنترل جمعیت و شورش",
  "Nuclear, Biological, Chemical (NBC)": "هسته‌ای، بیولوژیکی، شیمیایی",
  "Patient Evacuation Coordination Centre": "مرکز هماهنگی تخلیه بیمار",
  Radiological: "پرتوافشانی",
  "Search and Rescue": "جستجو و نجات",
  Security: "امنیت",
  "Shore Party": "گروه ساحلی",
  "Single Rocket Launcher": "پرتابگر موشک تکی",
  Smoke: "دود",
  "Special Operations Forces (SOF)": "نیروهای عملیات ویژه",
  "Special Purpose Marine Air-Ground Task Force": "نیروی ویژه دریایی هوایی-زمینی",
  Supply: "تأمین",
  Tactical: "تاکتیکی",
  "Task Force": "نیروی کار",
  Topographic: "توپوگرافی",
  Troop: "نیرو",
  "Vertical or Short Take-Off and Landing (VTOL/VSTOL)": "برخاست و فرود عمودی یا کوتاه",
  Veterinary: "دامپزشکی",
  Wheeled: "چرخدار",
  "High to Low Altitude": "ارتفاع بالا تا پایین",
  "Medium to Low Altitude": "ارتفاع متوسط تا پایین",
  Refuel: "سوخت‌گیری",
  Utility: "ابزاری",
  "Combat Search and Rescue": "جستجو و نجات رزمی",

  // Additional Modifiers
  "Probable Submarine": "زیردریایی احتمالی",
  "Certain Submarine": "زیردریایی قطعی",
  "Anti-torpedo Torpedo": "اژدر ضد اژدر",
  "Hijacking/Hijacked": "ربودن/ربوده شده",
  "Air Independent Propulsion": "پیشرانه مستقل از هوا",
  "Diesel Electric, General": "دیزل الکتریک، عمومی",
  "Diesel - Type 1": "دیزل - نوع 1",
  "Diesel - Type 2": "دیزل - نوع 2",
  "Diesel - Type 3": "دیزل - نوع 3",
  "Nuclear Powered, General": "هسته‌ای، عمومی",
};

/**
 * نام‌هایی که در MIL-STD-2525D وجود دارند اما همتای مستقیمی در APP-6D ندارند.
 * این فهرست عمداً بر اساس نام واقعی اصطلاح است، نه کد یا عنوانی مانند «گزینه».
 */
const supplementalTranslations: Record<string, string> = {
  "Special Troops": "نیروهای ویژه",
  "Air and Missile Defense": "دفاع هوایی و موشکی",
  "Chemical, Biological, Radiological, Nuclear, and High-Yield Explosives":
    "مواد شیمیایی، زیستی، پرتوزا، هسته‌ای و انفجاری پرقدرت",
  "Military History": "تاریخ نظامی",
  "Floating Craft": "شناور",
  "NATO Supply Class - ALL": "همه رده‌های تدارکاتی ناتو",
  "Interpreter/Translator": "مترجم شفاهی/کتبی",
  "Army Field Support": "پشتیبانی میدانی ارتش",
  "Contracting Services": "خدمات پیمانکاری",
  "Parachute Rigger": "چتربند",
  "Light Armor Reconnaissance": "شناسایی زرهی سبک",
  "Assault Breacher Vehicle (ABV) with Combat Dozer Blade":
    "خودروی رخنه‌گر تهاجمی با تیغه بولدوزر رزمی",
  "Medium Capability Equipment": "تجهیزات با توان متوسط",
  "Heavy Capability Equipment": "تجهیزات با توان سنگین",
  "Target Handover": "تحویل هدف",
  "Key Terrain": "عارضه کلیدی زمین",
  "Marine Life": "زیست دریایی",
  "Sea Anomaly (Wake, Current, Knuckle)": "ناهنجاری دریایی (رد، جریان، پیچش)",
  "Bottom Return/Non-MILCO, Wreck, Dangerous": "بازتاب بستر/غیرنظامی، لاشه خطرناک",
  "Bottom Return/Non-MILCO, Wreck, Non Dangerous": "بازتاب بستر/غیرنظامی، لاشه غیرخطرناک",
  "Known Point": "نقطه شناخته‌شده",
  Fenced: "حصارکشی‌شده",
  Mineline: "خط مین",
  "Cordon and Knock": "محاصره و اخطار",
  "Cordon and Search": "محاصره و جستجو",
  Suppress: "سرکوب",
  "Advance to Contact": "پیشروی تا تماس",
  Capture: "تصرف",
  "Conduct Exploitation": "اجرای بهره‌برداری",
  Deny: "ممانعت",
  Envelop: "احاطه",
  Exfiltrate: "خروج نفوذی",
  Infiltrate: "نفوذ",
  Locate: "مکان‌یابی",
  Pursue: "تعقیب",
  "Signal Intercept": "رهگیری سیگنال",
  Botnet: "شبکه بات",
  "Command and Control (C2)": "فرماندهی و کنترل",
  Herder: "هدایت‌کننده",
  "Callback Domain": "دامنه بازگشت تماس",
  Zombie: "سامانه زامبی",
  Infection: "آلودگی",
  "Advanced Persistent Threat (APT)": "تهدید پایدار پیشرفته",
  "APT with C2": "تهدید پایدار پیشرفته با فرماندهی و کنترل",
  "APT with Self Propagation": "تهدید پایدار پیشرفته با انتشار خودکار",
  "APT with C2 and Self Propagation":
    "تهدید پایدار پیشرفته با فرماندهی و کنترل و انتشار خودکار",
  "APT Other": "سایر تهدیدهای پایدار پیشرفته",
  "Non-Advanced Persistent Threat (NAPT)": "تهدید پایدار غیرپیشرفته",
  "NAPT with C2": "تهدید پایدار غیرپیشرفته با فرماندهی و کنترل",
  "NAPT with Self Propagation": "تهدید پایدار غیرپیشرفته با انتشار خودکار",
  "NAPT with C2 and Self Propagation":
    "تهدید پایدار غیرپیشرفته با فرماندهی و کنترل و انتشار خودکار",
  "NAPT Other": "سایر تهدیدهای پایدار غیرپیشرفته",
  "Health and Status": "سلامت و وضعیت",
  "Network Outage": "قطعی شبکه",
  Unknown: "ناشناخته",
  Impaired: "مختل",
  "Device Type": "نوع دستگاه",
  "Core Router": "مسیریاب هسته",
  Router: "مسیریاب",
  "Cross Domain Solution": "راهکار میان‌دامنه‌ای",
  "Mail Server": "کارساز رایانامه",
  "Web Server": "کارساز وب",
  "Domain Server": "کارساز دامنه",
  "File Server": "کارساز پرونده",
  "Peer-to-Peer Node": "گره همتا‌به‌همتا",
  Firewall: "دیوار آتش",
  Switch: "سوئیچ شبکه",
  Host: "میزبان",
  "Virtual Private Network (VPN)": "شبکه خصوصی مجازی",
  "Device Domain": "دامنه دستگاه",
  "Department of Defense (DoD)": "وزارت دفاع",
  Contractor: "پیمانکار",
  "Supervisory Control and Data Acquisition (SCADA)": "کنترل نظارتی و گردآوری داده",
  "Non-Government": "غیردولتی",
  Effect: "اثر",
  Degradation: "افت عملکرد",
  "Data Spoofing": "جعل داده",
  "Data Manipulation": "دست‌کاری داده",
  "Power Outage": "قطعی برق",
  "Service Outage": "قطعی خدمت",
  "Device Outage": "ازکارافتادگی دستگاه",
  "Multiple Strikes – STRIKWARN": "هشدار چند حمله",
  "Mobility Assault": "تحرک تهاجمی",
  "Load Handling System": "سامانه جابه‌جایی بار",
  "Palletized Load System": "سامانه بار پالت‌شده",
  "Retransmission Site": "محل بازپخش",
  Assault: "تهاجمی",
  "Network or Network Operations": "شبکه یا عملیات شبکه",
  "Airfield, Aerial Port of Debarkation, or Aerial Port of Embarkation":
    "فرودگاه، بندر هوایی تخلیه یا بارگیری",
  Pipeline: "خط لوله",
  Postal: "پستی",
  "Independent Command": "فرماندهی مستقل",
  Hijacker: "هواپیماربا",
  "Multi-purpose Blade": "تیغه چندمنظوره",
  "Tank-width Mine Plow": "مین‌روب شخمی هم‌عرض تانک",
  MedEvac: "تخلیه پزشکی",
  "Petroleum, oil, and lubricants (POL)": "سوخت، نفت و روانکار",
  Robotic: "رباتیک",
  "Wheeled limited cross country": "چرخ‌دار با توان محدود خارج جاده",
  "Wheeled cross country": "چرخ‌دار خارج جاده",
  Tracked: "زنجیری",
  "Wheeled and tracked combination": "ترکیب چرخ‌دار و زنجیری",
  "No Vehicles": "بدون خودرو",
  "Over snow (prime mover)": "برف‌رو (کشنده اصلی)",
  Sled: "سورتمه",
  Barge: "دوبه",
  "Anti-Aircraft Fire Control": "کنترل آتش ضدهوایی",
  "Airborne Search and Bombing": "جستجو و بمباران هوابرد",
  "Airborne Intercept": "رهگیری هوابرد",
  Altimeter: "ارتفاع‌سنج",
  "Airborne Reconnaissance and Mapping": "شناسایی و نقشه‌برداری هوابرد",
  "Air Traffic Control": "کنترل ترافیک هوایی",
  "Beacon Transponder (not IFF)": "ترانسپوندر راهنما (غیر از تشخیص دوست از دشمن)",
  "Battlefield Surveillance": "پایش میدان نبرد",
  "Controlled Approach": "تقرب کنترل‌شده",
  "Controlled Intercept": "رهگیری کنترل‌شده",
  "Cellular/Mobile": "سلولی/همراه",
  "Coastal Surveillance": "پایش ساحلی",
  "Decoy/Mimic": "طعمه/شبیه‌ساز",
  "Data Transmission": "انتقال داده",
  "Earth Surveillance": "پایش زمین",
  "Early Warning": "هشدار زودهنگام",
  "Fire Control": "کنترل آتش",
  "Ground Mapping": "نقشه‌برداری زمینی",
  "Height Finding": "ارتفاع‌یابی",
  "Harbor Surveillance": "پایش بندر",
  "Identification, Friend or Foe (Interrogator)": "تشخیص دوست از دشمن (پرسشگر)",
  "Instrument Landing System": "سامانه فرود ابزاری",
  "Ionospheric Sounding": "پیمایش یون‌سپهر",
  "Identification, Friend or Foe (Transponder)": "تشخیص دوست از دشمن (پاسخ‌دهنده)",
  "Barrage Jammer": "اخلالگر سدّی",
  "Click Jammer": "اخلالگر کلیکی",
  "Deceptive Jammer": "اخلالگر فریبنده",
  "Frequency Swept Jammer": "اخلالگر جاروب فرکانسی",
  "Jammer (general)": "اخلالگر (عمومی)",
  "Noise Jammer": "اخلالگر نویزی",
  "Pulsed Jammer": "اخلالگر پالسی",
  "Repeater Jammer": "اخلالگر تکرارکننده",
  "Spot Noise Jammer": "اخلالگر نویزی نقطه‌ای",
  "Transponder Jammer": "اخلالگر ترانسپوندر",
  "Missile Acquisition": "کشف موشک",
  "Missile Control": "کنترل موشک",
  "Missile Downlink": "پیوند پایین موشک",
  "Multi-Function": "چندمنظوره",
  "Missile Guidance": "هدایت موشک",
  "Missile Homing": "آشیانه‌یابی موشک",
  "Missile Tracking": "ردگیری موشک",
  "Navigational/General": "ناوبری/عمومی",
  "Navigational/Distance Measuring Equipment": "ناوبری/تجهیزات فاصله‌سنجی",
  "Navigation/Terrain Following": "ناوبری/تعقیب عوارض زمین",
  "Navigational/Weather Avoidance": "ناوبری/اجتناب از آب‌وهوا",
  "Omni-Line of Sight (LOS)": "خط دید همه‌جهته",
  "Proximity Use": "کاربرد مجاورتی",
  "Point-to-Point Line of Sight (LOS)": "خط دید نقطه‌به‌نقطه",
  Instrumentation: "ابزار دقیق",
  "Satellite Downlink": "پیوند پایین ماهواره",
  "Surface Search": "جستجوی سطحی",
  "Shell Tracking": "ردگیری گلوله",
  "Satellite Uplink": "پیوند بالای ماهواره",
  "Target Illumination": "روشن‌سازی هدف",
  "Tropospheric Scatter": "پراکندگی تروپوسفری",
  "Target Tracking": "ردگیری هدف",
  "Video Remoting": "کنترل ویدئویی از راه دور",
  Experimental: "آزمایشی",
  Guerilla: "چریکی",
  "Air Assault": "هجوم هوایی",
  "Very Heavy": "بسیار سنگین",
  "Navy Barge, Self-Propelled": "دوبه نیروی دریایی، خودکششی",
  "Navy Barge, Not Self-Propelled": "دوبه نیروی دریایی، غیرخودکششی",
  "Tug Harbor": "یدک‌کش بندری",
  "Ocean Going Tug Boat": "یدک‌کش اقیانوس‌پیما",
  "Surface Deployment and Distribution Command": "فرماندهی استقرار و توزیع سطحی",
  "Noncombatant Generic Vessel": "شناور عمومی غیررزمی",
  Composite: "ترکیبی",
  "Light and Medium": "سبک و متوسط",
  "Security Force Assistance": "کمک به نیروی امنیتی",
  Railway: "راه‌آهن",
  "Tractor Trailer": "کشنده و تریلر",
  "Wheeled LTD": "چرخ‌دار با تحرک محدود",
  "Wheeled X": "چرخ‌دار خارج جاده",
  Arrow: "پیکان",
  "Ground-Based Interceptor (GBI)": "رهگیر زمین‌پایه",
  "Standard Missile Terminal Phase (SM-T)": "موشک استاندارد مرحله پایانی",
  "Terminal High Altitude Area Defense (THAAD)": "دفاع منطقه‌ای ارتفاع‌بالای پایانی",
  "Close Range (CRBM)": "برد نزدیک",
  "Standard Missile – 3 (SM-3)": "موشک استاندارد ۳",
  Debris: "آوار",
};

const registeredTranslations: Record<string, string> = {};

function normalizeTerm(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

const persianLetterNames: Record<string, string> = {
  A: "اِی",
  B: "بی",
  C: "سی",
  D: "دی",
  E: "ای",
  F: "اِف",
  G: "جی",
  H: "اِچ",
  I: "آی",
  J: "جِی",
  K: "کِی",
  L: "اِل",
  M: "اِم",
  N: "اِن",
  O: "اُو",
  P: "پی",
  Q: "کیو",
  R: "آر",
  S: "اِس",
  T: "تی",
  U: "یو",
  V: "وی",
  W: "دابلیو",
  X: "اِکس",
  Y: "وای",
  Z: "زِد",
};

const romanNumerals: Record<string, string> = {
  I: "۱",
  II: "۲",
  III: "۳",
  IV: "۴",
  V: "۵",
  VI: "۶",
  VII: "۷",
  VIII: "۸",
  IX: "۹",
  X: "۱۰",
};

const latinMilitaryTerms: Record<string, string> = {
  BAND: "باند",
  MILCO: "میلکو",
  NATO: "ناتو",
  MEDEVAC: "مِدِواک",
  NOTACK: "نوتک",
  POSCON: "پازکان",
  STRIKWARN: "هشدار حمله",
};

function transliterateLatinToken(token: string): string {
  const upper = token.toUpperCase();
  return (
    romanNumerals[upper] ||
    latinMilitaryTerms[upper] ||
    [...upper].map((letter) => persianLetterNames[letter] || letter).join("‌")
  );
}

/**
 * مخفف‌های استاندارد (مانند CBRN و IED) را نیز با حروف فارسی نمایش می‌دهد
 * تا هیچ بخش لاتین در عنوان قابل مشاهده باقی نماند.
 */
function persianizeLatinFragments(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[A-Za-z]+/g, transliterateLatinToken)
    .replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

/**
 * نگاشت نام‌های هم‌کد میان دو استاندارد را در زمان بارگذاری ثبت می‌کند.
 * به این ترتیب ترجمه‌های کامل APP-6D برای نام‌های MIL-STD-2525D نیز استفاده می‌شوند.
 */
export function registerSymbologyTranslation(source: string, translation: string) {
  const key = normalizeTerm(source);
  const value = normalizeTerm(translation);
  if (key && value && key !== value) registeredTranslations[key] = value;
}

/**
 * همهٔ عنوان‌های هم‌کد دو استاندارد را ثبت می‌کند. این تابع باید پیش از
 * نمایش داده‌های استاندارد انگلیسی فراخوانی شود.
 */
export function registerStandardSymbologyTranslations(
  source: SymbolSetMap,
  translated: SymbolSetMap,
) {
  const textFields = ["entity", "entityType", "entitySubtype", "modifier"] as const;
  for (const [symbolSet, sourceSet] of Object.entries(source)) {
    const translatedSet = translated[symbolSet];
    if (!translatedSet) continue;
    for (const collection of ["mainIcon", "modifierOne", "modifierTwo"] as const) {
      const translatedByCode = new Map(
        translatedSet[collection].map((item) => [item.code, item]),
      );
      for (const sourceItem of sourceSet[collection]) {
        const translatedItem = translatedByCode.get(sourceItem.code);
        if (!translatedItem) continue;
        const sourceRecord = sourceItem as unknown as Partial<
          Record<(typeof textFields)[number], string>
        >;
        const translatedRecord = translatedItem as unknown as Partial<
          Record<(typeof textFields)[number], string>
        >;
        for (const field of textFields) {
          const sourceText = sourceRecord[field];
          const translatedText = translatedRecord[field];
          if (sourceText && translatedText)
            registerSymbologyTranslation(sourceText, translatedText);
        }
      }
    }
  }
}

function translateMineCombination(value: string): string | undefined {
  if (!value.includes("Mine")) return undefined;
  const replacements: Array<[string, string]> = [
    ["Antipersonnel Mine with Directional Effects", "مین ضدنفر با اثر جهت‌دار"],
    ["Antitank Mine with Antihandling Device", "مین ضدتانک با سازوکار ضدجابجایی"],
    ["Wide Area Antitank Mine", "مین ضدتانک منطقه‌گسترده"],
    ["Antipersonnel Mine", "مین ضدنفر"],
    ["Antitank Mine", "مین ضدتانک"],
    ["Mine Cluster", "خوشه مین"],
  ];
  let translated = value;
  for (const [english, persian] of replacements)
    translated = translated.replaceAll(english, persian);
  translated = translated.replaceAll(", and ", " و ").replaceAll(" and ", " و ");
  return /[A-Za-z]/.test(translated) ? undefined : translated;
}

function translateTerm(value: string, primary: Record<string, string>): string {
  const normalized = normalizeTerm(value);
  const translated =
    primary[normalized] ||
    supplementalTranslations[normalized] ||
    registeredTranslations[normalized] ||
    translateMineCombination(normalized) ||
    normalized;
  return persianizeLatinFragments(translated);
}

export function translateEntity(entity: string): string {
  return translateTerm(entity, entityTranslations);
}

export function translateModifier(modifier: string): string {
  return translateTerm(modifier, modifierTranslations);
}

export function translateEntityType(entityType: string): string {
  return translateTerm(entityType, entityTranslations);
}

export function translateEntitySubtype(entitySubtype: string): string {
  return translateTerm(entitySubtype, entityTranslations);
}

export function translateSymbolSet(symbolSetName: string): string {
  return persianizeLatinFragments(symbolSetTranslations[symbolSetName] || symbolSetName);
}
