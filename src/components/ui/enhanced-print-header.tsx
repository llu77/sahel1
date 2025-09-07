import React from 'react';
import Logo from './logo';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EnhancedPrintHeaderProps {
  title: string;
  subtitle?: string;
  branch?: 'laban' | 'tuwaiq' | string;
  supervisor?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  showDate?: boolean;
  showLogo?: boolean;
  invoiceNumber?: string;
  companyInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

// Branch supervisors mapping
const branchSupervisors: Record<string, string> = {
  'laban': 'عبدالحي جلال',
  'tuwaiq': 'محمد إسماعيل'
};

// Branch names in Arabic
const branchNames: Record<string, string> = {
  'laban': 'فرع لبن',
  'tuwaiq': 'فرع طويق'
};

export const EnhancedPrintHeader: React.FC<EnhancedPrintHeaderProps> = ({
  title,
  subtitle,
  branch,
  supervisor,
  dateRange,
  showDate = true,
  showLogo = true,
  invoiceNumber,
  companyInfo = {
    name: 'نظام سهل',
    phone: '+966 50 123 4567',
    email: 'info@sahl.com',
    address: 'الرياض، المملكة العربية السعودية'
  }
}) => {
  const currentDate = new Date();
  const branchName = branch ? (branchNames[branch] || branch) : '';
  const supervisorName = supervisor || (branch ? branchSupervisors[branch] : '');
  
  return (
    <>
      {/* Main Header */}
      <div className="print-header print-only" style={{ display: 'none' }}>
        {/* Logo Section */}
        {showLogo && (
          <div className="logo-section">
            <Logo width={100} height={40} forPrint={true} />
          </div>
        )}
        
        {/* Title Section */}
        <div className="title-section">
          <h1>{title}</h1>
          {subtitle && <div className="subtitle">{subtitle}</div>}
          {invoiceNumber && (
            <div className="invoice-number" style={{ 
              fontSize: '10pt', 
              marginTop: '2mm',
              fontWeight: 'bold' 
            }}>
              رقم الفاتورة: {invoiceNumber}
            </div>
          )}
          {dateRange && (
            <div className="date-range" style={{ fontSize: '9pt', marginTop: '2mm' }}>
              من {format(dateRange.from, 'dd/MM/yyyy', { locale: ar })} 
              {' '}إلى {format(dateRange.to, 'dd/MM/yyyy', { locale: ar })}
            </div>
          )}
        </div>
        
        {/* Company Info Section */}
        <div className="info-section">
          {companyInfo.name && <div className="info-line">{companyInfo.name}</div>}
          {companyInfo.phone && <div className="info-line">هاتف: {companyInfo.phone}</div>}
          {companyInfo.email && <div className="info-line">{companyInfo.email}</div>}
          {companyInfo.address && <div className="info-line">{companyInfo.address}</div>}
          {showDate && (
            <div className="print-date" style={{ marginTop: '3mm' }}>
              تاريخ الطباعة: {format(currentDate, 'dd/MM/yyyy HH:mm', { locale: ar })}
            </div>
          )}
        </div>
      </div>

      {/* Branch and Supervisor Footer */}
      {(branchName || supervisorName) && (
        <div className="print-branch-info print-only" style={{ display: 'none' }}>
          <div className="branch-info-grid">
            {branchName && (
              <div className="branch-info-item">
                <div className="branch-info-label">الفرع</div>
                <div className="branch-info-value">{branchName}</div>
              </div>
            )}
            {supervisorName && (
              <div className="branch-info-item">
                <div className="branch-info-label">المشرف</div>
                <div className="branch-info-value">{supervisorName}</div>
              </div>
            )}
            <div className="branch-info-item">
              <div className="branch-info-label">التاريخ</div>
              <div className="branch-info-value">
                {format(currentDate, 'dd/MM/yyyy', { locale: ar })}
              </div>
            </div>
          </div>
          <div style={{ 
            marginTop: '5mm',
            paddingTop: '3mm',
            borderTop: '1px solid #999',
            textAlign: 'center',
            fontSize: '9pt',
            color: '#666'
          }}>
            Symbol AI Co. - جميع الحقوق محفوظة © {new Date().getFullYear()}
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedPrintHeader;