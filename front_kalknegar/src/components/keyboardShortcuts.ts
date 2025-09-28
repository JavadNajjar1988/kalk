export type KeyboardShortcut = string[];

export interface KeyboardEntry {
  description: string;
  shortcut: KeyboardShortcut[];
}

export interface KeyboardCategory {
  label: string;
  shortcuts: KeyboardEntry[];
}

const genericShortcuts: KeyboardCategory = {
  label: "عمومی",
  shortcuts: [
    { shortcut: [["?"]], description: "نمایش این پنجره راهنما" },
    { shortcut: [["ctrl / ⌘", "k"], ["s"]], description: "باز کردن جستجو" },
    { shortcut: [["ctrl / ⌘", "z"]], description: "بازگردانی" },
    {
      shortcut: [
        ["ctrl / ⌘", "shift", "z"],
        ["ctrl", "y"],
      ],
      description: "تکرار",
    },
  ],
};

export const mapEditModeShortcuts: KeyboardCategory[] = [
  genericShortcuts,
  {
    label: "ویرایش و دستکاری واحد",
    shortcuts: [
      { shortcut: [["del"]], description: "حذف واحدهای انتخاب شده" },
      { shortcut: [["c"]], description: "ایجاد واحد زیرمجموعه" },
      { shortcut: [["e"]], description: "ویرایش واحد فعال" },
      { shortcut: [["d"]], description: "تکثیر واحد" },
      { shortcut: [["z"]], description: "بزرگ‌نمایی روی واحد" },
      { shortcut: [["p"]], description: "حرکت به سمت واحد" },
      { shortcut: [["m"]], description: "تغییر حالت جابجایی واحد/ویژگی" },
      { shortcut: [["l"]], description: "یافتن واحد در آرایش نبرد" },
    ],
  },
  {
    label: "دستکاری زمان",
    shortcuts: [
      { shortcut: [["t"]], description: "تنظیم زمان سناریو" },
      { shortcut: [["alt", "p"], ["k"]], description: "پخش/توقف" },
      { description: "افزایش سرعت پخش", shortcut: [[">"]] },
      { description: "کاهش سرعت پخش", shortcut: [["<"]] },
    ],
  },
];

export const gridEditModeShortcuts: KeyboardCategory[] = [
  genericShortcuts,
  {
    label: "ویرایش و دستکاری واحد",
    shortcuts: [
      { shortcut: [["alt", "enter"]], description: "ایجاد واحد زیرمجموعه" },
      { shortcut: [["shift", "enter"]], description: "تکثیر واحد" },
      { shortcut: [["alt", "x"]], description: "باز/بسته کردن آیتم" },
      { shortcut: [["ctrl", "e"]], description: "باز/بسته کردن آیتم و زیرمجموعه‌ها" },
    ],
  },
  {
    label: "ویرایش سلول",
    shortcuts: [
      { shortcut: [["enter"]], description: "ورود به حالت ویرایش سلول" },
      { shortcut: [["esc"]], description: "لغو ویرایش سلول" },
      { shortcut: [["del"]], description: "پاک کردن محتوای سلول" },
      { shortcut: [["ctrl", "c"]], description: "کپی محتوای سلول به کلیپ‌بورد" },
      { shortcut: [["ctrl", "v"]], description: "چسباندن محتوای کلیپ‌بورد به سلول" },
    ],
  },
];

export const defaultShortcuts = [genericShortcuts];
