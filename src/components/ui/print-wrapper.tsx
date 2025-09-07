"use client";

import React, { useRef } from 'react';
import { Button } from './button';
import { Printer } from 'lucide-react';
import PrintHeader from './print-header';

interface PrintWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  branch?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  showPrintButton?: boolean;
  buttonText?: string;
  buttonClassName?: string;
  companyInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

export const PrintWrapper: React.FC<PrintWrapperProps> = ({
  children,
  title,
  subtitle,
  branch,
  dateRange,
  showPrintButton = true,
  buttonText = 'طباعة',
  buttonClassName = '',
  companyInfo
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {showPrintButton && (
        <div className="no-print mb-4">
          <Button
            onClick={handlePrint}
            variant="outline"
            className={`flex items-center gap-2 ${buttonClassName}`}
          >
            <Printer className="h-4 w-4" />
            {buttonText}
          </Button>
        </div>
      )}
      
      <div ref={printRef} className="print-container">
        <PrintHeader
          title={title}
          subtitle={subtitle}
          branch={branch}
          dateRange={dateRange}
          showDate={true}
          showLogo={true}
          companyInfo={companyInfo}
        />
        
        <div className="print-content">
          {children}
        </div>
        
        {/* Print Footer */}
        <div className="print-footer print-only" style={{ display: 'none' }}>
          <style jsx>{`
            @media print {
              .print-footer {
                display: block !important;
                margin-top: 20mm;
                padding-top: 5mm;
                border-top: 1px solid #999;
                text-align: center;
                font-size: 9pt;
                color: #666;
              }
            }
          `}</style>
          <div>Symbol AI Co. - جميع الحقوق محفوظة © {new Date().getFullYear()}</div>
        </div>
      </div>
    </>
  );
};

export default PrintWrapper;