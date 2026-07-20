import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Button, Chip, Tabs, Tab, Autocomplete, SelectChangeEvent } from '@mui/material';
import ms from 'milsymbol';
import { ALL_UNIT_TYPES } from '@/config/unitTypes';

import modifiersData from '@/config/modifiers.json';
import echelonsData from '@/config/echelons.json';
import sidcData from '@/config/sidc-data.json';

// تعریف ساختارهای مورد نیاز
interface ModifierOption {
  value: string;
  label: string;
}

interface EchelonOption {
  value: string;
  label: string;
}

interface EntityOption {
  id: string;
  name: string;
  nameEn: string;
}

interface EntityTypeOption {
  id: string;
  name: string;
  nameEn: string;
  parentId: string;
}

interface EntitySubTypeOption {
  id: string;
  name: string;
  nameEn: string;
  parentId: string;
}

const MODIFIERS_BY_SYMBOL_SET: Record<string, { modifierOne: ModifierOption[]; modifierTwo: ModifierOption[] }> = 
  modifiersData.reduce((acc, item) => {
    acc[item.symbolSet] = item.modifiers;
    return acc;
  }, {} as Record<string, { modifierOne: ModifierOption[]; modifierTwo: ModifierOption[] }>);

const ECHELONS_BY_SYMBOL_SET: Record<string, EchelonOption[]> = 
  echelonsData.reduce((acc, item) => {
    acc[item.symbolSet] = item.echelons;
    return acc;
  }, {} as Record<string, EchelonOption[]>);


