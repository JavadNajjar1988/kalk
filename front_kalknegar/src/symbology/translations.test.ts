import { beforeAll, describe, expect, it } from "vitest";
import { app6d } from "@/symbology/standards/app6d";
import { ms2525d } from "@/symbology/standards/milstd2525";
import {
  registerStandardSymbologyTranslations,
  translateEntity,
  translateEntitySubtype,
  translateEntityType,
  translateModifier,
  translateSymbolSet,
} from "@/symbology/translations";

const hasPersianText = (value: string) => /[\u0600-\u06ff]/.test(value);
const hasLatinText = (value: string) => /[A-Za-z]/.test(value);
const isGeneratedPlaceholder = (value: string) =>
  /^(?:گزینه|نماد|تغییردهنده)\s*[۰-۹\d]+$/.test(value);

beforeAll(() => {
  registerStandardSymbologyTranslations(ms2525d, app6d);
});

describe("پوشش فارسی کتابخانهٔ نمادهای نظامی", () => {
  it("نام تمام مجموعه‌های نماد را به‌صورت معنایی و خوانا ترجمه می‌کند", () => {
    const expectedNames: Record<string, string> = {
      "11": "واحد/سازمان غیرنظامی زمینی",
      "15": "تجهیزات زمینی",
      "20": "تأسیسات زمینی",
      "25": "اقدام کنترل",
      "30": "سطح دریا",
      "35": "زیرسطح دریا",
      "36": "جنگ مین",
      "40": "فعالیت/رویداد",
      "50": "اطلاعات سیگنالی فضایی",
      "51": "اطلاعات سیگنالی هوایی",
      "52": "اطلاعات سیگنالی زمینی",
      "53": "اطلاعات سیگنالی سطحی",
      "54": "اطلاعات سیگنالی زیرسطحی",
      "60": "فضای سایبری",
      "01": "هوایی",
      "02": "موشک هوایی",
      "05": "فضایی",
      "06": "موشک فضایی",
    };

    for (const [code, symbolSet] of Object.entries(ms2525d)) {
      const label = translateSymbolSet(symbolSet.name);
      expect(label).toBe(expectedNames[code] || symbolSet.name);
      expect(hasLatinText(label), label).toBe(false);
    }
  });

  it("تمام عنوان‌های APP-6D فارسی و بدون عنوان ساختگی هستند", () => {
    for (const symbolSet of Object.values(app6d)) {
      for (const item of symbolSet.mainIcon) {
        for (const label of [
          translateEntity(item.entity),
          item.entityType ? translateEntityType(item.entityType) : "",
          item.entitySubtype ? translateEntitySubtype(item.entitySubtype) : "",
        ].filter(Boolean)) {
          expect(
            hasPersianText(label),
            `${symbolSet.symbolSet}/${item.code}: ${label}`,
          ).toBe(true);
          expect(hasLatinText(label), label).toBe(false);
          expect(isGeneratedPlaceholder(label)).toBe(false);
        }
      }
      for (const collection of [symbolSet.modifierOne, symbolSet.modifierTwo]) {
        for (const item of collection) {
          const label = translateModifier(item.modifier);
          expect(
            hasPersianText(label),
            `${symbolSet.symbolSet}/${item.code}: ${label}`,
          ).toBe(true);
          expect(hasLatinText(label), label).toBe(false);
          expect(isGeneratedPlaceholder(label)).toBe(false);
        }
      }
    }
  });

  it("برای تمام نمادهای اصلی MIL-STD-2525D عنوان فارسی واقعی دارد", () => {
    for (const symbolSet of Object.values(ms2525d)) {
      for (const item of symbolSet.mainIcon) {
        const labels = [
          translateEntity(item.entity),
          item.entityType ? translateEntityType(item.entityType) : "",
          item.entitySubtype ? translateEntitySubtype(item.entitySubtype) : "",
        ].filter(Boolean);

        expect(labels.length).toBeGreaterThan(0);
        for (const label of labels) {
          expect(
            hasPersianText(label),
            `${symbolSet.symbolSet}/${item.code}: ${label}`,
          ).toBe(true);
          expect(hasLatinText(label), label).toBe(false);
          expect(isGeneratedPlaceholder(label)).toBe(false);
        }
      }
    }
  });

  it("برای تمام تغییردهنده‌های ۱ و ۲ عنوان فارسی واقعی دارد", () => {
    for (const symbolSet of Object.values(ms2525d)) {
      for (const collection of [symbolSet.modifierOne, symbolSet.modifierTwo]) {
        for (const item of collection) {
          const label = translateModifier(item.modifier);
          expect(
            hasPersianText(label),
            `${symbolSet.symbolSet}/${item.code}: ${label}`,
          ).toBe(true);
          expect(hasLatinText(label), label).toBe(false);
          expect(isGeneratedPlaceholder(label)).toBe(false);
        }
      }
    }
  });

  it("نمونهٔ گزارش‌شده در تصویر را درست ترجمه می‌کند", () => {
    expect(translateEntity("Military")).toBe("نظامی");
    expect(translateEntityType("Fixed Wing")).toBe("بال ثابت");
    expect(translateEntitySubtype("Patrol")).toBe("گشت");
    expect(translateModifier("Interceptor")).toBe("رهگیر");
    expect(translateModifier("Not Applicable")).toBe("قابل اجرا نیست");
  });

  it("اصطلاحات نظامی چندمعنایی را با معادل تخصصی ترجمه می‌کند", () => {
    expect(translateEntity("Task Force")).toBe("گروه رزمی");
    expect(translateEntity("Decontamination")).toBe("رفع آلودگی");
    expect(translateEntity("Utility")).toBe("چندمنظوره");
    expect(translateEntity("Air Assault with Organic Lift")).toBe(
      "هجوم هوایی با ترابری سازمانی",
    );
    expect(translateEntity("Army Aviation/Aviation Rotary Wing")).toBe(
      "هوانیروز/هوانوردی بال‌گردان",
    );
    expect(translateEntity("Aviation Composite")).toBe(
      "یگان هوانوردی مختلط",
    );
    expect(translateEntity("Special Troops")).toBe("رسته‌های ویژه");
    expect(translateEntity("Radiological")).toBe("پرتوی");
  });
});
