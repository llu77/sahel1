"use client";

import React, { useRef } from 'react';
import { Button } from './button';
import { Printer } from 'lucide-react';
import EnhancedPrintHeader from './enhanced-print-header';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Revenue {
  id: number;
  documentNumber: string;
  documentType: string;
  amount: number;
  discount: number;
  totalAfterDiscount: number;
  percentage: number;
  date: string | Date;
  paymentMethod: string;
  branchRevenue: number;
  departmentRevenue: number;
  notes?: string;
  employeeContributions?: Array<{
    name: string;
    amount: number;
  }>;
  branch?: string;
}

interface RevenueReportPrintProps {
  revenues: Revenue[];
  branch?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  showPrintButton?: boolean;
  title?: string;
}

export const RevenueReportPrint: React.FC<RevenueReportPrintProps> = ({
  revenues,
  branch,
  dateRange,
  showPrintButton = true,
  title = 'تقرير الإيرادات'
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const totals = revenues.reduce((acc, revenue) => {
    acc.totalAmount += revenue.amount || 0;
    acc.totalDiscount += revenue.discount || 0;
    acc.totalAfterDiscount += revenue.totalAfterDiscount || 0;
    acc.totalBranchRevenue += revenue.branchRevenue || 0;
    acc.totalDepartmentRevenue += revenue.departmentRevenue || 0;
    return acc;
  }, {
    totalAmount: 0,
    totalDiscount: 0,
    totalAfterDiscount: 0,
    totalBranchRevenue: 0,
    totalDepartmentRevenue: 0
  });

  // Calculate payment methods breakdown
  const paymentMethods = revenues.reduce((acc, revenue) => {
    const methods = revenue.paymentMethod?.split('-') || [];
    methods.forEach(method => {
      const [type, amount] = method.split(':').map(s => s.trim());
      if (type && amount) {
        const value = parseFloat(amount.replace(/[^\d.]/g, '')) || 0;
        if (type.includes('نقد')) {
          acc.cash += value;
        } else if (type.includes('شبك')) {
          acc.card += value;
        }
      }
    });
    return acc;
  }, { cash: 0, card: 0 });

  // Employee contributions summary
  const employeeContributions = revenues.reduce((acc, revenue) => {
    revenue.employeeContributions?.forEach(contrib => {
      if (!acc[contrib.name]) {
        acc[contrib.name] = 0;
      }
      acc[contrib.name] += contrib.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {showPrintButton && (
        <div className="no-print mb-4">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            طباعة التقرير
          </Button>
        </div>
      )}
      
      <div ref={printRef} className="print-page">
        <div className="print-container">
          <EnhancedPrintHeader
            title={title}
            subtitle="تقرير مفصل للإيرادات"
            branch={branch}
            dateRange={dateRange}
            showDate={true}
            showLogo={true}
          />
          
          {/* Summary Statistics */}
          <div className="print-only" style={{ 
            display: 'none',
            marginBottom: '10mm',
            padding: '5mm',
            border: '2px solid #000',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold',
              marginBottom: '3mm',
              textAlign: 'center',
              borderBottom: '1px solid #000',
              paddingBottom: '2mm'
            }}>
              ملخص الإيرادات
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>إجمالي الإيرادات</div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
                  {totals.totalAmount.toLocaleString()} ريال
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>إجمالي الخصومات</div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
                  {totals.totalDiscount.toLocaleString()} ريال
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>الصافي بعد الخصم</div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
                  {totals.totalAfterDiscount.toLocaleString()} ريال
                </div>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around',
              marginTop: '5mm',
              paddingTop: '3mm',
              borderTop: '1px solid #000'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>نقدي</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>
                  {paymentMethods.cash.toLocaleString()} ريال
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>شبكة</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>
                  {paymentMethods.card.toLocaleString()} ريال
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>عدد العمليات</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>
                  {revenues.length}
                </div>
              </div>
            </div>
          </div>
          
          {/* Revenues Table */}
          <table className="invoice-table print-only" style={{ display: 'none' }}>
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '15%' }}>رقم المستند</th>
                <th style={{ width: '15%' }}>التاريخ</th>
                <th style={{ width: '15%' }}>المبلغ</th>
                <th style={{ width: '10%' }}>الخصم</th>
                <th style={{ width: '15%' }}>الصافي</th>
                <th style={{ width: '25%' }}>طريقة الدفع</th>
              </tr>
            </thead>
            <tbody>
              {revenues.map((revenue, index) => (
                <tr key={revenue.id}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>{revenue.documentNumber}</td>
                  <td>{format(new Date(revenue.date), 'dd/MM/yyyy', { locale: ar })}</td>
                  <td style={{ textAlign: 'left' }}>{revenue.amount.toLocaleString()} ريال</td>
                  <td style={{ textAlign: 'center' }}>{revenue.discount.toLocaleString()}</td>
                  <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                    {revenue.totalAfterDiscount.toLocaleString()} ريال
                  </td>
                  <td style={{ fontSize: '9pt' }}>{revenue.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#e8e8e8' }}>
                <td colSpan={3} style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  الإجمالي
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  {totals.totalAmount.toLocaleString()} ريال
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {totals.totalDiscount.toLocaleString()}
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '11pt' }}>
                  {totals.totalAfterDiscount.toLocaleString()} ريال
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {/* Employee Contributions */}
          {Object.keys(employeeContributions).length > 0 && (
            <div className="print-only" style={{ 
              display: 'none',
              marginTop: '10mm',
              pageBreakInside: 'avoid'
            }}>
              <h3 style={{ 
                fontSize: '12pt', 
                fontWeight: 'bold',
                marginBottom: '5mm',
                borderBottom: '1px solid #000',
                paddingBottom: '2mm'
              }}>
                مساهمات الموظفين
              </h3>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #000'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#e8e8e8' }}>
                    <th style={{ 
                      padding: '3mm',
                      border: '1px solid #000',
                      textAlign: 'right'
                    }}>
                      اسم الموظف
                    </th>
                    <th style={{ 
                      padding: '3mm',
                      border: '1px solid #000',
                      textAlign: 'left'
                    }}>
                      إجمالي المساهمة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(employeeContributions).map(([name, amount]) => (
                    <tr key={name}>
                      <td style={{ 
                        padding: '2mm 3mm',
                        border: '1px solid #999'
                      }}>
                        {name}
                      </td>
                      <td style={{ 
                        padding: '2mm 3mm',
                        border: '1px solid #999',
                        textAlign: 'left',
                        fontWeight: 'bold'
                      }}>
                        {amount.toLocaleString()} ريال
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <td style={{ 
                      padding: '3mm',
                      border: '1px solid #000',
                      fontWeight: 'bold'
                    }}>
                      الإجمالي
                    </td>
                    <td style={{ 
                      padding: '3mm',
                      border: '1px solid #000',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '11pt'
                    }}>
                      {Object.values(employeeContributions)
                        .reduce((sum, amount) => sum + amount, 0)
                        .toLocaleString()} ريال
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Signature Section */}
          <div className="approval-section print-only" style={{ display: 'none' }}>
            <div className="approval-box">
              <div className="signature-line"></div>
              <div className="approval-label">المحاسب</div>
            </div>
            <div className="approval-box">
              <div className="signature-line"></div>
              <div className="approval-label">المدير المالي</div>
            </div>
            <div className="approval-box">
              <div className="signature-line"></div>
              <div className="approval-label">المدير العام</div>
            </div>
          </div>

          {/* Enhanced Branch Footer */}
          <EnhancedPrintHeader
            title=""
            branch={branch}
            showDate={false}
            showLogo={false}
          />
        </div>
      </div>

      {/* Screen Display */}
      <div className="screen-only">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">إجمالي الإيرادات</div>
              <div className="text-2xl font-bold">{totals.totalAmount.toLocaleString()} ريال</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">إجمالي الخصومات</div>
              <div className="text-2xl font-bold">{totals.totalDiscount.toLocaleString()} ريال</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">الصافي</div>
              <div className="text-2xl font-bold text-green-600">
                {totals.totalAfterDiscount.toLocaleString()} ريال
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RevenueReportPrint;