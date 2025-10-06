import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";

// انواع و فهرست‌های کمکی
const echelons = ["لشکر", "تیپ", "گردان", "گروهان", "دسته"] as const;
const branches = [
  "پیاده",
  "زرهی",
  "توپخانه",
  "مهندسی رزمی",
  "پدافند هوایی",
  "هوابرد",
  "تکاور/نیروی ویژه",
  "لجستیک",
  "مخابرات",
  "شناور/دریایی",
] as const;
const capabilitiesAll = [
  "زرهی",
  "توپخانه کششی",
  "توپخانه خودکششی",
  "موشکی",
  "ضدزره",
  "راکت‌انداز",
  "مكانیزه",
  "سبك/تحرك بالا",
  "ضدهوایی",
  "مهندسی رزمی",
  "جنگال/الکترونیک",
  "شناسایی/اطلاعات",
  "پهپاد",
] as const;

export type MilitaryUnitForm = {
  unitName: string; // نام یگان
  unitAlias?: string; // عنوان کوتاه یا اسم مستعار
  echelon: typeof echelons[number]; // رده سازمانی
  branch: typeof branches[number]; // رسته
  parentCommand?: string; // زیرمجموعه کجا
  codeNumber?: string; // کد/شماره یگان
  garrisonCity?: string; // شهر استقرار
  province?: string; // استان
  baseName?: string; // نام پادگان/قرارگاه
  lat?: string; // مختصات - عرض
  lng?: string; // مختصات - طول
  areaOfOps?: string; // محدوده مسئولیت/عملیاتی
  capabilities: string[]; // توانمندی‌ها
  personnelStrength?: string; // تعداد نیرو (حدودی)
  equipment?: string; // تجهیزات شاخص
  readiness?: "خیلی بالا" | "بالا" | "متوسط" | "پایین";
  commanderName?: string;
  contact?: string; // تلفن/ایمیل داخلی
  notes?: string;
};

// رابط سازگار با استفاده‌ی قبلی فایل
interface RanksModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void; // نگه‌داشتن امضا برای سازگاری
  rank?: Partial<MilitaryUnitForm>; // داده‌ی اولیه‌ی احتمالی
  categories: any[]; // برای سازگاری
  fields: any[]; // برای سازگاری
}

// اعتبارسنجی ساده
const requiredFields: (keyof MilitaryUnitForm)[] = ["unitName", "echelon", "branch"];

// نگاشت‌ها برای سازگاری با RankItem
const mapEchelonToLevel = (e: MilitaryUnitForm["echelon"]): number => {
  switch (e) {
    case "لشکر": return 5;
    case "تیپ": return 4;
    case "گردان": return 3;
    case "گروهان": return 2;
    case "دسته": return 1;
    default: return 1;
  }
};

const defaultStatus: 'active' | 'historical' | 'deprecated' = 'active';

