"use client";

import React, { useRef } from 'react';
import { Button } from './button';
import { Printer } from 'lucide-react';
import EnhancedPrintHeader from './enhanced-print-header';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ReportsPrintProps {
  revenues: number;
  expenses: number;
  netIncome: number;
  branch?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  showPrintButton?: boolean;
  title?: string;
  revenuesByCategory?: Record<string, number>;
  expensesByCategory?: Record<string, number>;
  monthlyData?: Array<{
    month: string;
    revenue: number;
    expense: number;
    net: number;
  }>;
}

export const ReportsPrint: React.FC<ReportsPrintProps> = ({
  revenues,
  expenses,
  netIncome,
  branch,
  dateRange,
  showPrintButton = true,
  title = 'تقرير إحصائي شامل',
  revenuesByCategory = {},
  expensesByCategory = {},
  monthlyData = []
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const profitMargin = revenues > 0 ? ((netIncome / revenues) * 100).toFixed(1) : '0';
  const expenseRatio = revenues > 0 ? ((expenses / revenues) * 100).toFixed(1) : '0';

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
            طباعة التقرير الإحصائي
          </Button>
        </div>
      )}
      
      <div ref={printRef} className="print-page">
        <div className="print-container">
          <EnhancedPrintHeader
            title={title}
            subtitle="تقرير مالي وإحصائي متكامل"
            branch={branch}
            dateRange={dateRange}
            showDate={true}
            showLogo={true}
          />
          
          {/* Executive Summary */}
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
              marginBottom: '5mm',
              textAlign: 'center',
              borderBottom: '1px solid #000',
              paddingBottom: '2mm'
            }}>
              الملخص التنفيذي
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #ccc' }}>
                <div style={{ fontSize: '10pt', color: '#000', marginBottom: '2mm' }}>إجمالي الإيرادات</div>
                <div style={{ fontSize: '16pt', fontWeight: 'bold', color: '#28a745' }}>
                  {revenues.toLocaleString()} ريال
                </div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #ccc' }}>
                <div style={{ fontSize: '10pt', color: '#000', marginBottom: '2mm' }}>إجمالي المصروفات</div>
                <div style={{ fontSize: '16pt', fontWeight: 'bold', color: '#dc3545' }}>
                  {expenses.toLocaleString()} ريال
                </div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000', marginBottom: '2mm' }}>صافي الربح</div>
                <div style={{ 
                  fontSize: '16pt', 
                  fontWeight: 'bold', 
                  color: netIncome >= 0 ? '#007bff' : '#dc3545' 
                }}>
                  {netIncome.toLocaleString()} ريال
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="print-only" style={{ 
            display: 'none',
            marginBottom: '10mm',
            padding: '5mm',
            border: '1px solid #000'
          }}>
            <h3 style={{ 
              fontSize: '11pt', 
              fontWeight: 'bold',
              marginBottom: '3mm',
              borderBottom: '1px solid #000',
              paddingBottom: '2mm'
            }}>
              مؤشرات الأداء الرئيسية
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5mm' }}>
              <div>
                <span style={{ fontSize: '9pt' }}>هامش الربح: </span>
                <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>{profitMargin}%</span>
              </div>
              <div>
                <span style={{ fontSize: '9pt' }}>نسبة المصروفات: </span>
                <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>{expenseRatio}%</span>
              </div>
              <div>
                <span style={{ fontSize: '9pt' }}>معدل الإيراد اليومي: </span>
                <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                  {dateRange ? Math.round(revenues / ((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))).toLocaleString() : 0} ريال
                </span>
              </div>
              <div>
                <span style={{ fontSize: '9pt' }}>معدل المصروف اليومي: </span>
                <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                  {dateRange ? Math.round(expenses / ((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))).toLocaleString() : 0} ريال
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Trend Analysis */}
          {monthlyData.length > 0 && (
            <div className="print-only" style={{ 
              display: 'none',
              marginBottom: '10mm',
              pageBreakInside: 'avoid'
            }}>
              <h3 style={{ 
                fontSize: '11pt', 
                fontWeight: 'bold',
                marginBottom: '3mm',
                borderBottom: '1px solid #000',
                paddingBottom: '2mm'
              }}>
                التحليل الشهري
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
                      الشهر
                    </th>
                    <th style={{ 
                      padding: '3mm',
                      border: '1px solid #000',
                      textAlign: 'left'
                    }}>
                      الإيرادات
                    </th>
                    <th style={{ 
                      padding: '3mm',
                      border: '1px solid #000',
                      textAlign: 'left'
                    }}>
                      المصروفات
                    </th>
                    <th style={{ 
                      padding: '3mm',
                      border: '1px solid #000',
                      textAlign: 'left'
                    }}>
                      صافي الربح
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, index) => (
                    <tr key={index}>
                      <td style={{ 
                        padding: '2mm 3mm',
                        border: '1px solid #999'
                      }}>
                        {data.month}
                      </td>
                      <td style={{ 
                        padding: '2mm 3mm',
                        border: '1px solid #999',
                        textAlign: 'left',
                        color: '#28a745'
                      }}>
                        {data.revenue.toLocaleString()} ريال
                      </td>
                      <td style={{ 
                        padding: '2mm 3mm',
                        border: '1px solid #999',
                        textAlign: 'left',
                        color: '#dc3545'
                      }}>
                        {data.expense.toLocaleString()} ريال
                      </td>
                      <td style={{ 
                        padding: '2mm 3mm',
                        border: '1px solid #999',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: data.net >= 0 ? '#007bff' : '#dc3545'
                      }}>
                        {data.net.toLocaleString()} ريال
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="print-only" style={{ 
            display: 'none',
            marginBottom: '10mm',
            pageBreakInside: 'avoid'
          }}>
            <h3 style={{ 
              fontSize: '11pt', 
              fontWeight: 'bold',
              marginBottom: '3mm',
              borderBottom: '1px solid #000',
              paddingBottom: '2mm'
            }}>
              تحليل الفئات
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5mm' }}>
              {/* Revenue Categories */}
              {Object.keys(revenuesByCategory).length > 0 && (
                <div>
                  <h4 style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '2mm' }}>
                    الإيرادات حسب الفئة
                  </h4>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #000'
                  }}>
                    <tbody>
                      {Object.entries(revenuesByCategory).map(([category, amount]) => (
                        <tr key={category}>
                          <td style={{ 
                            padding: '2mm',
                            border: '1px solid #999',
                            fontSize: '9pt'
                          }}>
                            {category}
                          </td>
                          <td style={{ 
                            padding: '2mm',
                            border: '1px solid #999',
                            textAlign: 'left',
                            fontWeight: 'bold',
                            fontSize: '9pt'
                          }}>
                            {amount.toLocaleString()} ريال
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expense Categories */}
              {Object.keys(expensesByCategory).length > 0 && (
                <div>
                  <h4 style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '2mm' }}>
                    المصروفات حسب الفئة
                  </h4>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #000'
                  }}>
                    <tbody>
                      {Object.entries(expensesByCategory).map(([category, amount]) => (
                        <tr key={category}>
                          <td style={{ 
                            padding: '2mm',
                            border: '1px solid #999',
                            fontSize: '9pt'
                          }}>
                            {category}
                          </td>
                          <td style={{ 
                            padding: '2mm',
                            border: '1px solid #999',
                            textAlign: 'left',
                            fontWeight: 'bold',
                            fontSize: '9pt'
                          }}>
                            {amount.toLocaleString()} ريال
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="print-only" style={{ 
            display: 'none',
            marginTop: '10mm',
            padding: '5mm',
            border: '2px solid #000',
            backgroundColor: '#f0f0f0',
            pageBreakInside: 'avoid'
          }}>
            <h4 style={{ 
              fontSize: '11pt', 
              fontWeight: 'bold',
              marginBottom: '3mm',
              textAlign: 'center'
            }}>
              الخلاصة المالية
            </h4>
            <div style={{ textAlign: 'center', fontSize: '12pt' }}>
              <div style={{ marginBottom: '2mm' }}>
                الوضع المالي: 
                <span style={{ 
                  fontWeight: 'bold',
                  color: netIncome >= 0 ? '#28a745' : '#dc3545',
                  marginRight: '3mm'
                }}>
                  {netIncome >= 0 ? 'ربح' : 'خسارة'}
                </span>
              </div>
              <div style={{ 
                fontSize: '14pt', 
                fontWeight: 'bold',
                color: netIncome >= 0 ? '#28a745' : '#dc3545'
              }}>
                {Math.abs(netIncome).toLocaleString()} ريال
              </div>
            </div>
          </div>

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
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-sm text-gray-600">إجمالي الإيرادات</div>
              <div className="text-2xl font-bold text-green-600">
                {revenues.toLocaleString()} ريال
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-sm text-gray-600">إجمالي المصروفات</div>
              <div className="text-2xl font-bold text-red-600">
                {expenses.toLocaleString()} ريال
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">صافي الربح</div>
              <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {netIncome.toLocaleString()} ريال
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportsPrint;