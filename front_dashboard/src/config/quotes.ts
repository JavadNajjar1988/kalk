interface Quote {
  text: string;
  author: string;
  category?: 'military' | 'leadership' | 'strategy' | 'wisdom' | 'patriotic';
}

// بانک سخنان معروف
const quotes: Quote[] = [
  {
    text: "پیروزی از آن کسی است که بیش از همه تحمل کند.",
    author: "امام علی (ع)",
    category: "leadership"
  },
  {
    text: "فرماندهی که خود را به خطر نیندازد، سربازان را به خطر نمی‌اندازد.",
    author: "شهید صیاد شیرازی",
    category: "military"
  },
  {
    text: "ما برای تکلیف جنگیدیم، نه برای پیروزی.",
    author: "شهید حسن باقری",
    category: "military"
  },
  {
    text: "شهادت هنر مردان خداست.",
    author: "امام خمینی (ره)",
    category: "patriotic"
  },
  {
    text: "دشمن را باید شناخت، راه‌های نفوذش را باید شناخت، شیوه‌هایش را باید شناخت.",
    author: "مقام معظم رهبری",
    category: "strategy"
  },
  {
    text: "آنچه که انسان را به پیروزی می‌رساند، ایمان است.",
    author: "شهید مصطفی چمران",
    category: "wisdom"
  },
  {
    text: "فرماندهی، هنر تبدیل فشار به انگیزه است.",
    author: "شهید حاج قاسم سلیمانی",
    category: "leadership"
  },
  {
    text: "ما مأمور به انجام وظیفه‌ایم، نه مأمور به نتیجه.",
    author: "شهید بهشتی",
    category: "wisdom"
  },
  {
    text: "اگر می‌خواهید در جنگ پیروز شوید، باید در صلح آماده باشید.",
    author: "امیرکبیر",
    category: "strategy"
  },
  {
    text: "ما برای عزت می‌جنگیم، نه برای غنیمت.",
    author: "شهید همت",
    category: "military"
  },
  {
    text: "نظم و انضباط، رمز موفقیت در هر عملیات است.",
    author: "شهید خرازی",
    category: "military"
  },
  {
    text: "اطلاعات دقیق، نیمی از پیروزی است.",
    author: "شهید صیاد شیرازی",
    category: "strategy"
  },
  {
    text: "آنکه خود را می‌شناسد، دشمن را بهتر می‌شناسد.",
    author: "امام علی (ع)",
    category: "wisdom"
  },
  {
    text: "قدرت نظامی بدون قدرت ایمان، پوچ است.",
    author: "شهید حاج قاسم سلیمانی",
    category: "military"
  },
  {
    text: "تدبیر قبل از شمشیر.",
    author: "امام علی (ع)",
    category: "strategy"
  }
];

/**
 * دریافت یک سخن تصادفی از بانک سخنان
 * @param category دسته‌بندی سخن (اختیاری)
 * @returns یک سخن تصادفی
 */
export function getRandomQuote(category?: Quote['category']): Quote {
  let filteredQuotes = quotes;
  
  // اگر دسته‌بندی مشخص شده باشد، فقط سخنان آن دسته را فیلتر کن
  if (category) {
    filteredQuotes = quotes.filter(quote => quote.category === category);
    // اگر هیچ سخنی در این دسته نبود، از همه سخنان استفاده کن
    if (filteredQuotes.length === 0) {
      filteredQuotes = quotes;
    }
  }
  
  // انتخاب یک سخن تصادفی
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  return filteredQuotes[randomIndex];
}

// اکسپورت تایپ Quote برای استفاده در سایر فایل‌ها
export type { Quote };

// اکسپورت آرایه quotes برای استفاده در سایر فایل‌ها
export { quotes }; 