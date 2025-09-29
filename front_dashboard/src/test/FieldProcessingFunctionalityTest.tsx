import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { FieldEnhancer } from '../modules/definition-editor/components/fields/processors/FieldEnhancer';
import { ExtendedCustomFieldDefinition } from '../modules/definition-editor/components/fields/types/FieldEditTypes';

interface TestResult {
  feature: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
}

const FieldProcessingFunctionalityTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test field configurations
  const testFields: Record<string, ExtendedCustomFieldDefinition> = {
    caseTransformLower: {
      id: 'test1',
      name: 'تست تبدیل حروف کوچک',
      englishName: 'case_transform_lower',
      type: 'text',
      order: 1,
      caseTransform: 'lowercase',
      isRequired: false
    },
    caseTransformUpper: {
      id: 'test2', 
      name: 'تست تبدیل حروف بزرگ',
      englishName: 'case_transform_upper',
      type: 'text',
      order: 2,
      caseTransform: 'uppercase',
      isRequired: false
    },
    caseTransformCapitalize: {
      id: 'test3',
      name: 'تست حرف اول بزرگ',
      englishName: 'case_transform_capitalize',
      type: 'text',
      order: 3,
      caseTransform: 'capitalize',
      isRequired: false
    },
    spaceTrimming: {
      id: 'test4',
      name: 'تست حذف فاصله‌های اضافی',
      englishName: 'space_trimming',
      type: 'text',
      order: 4,
      trimExtraSpaces: true,
      isRequired: false
    },
    characterControlLetters: {
      id: 'test5',
      name: 'تست کنترل کاراکتر فقط حروف',
      englishName: 'character_control_letters',
      type: 'text',
      order: 5,
      characterControl: 'letters-only',
      isRequired: false
    },
    characterControlLettersNumbers: {
      id: 'test6',
      name: 'تست کنترل کاراکتر حروف و اعداد',
      englishName: 'character_control_letters_numbers',
      type: 'text',
      order: 6,
      characterControl: 'letters-numbers',
      isRequired: false
    },
    combinedFeatures: {
      id: 'test7',
      name: 'تست ترکیبی ویژگی‌ها',
      englishName: 'combined_features',
      type: 'text',
      order: 7,
      caseTransform: 'capitalize',
      trimExtraSpaces: true,
      characterControl: 'letters-only',
      isRequired: false
    },
    numberConversion: {
      id: 'test8',
      name: 'تست تبدیل اعداد',
      englishName: 'number_conversion',
      type: 'text',
      order: 8,
      convertNumbers: true,
      isRequired: false
    },
    halfSpaceFix: {
      id: 'test9',
      name: 'تست اصلاح نیم‌فاصله',
      englishName: 'half_space_fix',
      type: 'text',
      order: 9,
      fixHalfSpace: true,
      isRequired: false
    },
    suggestions: {
      id: 'test10',
      name: 'تست پیشنهادات',
      englishName: 'suggestions',
      type: 'text',
      order: 10,
      enableSuggestions: true,
      suggestions: ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز'],
      isRequired: false
    },
    sensitiveData: {
      id: 'test11',
      name: 'تست شناسایی اطلاعات حساس',
      englishName: 'sensitive_data',
      type: 'text',
      order: 11,
      enableSensitiveDataDetection: true,
      sensitiveDataAction: 'warn',
      isRequired: false
    }
  };

  // Test cases
  const testCases = [
    // Case Transform Tests
    { field: 'caseTransformLower', input: 'HELLO WORLD', expected: 'hello world', feature: 'Case Transform - Lowercase' },
    { field: 'caseTransformLower', input: 'سلام دنیا', expected: 'سلام دنیا', feature: 'Case Transform - Lowercase (Persian)' },
    { field: 'caseTransformUpper', input: 'hello world', expected: 'HELLO WORLD', feature: 'Case Transform - Uppercase' },
    { field: 'caseTransformUpper', input: 'سلام دنیا', expected: 'سلام دنیا', feature: 'Case Transform - Uppercase (Persian)' },
    { field: 'caseTransformCapitalize', input: 'hello world', expected: 'Hello World', feature: 'Case Transform - Capitalize' },
    { field: 'caseTransformCapitalize', input: 'john doe', expected: 'John Doe', feature: 'Case Transform - Capitalize Names' },
    
    // Space Trimming Tests
    { field: 'spaceTrimming', input: '  hello   world  ', expected: 'hello world', feature: 'Space Trimming - Multiple spaces' },
    { field: 'spaceTrimming', input: '\t\ntest\t\n', expected: 'test', feature: 'Space Trimming - Tabs and newlines' },
    { field: 'spaceTrimming', input: 'normal text', expected: 'normal text', feature: 'Space Trimming - Normal text' },
    
    // Character Control Tests  
    { field: 'characterControlLetters', input: 'hello123!@#world', expected: 'helloworld', feature: 'Character Control - Letters only' },
    { field: 'characterControlLetters', input: 'سلام123!@#دنیا', expected: 'سلامدنیا', feature: 'Character Control - Persian letters only' },
    { field: 'characterControlLettersNumbers', input: 'hello123!@#world', expected: 'hello123world', feature: 'Character Control - Letters + Numbers' },
    { field: 'characterControlLettersNumbers', input: 'سلام123!@#دنیا', expected: 'سلام123دنیا', feature: 'Character Control - Persian + Numbers' },
    
    // Combined Features Tests
    { field: 'combinedFeatures', input: '  HELLO   123!@#   WORLD  ', expected: 'Hello World', feature: 'Combined - Capitalize + Trim + Letters only' },
    { field: 'combinedFeatures', input: '  سلام   123!@#   دنیا  ', expected: 'سلام دنیا', feature: 'Combined - Persian text processing' },
    
    // Number Conversion Tests
    { field: 'numberConversion', input: '۱۲۳۴۵', expected: '12345', feature: 'Number Conversion - Persian to English' },
    { field: 'numberConversion', input: '١٢٣٤٥', expected: '12345', feature: 'Number Conversion - Arabic to English' },
    { field: 'numberConversion', input: 'امروز ۱۵ آبان ۱۴۰۳ است', expected: 'امروز 15 آبان 1403 است', feature: 'Number Conversion - Mixed text with Persian numbers' },
    
    // Half-Space Fix Tests
    { field: 'halfSpaceFix', input: 'میروم', expected: 'می‌روم', feature: 'Half-Space Fix - Add missing half-space with prefix' },
    { field: 'halfSpaceFix', input: 'کتابها', expected: 'کتاب‌ها', feature: 'Half-Space Fix - Add missing half-space with suffix' },
    { field: 'halfSpaceFix', input: 'می‌‌‌روم', expected: 'می‌روم', feature: 'Half-Space Fix - Remove extra half-spaces' },
    
    // Suggestions Tests
    { field: 'suggestions', input: 'ته', expected: 'ته', feature: 'Suggestions - Partial match should remain unchanged' },
    { field: 'suggestions', input: 'اصف', expected: 'اصف', feature: 'Suggestions - Prefix match available' },
    
    // Sensitive Data Tests
    { field: 'sensitiveData', input: '1234567890', expected: '1234567890', feature: 'Sensitive Data Detection - Iranian National ID pattern' },
    { field: 'sensitiveData', input: 'test@example.com', expected: 'test@example.com', feature: 'Sensitive Data Detection - Email address' },
    { field: 'sensitiveData', input: '09123456789', expected: '09123456789', feature: 'Sensitive Data Detection - Phone number' }
  ];

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      try {
        const field = testFields[testCase.field];
        
        // Test sync processing
        const syncResult = FieldEnhancer.processValueSync(testCase.input, field);
        
        // Test async processing  
        const asyncResult = await FieldEnhancer.processValue(testCase.input, field);
        
        // Use sync result for immediate comparison
        const actual = syncResult;
        const passed = actual === testCase.expected;
        
        results.push({
          feature: testCase.feature,
          input: testCase.input,
          expected: testCase.expected,
          actual: actual,
          passed: passed,
          error: !passed ? `Expected "${testCase.expected}" but got "${actual}"` : undefined
        });
        
      } catch (error) {
        results.push({
          feature: testCase.feature,
          input: testCase.input,
          expected: testCase.expected,
          actual: 'ERROR',
          passed: false,
          error: `Processing failed: ${error}`
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getPassedCount = () => testResults.filter(r => r.passed).length;
  const getFailedCount = () => testResults.filter(r => !r.passed).length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 تست عملکرد سیستم پردازش مقادیر فیلد
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        این تست بررسی می‌کند که آیا ویژگی‌های مختلف پردازش فیلد به درستی عمل می‌کنند یا خیر
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={runTests}
          disabled={isRunning}
          size="large"
        >
          {isRunning ? 'در حال اجرای تست‌ها...' : 'اجرای تست‌ها'}
        </Button>
      </Box>

      {testResults.length > 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography variant="h6" color="success.dark">
                    ✅ موفق: {getPassedCount()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Typography variant="h6" color="error.dark">
                    ❌ ناموفق: {getFailedCount()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'info.light' }}>
                <CardContent>
                  <Typography variant="h6" color="info.dark">
                    📊 کل: {testResults.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              نتایج تست‌ها
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ویژگی</TableCell>
                    <TableCell>ورودی</TableCell>
                    <TableCell>نتیجه انتظاری</TableCell>
                    <TableCell>نتیجه واقعی</TableCell>
                    <TableCell>وضعیت</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.feature}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>"{result.input}"</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>"{result.expected}"</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>"{result.actual}"</TableCell>
                      <TableCell>
                        <Chip 
                          label={result.passed ? 'موفق' : 'ناموفق'}
                          color={result.passed ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {getFailedCount() > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="h6">❌ مشکلات شناسایی شده:</Typography>
              {testResults.filter(r => !r.passed).map((result, index) => (
                <Typography key={index} variant="body2" sx={{ mt: 1 }}>
                  • <strong>{result.feature}:</strong> {result.error}
                </Typography>
              ))}
            </Alert>
          )}

          {getFailedCount() === 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="h6">✅ همه تست‌ها موفقیت‌آمیز بودند!</Typography>
              <Typography variant="body2">
                سیستم پردازش مقادیر فیلد به درستی عمل می‌کند.
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default FieldProcessingFunctionalityTest;