import React from 'react';
import Logo from './logo';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  branch?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  showDate?: boolean;
  showLogo?: boolean;
  companyInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  title,
  subtitle,
  branch,
  dateRange,
  showDate = true,
  showLogo = true,
  companyInfo = {
    name: 'نظام سهل',
    phone: '+966 50 123 4567',
    email: 'info@sahl.com',
    address: 'الرياض، المملكة العربية السعودية'
  }
}) => {
  const currentDate = new Date();
  
  return (
    <div className="print-header print-only" style={{ 
      display: 'none',
      borderBottom: '2px solid #333',
      paddingBottom: '10mm',
      marginBottom: '10mm'
    }}>
      <style jsx>{`
        @media print {
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
          }
          
          .logo-section {
            flex: 0 0 auto;
          }
          
          .title-section {
            flex: 1;
            text-align: center;
            padding: 0 20px;
          }
          
          .info-section {
            flex: 0 0 auto;
            text-align: left;
            font-size: 9pt;
            line-height: 1.4;
          }
          
          .main-title {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
          }
          
          .subtitle {
            font-size: 12pt;
            color: #555;
            margin-bottom: 3px;
          }
          
          .branch-name {
            font-size: 11pt;
            color: #666;
            margin-bottom: 3px;
          }
          
          .date-range {
            font-size: 10pt;
            color: #666;
            margin-top: 5px;
          }
          
          .print-date {
            font-size: 9pt;
            color: #999;
            margin-top: 10px;
          }
          
          .company-info {
            min-width: 150px;
          }
          
          .info-line {
            margin: 2px 0;
            color: #555;
          }
        }
      `}</style>
      
      {/* Logo Section */}
      {showLogo && (
        <div className="logo-section">
          <Logo width={120} height={50} forPrint={true} />
        </div>
      )}
      
      {/* Title Section */}
      <div className="title-section">
        <h1 className="main-title">{title}</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
        {branch && <div className="branch-name">فرع {branch}</div>}
        {dateRange && (
          <div className="date-range">
            من {format(dateRange.from, 'dd/MM/yyyy', { locale: ar })} 
            {' '}إلى {format(dateRange.to, 'dd/MM/yyyy', { locale: ar })}
          </div>
        )}
      </div>
      
      {/* Company Info Section */}
      <div className="info-section company-info">
        {companyInfo.name && <div className="info-line">{companyInfo.name}</div>}
        {companyInfo.phone && <div className="info-line">هاتف: {companyInfo.phone}</div>}
        {companyInfo.email && <div className="info-line">{companyInfo.email}</div>}
        {companyInfo.address && <div className="info-line">{companyInfo.address}</div>}
        {showDate && (
          <div className="print-date">
            تاريخ الطباعة: {format(currentDate, 'dd/MM/yyyy HH:mm', { locale: ar })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintHeader;