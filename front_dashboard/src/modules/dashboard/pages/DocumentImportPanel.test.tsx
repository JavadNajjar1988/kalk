import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import DocumentImportPanel from './DocumentImportPanel';
import api from '@/services/api/dataImportApiService';

vi.mock('@/services/api/dataImportApiService', () => ({
  default: {
    previewWholeDocument: vi.fn(),
    previewDocument: vi.fn(),
    createDocumentJob: vi.fn(),
    getDocumentJob: vi.fn(),
    listDocumentJobs: vi.fn().mockResolvedValue([]),
    getDocumentJobPage: vi.fn(),
    detectDocumentMapPages: vi.fn(),
    getDocumentMapPageImage: vi.fn(),
    attachDocumentMapPage: vi.fn(),
    cancelDocumentJob: vi.fn(),
    resumeDocumentJob: vi.fn(),
    createDocumentWorkbook: vi.fn(),
    getDocumentModelStatus: vi.fn().mockResolvedValue({
      ready: true,
      llm: {
        model: 'qwen',
        configured: true,
        reachable: true,
        available: true,
      },
      ocr: {
        model: 'paddle',
        configured: true,
        reachable: true,
        available: true,
      },
      ocrMode: 'vlm-component',
    }),
  },
}));

vi.mock('@/services/api/scenarioApiService', () => ({
  scenarioApiService: { getScenarios: vi.fn().mockResolvedValue([]) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

it('offers whole-document processing and resumes without replacing completed pages', async () => {
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  const partialJob = {
    id: 'job-1',
    filename: 'report.pdf',
    documentId: 'doc',
    pageCount: 2,
    forceOcr: false,
    status: 'partial' as const,
    processedPages: [1],
    failedPages: { '2': 'خطای نمونه' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:01:00Z',
  };
  vi.mocked(api.createDocumentJob).mockResolvedValueOnce({
    ...partialJob,
    status: 'queued',
    processedPages: [],
    failedPages: {},
  });
  vi.mocked(api.getDocumentJob).mockResolvedValue(partialJob);
  vi.mocked(api.detectDocumentMapPages).mockResolvedValue(partialJob);
  vi.mocked(api.getDocumentJobPage).mockResolvedValueOnce({
    page: 1,
    pageCount: 2,
    documentId: 'doc',
    filename: 'report.pdf',
    method: 'native',
    text: 'متن',
    warnings: [],
    items: [],
    persisted: true,
  });
  vi.mocked(api.resumeDocumentJob).mockResolvedValueOnce({
    ...partialJob,
    status: 'queued',
  });
  const { container } = render(<DocumentImportPanel />);
  expect(
    await screen.findByText('سامانه آماده پردازش است')
  ).toBeInTheDocument();
  const button = screen.getByRole('button', { name: 'پردازش کل سند' });
  expect(button).toBeDisabled();
  fireEvent.change(container.querySelector('input[type=file]')!, {
    target: {
      files: [new File(['sample'], 'report.pdf', { type: 'application/pdf' })],
    },
  });
  fireEvent.click(button);
  await screen.findByText(/صفحه 2: خطای نمونه/);
  await waitFor(() => expect(button).toBeEnabled());
  await waitFor(() =>
    expect(localStorage.getItem('kalkyar-active-document-job')).toBe('job-1')
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: 'تلاش دوباره برای صفحه‌های خطادار',
    })
  );
  await waitFor(() =>
    expect(api.resumeDocumentJob).toHaveBeenCalledWith('job-1')
  );
  expect(api.createDocumentJob).toHaveBeenCalledTimes(1);
  expect(api.previewDocument).not.toHaveBeenCalled();
});

it('restores the latest running server job after returning to the page', async () => {
  const runningJob = {
    id: 'job-running',
    filename: 'employer-report.pdf',
    documentId: 'doc-running',
    pageCount: 160,
    forceOcr: false,
    status: 'running' as const,
    currentPage: 4,
    processedPages: [],
    failedPages: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:01:00Z',
  };
  vi.mocked(api.listDocumentJobs).mockResolvedValueOnce([runningJob]);
  vi.mocked(api.getDocumentJob).mockResolvedValue(runningJob);

  render(<DocumentImportPanel />);

  expect(
    await screen.findByText(/در حال پردازش صفحه 4 از 160/)
  ).toBeInTheDocument();
  expect(localStorage.getItem('kalkyar-active-document-job')).toBe(
    'job-running'
  );
});

it('offers recovery for the latest completed server job', async () => {
  const completedJob = {
    id: 'job-completed',
    filename: 'employer-report.pdf',
    documentId: 'doc-completed',
    pageCount: 1,
    forceOcr: false,
    status: 'completed' as const,
    processedPages: [1],
    failedPages: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:01:00Z',
  };
  vi.mocked(api.listDocumentJobs).mockResolvedValueOnce([completedJob]);
  vi.mocked(api.getDocumentJob).mockResolvedValue(completedJob);
  vi.mocked(api.getDocumentJobPage).mockResolvedValueOnce({
    page: 1,
    pageCount: 1,
    documentId: 'doc-completed',
    filename: 'employer-report.pdf',
    method: 'native',
    text: 'عملیات نمونه',
    warnings: [],
    items: [],
    persisted: true,
  });

  render(<DocumentImportPanel />);

  const restoreButton = await screen.findByRole('button', {
    name: 'بازیابی آخرین پردازش سرور',
  });
  fireEvent.click(restoreButton);

  await waitFor(() =>
    expect(api.getDocumentJob).toHaveBeenCalledWith('job-completed')
  );
  expect(
    await screen.findByText(/نتیجه پردازش «employer-report.pdf» از سرور بازیابی شد/)
  ).toBeInTheDocument();
  expect(localStorage.getItem('kalkyar-active-document-job')).toBe(
    'job-completed'
  );
});

it('sends the reviewed document workbook to unified preview', async () => {
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  const completedJob = {
    id: 'job-2',
    filename: 'report.pdf',
    documentId: 'doc',
    pageCount: 1,
    forceOcr: false,
    status: 'completed' as const,
    processedPages: [1],
    failedPages: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:01:00Z',
  };
  vi.mocked(api.createDocumentJob).mockResolvedValueOnce({
    ...completedJob,
    status: 'queued',
    processedPages: [],
  });
  vi.mocked(api.getDocumentJob).mockResolvedValue(completedJob);
  vi.mocked(api.getDocumentJobPage).mockResolvedValueOnce({
    page: 1,
    pageCount: 1,
    documentId: 'doc',
    filename: 'report.pdf',
    method: 'native',
    text: 'عملیات نمونه',
    warnings: [],
    items: [
      {
        id: 'scenario-1',
        kind: 'scenario',
        name: 'عملیات نمونه',
        evidence: 'عملیات نمونه',
        sourcePage: 1,
        sourceMethod: 'native',
        documentId: 'doc',
        reviewStatus: 'pending',
        startTime: '2026-01-01T08:00',
      },
    ],
    persisted: true,
  });
  vi.mocked(api.createDocumentWorkbook).mockResolvedValueOnce(
    new Blob(['xlsx'])
  );
  const onContinue = vi.fn().mockResolvedValue(undefined);
  const { container } = render(
    <DocumentImportPanel onContinueWithWorkbook={onContinue} />
  );
  await screen.findByText('سامانه آماده پردازش است');
  fireEvent.change(container.querySelector('input[type=file]')!, {
    target: { files: [new File(['sample'], 'report.pdf')] },
  });
  fireEvent.click(screen.getByRole('button', { name: 'پردازش کل سند' }));
  await screen.findByDisplayValue('عملیات نمونه');
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'نتیجه بازبینی' }));
  fireEvent.click(screen.getByRole('option', { name: 'تأیید خوانش' }));
  expect(
    screen.getByLabelText('زمان شروع سناریو شمسی')
  ).toBeInTheDocument();
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: 'سناریوی اصلی فایل' })
  );
  fireEvent.click(screen.getByRole('option', { name: 'عملیات نمونه' }));
  fireEvent.click(
    screen.getByRole('button', {
      name: 'ساخت اکسل و ادامه در ورود یکپارچه',
    })
  );
  await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
  expect(onContinue.mock.calls[0][0]).toBeInstanceOf(File);
});

it('restores a saved review draft without writing data', async () => {
  const draftContent = JSON.stringify({
    version: 1,
    status: 'review-draft',
    filename: 'report.pdf',
    documentId: 'doc',
    pageCount: 1,
    failedPages: {},
    pages: [
      {
        page: 1,
        pageCount: 1,
        documentId: 'doc',
        filename: 'report.pdf',
        method: 'native',
        text: 'عملیات بازیابی‌شده',
        warnings: [],
        items: [],
        persisted: false,
      },
    ],
    items: [
      {
        id: 'scenario-restored',
        kind: 'scenario',
        name: 'عملیات بازیابی‌شده',
        evidence: 'عملیات بازیابی‌شده',
        sourcePage: 1,
        sourceMethod: 'native',
        documentId: 'doc',
        reviewStatus: 'pending',
      },
    ],
  });
  const draft = new File([draftContent], 'document-review-draft.json', {
    type: 'application/json',
  });
  Object.defineProperty(draft, 'text', {
    value: vi.fn().mockResolvedValue(draftContent),
  });
  const { container } = render(<DocumentImportPanel />);
  await screen.findByText('سامانه آماده پردازش است');
  const inputs = container.querySelectorAll('input[type=file]');
  fireEvent.change(inputs[1], { target: { files: [draft] } });
  expect(
    await screen.findByDisplayValue('عملیات بازیابی‌شده')
  ).toBeInTheDocument();
  expect(
    screen.getByText(/پیش‌نویس «report.pdf» بازیابی شد/)
  ).toBeInTheDocument();
});

it('filters proposals and applies review decisions to repeated mentions', async () => {
  const proposal = {
    kind: 'scenario' as const,
    name: 'عملیات تکراری',
    sourcePage: 1,
    sourceMethod: 'native' as const,
    documentId: 'doc',
    reviewStatus: 'pending' as const,
  };
  const draftContent = JSON.stringify({
    version: 1,
    status: 'review-draft',
    filename: 'report.pdf',
    documentId: 'doc',
    pageCount: 1,
    failedPages: {},
    pages: [
      {
        page: 1,
        pageCount: 1,
        documentId: 'doc',
        filename: 'report.pdf',
        method: 'native',
        text: 'متن صفحه',
        warnings: [],
        items: [],
        persisted: false,
      },
    ],
    items: [
      { ...proposal, id: 'scenario-a', evidence: 'شاهد نخست' },
      { ...proposal, id: 'scenario-b', evidence: 'شاهد دوم' },
      {
        ...proposal,
        id: 'person-a',
        kind: 'person',
        name: 'شخص نمونه',
        evidence: 'شاهد شخص',
      },
    ],
  });
  const draft = new File([draftContent], 'document-review-draft.json', {
    type: 'application/json',
  });
  Object.defineProperty(draft, 'text', {
    value: vi.fn().mockResolvedValue(draftContent),
  });
  const { container } = render(<DocumentImportPanel />);
  await screen.findByText('سامانه آماده پردازش است');
  fireEvent.change(container.querySelectorAll('input[type=file]')[1], {
    target: { files: [draft] },
  });

  expect(await screen.findAllByText(/این نام 2 بار/)).toHaveLength(2);
  const reviewSelectors = screen.getAllByRole('combobox', {
    name: 'نتیجه بازبینی',
  });
  fireEvent.mouseDown(reviewSelectors[0]);
  fireEvent.click(screen.getByRole('option', { name: 'تأیید خوانش' }));
  await waitFor(() => {
    const updated = screen.getAllByRole('combobox', {
      name: 'نتیجه بازبینی',
    });
    expect(updated[0]).toHaveTextContent('تأیید خوانش');
    expect(updated[1]).toHaveTextContent('تأیید خوانش');
    expect(updated[2]).toHaveTextContent('نیازمند بررسی');
  });

  const typeSelectors = screen.getAllByRole('combobox', {
    name: 'نوع پیشنهاد',
  });
  fireEvent.mouseDown(typeSelectors[0]);
  fireEvent.click(screen.getByRole('option', { name: 'شخص' }));
  await waitFor(() => {
    expect(screen.queryByDisplayValue('عملیات تکراری')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('شخص نمونه')).toBeInTheDocument();
  });
});
