import { UserRole } from '@/types';
import { Address, UserProfile } from '../types';
import { convertToFarsiNumbers } from './formatters';

// PDF generation function
export const generateUserPDF = (userData: Partial<UserProfile>, addresses: Address[]) => {
  // Create a new window with the user data for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  // Get role text function
  const getRoleText = (role: UserRole | undefined) => {
    switch (role) {
      case 'admin': return 'مدیر کل';
      case 'commander': return 'فرمانده';
      case 'operator': return 'اپراتور';
      case 'viewer': return 'بیننده';
      default: return 'نامشخص';
    }
  };
  
  // Get clearance text function
  const getClearanceText = (clearance: string | undefined) => {
    switch (clearance) {
      case 'top_secret': return 'فوق محرمانه';
      case 'secret': return 'محرمانه';
      case 'basic': return 'عادی';
      case 'none': return 'بدون دسترسی';
      default: return 'نامشخص';
    }
  };
  
  // Get nationality text
  const getNationalityText = (nationality: string | undefined) => {
    return nationality === 'iranian' ? 'ایرانی' : 'غیر ایرانی';
  };
  
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>اطلاعات کاربر - ${userData.name || userData.username}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'B-Yekan', 'Vazirmatn', 'Tahoma', 'Iranian Sans', 'بی یکان', 'تهوما', 'Segoe UI', 'Arial', sans-serif;
          direction: rtl;
          background: white;
          color: #333;
          line-height: 1.6;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #1976d2;
          font-size: 24px;
          margin-bottom: 10px;
        }
        
        .header p {
          color: #666;
          font-size: 14px;
        }
        
        .section {
          margin-bottom: 30px;
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 15px;
          border-bottom: 2px solid #1976d2;
          padding-bottom: 5px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        
        .info-item {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }
        
        .info-label {
          font-weight: bold;
          color: #555;
          margin-bottom: 5px;
        }
        
        .info-value {
          color: #333;
          font-size: 14px;
        }
        
        .addresses {
          margin-top: 15px;
        }
        
        .address-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          margin-bottom: 10px;
        }
        
        .address-title {
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 10px;
        }
        
        .permissions-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }
        
        .permission-item {
          background: white;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
          font-size: 13px;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 12px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>فرم اطلاعات کاربر</h1>
        <p>سیستم مدیریت عملیات نظامی ساجد</p>
        <p>تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}</p>
      </div>
      
      <div class="section">
        <div class="section-title">اطلاعات شخصی</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">نام و نام خانوادگی:</div>
            <div class="info-value">${userData.name || 'وارد نشده'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">نام انگلیسی:</div>
            <div class="info-value">${userData.nameEn || 'وارد نشده'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">نام کاربری:</div>
            <div class="info-value">${userData.username || 'وارد نشده'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">شماره تماس:</div>
            <div class="info-value">${convertToFarsiNumbers(userData.phoneNumber || 'وارد نشده')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">تابعیت:</div>
            <div class="info-value">${getNationalityText(userData.nationality)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">${userData.nationality === 'iranian' ? 'شماره ملی' : 'شماره پاسپورت'}:</div>
            <div class="info-value">${convertToFarsiNumbers(userData.nationalId || 'وارد نشده')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">بخش:</div>
            <div class="info-value">${userData.department || 'وارد نشده'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">سمت:</div>
            <div class="info-value">${userData.position || 'وارد نشده'}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">آدرس‌ها</div>
        <div class="addresses">
          ${addresses.map(address => `
            <div class="address-item">
              <div class="address-title">${address.title} ${address.isDefault ? '(پیش‌فرض)' : ''}</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">کشور:</div>
                  <div class="info-value">${address.country || 'وارد نشده'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">استان:</div>
                  <div class="info-value">${address.state || 'وارد نشده'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">شهر:</div>
                  <div class="info-value">${address.city || 'وارد نشده'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">کد پستی:</div>
                  <div class="info-value">${convertToFarsiNumbers(address.postalCode || 'وارد نشده')}</div>
                </div>
              </div>
              ${address.detailAddress ? `
                <div class="info-item" style="margin-top: 10px;">
                  <div class="info-label">آدرس کامل:</div>
                  <div class="info-value">${address.detailAddress}</div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">سطوح دسترسی</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">نقش:</div>
            <div class="info-value">${getRoleText(userData.role)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">سطح امنیتی:</div>
            <div class="info-value">${getClearanceText(userData.securityClearance)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">وضعیت:</div>
            <div class="info-value">${userData.isActive ? 'فعال' : 'غیرفعال'}</div>
          </div>
        </div>
        ${userData.permissions && userData.permissions.length > 0 ? `
          <div style="margin-top: 20px;">
            <div class="info-label">مجوزهای دسترسی:</div>
            <div class="permissions-list">
              ${userData.permissions.map(permission => `
                <div class="permission-item">${permission}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>این سند توسط سیستم مدیریت عملیات نظامی ساجد تولید شده است.</p>
        <p>تاریخ و زمان تولید: ${convertToFarsiNumbers(new Date().toLocaleString('fa-IR'))}</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
}; 