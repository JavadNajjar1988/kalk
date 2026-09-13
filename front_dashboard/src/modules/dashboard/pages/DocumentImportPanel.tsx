import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import dataImportApiService, {
  DocumentJob,
  DocumentMapPage,
  DocumentModelStatus,
  DocumentPageCoverage,
  DocumentPagePreview,
  DocumentProposal,
} from '@/services/api/dataImportApiService';
import { scenarioApiService } from '@/services/api/scenarioApiService';
import resourceApiService, {
  ResourceDto,
  ResourceType,
} from '@/services/api/resourceApiService';
import PersianCalendarField from '@/components/common/PersianCalendarField';

const ACTIVE_DOCUMENT_JOB_KEY = 'kalkyar-active-document-job';

const labels: Record<DocumentProposal['kind'], string> = {
  scenario: 'سناریو',
  person: 'شخص',
  unit: 'یگان',
  equipment: 'تجهیز',
  place: 'مکان',
  event: 'رویداد',
};

const pageKindLabels: Record<
  NonNullable<DocumentPagePreview['pageKinds']>[number],
  string
> = {
  text: 'متن',
  image: 'تصویر',
  table: 'جدول',
  'military-map': 'کالک یا نقشه نظامی',
};

const resourceKind: Partial<Record<DocumentProposal['kind'], ResourceType>> = {
  person: 'personnel',
  unit: 'units',
  equipment: 'equipment',
};

const personTitlePattern =
  /^(?:شهید|امیر|سردار|سپهبد|سرلشکر|سرتیپ(?:\s+دوم)?|سرهنگ|سرگرد|سروان|ستوان(?:\s+(?:یکم|دوم|سوم))?|دریادار|ناخدا(?:\s+(?:یکم|دوم|سوم))?|حاج(?:ی)?|دکتر|مهندس|آیت\s*الله|حجت\s*الاسلام(?:\s+والمسلمین)?|جناب(?:\s+آقای)?|آقای|خانم)\s+/i;

const normalizePersianName = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[أإ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/\s+/g, ' ')
    .trim();

export const canonicalEntityName = (item: DocumentProposal) => {
  if (item.matchedResourceName?.trim()) return item.matchedResourceName.trim();
  if (item.canonicalName?.trim()) return normalizePersianName(item.canonicalName);
  let name = normalizePersianName(item.name);
  if (item.kind === 'person') {
    let previous = '';
    while (name && name !== previous) {
      previous = name;
      name = name.replace(personTitlePattern, '').trim();
    }
  }
  return name || normalizePersianName(item.name);
};

const compactEntityName = (value: string) =>
  normalizePersianName(value)
    .replace(/[\s\u200c\-_،,:؛;()[\]{}]+/g, '')
    .toLocaleLowerCase('fa');

export const mentionKey = (item: DocumentProposal) => {
  if (item.matchedResourceId)
    return `${item.kind}:resource:${item.matchedResourceId.toLocaleLowerCase()}`;
  if (item.resourceCode)
    return `${item.kind}:code:${item.resourceCode.trim().toLocaleLowerCase()}`;
  if (item.entityDraftId)
    return `${item.kind}:draft:${item.entityDraftId.toLocaleLowerCase()}`;
  return `${item.kind}:name:${compactEntityName(canonicalEntityName(item))}`;
};

const referencePrefixes: Partial<Record<DocumentProposal['kind'], string>> = {
  person: 'PER',
  unit: 'UNT',
  equipment: 'EQP',
};

export const automaticReferenceCode = (item: DocumentProposal) => {
  const prefix = referencePrefixes[item.kind];
  if (!prefix || !item.entityDraftId) return '';
  const identityParts = item.entityDraftId.split('-');
  const source = identityParts[identityParts.length - 1].replace(
    /[^0-9a-f]/gi,
    ''
  );
  if (source.length < 10) return '';
  const suffix = source.slice(0, 10).toUpperCase();
  return `${prefix}-${suffix}`;
};

const missingFields = (item: DocumentProposal): string[] => {
  if (item.reviewStatus !== 'accepted') return [];
  if (item.kind === 'scenario') return item.startTime ? [] : ['زمان شروع'];
  if (item.kind === 'event') return item.startTime ? [] : ['زمان رویداد'];
  if (item.kind === 'unit')
    return [
      !item.side && 'طرف',
      !item.unitType && 'نوع یگان',
      !item.echelon && 'رده',
    ].filter(Boolean) as string[];
  if (item.kind === 'equipment')
    return [
      !item.equipmentType && 'نوع تجهیز',
      item.quantity === undefined && 'تعداد',
    ].filter(Boolean) as string[];
  if (item.kind === 'person') return [];
  if (item.kind === 'place')
    return [
      !item.placeType && 'نوع عارضه',
      item.longitude === undefined && 'طول جغرافیایی',
      item.latitude === undefined && 'عرض جغرافیایی',
    ].filter(Boolean) as string[];
  return [];
};

interface DocumentImportPanelProps {
  onContinueWithWorkbook?: (file: File) => Promise<void>;
}

interface DocumentReviewDraft {
  version: 1;
  status: 'review-draft';
  filename: string;
  documentId: string;
  pageCount: number;
  failedPages?: Record<string, string>;
  pages: DocumentPagePreview[];
  items: DocumentProposal[];
  mainScenarioId?: string;
  jobId?: string;
  mapPages?: Record<string, DocumentMapPage>;
}

