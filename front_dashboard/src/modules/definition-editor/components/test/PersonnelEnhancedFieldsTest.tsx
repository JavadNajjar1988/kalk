// Comprehensive Test Component for Enhanced Personnel Fields
// کامپوننت تست جامع برای فیلدهای پیشرفته پرسنلی

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Import all enhanced components
import {
  EnglishTextFieldComponent,
  NumericTextFieldComponent,
  ConditionalNationalIdComponent,
  NameSplitFieldComponent,
  FullNameDualFieldComponent,
  PhoneArrayFieldComponent,
  HierarchicalAddressComponent
} from '../forms';

// Import validation utilities
import {
  validateEnglishOnly,
  validateNumericOnly,
  validateNationalIdByCountry,
  validatePhoneNumber,
  SUPPORTED_COUNTRIES,
  PHONE_LABELS,
  ADDRESS_LABELS
} from '../../utils/validationUtils';

import type { PhoneEntry, HierarchicalAddress } from '../../types/enhancedFields';

interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const PersonnelEnhancedFieldsTest: React.FC = () => {
  // Test data states
  const [englishText, setEnglishText] = useState('');
  const [numericText, setNumericText] = useState('');
  const [nationality, setNationality] = useState('iranian');
  const [nationalId, setNationalId] = useState('');
  const [nameData, setNameData] = useState({ firstName: '', lastName: '' });
  const [fullNameData, setFullNameData] = useState({
    firstNameFa: '',
    lastNameFa: '',
    firstNameEn: '',
    lastNameEn: ''
  });
  const [phones, setPhones] = useState<PhoneEntry[]>([]);
  const [addresses, setAddresses] = useState<HierarchicalAddress[]>([]);
  
  // Test results
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Run validation tests
  const runValidationTests = () => {
    const results: TestResult[] = [];

    // Test English validation
    results.push({
      testName: 'English Text Validation',
      status: validateEnglishOnly('Hello World') ? 'pass' : 'fail',
      message: validateEnglishOnly('Hello World') ? 'Valid English text accepted' : 'Failed to validate English text'
    });

    results.push({
      testName: 'English Text Invalid Characters',
      status: !validateEnglishOnly('Hello سلام') ? 'pass' : 'fail',
      message: !validateEnglishOnly('Hello سلام') ? 'Invalid characters rejected correctly' : 'Failed to reject non-English characters'
    });

    // Test numeric validation
    results.push({
      testName: 'Numeric Validation',
      status: validateNumericOnly('123456') ? 'pass' : 'fail',
      message: validateNumericOnly('123456') ? 'Valid numbers accepted' : 'Failed to validate numbers'
    });

    results.push({
      testName: 'Numeric Invalid Characters',
      status: !validateNumericOnly('123abc') ? 'pass' : 'fail',
      message: !validateNumericOnly('123abc') ? 'Invalid characters rejected correctly' : 'Failed to reject non-numeric characters'
    });

    // Test Iranian national ID
    const iranianValidIds = ['0123456789', '1234567891']; // These are test IDs
    const iranianInvalidIds = ['0000000000', '123456789a'];
    
    iranianValidIds.forEach((id, index) => {
      const validation = validateNationalIdByCountry(id, 'iranian');
      results.push({
        testName: `Iranian National ID Test ${index + 1}`,
        status: validation.isValid ? 'pass' : 'fail',
        message: validation.isValid ? `Valid Iranian ID: ${id}` : `Invalid Iranian ID: ${id} - ${validation.message}`
      });
    });

    iranianInvalidIds.forEach((id, index) => {
      const validation = validateNationalIdByCountry(id, 'iranian');
      results.push({
        testName: `Iranian Invalid ID Test ${index + 1}`,
        status: !validation.isValid ? 'pass' : 'fail',
        message: !validation.isValid ? `Correctly rejected invalid ID: ${id}` : `Failed to reject invalid ID: ${id}`
      });
    });

    // Test other countries
    const countriesTest = [
      { country: 'lebanon', validLength: 11 },
      { country: 'iraq', validLength: 12 },
      { country: 'qatar', validLength: 11 }
    ];

    countriesTest.forEach(({ country, validLength }) => {
      const validId = '1'.repeat(validLength);
      const invalidId = '1'.repeat(validLength - 1);
      
      const validResult = validateNationalIdByCountry(validId, country);
      const invalidResult = validateNationalIdByCountry(invalidId, country);
      
      results.push({
        testName: `${country.toUpperCase()} ID Validation`,
        status: validResult.isValid && !invalidResult.isValid ? 'pass' : 'fail',
        message: `${country} ID validation: ${validLength} digits`
      });
    });

    // Test phone validation
    const validPhones = ['09123456789', '02123456789', '+989123456789'];
    const invalidPhones = ['012345678', 'abc123456789', ''];

    validPhones.forEach((phone, index) => {
      results.push({
        testName: `Valid Phone Test ${index + 1}`,
        status: validatePhoneNumber(phone) ? 'pass' : 'fail',
        message: validatePhoneNumber(phone) ? `Valid phone: ${phone}` : `Failed to validate phone: ${phone}`
      });
    });

    invalidPhones.forEach((phone, index) => {
      results.push({
        testName: `Invalid Phone Test ${index + 1}`,
        status: !validatePhoneNumber(phone) ? 'pass' : 'fail',
        message: !validatePhoneNumber(phone) ? `Correctly rejected phone: ${phone}` : `Failed to reject phone: ${phone}`
      });
    });

    setTestResults(results);
  };

  // Get test summary
  const getTestSummary = () => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'pass').length;
    const failed = testResults.filter(r => r.status === 'fail').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;
    
    return { total, passed, failed, warnings };
  };

  const summary = getTestSummary();

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        تست فیلدهای پیشرفته پرسنلی
      </Typography>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            خلاصه نتایج تست
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Chip 
                icon={<CheckCircleIcon />}
                label={`موفق: ${summary.passed}`}
                color="success"
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Chip 
                icon={<ErrorIcon />}
                label={`ناموفق: ${summary.failed}`}
                color="error"
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Chip 
                icon={<WarningIcon />}
                label={`هشدار: ${summary.warnings}`}
                color="warning"
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Chip 
                label={`کل: ${summary.total}`}
                color="primary"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Run Tests Button */}
      <Box mb={3}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={runValidationTests}
          size="large"
        >
          اجرای تست‌های اعتبارسنجی
        </Button>
      </Box>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">نتایج تست اعتبارسنجی</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {testResults.map((result, index) => (
              <Alert 
                key={index}
                severity={result.status === 'pass' ? 'success' : result.status === 'fail' ? 'error' : 'warning'}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">{result.testName}</Typography>
                <Typography variant="body2">{result.message}</Typography>
              </Alert>
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Interactive Component Tests */}
      <Typography variant="h5" gutterBottom>
        تست تعاملی کامپوننت‌ها
      </Typography>

      <Grid container spacing={3}>
        {/* English Text Field */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              فیلد متن انگلیسی
            </Typography>
            <EnglishTextFieldComponent
              value={englishText}
              onChange={setEnglishText}
              label="English Text"
              placeholder="Enter English text only"
            />
          </Paper>
        </Grid>

        {/* Numeric Text Field */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              فیلد عددی
            </Typography>
            <NumericTextFieldComponent
              value={numericText}
              onChange={setNumericText}
              label="Numeric Text"
              placeholder="Enter numbers only"
              minLength={5}
              maxLength={15}
            />
          </Paper>
        </Grid>

        {/* Conditional National ID */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              شماره ملی شرطی
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <select 
                  value={nationality} 
                  onChange={(e) => setNationality(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                >
                  {SUPPORTED_COUNTRIES.map(country => (
                    <option key={country.value} value={country.value}>
                      {country.flag} {country.label}
                    </option>
                  ))}
                </select>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ConditionalNationalIdComponent
                  nationalityValue={nationality}
                  idValue={nationalId}
                  onIdChange={setNationalId}
                  label="شماره شناسایی ملی"
                  required={true}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Name Split Field */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              تفکیک نام و نام خانوادگی
            </Typography>
            <NameSplitFieldComponent
              firstNameValue={nameData.firstName}
              lastNameValue={nameData.lastName}
              onFirstNameChange={(firstName) => setNameData(prev => ({ ...prev, firstName }))}
              onLastNameChange={(lastName) => setNameData(prev => ({ ...prev, lastName }))}
              required={true}
            />
          </Paper>
        </Grid>

        {/* Full Name Dual */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              نام کامل دوزبانه
            </Typography>
            <FullNameDualFieldComponent
              firstNameFa={fullNameData.firstNameFa}
              lastNameFa={fullNameData.lastNameFa}
              firstNameEn={fullNameData.firstNameEn}
              lastNameEn={fullNameData.lastNameEn}
              onFirstNameFaChange={(firstNameFa) => setFullNameData(prev => ({ ...prev, firstNameFa }))}
              onLastNameFaChange={(lastNameFa) => setFullNameData(prev => ({ ...prev, lastNameFa }))}
              onFirstNameEnChange={(firstNameEn) => setFullNameData(prev => ({ ...prev, firstNameEn }))}
              onLastNameEnChange={(lastNameEn) => setFullNameData(prev => ({ ...prev, lastNameEn }))}
              required={true}
            />
          </Paper>
        </Grid>

        {/* Phone Array */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              آرایه شماره تلفن
            </Typography>
            <PhoneArrayFieldComponent
              value={phones}
              onChange={setPhones}
              label="شماره‌های تماس"
              required={true}
              minItems={1}
              maxItems={5}
            />
          </Paper>
        </Grid>

        {/* Address Array */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              آرایه آدرس سلسله‌مراتبی
            </Typography>
            <HierarchicalAddressComponent
              value={addresses}
              onChange={setAddresses}
              label="آدرس‌ها"
              required={false}
              minItems={0}
              maxItems={3}
              rootCategory="geographical"
              levels={['استان', 'شهر', 'منطقه']}
              allowFreeText={true}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Current Values Display */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" gutterBottom>
        مقادیر فعلی فیلدها
      </Typography>
      <Paper sx={{ p: 2 }}>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify({
            englishText,
            numericText,
            nationality,
            nationalId,
            nameData,
            fullNameData,
            phones,
            addresses
          }, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default PersonnelEnhancedFieldsTest;