const MilitarySymbolGeneratorPage: React.FC = () => {
  // تعریف استیت‌ها برای اجزای مختلف کد SIDC
  const [version, setVersion] = useState<string>("10"); // نسخه
  const [context, setContext] = useState<string>("0");  // زمینه
  const [standardIdentity, setStandardIdentity] = useState<string>("3"); // هویت استاندارد (دوست، دشمن و...)
  const [symbolSet, setSymbolSet] = useState<string>("10"); // مجموعه نماد (زمینی، هوایی و...)
  const [status, setStatus] = useState<string>("0"); // وضعیت
  const [hqtfd, setHqtfd] = useState<string>("0"); // نوع مقر فرماندهی
  const [amplifier, setAmplifier] = useState<string>("0"); // تقویت‌کننده
  const [amplifierDescriptor, setAmplifierDescriptor] = useState<string>("0"); // توضیح تقویت‌کننده
  const [entity, setEntity] = useState<string>("11"); // نهاد (کد دو رقمی)
  const [entityType, setEntityType] = useState<string>("00"); // نوع نهاد
  const [entitySubType, setEntitySubType] = useState<string>("00"); // زیر نوع نهاد
  const [modifierOne, setModifierOne] = useState<string>("00"); // اصلاح‌کننده اول
  const [modifierTwo, setModifierTwo] = useState<string>("00"); // اصلاح‌کننده دوم
  
  // استیت‌های جدید برای مدیریت موجودیت‌ها و زیرنوع‌ها
  const [selectedEntityOption, setSelectedEntityOption] = useState<EntityOption | null>(null);
  const [selectedEntityTypeOption, setSelectedEntityTypeOption] = useState<EntityTypeOption | null>(null);
  const [selectedEntitySubTypeOption, setSelectedEntitySubTypeOption] = useState<EntitySubTypeOption | null>(null);

  // state های جدید برای گزینه‌های milsymbol
  const [echelonCode, setEchelonCode] = useState<string>("00"); // کد رده سازمانی برای SIDC
  const [mobility, setMobility] = useState<string>(""); // تحرک
  const [leadership, setLeadership] = useState<string>(""); // رهبری
  const [country, setCountry] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [uniqueDesignation, setUniqueDesignation] = useState<string>("");
  const [higherFormation, setHigherFormation] = useState<string>("");
  const [staffComments, setStaffComments] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [reinforcedReduced, setReinforcedReduced] = useState<string>("");
  const [direction, setDirection] = useState<number>(0);

  // تنظیمات ظاهر نماد
  const [size, setSize] = useState<number>(100); // اندازه نماد
  const [fillColor, setFillColor] = useState<string>(""); // رنگ پرکننده
  const [frameColor, setFrameColor] = useState<string>(""); // رنگ قاب
  const [iconColor, setIconColor] = useState<string>(""); // رنگ آیکون
  const [colorMode, setColorMode] = useState<string>("Light"); // حالت رنگ
  const [symbolSvg, setSymbolSvg] = useState<string>(""); // SVG نماد
  const [standardVersion, setStandardVersion] = useState<'2525' | 'APP6' | '2525e' | 'APP6e'>('2525'); // استاندارد نماد

  // ساخت کد SIDC کامل
  const [sidc, setSidc] = useState<string>("10031000121100000000");

  // دریافت اصلاح‌کننده‌های مربوط به مجموعه نماد انتخاب شده
  const currentModifiers = useMemo(() => {
    return MODIFIERS_BY_SYMBOL_SET[symbolSet] || {
      modifierOne: [],
      modifierTwo: []
    };
  }, [symbolSet]);

  // دریافت رده‌های سازمانی مربوط به مجموعه نماد انتخاب شده
  const currentEchelons = useMemo(() => {
    return ECHELONS_BY_SYMBOL_SET[symbolSet] || [];
  }, [symbolSet]);

  // استفاده از داده‌های جدید
  const symbolSets = useMemo(() => {
    return sidcData.symbolSets.map(set => ({
      value: set.id,
      label: set.name,
      labelEn: set.nameEn
    }));
  }, []);

  const standardIdentityOptions = useMemo(() => {
    return sidcData.standardIdentities.map(identity => ({
      value: identity.id,
      label: identity.name
    }));
  }, []);

  const contextOptions = useMemo(() => {
    return sidcData.contexts.map(ctx => ({
      value: ctx.id,
      label: ctx.name
    }));
  }, []);

  const versionOptions = useMemo(() => {
    return sidcData.versions.map(ver => ({
      value: ver.id,
      label: ver.name
    }));
  }, []);

  // دریافت موجودیت‌های مربوط به مجموعه نماد انتخاب شده
  const entityOptions = useMemo(() => {
    const selectedSymbolSet = sidcData.symbolSets.find(set => set.id === symbolSet);
    if (!selectedSymbolSet) return [];
    
    return selectedSymbolSet.entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      nameEn: entity.nameEn
    }));
  }, [symbolSet]);

  // دریافت انواع موجودیت مربوط به موجودیت انتخاب شده
  const entityTypeOptions = useMemo(() => {
    if (!selectedEntityOption) return [];
    
    const selectedSymbolSet = sidcData.symbolSets.find(set => set.id === symbolSet);
    if (!selectedSymbolSet) return [];
    
    const selectedEntity = selectedSymbolSet.entities.find(e => e.id === selectedEntityOption.id);
    if (!selectedEntity) return [];
    
    return selectedEntity.types.map(type => ({
      id: type.id,
      name: type.name,
      nameEn: type.nameEn,
      parentId: selectedEntityOption.id
    }));
  }, [symbolSet, selectedEntityOption]);

  // دریافت زیرنوع‌های مربوط به نوع موجودیت انتخاب شده
  const entitySubTypeOptions = useMemo(() => {
    if (!selectedEntityOption || !selectedEntityTypeOption) return [];
    
    const selectedSymbolSet = sidcData.symbolSets.find(set => set.id === symbolSet);
    if (!selectedSymbolSet) return [];
    
    const selectedEntity = selectedSymbolSet.entities.find(e => e.id === selectedEntityOption.id);
    if (!selectedEntity) return [];
    
    const selectedType = selectedEntity.types.find(t => t.id === selectedEntityTypeOption.id);
    if (!selectedType) return [];
    
    return selectedType.subtypes.map(subtype => ({
      id: subtype.id,
      name: subtype.name,
      nameEn: subtype.nameEn,
      parentId: selectedEntityTypeOption.id
    }));
  }, [symbolSet, selectedEntityOption, selectedEntityTypeOption]);

  // ریست کردن مقادیر هنگام تغییر symbolSet
  useEffect(() => {
    // ریست کردن entity به مقدار پیش‌فرض
    setSelectedEntityOption(null);
    setSelectedEntityTypeOption(null);
    setSelectedEntitySubTypeOption(null);
    setEntity("11");
    setEntityType("00");
    setEntitySubType("00");
    
    // ریست کردن اصلاح‌کننده‌ها
    setModifierOne("00");
    setModifierTwo("00");
    
    // ریست کردن رده سازمانی - اطمینان از وجود در گزینه‌ها
    const availableEchelons = ECHELONS_BY_SYMBOL_SET[symbolSet] || [];
    const defaultEchelon = availableEchelons.length > 0 ? availableEchelons[0].value : "00";
    setEchelonCode(defaultEchelon);
    
    // ریست کردن اصلاح‌کننده‌های خاص
    setMobility("");
    setLeadership("");
  }, [symbolSet]);

  // به‌روزرسانی entity هنگام تغییر selectedEntityOption
  useEffect(() => {
    if (selectedEntityOption) {
      setEntity(selectedEntityOption.id.substring(0, 2));
    }
  }, [selectedEntityOption]);

  // به‌روزرسانی entityType هنگام تغییر selectedEntityTypeOption
  useEffect(() => {
    if (selectedEntityTypeOption) {
      setEntityType(selectedEntityTypeOption.id.substring(2, 4));
    } else {
      setEntityType("00");
    }
  }, [selectedEntityTypeOption]);

  // به‌روزرسانی entitySubType هنگام تغییر selectedEntitySubTypeOption
  useEffect(() => {
    if (selectedEntitySubTypeOption) {
      setEntitySubType(selectedEntitySubTypeOption.id.substring(4, 6));
    } else {
      setEntitySubType("00");
    }
  }, [selectedEntitySubTypeOption]);

  // اطمینان از اینکه مقادیر Select‌ها همیشه معتبر باشند
  useEffect(() => {
    // بررسی رده سازمانی
    const availableEchelons = ECHELONS_BY_SYMBOL_SET[symbolSet] || [];
    const validEchelon = availableEchelons.find(e => e.value === echelonCode);
    if (!validEchelon && availableEchelons.length > 0) {
      setEchelonCode(availableEchelons[0].value);
    }
    
    // بررسی اصلاح‌کننده اول
    const availableModifiersOne = MODIFIERS_BY_SYMBOL_SET[symbolSet]?.modifierOne || [];
    const validModifierOne = availableModifiersOne.find(m => m.value === modifierOne);
    if (!validModifierOne && availableModifiersOne.length > 0) {
      setModifierOne(availableModifiersOne[0].value);
    }
    
    // بررسی اصلاح‌کننده دوم
    const availableModifiersTwo = MODIFIERS_BY_SYMBOL_SET[symbolSet]?.modifierTwo || [];
    const validModifierTwo = availableModifiersTwo.find(m => m.value === modifierTwo);
    if (!validModifierTwo && availableModifiersTwo.length > 0) {
      setModifierTwo(availableModifiersTwo[0].value);
    }
  }, [symbolSet, echelonCode, modifierOne, modifierTwo]);

  // به‌روزرسانی amplifier و amplifierDescriptor بر اساس symbolSet و echelon
  useEffect(() => {
    if (symbolSet === "10") {
      // برای یگان‌های زمینی، از echelonCode استفاده کن
      setAmplifier(echelonCode.substring(0, 1));
      setAmplifierDescriptor(echelonCode.substring(1, 2));
    } else if (symbolSet === "15") {
      // برای تجهیزات زمینی، می‌توان از mobility استفاده کرد
      // اینجا باید کد مناسب را تنظیم کنید
      setAmplifier("0");
      setAmplifierDescriptor("0");
    } else {
      // برای سایر موارد
      setAmplifier("0");
      setAmplifierDescriptor("0");
    }
  }, [symbolSet, echelonCode]);

  // تشخیص نوع هندسی مجموعه نماد انتخاب شده (نقطه، خط، چندضلعی)
  const currentSymbolSetGeometry = useMemo(() => {
    const selectedSymbolSet = sidcData.symbolSets.find(set => set.id === symbolSet);
    return selectedSymbolSet?.geometry || "POINT";
  }, [symbolSet]);

  // به‌روزرسانی کد SIDC هنگامی که هر یک از اجزای آن تغییر می‌کند
  useEffect(() => {
    // ساخت کد SIDC با استفاده از اجزای مختلف
    // برای نسخه‌های APP-6E و 2525E، ساختار 20 رقمی حفظ می‌شود اما با برخی تغییرات داخلی
    const newSidc = 
      version +
      context +
      standardIdentity +
      symbolSet +
      status +
      hqtfd +
      amplifier +
      amplifierDescriptor +
      entity +
      entityType +
      entitySubType +
      modifierOne +
      modifierTwo;
      
    setSidc(newSidc);
  }, [
    version, context, standardIdentity, symbolSet, status, 
    hqtfd, amplifier, amplifierDescriptor, entity, entityType, 
    entitySubType, modifierOne, modifierTwo
  ]);

  // به‌روزرسانی URL با پارامتر SIDC و استاندارد
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('sidc', sidc);
    url.searchParams.set('standard', standardVersion);
    window.history.replaceState({}, '', url.toString());
  }, [sidc, standardVersion]);

  // بررسی URL برای SIDC و استاندارد هنگام بارگذاری
  useEffect(() => {
    const url = new URL(window.location.href);
    const sidcParam = url.searchParams.get('sidc');
    const standardParam = url.searchParams.get('standard');
    
    // تنظیم استاندارد اگر در URL وجود داشته باشد
    if (standardParam && ['2525', 'APP6', '2525e', 'APP6e'].includes(standardParam)) {
      setStandardVersion(standardParam as '2525' | 'APP6' | '2525e' | 'APP6e');
    }
    
    if (sidcParam && sidcParam.length === 20) {
      setSidc(sidcParam);
      
      // استخراج اجزای SIDC
      const versionPart = sidcParam.substring(0, 2);
      const contextPart = sidcParam.substring(2, 3);
      const identityPart = sidcParam.substring(3, 4);
      const symbolSetPart = sidcParam.substring(4, 6);
      const statusPart = sidcParam.substring(6, 7);
      const hqtfdPart = sidcParam.substring(7, 8);
      const amplifierPart = sidcParam.substring(8, 9);
      const amplifierDescriptorPart = sidcParam.substring(9, 10);
      const entityPart = sidcParam.substring(10, 12);
      const entityTypePart = sidcParam.substring(12, 14);
      const entitySubTypePart = sidcParam.substring(14, 16);
      const modifierOnePart = sidcParam.substring(16, 18);
      const modifierTwoPart = sidcParam.substring(18, 20);
      
      // به‌روزرسانی استیت‌ها
      setVersion(versionPart);
      setContext(contextPart);
      setStandardIdentity(identityPart);
      setSymbolSet(symbolSetPart);
      setStatus(statusPart);
      setHqtfd(hqtfdPart);
      setAmplifier(amplifierPart);
      setAmplifierDescriptor(amplifierDescriptorPart);
      setEntityType(entityTypePart);
      setEntitySubType(entitySubTypePart);
      setModifierOne(modifierOnePart);
      setModifierTwo(modifierTwoPart);
      
      // تنظیم entity بر اساس SIDC
      const entityCode = entityPart + entityTypePart + entitySubTypePart;
      const matchingUnit = ALL_UNIT_TYPES.find(unit => {
        const unitSidc = unit.sidc;
        return unitSidc.substring(10, 16) === entityCode;
      });
      
      if (matchingUnit) {
        setEntity(matchingUnit.id);
      }
    }
  }, []);

  // تولید نماد به صورت SVG با استفاده از کتابخانه milsymbol
  useEffect(() => {
    try {
      // بررسی نوع هندسی نماد (نقطه، خط، چندضلعی)
      if (currentSymbolSetGeometry === "LINE" || currentSymbolSetGeometry === "POLYGON") {
        // برای نمادهای خطی و چندضلعی، یک تصویر متن‌دار نمایش می‌دهیم
        const svgText = `
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f5f5f5" stroke="#cccccc" />
            <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="14" fill="#555555">
              ${currentSymbolSetGeometry === "LINE" ? "نماد خطی" : "نماد چندضلعی"}
            </text>
            <text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="12" fill="#555555">
              (${currentSymbolSetGeometry === "LINE" ? "LINE" : "POLYGON"} Symbol)
            </text>
            <text x="50%" y="65%" text-anchor="middle" font-family="Arial" font-size="10" fill="#777777">
              کد SIDC: ${sidc}
            </text>
          </svg>
        `;
        setSymbolSvg(svgText);
        return;
      }
      
      // تنظیم گزینه‌های milsymbol با توجه به استاندارد انتخاب شده
      // اگر standardVersion به '2525e' یا 'APP6e' تنظیم شده، باید با قابلیت‌های کتابخانه milsymbol سازگار باشد
      const options: any = {
        size: size,
        standard: standardVersion,
      };
      
      // اضافه کردن رنگ‌ها اگر تعریف شده باشند
      if (fillColor) options.fillColor = fillColor;
      if (frameColor) options.frameColor = frameColor;
      if (iconColor) options.iconColor = iconColor;
      if (colorMode && colorMode !== "Light") options.colorMode = colorMode;
      
      // اضافه کردن text amplifiers
      if (uniqueDesignation) options.uniqueDesignation = uniqueDesignation;
      if (higherFormation) options.higherFormation = higherFormation;
      if (additionalInfo) options.additionalInformation = additionalInfo;
      if (staffComments) options.staffComments = staffComments;
      if (quantity) options.quantity = quantity;
      if (country) options.country = country;
      if (direction > 0) options.direction = direction;
      
      // اضافه کردن modifiers
      if (mobility) options.mobility = mobility;
      if (leadership) options.leadership = leadership;
      if (reinforcedReduced) options.reinforcedReduced = reinforcedReduced;
      
      // ایجاد نماد
      const symbol = new ms.Symbol(sidc, options);
      setSymbolSvg(symbol.asSVG());
    } catch (error) {
      console.error("خطا در تولید نماد:", error);
    }
  }, [sidc, size, fillColor, frameColor, iconColor, colorMode, standardVersion, 
      mobility, leadership, country, additionalInfo, uniqueDesignation, 
      higherFormation, staffComments, quantity, reinforcedReduced, direction, currentSymbolSetGeometry]);

  // هویت استاندارد (دوست، دشمن، خنثی و...)
  // نسخه‌های استاندارد
  // زمینه‌های عملیاتی
  // مجموعه نماد (زمینی، هوایی، دریایی و...)
  // وضعیت (فعال، برنامه‌ریزی شده، گزارش شده و...)
  // نوع مقر فرماندهی
  // رده سازمانی (echelon) - با کدهای SIDC
  // گزینه‌های تحرک (mobility) - برای symbolSet=15
  // گزینه‌های رهبری (leadership) - برای symbolSet=27
  // گزینه‌های تقویت/کاهش
  // گزینه‌های حالت رنگ
  // گزینه‌های کشور (نمونه)

  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // بهینه‌سازی رندر با استفاده از useCallback
  const handleVersionChange = useCallback((e: SelectChangeEvent) => {
    setVersion(e.target.value);
  }, []);

  const handleContextChange = useCallback((e: SelectChangeEvent) => {
    setContext(e.target.value);
  }, []);

  const handleStandardIdentityChange = useCallback((e: SelectChangeEvent) => {
    setStandardIdentity(e.target.value);
  }, []);

  const handleSymbolSetChange = useCallback((e: SelectChangeEvent) => {
    setSymbolSet(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  const handleHqtfdChange = useCallback((e: SelectChangeEvent) => {
    setHqtfd(e.target.value);
  }, []);

  // وضعیت (فعال، برنامه‌ریزی شده، گزارش شده و...)
  const statusOptions = [
    { value: "0", label: "حاضر/واقعی", labelEn: "Present/Actual" },
    { value: "1", label: "برنامه‌ریزی شده", labelEn: "Planned/Anticipated" },
    { value: "2", label: "مشکوک", labelEn: "Suspected" },
    { value: "3", label: "موجود و فعال", labelEn: "Present and Fully Capable" },
    { value: "4", label: "موجود و آسیب‌دیده", labelEn: "Present and Damaged" },
    { value: "5", label: "موجود و نابود شده", labelEn: "Present and Destroyed" },
    { value: "6", label: "موجود با مکان نامشخص", labelEn: "Present but Location Unknown" },
    { value: "7", label: "احتمالاً موجود", labelEn: "Suspected Present" },
  ];

  // نوع مقر فرماندهی (Headquarters/Task Force/Dummy)
  const hqtfdOptions = [
    { value: "0", label: "بدون نشان مقر", labelEn: "Not HQ/Task Force/Dummy" },
    { value: "1", label: "مقر فرماندهی", labelEn: "Headquarters" },
    { value: "2", label: "گروه رزمی", labelEn: "Task Force" },
    { value: "3", label: "مقر فرماندهی و گروه رزمی", labelEn: "HQ & Task Force" },
    { value: "4", label: "ساختگی", labelEn: "Dummy" },
    { value: "5", label: "ساختگی مقر فرماندهی", labelEn: "Dummy Headquarters" },
    { value: "6", label: "ساختگی گروه رزمی", labelEn: "Dummy Task Force" },
    { value: "7", label: "ساختگی مقر فرماندهی و گروه رزمی", labelEn: "Dummy HQ & Task Force" },
    { value: "8", label: "عنصر پشتیبان", labelEn: "Feint/Dummy Deception" },
  ];

  // رده سازمانی (echelon) - با کدهای SIDC
  const echelonOptions = [
    { value: "00", label: "نامشخص" },
    { value: "11", label: "تیم/خدمه" },
    { value: "12", label: "جوخه" },
    { value: "13", label: "بخش" },
    { value: "14", label: "دسته/گروه جداشده" },
    { value: "15", label: "گروهان/باتری/سرایا" },
    { value: "16", label: "گردان/اسکادران" },
    { value: "17", label: "هنگ/گروه" },
    { value: "18", label: "تیپ" },
    { value: "21", label: "لشکر" },
    { value: "22", label: "سپاه/MEF" },
    { value: "23", label: "ارتش" },
    { value: "24", label: "گروه ارتش/جبهه" },
    { value: "25", label: "منطقه/تئاتر" },
    { value: "26", label: "فرماندهی" },
  ];

  // گزینه‌های تحرک (mobility) - برای symbolSet=15
  const mobilityOptions = [
    { value: '', label: 'بدون تحرک' },
    { value: 'wheeled', label: 'چرخدار' },
    { value: 'tracked', label: 'زنجیری' },
    { value: 'halftrack', label: 'نیمه زنجیری' },
    { value: 'towed', label: 'یدک کشیده' },
    { value: 'rail', label: 'ریلی' },
    { value: 'packanimals', label: 'حیوانات باربر' },
    { value: 'amphibious', label: 'آبی‌خاکی' },
    { value: 'barge', label: 'بارج' },
    { value: 'sled', label: 'سورتمه' },
  ];

  // گزینه‌های رهبری (leadership) - برای symbolSet=27
  const leadershipOptions = [
    { value: '', label: 'بدون رهبری' },
    { value: 'friend', label: 'رهبر دوست' },
    { value: 'enemy', label: 'رهبر دشمن' },
    { value: 'neutral', label: 'رهبر خنثی' },
  ];

  // گزینه‌های تقویت/کاهش
  const reinforcedReducedOptions = [
    { value: '', label: 'عادی' },
    { value: 'reinforced', label: 'تقویت شده' },
    { value: 'reduced', label: 'کاهش یافته' },
    { value: 'reinforcedreduced', label: 'تقویت شده و کاهش یافته' },
  ];

  // گزینه‌های حالت رنگ
  const colorModeOptions = [
    { value: 'Light', label: 'روشن' },
    { value: 'Dark', label: 'تیره' },
    { value: 'FrameColor', label: 'رنگ قاب' },
    { value: 'IconColor', label: 'رنگ آیکون' },
    { value: 'Black', label: 'سیاه' },
    { value: 'White', label: 'سفید' },
  ];

  // گزینه‌های کشور (نمونه)
  const countryOptions = [
    { value: '', label: 'بدون کشور' },
    { value: 'IRN', label: 'ایران' },
    { value: 'USA', label: 'آمریکا' },
    { value: 'RUS', label: 'روسیه' },
    { value: 'CHN', label: 'چین' },
    { value: 'GBR', label: 'انگلیس' },
    { value: 'FRA', label: 'فرانسه' },
    { value: 'DEU', label: 'آلمان' },
    { value: 'IRQ', label: 'عراق' },
    { value: 'SYR', label: 'سوریه' },
    { value: 'LBN', label: 'لبنان' },
    { value: 'PSE', label: 'فلسطین' },
    { value: 'ISR', label: 'اسرائیل' },
    { value: 'JOR', label: 'اردن' },
    { value: 'EGY', label: 'مصر' },
    { value: 'SAU', label: 'عربستان سعودی' },
    { value: 'TUR', label: 'ترکیه' },
    { value: 'PAK', label: 'پاکستان' },
    { value: 'AFG', label: 'افغانستان' },
  ];

  // هندلرهای جدید برای انتخاب موجودیت‌ها و زیرنوع‌ها
  const handleEntityChange = useCallback((event: React.SyntheticEvent, newValue: EntityOption | null) => {
    setSelectedEntityOption(newValue);
    setSelectedEntityTypeOption(null);
    setSelectedEntitySubTypeOption(null);
  }, []);

  const handleEntityTypeChange = useCallback((event: React.SyntheticEvent, newValue: EntityTypeOption | null) => {
    setSelectedEntityTypeOption(newValue);
    setSelectedEntitySubTypeOption(null);
  }, []);

  const handleEntitySubTypeChange = useCallback((event: React.SyntheticEvent, newValue: EntitySubTypeOption | null) => {
    setSelectedEntitySubTypeOption(newValue);
  }, []);

  return (
    <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                <Typography variant="h4" color="primary" gutterBottom>
            تولید نماد نظامی
            
          </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Tabs value={tabIndex} onChange={handleTabChange} centered>
              <Tab label="تنظیمات اصلی" />
              <Tab label="اطلاعات متنی" />
              <Tab label="تنظیمات ظاهری" />
            </Tabs>
            
            <Box sx={{ pt: 3 }}>
              {tabIndex === 0 && (
                <Grid container spacing={2}>
                  {/* بخش اصلی SIDC */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      تنظیمات اصلی
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>استاندارد نظامی</InputLabel>
                      <Select
                        value={version}
                        onChange={(e) => {
                          // تنظیم هر دو مقدار version و standardVersion به صورت هماهنگ
                          const selectedValue = e.target.value;
                          setVersion(selectedValue);
                          // انتخاب standardVersion متناظر با version
                          if (selectedValue === "10") {
                            setStandardVersion('2525'); // برای نسخه APP-6D / MIL-STD-2525D
                          } else if (selectedValue === "15") {
                            setStandardVersion('2525e'); // برای نسخه APP-6E / MIL-STD-2525E
                          } else {
                            setStandardVersion('2525');
                          }
                        }}
                        label="استاندارد نظامی"
                      >
                        {versionOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>نوع نمایش نماد</InputLabel>
                      <Select
                        value={standardVersion}
                        onChange={(e) => setStandardVersion(e.target.value as '2525' | 'APP6' | '2525e' | 'APP6e')}
                        label="نوع نمایش نماد"
                      >
                        <MenuItem value="2525">MIL-STD-2525D</MenuItem>
                        <MenuItem value="2525e">MIL-STD-2525E</MenuItem>
                        <MenuItem value="APP6">APP-6D</MenuItem>
                        <MenuItem value="APP6e">APP-6E</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>زمینه عملیاتی</InputLabel>
                      <Select
                        value={context}
                        onChange={handleContextChange}
                        label="زمینه عملیاتی"
                      >
                        {contextOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>هویت (دوست/دشمن)</InputLabel>
                      <Select
                        value={standardIdentity}
                        onChange={handleStandardIdentityChange}
                        label="هویت (دوست/دشمن)"
                      >
                        {standardIdentityOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>مجموعه نماد</InputLabel>
                      <Select
                        value={symbolSet}
                        onChange={handleSymbolSetChange}
                        label="مجموعه نماد"
                      >
                        {symbolSets.map(option => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>وضعیت</InputLabel>
                      <Select
                        value={status}
                        onChange={handleStatusChange}
                        label="وضعیت"
                      >
                        {statusOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label} ({option.labelEn})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* انتخاب موجودیت */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={entityOptions}
                      getOptionLabel={(option) => `${option.name} (${option.nameEn})`}
                      value={selectedEntityOption}
                      onChange={handleEntityChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="موجودیت"
                          size="small"
                          variant="outlined"
                          helperText="انتخاب موجودیت اصلی"
                        />
                      )}
                    />
                  </Grid>
                  
                  {/* انتخاب نوع موجودیت */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={entityTypeOptions}
                      getOptionLabel={(option) => `${option.name} (${option.nameEn})`}
                      value={selectedEntityTypeOption}
                      onChange={handleEntityTypeChange}
                      disabled={!selectedEntityOption}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="نوع موجودیت"
                          size="small"
                          variant="outlined"
                          helperText="انتخاب نوع موجودیت"
                        />
                      )}
                    />
                  </Grid>
                  
                  {/* انتخاب زیرنوع موجودیت */}
                  {entitySubTypeOptions.length > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={entitySubTypeOptions}
                        getOptionLabel={(option) => `${option.name} (${option.nameEn})`}
                        value={selectedEntitySubTypeOption}
                        onChange={handleEntitySubTypeChange}
                        disabled={!selectedEntityTypeOption}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="زیرنوع موجودیت"
                            size="small"
                            variant="outlined"
                            helperText="انتخاب زیرنوع موجودیت"
                          />
                        )}
                      />
                    </Grid>
                  )}
                  
                  {/* نمایش UnitTypeSelector برای تمام انواع مجموعه نماد */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={ALL_UNIT_TYPES.filter(unit => unit.sidc.substring(4, 6) === symbolSet)}
                      getOptionLabel={(option) => `${option.name} (${option.nameEn})`}
                      value={ALL_UNIT_TYPES.find(unit => unit.id === entity) || null}
                      onChange={(event, newValue) => {
                        setEntity(newValue ? newValue.id : 'command_control');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="نوع یگان"
                          size="small"
                          variant="outlined"
                          helperText="جستجو بر اساس نام فارسی یا انگلیسی"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box sx={{ mr: 2 }} dangerouslySetInnerHTML={{ __html: new ms.Symbol(option.sidc, { size: 20 }).asSVG() }} />
                          {option.name}
                        </Box>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>نوع مقر</InputLabel>
                      <Select
                        value={hqtfd}
                        onChange={handleHqtfdChange}
                        label="نوع مقر"
                      >
                        {hqtfdOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label} ({option.labelEn})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* بخش Modifiers */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
                      اصلاح‌کننده‌ها و رده سازمانی
                    </Typography>
                  </Grid>
                  
                  {/* نمایش رده سازمانی برای همه مجموعه‌های نماد */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>رده سازمانی</InputLabel>
                      <Select
                        value={echelonCode}
                        onChange={(e) => setEchelonCode(e.target.value)}
                        label="رده سازمانی"
                      >
                        {currentEchelons.map(option => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* نمایش اصلاح‌کننده اول برای مجموعه نماد انتخاب شده */}
                  {currentModifiers.modifierOne.length > 0 && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>اصلاح‌کننده اول</InputLabel>
                        <Select
                          value={modifierOne}
                          onChange={(e) => setModifierOne(e.target.value)}
                          label="اصلاح‌کننده اول"
                        >
                          {currentModifiers.modifierOne.map(option => (
                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  
                  {/* نمایش اصلاح‌کننده دوم برای مجموعه نماد انتخاب شده */}
                  {currentModifiers.modifierTwo.length > 0 && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>اصلاح‌کننده دوم</InputLabel>
                        <Select
                          value={modifierTwo}
                          onChange={(e) => setModifierTwo(e.target.value)}
                          label="اصلاح‌کننده دوم"
                        >
                          {currentModifiers.modifierTwo.map(option => (
                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  
                  {/* اصلاح‌کننده‌های مخصوص تجهیزات زمینی */}
                  {symbolSet === "15" && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>تحرک</InputLabel>
                        <Select
                          value={mobility}
                          onChange={(e) => setMobility(e.target.value)}
                          label="تحرک"
                        >
                          {mobilityOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  
                  {/* اصلاح‌کننده‌های مخصوص افراد پیاده */}
                  {symbolSet === "27" && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>رهبری</InputLabel>
                        <Select
                          value={leadership}
                          onChange={(e) => setLeadership(e.target.value)}
                          label="رهبری"
                        >
                          {leadershipOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>تقویت/کاهش</InputLabel>
                      <Select
                        value={reinforcedReduced}
                        onChange={(e) => setReinforcedReduced(e.target.value)}
                        label="تقویت/کاهش"
                      >
                        {reinforcedReducedOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>کشور</InputLabel>
                      <Select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        label="کشور"
                      >
                        {countryOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
              {tabIndex === 1 && (
                <Grid container spacing={2}>
                  {/* بخش Text Amplifiers */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
                      اطلاعات متنی
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="نام یکتا"
                      value={uniqueDesignation}
                      onChange={(e) => setUniqueDesignation(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="یگان بالادست"
                      value={higherFormation}
                      onChange={(e) => setHigherFormation(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="اطلاعات اضافی"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="نظرات ستاد"
                      value={staffComments}
                      onChange={(e) => setStaffComments(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="تعداد"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="جهت (درجه)"
                      type="number"
                      value={direction}
                      onChange={(e) => setDirection(Number(e.target.value))}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                      inputProps={{ min: 0, max: 360 }}
                    />
                  </Grid>
                </Grid>
              )}
              {tabIndex === 2 && (
                <Grid container spacing={2}>
                  {/* بخش تنظیمات ظاهری */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
                      تنظیمات ظاهری
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="اندازه نماد"
                      type="number"
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                      inputProps={{ min: 20, max: 500 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>حالت رنگ</InputLabel>
                      <Select
                        value={colorMode}
                        onChange={(e) => setColorMode(e.target.value)}
                        label="حالت رنگ"
                      >
                        {colorModeOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="رنگ پرکننده"
                      type="color"
                      value={fillColor || "#FFFFFF"}
                      onChange={(e) => setFillColor(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="رنگ قاب"
                      type="color"
                      value={frameColor || "#000000"}
                      onChange={(e) => setFrameColor(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="رنگ آیکون"
                      type="color"
                      value={iconColor || "#000000"}
                      onChange={(e) => setIconColor(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                </Grid>
              )}
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <TextField
                  label="کد SIDC کامل"
                  value={sidc}
                  onChange={(e) => setSidc(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  helperText="کد 20 رقمی SIDC"
                />
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '600px' }}>
            <Typography variant="h6" gutterBottom>
              پیش‌نمایش نماد
            </Typography>
            
            {currentSymbolSetGeometry === "LINE" || currentSymbolSetGeometry === "POLYGON" ? (
              <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1, width: '100%' }}>
                <Typography variant="body2" color="warning.dark" align="center">
                  {currentSymbolSetGeometry === "LINE" ? "نمادهای خطی" : "نمادهای چندضلعی"} نیاز به نقشه دارند و به صورت مستقل نمایش داده نمی‌شوند.
                  <br />
                  کد SIDC ایجاد شده را می‌توانید در نقشه استفاده کنید.
                </Typography>
              </Box>
            ) : null}
            
            <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, bgcolor: '#f5f5f5', p: 2, borderRadius: 2, width: '100%' }}>
              <Box dangerouslySetInnerHTML={{ __html: symbolSvg }} />
            </Box>
            
            <Box sx={{ width: '100%', mt: 'auto' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>کد SIDC:</strong> {sidc}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={`هویت: ${standardIdentityOptions.find(opt => opt.value === standardIdentity)?.label || ''}`}
                  size="small"
                  color={standardIdentity === "3" ? "success" : standardIdentity === "6" ? "error" : "default"}
                />
                {selectedEntityOption && (
                  <Chip 
                    label={`موجودیت: ${selectedEntityOption.name}`}
                    size="small"
                    color="primary"
                  />
                )}
                {selectedEntityTypeOption && (
                  <Chip 
                    label={`نوع: ${selectedEntityTypeOption.name}`}
                    size="small"
                    color="secondary"
                  />
                )}
                {selectedEntitySubTypeOption && (
                  <Chip 
                    label={`زیرنوع: ${selectedEntitySubTypeOption.name}`}
                    size="small"
                    color="info"
                  />
                )}
                <Chip 
                  label={`وضعیت: ${statusOptions.find(opt => opt.value === status)?.label || ''}`}
                  size="small"
                />
                {echelonCode !== "00" && (
                  <Chip 
                    label={`رده: ${echelonOptions.find(opt => opt.value === echelonCode)?.label || ''}`}
                    size="small"
                    color="primary"
                  />
                )}
                {country && (
                  <Chip 
                    label={`کشور: ${countryOptions.find(opt => opt.value === country)?.label || ''}`}
                    size="small"
                  />
                )}
                {reinforcedReduced && (
                  <Chip 
                    label={`${reinforcedReducedOptions.find(opt => opt.value === reinforcedReduced)?.label || ''}`}
                    size="small"
                    color="secondary"
                  />
                )}
              </Box>
              
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(symbolSvg)}`;
                  const link = document.createElement('a');
                  link.href = dataUrl;
                  link.download = `military-symbol-${sidc}.svg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                دانلود نماد (SVG)
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                      if (blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `military-symbol-${sidc}.png`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }
                    });
                  };
                  img.src = `data:image/svg+xml;base64,${btoa(symbolSvg)}`;
                }}
              >
                دانلود نماد (PNG)
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MilitarySymbolGeneratorPage; 