const RanksModal: React.FC<RanksModalProps> = ({ open, onClose, onSave, rank }) => {
  const [form, setForm] = useState<MilitaryUnitForm>({
    unitName: "",
    unitAlias: "",
    echelon: "تیپ",
    branch: "زرهی",
    parentCommand: "",
    codeNumber: "",
    garrisonCity: "",
    province: "",
    baseName: "",
    lat: "",
    lng: "",
    areaOfOps: "",
    capabilities: [],
    personnelStrength: "",
    equipment: "",
    readiness: undefined,
    commanderName: "",
    contact: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm((prev) => ({ ...prev, ...(rank || {}) }));
    }
  }, [open, rank]);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof MilitaryUnitForm, string>> = {};
    for (const f of requiredFields) {
      const value = form[f] as unknown;
      if (!value || (Array.isArray(value) && value.length === 0)) {
        e[f] = "الزامی";
      }
    }
    return e;
  }, [form]);

  function setField<K extends keyof MilitaryUnitForm>(k: K, v: MilitaryUnitForm[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function toggleCapability(cap: string) {
    setForm((s) => {
      const exists = s.capabilities.includes(cap);
      return { ...s, capabilities: exists ? s.capabilities.filter((c) => c !== cap) : [...s.capabilities, cap] };
    });
  }

  function handleSubmit() {
    if (Object.keys(errors).length > 0) return;

    // ساخت payload سازگار با RankItem
    const itemData = {
      rankCode: (form.codeNumber || '').trim(),
      title: (form.unitName || form.unitAlias || '').trim(),
      level: mapEchelonToLevel(form.echelon),
      category: form.branch, // ذخیره رسته به عنوان دسته‌بندی
      insignia: undefined as string | undefined,
      authority: [...(form.capabilities || [])],
      description: [
        form.areaOfOps ? `حوزه عملیات: ${form.areaOfOps}` : '',
        form.equipment ? `تجهیزات: ${form.equipment}` : '',
        form.notes ? `توضیحات: ${form.notes}` : '',
      ].filter(Boolean).join(' — ') || undefined,
      requirements: JSON.stringify({
        parentCommand: form.parentCommand || undefined,
        garrisonCity: form.garrisonCity || undefined,
        province: form.province || undefined,
        baseName: form.baseName || undefined,
        coordinates: (form.lat && form.lng) ? { lat: form.lat, lng: form.lng } : undefined,
        personnelStrength: form.personnelStrength || undefined,
        readiness: form.readiness || undefined,
        commanderName: form.commanderName || undefined,
        contact: form.contact || undefined,
      }),
      status: defaultStatus,
    };

    onSave(itemData);
    onClose();
  }

  function fillExample() {
    setForm({
      unitName: "تیپ ۲۱ امام‌رضا",
      unitAlias: "۲۱ امام‌رضا",
      echelon: "تیپ",
      branch: "زرهی",
      parentCommand: "لشکر نمونه شمال‌شرق",
      codeNumber: "۲۱-ز-الف",
      garrisonCity: "نیشابور",
      province: "خراسان رضوی",
      baseName: "پادگان امام‌رضا(ع)",
      lat: "36.214",
      lng: "58.796",
      areaOfOps: "استان‌های خراسان",
      capabilities: ["زرهی", "توپخانه خودکششی", "ضدزره"],
      personnelStrength: "حدود ۳۵۰۰ نفر",
      equipment: "تانک‌های اصلی نبرد، هویتزر خودکششی، نفربر مکانیزه، گروه ضدزره",
      readiness: "بالا",
      commanderName: "سرهنگ نمونه",
      contact: "دفتر فرماندهی: ۰۵۱-xxxxxxx",
      notes: "یگان واکنش سریع منطقه‌ای",
    });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>ثبت/ویرایش ردهٔ نظامی</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                label={
                  <>
                    نام یگان<span style={{ color: "#ef4444" }}> *</span>
                  </>
                }
                value={form.unitName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("unitName", e.target.value)}
                placeholder="مثلاً تیپ ۲۱ امام‌رضا"
                error={Boolean(errors.unitName)}
                helperText={errors.unitName ? "نام یگان الزامی است" : ""}
              />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                label="عنوان کوتاه"
                value={form.unitAlias}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("unitAlias", e.target.value)}
                placeholder="مثلاً ۲۱ امام‌رضا"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.echelon)}>
                <InputLabel id="echelon-label">ردهٔ سازمانی *</InputLabel>
                <Select
                  labelId="echelon-label"
                  label="ردهٔ سازمانی *"
                  value={form.echelon}
                  onChange={(e) => setField("echelon", e.target.value as MilitaryUnitForm["echelon"])}
                >
                  {echelons.map((e) => (
                    <MenuItem key={e} value={e}>{e}</MenuItem>
                  ))}
                </Select>
                {errors.echelon && (
                  <Typography variant="caption" color="error">انتخاب رده الزامی است</Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={Boolean(errors.branch)}>
                <InputLabel id="branch-label">رسته/نیرو *</InputLabel>
                <Select
                  labelId="branch-label"
                  label="رسته/نیرو *"
                  value={form.branch}
                  onChange={(e) => setField("branch", e.target.value as MilitaryUnitForm["branch"])}
                >
                  {branches.map((b) => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
                {errors.branch && (
                  <Typography variant="caption" color="error">انتخاب رسته الزامی است</Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="زیرمجموعه/قرارگاه بالادست"
                value={form.parentCommand}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("parentCommand", e.target.value)}
                placeholder="مثلاً لشکر نمونه شمال‌شرق"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="کد/شماره سازمانی"
                value={form.codeNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("codeNumber", e.target.value)}
                placeholder="مثلاً ۲۱-ز-الف"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="شهر استقرار"
                value={form.garrisonCity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("garrisonCity", e.target.value)}
                placeholder="مثلاً نیشابور"
              />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                label="استان"
                value={form.province}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("province", e.target.value)}
                placeholder="مثلاً خراسان رضوی"
              />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                label="نام پادگان/قرارگاه"
                value={form.baseName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("baseName", e.target.value)}
                placeholder="مثلاً پادگان امام‌رضا(ع)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="عرض جغرافیایی"
                    value={form.lat}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("lat", e.target.value)}
                    placeholder="عرض جغرافیایی"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="طول جغرافیایی"
                    value={form.lng}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("lng", e.target.value)}
                    placeholder="طول جغرافیایی"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                label="محدوده مسئولیت/عملیات"
                value={form.areaOfOps}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("areaOfOps", e.target.value)}
                placeholder="مثلاً استان‌های خراسان"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 0.5 }}>توانمندی‌ها</Box>
              <Grid container spacing={1}>
                {capabilitiesAll.map((c) => (
                  <Grid item xs={12} sm={6} md={4} key={c}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.capabilities.includes(c)}
                          onChange={() => toggleCapability(c)}
                        />
                      }
                      label={c}
                    />
                  </Grid>
                ))}
              </Grid>
              {form.capabilities.length === 0 && (
                <Typography variant="caption" color="text.secondary">می‌توانید چند مورد را انتخاب کنید</Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تعداد نیرو (تقریبی)"
                value={form.personnelStrength}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("personnelStrength", e.target.value)}
                placeholder="مثلاً حدود ۳۵۰۰ نفر"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="readiness-label">آمادگی رزمی</InputLabel>
                <Select
                  labelId="readiness-label"
                  label="آمادگی رزمی"
                  value={form.readiness || ""}
                  onChange={(e) => setField("readiness", (e.target.value || undefined) as any)}
                  displayEmpty
                >
                  <MenuItem value=""><em>انتخاب سطح</em></MenuItem>
                  {( ["خیلی بالا", "بالا", "متوسط", "پایین"] as const ).map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="تجهیزات شاخص"
                value={form.equipment}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField("equipment", e.target.value)}
                placeholder="مثلاً تانک اصلی نبرد، هویتزر، نفربر مکانیزه..."
                multiline
                minRows={3}
              />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="نام فرمانده"
                value={form.commanderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("commanderName", e.target.value)}
                placeholder="مثلاً سرهنگ نمونه"
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                label="اطلاعات تماس"
                value={form.contact}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("contact", e.target.value)}
                placeholder="تلفن/ایمیل داخلی"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="توضیحات"
                value={form.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField("notes", e.target.value)}
                placeholder="نکات تکمیلی..."
                multiline
                minRows={3}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ display: "flex", justifyContent: "space-between", px: 3, pb: 2 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={fillExample}>پرکردن با مثال تیپ ۲۱ امام‌رضا</Button>
          <Button variant="text" onClick={onClose}>انصراف</Button>
        </Box>
        <Box>
          <Button variant="contained" onClick={handleSubmit} disabled={Object.keys(errors).length > 0}>ذخیره</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default RanksModal;