function MapPagePreviewImage({
  jobId,
  page,
  rotationDegrees,
}: {
  jobId: string;
  page: number;
  rotationDegrees: 0 | 90 | 180 | 270;
}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let stopped = false;
    let objectUrl = '';
    void dataImportApiService
      .getDocumentMapPageImage(jobId, page)
      .then(blob => {
        if (stopped) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      stopped = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [jobId, page]);
  return url ? (
    <Box
      sx={{
        height: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
      <Box
        component="img"
        src={url}
        alt={`پیش‌نمایش کالک صفحه ${page}`}
        sx={{
          maxWidth: rotationDegrees % 180 ? 270 : '100%',
          maxHeight: rotationDegrees % 180 ? 270 : 280,
          objectFit: 'contain',
          transform: `rotate(${rotationDegrees}deg)`,
        }}
      />
    </Box>
  ) : (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <CircularProgress size={28} />
    </Box>
  );
}

const parseReviewDraft = (raw: string): DocumentReviewDraft => {
  const draft: unknown = JSON.parse(raw);
  if (!draft || typeof draft !== 'object')
    throw new Error('ساختار پیش‌نویس معتبر نیست.');
  const value = draft as Partial<DocumentReviewDraft>;
  if (
    value.version !== 1 ||
    value.status !== 'review-draft' ||
    typeof value.filename !== 'string' ||
    !value.filename.trim() ||
    typeof value.documentId !== 'string' ||
    !value.documentId ||
    !Number.isInteger(value.pageCount) ||
    (value.pageCount || 0) < 1 ||
    (value.pageCount || 0) > 2000 ||
    !Array.isArray(value.pages) ||
    !Array.isArray(value.items)
  ) {
    throw new Error('این فایل، پیش‌نویس معتبر کالک‌یار نیست.');
  }
  const pageCount = value.pageCount as number;
  const documentId = value.documentId;
  if (
    value.pages.some(
      page =>
        !page ||
        page.documentId !== documentId ||
        !Number.isInteger(page.page) ||
        page.page < 1 ||
        page.page > pageCount ||
        !Array.isArray(page.items)
    ) ||
    value.items.some(
      item =>
        !item ||
        item.documentId !== documentId ||
        !Number.isInteger(item.sourcePage) ||
        item.sourcePage < 1 ||
        item.sourcePage > pageCount ||
        !Object.prototype.hasOwnProperty.call(labels, item.kind) ||
        !['pending', 'accepted', 'rejected'].includes(item.reviewStatus)
    )
  ) {
    throw new Error('صفحه‌ها یا پیشنهادهای پیش‌نویس با سند سازگار نیستند.');
  }
  return value as DocumentReviewDraft;
};

export default function DocumentImportPanel({
  onContinueWithWorkbook,
}: DocumentImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [draftFilename, setDraftFilename] = useState('');
  const [page, setPage] = useState(1);
  const [forceOcr, setForceOcr] = useState(false);
  const [pages, setPages] = useState<DocumentPagePreview[]>([]);
  const [items, setItems] = useState<DocumentProposal[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState<number>();
  const [activePage, setActivePage] = useState<number>();
  const [failures, setFailures] = useState<Record<number, string>>({});
  const [mapPages, setMapPages] = useState<Record<string, DocumentMapPage>>({});
  const [scenarioOptions, setScenarioOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [mapPlacement, setMapPlacement] = useState<
    Record<string, { scenarioId: string; rotationDegrees: 0 | 90 | 180 | 270 }>
  >({});
  const [attachingMapPage, setAttachingMapPage] = useState<number>();
  const [wholeDone, setWholeDone] = useState(false);
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState<DocumentJob['status']>();
  const [recoverableJob, setRecoverableJob] = useState<DocumentJob>();
  const [retryingFailures, setRetryingFailures] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [modelStatus, setModelStatus] = useState<DocumentModelStatus>();
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusFailed, setStatusFailed] = useState(false);
  const [mainScenarioId, setMainScenarioId] = useState('');
  const [reviewKind, setReviewKind] = useState<
    'all' | DocumentProposal['kind']
  >('all');
  const [reviewStatus, setReviewStatus] = useState<
    'all' | DocumentProposal['reviewStatus']
  >('all');
  const [reviewQuery, setReviewQuery] = useState('');
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [workbookBusy, setWorkbookBusy] = useState(false);
  const [resourceOptions, setResourceOptions] = useState<
    Record<string, ResourceDto[]>
  >({});
  const [resourceSearchBusy, setResourceSearchBusy] = useState<
    Record<string, boolean>
  >({});
  const request = useRef<AbortController | null>(null);
  const loadedJobPages = useRef(new Set<number>());
  useEffect(() => () => request.current?.abort(), []);
  const refreshStatus = async () => {
    setStatusLoading(true);
    setStatusFailed(false);
    try {
      setModelStatus(await dataImportApiService.getDocumentModelStatus());
    } catch {
      setModelStatus(undefined);
      setStatusFailed(true);
    } finally {
      setStatusLoading(false);
    }
  };
  useEffect(() => {
    void refreshStatus();
  }, []);
  useEffect(() => {
    void scenarioApiService
      .getScenarios()
      .then(values =>
        setScenarioOptions(
          values.map(value => ({ id: String(value.id), name: value.name }))
        )
      )
      .catch(() => setScenarioOptions([]));
  }, []);
  useEffect(() => {
    let stopped = false;
    const restoreJob = async () => {
      const storedJob = localStorage.getItem(ACTIVE_DOCUMENT_JOB_KEY);
      if (storedJob) {
        setJobId(storedJob);
        return;
      }
      try {
        const jobs = await dataImportApiService.listDocumentJobs();
        const activeJob = jobs.find(job =>
          ['queued', 'running', 'cancel_requested'].includes(job.status)
        );
        if (!stopped && activeJob) {
          localStorage.setItem(ACTIVE_DOCUMENT_JOB_KEY, activeJob.id);
          setJobId(activeJob.id);
          return;
        }
        const latestFinishedJob = jobs.find(
          job =>
            ['completed', 'partial'].includes(job.status) &&
            job.processedPages.length > 0
        );
        if (!stopped && latestFinishedJob) {
          setRecoverableJob(latestFinishedJob);
        }
      } catch {
        // ناتوانی در بازیابی فهرست، انتخاب و پردازش سند جدید را مسدود نمی‌کند.
      }
    };
    void restoreJob();
    return () => {
      stopped = true;
    };
  }, []);
  useEffect(() => {
    if (!file) {
      setSourceUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const selected = pages.find(p => p.page === page);
  const count = totalPages || pages[0]?.pageCount;
  const sourceFilename = file?.name || draftFilename;
  const acceptedItems = items.filter(item => item.reviewStatus === 'accepted');
  const uniqueAcceptedItems = Array.from(
    new Map(acceptedItems.map(item => [mentionKey(item), item])).values()
  );
  const acceptedScenarios = uniqueAcceptedItems.filter(
    item => item.kind === 'scenario'
  );
  const hasSelectedMainScenario = acceptedScenarios.some(
    item => item.id === mainScenarioId
  );
  const incompleteAccepted = uniqueAcceptedItems.filter(
    item => missingFields(item).length > 0
  );
  const coverage = useMemo<DocumentPageCoverage[]>(() => {
    if (!count) return [];
    return Array.from({ length: count }, (_value, index) => {
      const pageNumber = index + 1;
      const pageResult = pages.find(result => result.page === pageNumber);
      const pageItems = items.filter(item => item.sourcePage === pageNumber);
      const mapPage = mapPages[String(pageNumber)];
      const acceptedCount = pageItems.filter(
        item => item.reviewStatus === 'accepted'
      ).length;
      const rejectedCount = pageItems.filter(
        item => item.reviewStatus === 'rejected'
      ).length;
      const pendingCount = pageItems.filter(
        item => item.reviewStatus === 'pending'
      ).length;
      const fallbackKinds: DocumentPageCoverage['pageKinds'] = pageResult?.text
        ? ['text']
        : [];
      if (
        pageResult?.pageKind === 'military-map' &&
        !fallbackKinds.includes('military-map')
      ) {
        fallbackKinds.push('military-map');
      }
      return {
        page: pageNumber,
        pageKinds: pageResult?.pageKinds || fallbackKinds,
        status: failures[pageNumber]
          ? 'error'
          : pageResult?.reviewStatus === 'reviewed'
            ? 'reviewed'
            : pageResult?.reviewStatus === 'no_relevant_data'
              ? 'no_relevant_data'
              : 'pending_review',
        itemCount: pageItems.length,
        acceptedCount,
        rejectedCount,
        pendingCount,
        mapStatus: mapPage?.status,
        warnings: pageResult?.warnings || [],
      };
    });
  }, [count, failures, items, mapPages, pages]);
  const unresolvedCoverage = coverage.filter(
    entry =>
      !['reviewed', 'no_relevant_data'].includes(entry.status) ||
      entry.pendingCount > 0 ||
      entry.mapStatus === 'needs_placement'
  );
  const coverageReady =
    !!count &&
    coverage.length === count &&
    unresolvedCoverage.length === 0 &&
    incompleteAccepted.length === 0 &&
    hasSelectedMainScenario;
  const duplicateMentions = Math.max(
    0,
    acceptedItems.length -
      new Set(acceptedItems.map(item => mentionKey(item))).size
  );
  const filteredItems = useMemo(() => {
    const query = reviewQuery.trim().toLocaleLowerCase('fa');
    return items.filter(item => {
      if (reviewKind !== 'all' && item.kind !== reviewKind) return false;
      if (reviewStatus !== 'all' && item.reviewStatus !== reviewStatus)
        return false;
      if (
        query &&
        !`${item.name} ${item.evidence}`.toLocaleLowerCase('fa').includes(query)
      )
        return false;
      return true;
    });
  }, [items, reviewKind, reviewQuery, reviewStatus]);
  const mentionGroups = useMemo(() => {
    const groups = new Map<string, DocumentProposal[]>();
    items.forEach(item => {
      const key = mentionKey(item);
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    return groups;
  }, [items]);
  const matchingPages = useMemo(
    () =>
      Array.from(
        new Set(
          showFailedOnly
            ? Object.keys(failures).map(Number)
            : filteredItems.map(item => item.sourcePage)
        )
      ).sort((a, b) => a - b),
    [failures, filteredItems, showFailedOnly]
  );
  const matchingPageKey = matchingPages.join(',');
  useEffect(() => {
    if (matchingPages.length && !matchingPages.includes(page)) {
      setPage(matchingPages[0]);
    }
  }, [matchingPageKey, page]);
  const currentPageItems = showFailedOnly
    ? []
    : filteredItems.filter(item => item.sourcePage === page);
  const allCurrentPageItems = items.filter(item => item.sourcePage === page);
  const currentMapPage = mapPages[String(page)];
  const canReviewCurrentPage =
    !!selected &&
    !failures[page] &&
    allCurrentPageItems.every(item => item.reviewStatus !== 'pending') &&
    currentMapPage?.status !== 'needs_placement';
  const moveBetweenMatchingPages = (offset: number) => {
    if (!matchingPages.length) return;
    const currentIndex = matchingPages.indexOf(page);
    const nextIndex = Math.min(
      matchingPages.length - 1,
      Math.max(0, (currentIndex < 0 ? 0 : currentIndex) + offset)
    );
    setPage(matchingPages[nextIndex]);
  };
  const update = (id: string, patch: Partial<DocumentProposal>) => {
    const target = items.find(item => item.id === id);
    if (target) {
      const targetKey = mentionKey(target);
      const affectedPages = new Set(
        items
          .filter(item => item.id === id || mentionKey(item) === targetKey)
          .map(item => item.sourcePage)
      );
      setPages(previous =>
        previous.map(result =>
          affectedPages.has(result.page)
            ? { ...result, reviewStatus: 'pending' }
            : result
        )
      );
    }
    setItems(previous => {
      const current = previous.find(item => item.id === id);
      if (!current) return previous;
      const targetKey = mentionKey(current);
      return previous.map(item =>
        item.id === id || mentionKey(item) === targetKey
          ? { ...item, ...patch }
          : item
      );
    });
  };
  const setCurrentPageReview = (reviewed: boolean) => {
    setPages(previous =>
      previous.map(result =>
        result.page === page
          ? {
              ...result,
              reviewStatus: reviewed
                ? allCurrentPageItems.length
                  ? 'reviewed'
                  : 'no_relevant_data'
                : 'pending',
            }
          : result
      )
    );
  };
  const searchCatalog = async (item: DocumentProposal, query: string) => {
    const type = resourceKind[item.kind];
    if (!type || query.trim().length < 2) return;
    setResourceSearchBusy(previous => ({ ...previous, [item.id]: true }));
    try {
      const matches = await resourceApiService.search(query, type, 12);
      setResourceOptions(previous => ({ ...previous, [item.id]: matches }));
    } catch {
      setResourceOptions(previous => ({ ...previous, [item.id]: [] }));
    } finally {
      setResourceSearchBusy(previous => ({ ...previous, [item.id]: false }));
    }
  };
  const receivePage = (result: DocumentPagePreview) => {
    loadedJobPages.current.add(result.page);
    setTotalPages(result.pageCount);
    setPages(previous => {
      const existing = previous.find(p => p.page === result.page);
      const next = {
        ...result,
        reviewStatus:
          existing?.reviewStatus || result.reviewStatus || ('pending' as const),
      };
      return [...previous.filter(p => p.page !== result.page), next].sort(
        (a, b) => a.page - b.page
      );
    });
    setItems(previous => [
      ...previous.filter(p => p.sourcePage !== result.page),
      ...result.items,
    ]);
    setFailures(previous => {
      const next = { ...previous };
      delete next[result.page];
      return next;
    });
  };
  const syncJob = async (id: string) => {
    let job = await dataImportApiService.getDocumentJob(id);
    if (
      ['completed', 'partial', 'failed'].includes(job.status) &&
      Object.keys(job.failedPages || {}).length > 0 &&
      !Object.keys(job.mapPages || {}).length
    ) {
      job = await dataImportApiService.detectDocumentMapPages(id);
    }
    setJobStatus(job.status);
    setDraftFilename(job.filename);
    setTotalPages(job.pageCount);
    setActivePage(job.currentPage);
    setFailures(
      Object.fromEntries(
        Object.entries(job.failedPages || {}).map(([number, message]) => [
          Number(number),
          message,
        ])
      )
    );
    setMapPages(job.mapPages || {});
    const missing = job.processedPages.filter(
      number => !loadedJobPages.current.has(number)
    );
    for (const number of missing) {
      receivePage(await dataImportApiService.getDocumentJobPage(id, number));
    }
    const running = ['queued', 'running', 'cancel_requested'].includes(
      job.status
    );
    setBusy(running);
    setWholeDone(['completed', 'partial'].includes(job.status));
    if (!running) setRetryingFailures(false);
    if (job.error) setError(job.error);
    return job;
  };
  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    let syncing = false;
    let timer: number | undefined;
    const poll = async () => {
      if (syncing) return;
      syncing = true;
      try {
        const job = await syncJob(jobId);
        if (
          !stopped &&
          ['queued', 'running', 'cancel_requested'].includes(job.status)
        ) {
          timer = window.setTimeout(() => void poll(), 1500);
        }
      } catch (err) {
        if (!stopped) {
          localStorage.removeItem(ACTIVE_DOCUMENT_JOB_KEY);
          setJobId('');
          setBusy(false);
          setError(
            err instanceof Error
              ? err.message
              : 'بازیابی وضعیت پردازش ناموفق بود.'
          );
        }
      } finally {
        syncing = false;
      }
    };
    void poll();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [jobId]);
  const extractAll = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setWholeDone(false);
    try {
      const activeJobId =
        jobId || localStorage.getItem(ACTIVE_DOCUMENT_JOB_KEY) || '';
      setRetryingFailures(
        Boolean(
          activeJobId &&
            ['partial', 'failed', 'cancelled'].includes(jobStatus || '') &&
            Object.keys(failures).length
        )
      );
      const job = activeJobId
        ? await dataImportApiService.resumeDocumentJob(activeJobId)
        : file
          ? await dataImportApiService.createDocumentJob(file, forceOcr)
          : undefined;
      if (!job) throw new Error('ابتدا سند را انتخاب کنید.');
      loadedJobPages.current = new Set(
        job.id === activeJobId ? pages.map(item => item.page) : []
      );
      if (job.id !== activeJobId) {
        setPages([]);
        setItems([]);
        setFailures({});
        setMapPages({});
        setMainScenarioId('');
      }
      setJobId(job.id);
      setJobStatus(job.status);
      setDraftFilename(job.filename);
      setTotalPages(job.pageCount);
      localStorage.setItem(ACTIVE_DOCUMENT_JOB_KEY, job.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'پردازش کل سند ناموفق بود.'
      );
      setBusy(false);
    }
  };

  const restoreServerJob = () => {
    if (!recoverableJob || busy) return;
    setFile(null);
    setPages([]);
    setItems([]);
    setFailures({});
    setMapPages({});
    setMainScenarioId('');
    setError('');
    setWholeDone(false);
    setActivePage(undefined);
    loadedJobPages.current = new Set();
    localStorage.setItem(ACTIVE_DOCUMENT_JOB_KEY, recoverableJob.id);
    setJobId(recoverableJob.id);
    setRecoverableJob(undefined);
  };

  const extract = async () => {
    if (!file || busy) return;
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 390_000);
    setBusy(true);
    setError('');
    try {
      const result = await dataImportApiService.previewDocument(
        file,
        page,
        forceOcr,
        controller.signal
      );
      receivePage(result);
    } catch (err) {
      setError(
        controller.signal.aborted
          ? 'پردازش متوقف شد؛ نتیجه صفحه‌های قبلی حفظ شده است.'
          : err instanceof Error
            ? err.message
            : 'خطا در پردازش سند'
      );
    } finally {
      clearTimeout(timeout);
      request.current = null;
      setBusy(false);
    }
  };
  const download = () => {
    const draft = {
      version: 1,
      status: 'review-draft',
      filename: sourceFilename,
      documentId: pages[0]?.documentId,
      pageCount: count,
      processedPages: pages.map(p => p.page),
      complete: pages.length === count,
      failedPages: failures,
      pages,
      items,
      mainScenarioId,
      jobId: jobId || undefined,
      mapPages,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document-review-draft.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const loadDraft = async (draftFile: File) => {
    setError('');
    try {
      if (draftFile.size > 25 * 1024 * 1024) {
        throw new Error('حجم پیش‌نویس بیش از ۲۵ مگابایت است.');
      }
      const draft = parseReviewDraft(await draftFile.text());
      if (file && file.name !== draft.filename) {
        throw new Error(
          'نام سند اصلی با پیش‌نویس یکسان نیست. ابتدا سند درست را انتخاب کنید.'
        );
      }
      setDraftFilename(draft.filename);
      setPages(
        draft.pages
          .map(result => ({
            ...result,
            reviewStatus: result.reviewStatus || ('pending' as const),
          }))
          .sort((a, b) => a.page - b.page)
      );
      setItems(draft.items);
      setTotalPages(draft.pageCount);
      setFailures(
        Object.fromEntries(
          Object.entries(draft.failedPages || {}).map(([number, message]) => [
            Number(number),
            message,
          ])
        )
      );
      setMapPages(draft.mapPages || {});
      setWholeDone(draft.pages.length === draft.pageCount);
      setPage(draft.pages[0]?.page || 1);
      setActivePage(undefined);
      setMainScenarioId(draft.mainScenarioId || '');
      loadedJobPages.current = new Set(draft.pages.map(item => item.page));
      if (draft.jobId) {
        setJobId(draft.jobId);
        localStorage.setItem(ACTIVE_DOCUMENT_JOB_KEY, draft.jobId);
      } else {
        setJobId('');
        setJobStatus(undefined);
        localStorage.removeItem(ACTIVE_DOCUMENT_JOB_KEY);
      }
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? 'فایل پیش‌نویس خوانا نیست.'
          : err instanceof Error
            ? err.message
            : 'بازیابی پیش‌نویس ناموفق بود.'
      );
    }
  };
  const createWorkbook = async (
    finalized = false,
    continueToImport = false
  ) => {
    if (!sourceFilename || !count || !hasSelectedMainScenario || workbookBusy)
      return;
    if (finalized && !coverageReady) {
      setError(
        'پیش از ساخت اکسل نهایی، همه صفحه‌ها، پیشنهادها، خطاها و کالک‌ها را تعیین تکلیف کنید.'
      );
      return;
    }
    setWorkbookBusy(true);
    setError('');
    try {
      const blob = await dataImportApiService.createDocumentWorkbook({
        filename: sourceFilename,
        documentId: pages[0]?.documentId || '',
        pageCount: count,
        mainScenarioId,
        items,
        coverage,
        finalized,
      });
      const workbook = new File(
        [blob],
        finalized ? 'document_import_final.xlsx' : 'document_review_draft.xlsx',
        {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      );
      if (continueToImport && onContinueWithWorkbook) {
        await onContinueWithWorkbook(workbook);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = workbook.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'ساخت فایل اکسل ناموفق بود.'
      );
    } finally {
      setWorkbookBusy(false);
    }
  };

  const attachMapPage = async (mapPage: DocumentMapPage) => {
    if (!jobId || attachingMapPage) return;
    const placement = mapPlacement[String(mapPage.page)];
    if (!placement?.scenarioId) {
      setError('ابتدا سناریوی مقصد کالک را انتخاب کنید.');
      return;
    }
    setAttachingMapPage(mapPage.page);
    setError('');
    try {
      const result = await dataImportApiService.attachDocumentMapPage(
        jobId,
        mapPage.page,
        {
          scenarioId: placement.scenarioId,
          layerName: `کالک صفحه ${mapPage.page} ـ ${sourceFilename}`,
          rotationDegrees: placement.rotationDegrees,
        }
      );
      setMapPages(previous => ({
        ...previous,
        [String(mapPage.page)]: {
          ...mapPage,
          status: 'attached',
          scenarioId: result.scenarioId,
          layerId: result.layerId,
        },
      }));
      window.open(result.kalknegarUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'افزودن کالک به سناریو ناموفق بود.'
      );
    } finally {
      setAttachingMapPage(undefined);
    }
  };

  const ignoreMapPage = async (mapPage: DocumentMapPage) => {
    if (!jobId || attachingMapPage) return;
    setAttachingMapPage(mapPage.page);
    setError('');
    try {
      const job = await dataImportApiService.decideDocumentMapPage(
        jobId,
        mapPage.page,
        'ignored'
      );
      setMapPages(job.mapPages || {});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'کنارگذاشتن کالک ناموفق بود.'
      );
    } finally {
      setAttachingMapPage(undefined);
    }
  };

  const reopenMapPage = async (mapPage: DocumentMapPage) => {
    if (!jobId || attachingMapPage) return;
    setAttachingMapPage(mapPage.page);
    setError('');
    try {
      const job = await dataImportApiService.decideDocumentMapPage(
        jobId,
        mapPage.page,
        'needs_placement'
      );
      setMapPages(job.mapPages || {});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'بازگشایی تصمیم کالک ناموفق بود.'
      );
    } finally {
      setAttachingMapPage(undefined);
    }
  };

  const unitChoices = acceptedItems.filter(item => item.kind === 'unit');
  const completionFields = (item: DocumentProposal) => {
    const catalogType = resourceKind[item.kind];
    const options = resourceOptions[item.id] || [];
    const selectedResource = options.find(
      option => option.id === item.matchedResourceId
    );
    const setNumber = (
      field: 'longitude' | 'latitude' | 'quantity' | 'radiusMeters',
      raw: string
    ) => update(item.id, { [field]: raw === '' ? undefined : Number(raw) });
    return (
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {catalogType && (
          <Autocomplete
            size="small"
            options={options}
            value={selectedResource || null}
            loading={!!resourceSearchBusy[item.id]}
            filterOptions={values => values}
            noOptionsText="نام یا کد منبع را وارد کنید"
            getOptionLabel={option =>
              `${option.name}${option.code ? ` ـ ${option.code}` : ''}`
            }
            getOptionDisabled={option => !option.code}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onInputChange={(_event, value, reason) => {
              if (reason === 'input') void searchCatalog(item, value);
            }}
            onChange={(_event, value) =>
              update(item.id, {
                matchedResourceId: value?.id,
                matchedResourceName: value?.name,
                resourceCode: value?.code || item.resourceCode,
              })
            }
            renderInput={params => (
              <TextField
                {...params}
                label="تطبیق با منبع موجود"
                helperText="با نام یا کد جستجو کنید؛ در صورت نبودن، کد مرجع جدید بدهید."
              />
            )}
          />
        )}
        {catalogType && (
          <TextField
            size="small"
            label="کد مرجع منبع"
            value={item.resourceCode || automaticReferenceCode(item)}
            onChange={event =>
              update(item.id, {
                resourceCode:
                  event.target.value === automaticReferenceCode(item)
                    ? undefined
                    : event.target.value,
                matchedResourceId: undefined,
                matchedResourceName: undefined,
              })
            }
            helperText={
              item.matchedResourceId
                ? 'کد منبع موجود حفظ می‌شود.'
                : 'کد پیشنهادی هنگام ثبت نهایی صادر می‌شود و به نام وابسته نیست.'
            }
          />
        )}
        {(item.kind === 'scenario' || item.kind === 'event') && (
          <PersianCalendarField
            label={
              item.kind === 'scenario' ? 'زمان شروع سناریو' : 'زمان رویداد'
            }
            value={item.startTime || ''}
            onChange={value => update(item.id, { startTime: value })}
          />
        )}
        {item.kind === 'unit' && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              select
              fullWidth
              size="small"
              label="طرف"
              value={item.side || ''}
              onChange={event => update(item.id, { side: event.target.value })}
            >
              <MenuItem value="خودی">خودی</MenuItem>
              <MenuItem value="دشمن">دشمن</MenuItem>
              <MenuItem value="خنثی">خنثی</MenuItem>
              <MenuItem value="نامشخص">نامشخص</MenuItem>
            </TextField>
            <TextField
              fullWidth
              size="small"
              label="نوع یگان"
              value={item.unitType || ''}
              onChange={event =>
                update(item.id, { unitType: event.target.value })
              }
            />
            <TextField
              select
              fullWidth
              size="small"
              label="رده یگان"
              value={item.echelon || ''}
              onChange={event =>
                update(item.id, { echelon: event.target.value })
              }
            >
              {[
                'لشکر',
                'تیپ',
                'هنگ',
                'گردان / اسکادران',
                'گروهان / آتشبار',
                'دسته',
                'جوخه',
              ].map(value => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              size="small"
              label="یگان بالادست"
              value={item.parentUnitId || ''}
              onChange={event =>
                update(item.id, { parentUnitId: event.target.value })
              }
            >
              <MenuItem value="">بدون یگان بالادست</MenuItem>
              {unitChoices
                .filter(unit => unit.id !== item.id)
                .map(unit => (
                  <MenuItem key={unit.id} value={`doc-${unit.id.slice(0, 24)}`}>
                    {unit.name}
                  </MenuItem>
                ))}
            </TextField>
          </Stack>
        )}
        {item.kind === 'equipment' && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="نوع تجهیز"
              value={item.equipmentType || ''}
              onChange={event =>
                update(item.id, { equipmentType: event.target.value })
              }
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="تعداد"
              value={item.quantity ?? ''}
              inputProps={{ min: 0 }}
              onChange={event => setNumber('quantity', event.target.value)}
            />
            <TextField
              select
              fullWidth
              size="small"
              label="یگان مربوط"
              value={item.unitId || ''}
              onChange={event =>
                update(item.id, { unitId: event.target.value })
              }
            >
              <MenuItem value="">بدون اتصال</MenuItem>
              {unitChoices.map(unit => (
                <MenuItem key={unit.id} value={`doc-${unit.id.slice(0, 24)}`}>
                  {unit.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        )}
        {item.kind === 'person' && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="درجه"
              value={item.rank || ''}
              onChange={event => update(item.id, { rank: event.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="سمت یا تخصص"
              value={item.specialty || ''}
              onChange={event =>
                update(item.id, { specialty: event.target.value })
              }
            />
            <TextField
              select
              fullWidth
              size="small"
              label="یگان مربوط"
              value={item.unitId || ''}
              onChange={event =>
                update(item.id, { unitId: event.target.value })
              }
            >
              <MenuItem value="">بدون اتصال</MenuItem>
              {unitChoices.map(unit => (
                <MenuItem key={unit.id} value={`doc-${unit.id.slice(0, 24)}`}>
                  {unit.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        )}
        {item.kind === 'place' && (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              select
              fullWidth
              size="small"
              label="نوع عارضه"
              value={item.placeType || ''}
              onChange={event =>
                update(item.id, { placeType: event.target.value })
              }
            >
              {[
                'شهر',
                'روستا',
                'ارتفاعات',
                'رودخانه',
                'جاده',
                'پل',
                'منطقه',
                'نقطه',
              ].map(value => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="شعاع به متر"
              value={item.radiusMeters ?? ''}
              inputProps={{ min: 0 }}
              onChange={event => setNumber('radiusMeters', event.target.value)}
            />
          </Stack>
        )}
        {['event', 'unit', 'equipment', 'place'].includes(item.kind) && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="طول جغرافیایی"
              value={item.longitude ?? ''}
              inputProps={{ min: -180, max: 180, step: 'any' }}
              onChange={event => setNumber('longitude', event.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="عرض جغرافیایی"
              value={item.latitude ?? ''}
              inputProps={{ min: -90, max: 90, step: 'any' }}
              onChange={event => setNumber('latitude', event.target.value)}
            />
          </Stack>
        )}
        {missingFields(item).length > 0 && (
          <Alert severity="warning">
            برای ورود نهایی تکمیل شود: {missingFields(item).join('، ')}
          </Alert>
        )}
      </Stack>
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}
      dir="rtl"
    >
      <Typography variant="h6" gutterBottom>
        استخراج از گزارش و سند
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        سند را انتخاب کنید و «پردازش کل سند» را بزنید. نتیجه هر صفحه به‌تدریج
        نمایش داده می‌شود و خطای یک صفحه مانع ادامه نمی‌شود. پردازش در سرور
        ادامه دارد؛ می‌توانید این صفحه را ببندید و بعداً برگردید. برای بررسی یا
        آزمایش یک صفحه نیز می‌توانید شماره آن را انتخاب کنید.
      </Typography>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ mb: 2 }}
        aria-label="مراحل پردازش سند"
      >
        {['۱. انتخاب سند', '۲. پردازش صفحه‌ها', '۳. بازبینی پیشنهادها'].map(
          label => (
            <Chip
              key={label}
              label={label}
              color="primary"
              variant="outlined"
            />
          )
        )}
        <Chip
          label="۴. ساخت اکسل قابل تکمیل"
          color="primary"
          variant="outlined"
        />
      </Stack>
      <Paper
        variant="outlined"
        sx={{ p: 1.5, mb: 2, borderRadius: 2 }}
        aria-live="polite"
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          spacing={1}
        >
          <Typography fontWeight={700} sx={{ flexGrow: 1 }}>
            وضعیت پردازش
          </Typography>
          <Chip
            size="small"
            label={
              statusLoading
                ? 'در حال بررسی…'
                : modelStatus?.ready
                  ? 'سامانه آماده پردازش است'
                  : 'پردازش در دسترس نیست'
            }
            color={modelStatus?.ready ? 'success' : 'default'}
          />
          <Button size="small" disabled={statusLoading} onClick={refreshStatus}>
            {statusLoading ? 'در حال بررسی…' : 'بررسی دوباره'}
          </Button>
        </Stack>
        {(statusFailed || (modelStatus && !modelStatus.ready)) && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            پردازش سند فعلاً در دسترس نیست. با مدیر سامانه تماس بگیرید یا کمی
            بعد دوباره بررسی کنید.
          </Alert>
        )}
        {modelStatus && (
          <Box component="details" sx={{ mt: 1 }}>
            <Typography
              component="summary"
              variant="caption"
              sx={{ cursor: 'pointer' }}
            >
              جزئیات فنی پردازش
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Typography variant="caption">
                مدل تحلیل:{' '}
                <Box component="span" dir="ltr">
                  {modelStatus.llm.model}
                </Box>
              </Typography>
              <Typography variant="caption">
                مدل تصویر:{' '}
                <Box component="span" dir="ltr">
                  {modelStatus.ocr.model}
                </Box>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {modelStatus.ocrMode === 'full-pipeline'
                  ? 'تشخیص صفحه‌آرایی و خواندن تصویر فعال است.'
                  : 'خواندن تصویر از بخش بینایی مدل انجام می‌شود.'}
              </Typography>
            </Stack>
          </Box>
        )}
      </Paper>
      <Alert severity="info" sx={{ mb: 2 }}>
        قالب‌های مجاز: پی‌دی‌اف، تصویر با پسوند PNG یا JPG و متن UTF-8. حداکثر
        حجم فایل ۲۵ مگابایت و حداکثر تعداد صفحات پی‌دی‌اف دو هزار صفحه است.
      </Alert>
      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'action.hover' }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ sm: 'center' }}
        >
          <Button
            component="label"
            variant="outlined"
            disabled={busy}
            sx={{ minWidth: 190 }}
          >
            انتخاب سند یا تصویر
            <input
              hidden
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              onChange={e => {
                const next = e.target.files?.[0] || null;
                if (next && next.size > 25 * 1024 * 1024) {
                  setError('حداکثر حجم فایل ۲۵ مگابایت است.');
                  return;
                }
                setFile(next);
                setJobId('');
                setJobStatus(undefined);
                loadedJobPages.current = new Set();
                localStorage.removeItem(ACTIVE_DOCUMENT_JOB_KEY);
                setDraftFilename('');
                setPages([]);
                setItems([]);
                setPage(1);
                setError('');
                setForceOcr(false);
                setTotalPages(undefined);
                setFailures({});
                setMapPages({});
                setWholeDone(false);
                setRetryingFailures(false);
                setActivePage(undefined);
                setMainScenarioId('');
              }}
            />
          </Button>
          <Button
            variant="contained"
            disabled={
              (!file && !jobId) ||
              busy ||
              jobStatus === 'completed' ||
              (!!count && pages.length === count)
            }
            onClick={extractAll}
            sx={{ minWidth: 170 }}
          >
            {jobStatus === 'partial' && Object.keys(failures).length
              ? 'تلاش دوباره برای صفحه‌های خطادار'
              : jobId && ['failed', 'cancelled'].includes(jobStatus || '')
                ? 'ادامه پردازش'
                : 'پردازش کل سند'}
          </Button>
        </Stack>
        {file && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, overflowWrap: 'anywhere' }}
          >
            فایل انتخاب‌شده: {file.name}
          </Typography>
        )}
      </Paper>
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
      >
        <Button component="label" disabled={busy}>
          بازیابی پیش‌نویس بازبینی
          <input
            hidden
            type="file"
            accept=".json,application/json"
            onChange={e => {
              const selectedDraft = e.target.files?.[0];
              if (selectedDraft) void loadDraft(selectedDraft);
              e.target.value = '';
            }}
          />
        </Button>
        {recoverableJob && !jobId && (
          <Button variant="outlined" disabled={busy} onClick={restoreServerJob}>
            بازیابی آخرین پردازش سرور
          </Button>
        )}
        {busy && (
          <Button
            onClick={() => {
              if (jobId) {
                void dataImportApiService
                  .cancelDocumentJob(jobId)
                  .then(job => setJobStatus(job.status))
                  .catch(err =>
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'توقف پردازش ناموفق بود.'
                    )
                  );
              } else {
                request.current?.abort();
              }
            }}
          >
            توقف پردازش
          </Button>
        )}
        {pages.length > 0 && (
          <Button disabled={busy} onClick={download}>
            دریافت پیش‌نویس بازبینی
          </Button>
        )}
        {count && page < count && (
          <Button disabled={busy} onClick={() => setPage(page + 1)}>
            صفحه بعد
          </Button>
        )}
      </Stack>
      {draftFilename && !file && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {jobId ? (
            <>
              نتیجه پردازش «{draftFilename}» از سرور بازیابی شد. بازبینی، ساخت
              اکسل و تلاش دوباره برای صفحه‌های خطادار در دسترس است.
            </>
          ) : (
            <>
              پیش‌نویس «{draftFilename}» بازیابی شد. بازبینی و ساخت اکسل در
              دسترس است. برای ادامه پردازش صفحه‌ها، سند اصلی را انتخاب کنید و
              سپس همین پیش‌نویس را دوباره بازیابی کنید.
            </>
          )}
        </Alert>
      )}
      <Box component="details" sx={{ mb: 2 }}>
        <Typography
          component="summary"
          variant="body2"
          sx={{ cursor: 'pointer' }}
        >
          گزینه‌های پیشرفته پردازش
        </Typography>
        <Stack spacing={1} sx={{ mt: 1, alignItems: 'flex-start' }}>
          <TextField
            label="شماره صفحه"
            type="number"
            size="small"
            value={page}
            disabled={
              busy ||
              (file !== null && !file.name.toLowerCase().endsWith('.pdf'))
            }
            inputProps={{ min: 1, max: count }}
            sx={{ width: 140 }}
            onChange={e =>
              setPage(
                Math.max(
                  1,
                  Math.min(count || 10000, Number(e.target.value) || 1)
                )
              )
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={forceOcr}
                disabled={busy}
                onChange={e => setForceOcr(e.target.checked)}
              />
            }
            label="خواندن دوباره از تصویر صفحه"
          />
          <Button
            variant="outlined"
            disabled={!file || busy || !!selected}
            onClick={extract}
          >
            استخراج فقط این صفحه
          </Button>
        </Stack>
      </Box>
      {busy && (
        <>
          <LinearProgress
            variant={
              count && !retryingFailures ? 'determinate' : 'indeterminate'
            }
            value={
              count && !retryingFailures
                ? ((pages.length + Object.keys(failures).length) / count) * 100
                : undefined
            }
          />
          <Typography variant="caption">
            {activePage
              ? retryingFailures
                ? `در حال تلاش دوباره برای صفحه ${activePage}…`
                : `در حال پردازش صفحه ${activePage} از ${count}…`
              : 'در حال خواندن سند…'}
          </Typography>
          <Typography variant="caption" display="block">
            پردازش در سرور ادامه دارد و می‌توانید این صفحه را ببندید. پس از
            بازگشت، نتیجه‌های آماده‌شده خودکار بازیابی می‌شوند.
          </Typography>
        </>
      )}
      {wholeDone && (
        <Alert
          severity={Object.keys(failures).length ? 'warning' : 'success'}
          sx={{ my: 2 }}
        >
          {Object.keys(failures).length
            ? 'بررسی کل سند پایان یافت؛ برخی صفحه‌ها خطا دارند. دکمه تلاش دوباره فقط همان صفحه‌های ناموفق را پردازش می‌کند.'
            : 'پردازش همه صفحه‌ها پایان یافت. پیشنهادها آماده بازبینی هستند.'}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      {count && (
        <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2 }}>
          <Typography fontWeight={700}>پوشش و کنترل کامل‌بودن سند</Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ mt: 1, flexWrap: 'wrap' }}
          >
            <Chip label={`${pages.length} از ${count} صفحه پردازش شده`} />
            <Chip
              color={unresolvedCoverage.length ? 'warning' : 'success'}
              label={`${unresolvedCoverage.length} صفحه تعیین‌تکلیف‌نشده`}
            />
            <Chip
              color={
                items.some(item => item.reviewStatus === 'pending')
                  ? 'warning'
                  : 'success'
              }
              label={`${items.filter(item => item.reviewStatus === 'pending').length} پیشنهاد در انتظار`}
            />
            <Chip
              color={Object.keys(failures).length ? 'error' : 'success'}
              label={`${Object.keys(failures).length} صفحه خطادار`}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            اکسل نهایی زمانی فعال می‌شود که همه صفحه‌ها بررسی، همه پیشنهادها
            تأیید یا کنار گذاشته، و همه کالک‌ها متصل یا رد شده باشند.
          </Typography>
        </Paper>
      )}
      {Object.keys(mapPages).length > 0 && jobId && (
        <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2 }}>
          <Typography fontWeight={700}>کالک‌های شناسایی‌شده</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            این صفحه‌ها داده مکانی قطعی ندارند. جهت تصویر را انتخاب کنید و آن را
            به سناریو بفرستید؛ تصویر در مرکز نمای فعلی باز می‌شود و جای دقیق،
            مقیاس و چرخش آن باید در کالک‌نگار تنظیم شود.
          </Typography>
          <Stack spacing={2}>
            {Object.values(mapPages)
              .sort((a, b) => a.page - b.page)
              .map(mapPage => {
                const placement = mapPlacement[String(mapPage.page)] || {
                  scenarioId: '',
                  rotationDegrees: 0 as const,
                };
                return (
                  <Paper
                    key={mapPage.page}
                    component="details"
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}
                  >
                    <Typography
                      component="summary"
                      fontWeight={700}
                      sx={{ cursor: 'pointer' }}
                    >
                      تصویر یا کالک صفحه {mapPage.page} ·{' '}
                      {mapPage.status === 'attached'
                        ? 'به سناریو افزوده شده'
                        : mapPage.status === 'ignored'
                          ? 'با تصمیم کاربر کنار گذاشته شده'
                          : 'نیازمند تعیین جهت و جانمایی'}
                    </Typography>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={2}
                      alignItems={{ md: 'center' }}
                      sx={{ mt: 1.5 }}
                    >
                      <Box
                        sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}
                      >
                        <MapPagePreviewImage
                          jobId={jobId}
                          page={mapPage.page}
                          rotationDegrees={placement.rotationDegrees}
                        />
                      </Box>
                      <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
                        <TextField
                          select
                          size="small"
                          label="سناریوی مقصد"
                          value={placement.scenarioId}
                          disabled={mapPage.status !== 'needs_placement'}
                          onChange={event =>
                            setMapPlacement(previous => ({
                              ...previous,
                              [String(mapPage.page)]: {
                                ...placement,
                                scenarioId: event.target.value,
                              },
                            }))
                          }
                        >
                          {scenarioOptions.map(scenario => (
                            <MenuItem key={scenario.id} value={scenario.id}>
                              {scenario.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          select
                          size="small"
                          label="چرخش اولیه تصویر"
                          value={placement.rotationDegrees}
                          disabled={mapPage.status !== 'needs_placement'}
                          onChange={event =>
                            setMapPlacement(previous => ({
                              ...previous,
                              [String(mapPage.page)]: {
                                ...placement,
                                rotationDegrees: Number(event.target.value) as
                                  | 0
                                  | 90
                                  | 180
                                  | 270,
                              },
                            }))
                          }
                        >
                          <MenuItem value={0}>بدون چرخش</MenuItem>
                          <MenuItem value={90}>۹۰ درجه</MenuItem>
                          <MenuItem value={180}>۱۸۰ درجه</MenuItem>
                          <MenuItem value={270}>۲۷۰ درجه</MenuItem>
                        </TextField>
                        <Button
                          variant="contained"
                          disabled={
                            mapPage.status !== 'needs_placement' ||
                            !placement.scenarioId ||
                            attachingMapPage === mapPage.page
                          }
                          onClick={() => void attachMapPage(mapPage)}
                        >
                          {attachingMapPage === mapPage.page
                            ? 'در حال افزودن…'
                            : 'افزودن و جانمایی در کالک‌نگار'}
                        </Button>
                        {mapPage.status === 'needs_placement' ? (
                          <Button
                            variant="text"
                            color="inherit"
                            disabled={attachingMapPage === mapPage.page}
                            onClick={() => void ignoreMapPage(mapPage)}
                          >
                            این تصویر کالک مرتبط نیست
                          </Button>
                        ) : (
                          <Button
                            variant="text"
                            disabled={attachingMapPage === mapPage.page}
                            onClick={() => void reopenMapPage(mapPage)}
                          >
                            تغییر تصمیم کالک
                          </Button>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          افزودن این لایه به معنی تأیید موقعیت آن نیست؛ لایه با
                          وضعیت نیازمند جانمایی ثبت می‌شود.
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
          </Stack>
        </Paper>
      )}
      {(items.length > 0 || Object.keys(failures).length > 0) && (
        <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2 }}>
          <Typography fontWeight={700} gutterBottom>
            ابزار بازبینی
          </Typography>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ md: 'center' }}
          >
            <TextField
              size="small"
              fullWidth
              label="جست‌وجو در نام و شاهد"
              value={reviewQuery}
              disabled={showFailedOnly}
              onChange={event => setReviewQuery(event.target.value)}
            />
            <TextField
              select
              size="small"
              label="نوع پیشنهاد"
              value={reviewKind}
              disabled={showFailedOnly}
              sx={{ minWidth: 150 }}
              onChange={event =>
                setReviewKind(
                  event.target.value as 'all' | DocumentProposal['kind']
                )
              }
            >
              <MenuItem value="all">همه نوع‌ها</MenuItem>
              {Object.entries(labels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="وضعیت بازبینی"
              value={reviewStatus}
              disabled={showFailedOnly}
              sx={{ minWidth: 170 }}
              onChange={event =>
                setReviewStatus(
                  event.target.value as 'all' | DocumentProposal['reviewStatus']
                )
              }
            >
              <MenuItem value="all">همه وضعیت‌ها</MenuItem>
              <MenuItem value="pending">نیازمند بررسی</MenuItem>
              <MenuItem value="accepted">تأییدشده</MenuItem>
              <MenuItem value="rejected">کنارگذاشته‌شده</MenuItem>
            </TextField>
          </Stack>
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={showFailedOnly}
                onChange={event => setShowFailedOnly(event.target.checked)}
              />
            }
            label={`فقط صفحه‌های خطادار (${Object.keys(failures).length})`}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
            sx={{ mt: 1 }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {showFailedOnly
                ? `${matchingPages.length} صفحه خطادار`
                : `${filteredItems.length} پیشنهاد در ${matchingPages.length} صفحه`}
            </Typography>
            <Button
              size="small"
              disabled={
                !matchingPages.length || matchingPages.indexOf(page) <= 0
              }
              onClick={() => moveBetweenMatchingPages(-1)}
            >
              نتیجه قبلی
            </Button>
            <TextField
              select
              size="small"
              label="صفحه نتیجه"
              value={matchingPages.includes(page) ? page : ''}
              sx={{ minWidth: 130 }}
              disabled={!matchingPages.length}
              onChange={event => setPage(Number(event.target.value))}
            >
              {matchingPages.map(number => (
                <MenuItem key={number} value={number}>
                  صفحه {number}
                </MenuItem>
              ))}
            </TextField>
            <Button
              size="small"
              disabled={
                !matchingPages.length ||
                matchingPages.indexOf(page) === matchingPages.length - 1
              }
              onClick={() => moveBetweenMatchingPages(1)}
            >
              نتیجه بعدی
            </Button>
          </Stack>
          {!matchingPages.length && (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              نتیجه‌ای مطابق فیلتر انتخاب‌شده وجود ندارد.
            </Alert>
          )}
        </Paper>
      )}
      {showFailedOnly && failures[page] && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          صفحه {page}: {failures[page]}
        </Alert>
      )}
      {!showFailedOnly && Object.keys(failures).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {Object.keys(failures).length} صفحه بدون نتیجه مانده است. گزینه «فقط
          صفحه‌های خطادار» را فعال کنید و پس از بررسی، دکمه «تلاش دوباره برای
          صفحه‌های خطادار» را بزنید.
          <Box component="details" sx={{ mt: 1 }}>
            <Typography component="summary" variant="body2">
              جزئیات صفحه‌های خطادار
            </Typography>
            {Object.entries(failures).map(([number, message]) => (
              <Typography key={number} variant="caption" display="block">
                صفحه {number}: {message}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}
      {sourceUrl && (
        <Button
          component="a"
          href={`${sourceUrl}${file?.name.toLowerCase().endsWith('.pdf') ? `#page=${page}` : ''}`}
          target="_blank"
          rel="noopener"
        >
          مشاهده اصل صفحه
        </Button>
      )}
      {selected && (
        <>
          {!!selected.pageKinds?.length && (
            <Stack direction="row" spacing={1} sx={{ my: 1, flexWrap: 'wrap' }}>
              {selected.pageKinds.map(kind => (
                <Chip key={kind} size="small" label={pageKindLabels[kind]} />
              ))}
            </Stack>
          )}
          {selected.warnings.map((warning, i) => (
            <Alert key={i} severity="warning" sx={{ my: 1 }}>
              {warning}
            </Alert>
          ))}
          {selected.mapCandidate && !jobId && (
            <Alert severity="info" sx={{ my: 1 }}>
              این صفحه احتمالاً کالک است. متن و پیشنهادها حفظ شده‌اند؛ برای
              ذخیره تصویر کالک و افزودن آن به کالک‌نگار، فایل را با گزینه
              «پردازش کل سند» پردازش کنید.
            </Alert>
          )}
          <Paper variant="outlined" sx={{ my: 2, p: 1.5, borderRadius: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ sm: 'center' }}
            >
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                وضعیت صفحه {page}:{' '}
                {selected.reviewStatus === 'reviewed'
                  ? 'بررسی و تأیید شده'
                  : selected.reviewStatus === 'no_relevant_data'
                    ? 'بررسی شده؛ داده مرتبط ندارد'
                    : 'نیازمند تعیین تکلیف'}
              </Typography>
              {selected.reviewStatus === 'reviewed' ||
              selected.reviewStatus === 'no_relevant_data' ? (
                <Button
                  size="small"
                  onClick={() => setCurrentPageReview(false)}
                >
                  بازگشایی بازبینی صفحه
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  disabled={!canReviewCurrentPage}
                  onClick={() => setCurrentPageReview(true)}
                >
                  تعیین تکلیف این صفحه
                </Button>
              )}
            </Stack>
            {!canReviewCurrentPage && selected.reviewStatus === 'pending' && (
              <Typography variant="caption" color="text.secondary">
                ابتدا همه پیشنهادهای این صفحه و در صورت وجود، وضعیت کالک آن را
                مشخص کنید.
              </Typography>
            )}
          </Paper>
          <Box component="details" sx={{ my: 2 }}>
            <summary>متن خوانده‌شده این صفحه</summary>
            {!!selected.nativeText && (
              <Typography variant="caption" color="text.secondary">
                متن داخلی سند و متن خوانده‌شده از تصویر، بدون حذف یکدیگر، در این
                بخش کنار هم نگه داشته می‌شوند.
              </Typography>
            )}
            <Typography
              sx={{
                whiteSpace: 'pre-wrap',
                maxHeight: 320,
                overflow: 'auto',
                p: 2,
              }}
            >
              {selected.text}
            </Typography>
          </Box>
          {currentPageItems.length === 0 && !showFailedOnly && (
            <Alert severity="info">
              در این صفحه پیشنهادی مطابق فیلتر فعلی یافت نشد.
            </Alert>
          )}
          <Stack spacing={2}>
            {currentPageItems.map(item => {
              const repeatedMentions = mentionGroups.get(mentionKey(item)) || [
                item,
              ];
              return (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    opacity: item.reviewStatus === 'rejected' ? 0.65 : 1,
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems="center"
                  >
                    <TextField
                      select
                      size="small"
                      label="نوع پیشنهاد"
                      value={item.kind}
                      sx={{ minWidth: 115 }}
                      onChange={e =>
                        update(item.id, {
                          kind: e.target.value as DocumentProposal['kind'],
                          reviewStatus: 'pending',
                        })
                      }
                    >
                      {Object.entries(labels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      size="small"
                      label="عبارت ثبت‌شده در سند"
                      value={item.name}
                      InputProps={{ readOnly: true }}
                      helperText="برای حفظ شاهد سند، این عبارت تغییر نمی‌کند."
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="نام معیار برای نمایش"
                      value={canonicalEntityName(item)}
                      onChange={e =>
                        update(item.id, {
                          canonicalName: e.target.value,
                          reviewStatus: 'pending',
                        })
                      }
                      helperText="تغییر این نام روی همه تکرارهای همین موجودیت اعمال می‌شود."
                    />
                    <TextField
                      select
                      size="small"
                      label="نتیجه بازبینی"
                      value={item.reviewStatus}
                      sx={{ minWidth: 170 }}
                      onChange={e =>
                        update(item.id, {
                          reviewStatus: e.target
                            .value as DocumentProposal['reviewStatus'],
                        })
                      }
                    >
                      <MenuItem value="pending">نیازمند بررسی</MenuItem>
                      <MenuItem
                        value="accepted"
                        disabled={!canonicalEntityName(item).trim()}
                      >
                        تأیید خوانش
                      </MenuItem>
                      <MenuItem value="rejected">کنار گذاشته شود</MenuItem>
                    </TextField>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ mt: 2, whiteSpace: 'pre-wrap' }}
                  >
                    {item.evidence}
                  </Typography>
                  {repeatedMentions.length > 1 && (
                    <Alert severity="info" sx={{ mt: 1.5 }}>
                      این موجودیت با نام معیار «{canonicalEntityName(item)}»،{' '}
                      {repeatedMentions.length} بار در صفحه‌های{' '}
                      {Array.from(
                        new Set(
                          repeatedMentions.map(mention => mention.sourcePage)
                        )
                      )
                        .sort((a, b) => a - b)
                        .join('، ')}{' '}
                      آمده است. شکل‌های ثبت‌شده در سند:{' '}
                      {Array.from(
                        new Set(repeatedMentions.map(mention => mention.name))
                      ).join('، ')}
                      . نتیجه بازبینی و اطلاعات تکمیلی این مورد روی همه ذکرهای
                      گروه اعمال می‌شود؛ عبارت و شاهد هر صفحه جداگانه حفظ خواهد
                      شد.
                    </Alert>
                  )}
                  {item.reviewStatus === 'accepted' && completionFields(item)}
                  <Typography variant="caption" color="text.secondary">
                    صفحه {item.sourcePage} ·{' '}
                    {item.sourceMethod === 'ocr-pipeline'
                      ? 'بازشناسی کامل صفحه'
                      : item.sourceMethod.startsWith('ocr')
                        ? 'بازشناسی تصویر'
                        : 'متن سند'}{' '}
                    · تأیید خوانش به معنی ثبت منبع یا رویداد نیست.
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
        </>
      )}
      {items.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 2 }}>
          <Typography fontWeight={700} gutterBottom>
            ساخت فایل قابل تکمیل
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ابتدا پیشنهادهای درست را تأیید کنید و سپس سناریوی اصلی سند را
            برگزینید. فایل ساخته‌شده وارد پایگاه داده نمی‌شود؛ خانه‌های نامطمئن
            مانند زمان، مختصات، طرف یگان و تعداد تجهیزات خالی می‌مانند تا شما
            آن‌ها را از روی اصل سند تکمیل کنید.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="سناریوی اصلی فایل"
              value={hasSelectedMainScenario ? mainScenarioId : ''}
              onChange={event => setMainScenarioId(event.target.value)}
              helperText={
                acceptedScenarios.length
                  ? 'یکی از پیشنهادهای سناریو که تأیید کرده‌اید انتخاب شود.'
                  : 'ابتدا دست‌کم یک پیشنهاد از نوع سناریو را تأیید کنید.'
              }
            >
              {acceptedScenarios.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              disabled={!hasSelectedMainScenario || workbookBusy}
              onClick={() => void createWorkbook(false, false)}
              sx={{ minWidth: 220, alignSelf: 'flex-start' }}
            >
              {workbookBusy ? 'در حال ساخت…' : 'دریافت پیش‌نویس اکسل'}
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={!coverageReady || workbookBusy}
              onClick={() => void createWorkbook(true, false)}
              sx={{ minWidth: 210, alignSelf: 'flex-start' }}
            >
              {workbookBusy ? 'در حال کنترل…' : 'دریافت اکسل نهایی'}
            </Button>
            {onContinueWithWorkbook && (
              <Button
                variant="outlined"
                disabled={
                  !hasSelectedMainScenario || workbookBusy || !coverageReady
                }
                onClick={() => void createWorkbook(true, true)}
                sx={{ minWidth: 250, alignSelf: 'flex-start' }}
              >
                ساخت اکسل نهایی و ادامه در ورود یکپارچه
              </Button>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {acceptedItems.length} پیشنهاد تأیید شده است. شماره صفحه و شاهد هر
            پیشنهاد در شیت «کالک‌یار» فایل خروجی حفظ می‌شود.
          </Typography>
          {duplicateMentions > 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {duplicateMentions} ذکر تکراری بر اساس نوع و نام در فایل خروجی
              معیار، شناسه منبع یا کد مرجع ادغام می‌شود؛ همه نام‌های درج‌شده،
              صفحه‌ها و شاهدها در شیت «کالک‌یار» باقی می‌مانند.
            </Alert>
          )}
          {incompleteAccepted.length > 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {incompleteAccepted.length} پیشنهاد تأییدشده هنوز اطلاعات الزامی
              ناقص دارد. دریافت پیش‌نویس ممکن است، اما ورود یکپارچه پس از تکمیل
              این موارد فعال می‌شود.
            </Alert>
          )}
        </Paper>
      )}
      <Alert severity="info" sx={{ mt: 2 }}>
        این مرحله پیش‌نویس می‌سازد. پس از دریافت اکسل، زمان، مکان، رابطه با
        عملیات و تطبیق با کاتالوگ منابع را تکمیل کنید و فایل را در تب «ورود
        یکپارچه» پیش‌نمایش بگیرید. ثبت نهایی فقط با تأیید جداگانه شما انجام
        می‌شود.
      </Alert>
    </Paper>
  );
}
