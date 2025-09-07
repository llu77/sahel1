"use client";

import React, { useRef } from 'react';
import { Button } from './button';
import { Printer } from 'lucide-react';
import EnhancedPrintHeader from './enhanced-print-header';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string | Date;
  paymentMethod: string;
  vendor?: string;
  invoiceNumber?: string;
  notes?: string;
  approvedBy?: string;
  branch?: string;
}

interface ExpenseReportPrintProps {
  expenses: Expense[];
  branch?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  showPrintButton?: boolean;
  title?: string;
}

export const ExpenseReportPrint: React.FC<ExpenseReportPrintProps> = ({
  expenses,
  branch,
  dateRange,
  showPrintButton = true,
  title = 'تقرير المصروفات'
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals by category
  const categoryTotals = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = {
        count: 0,
        total: 0
      };
    }
    acc[expense.category].count++;
    acc[expense.category].total += expense.amount || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Calculate payment methods breakdown
  const paymentMethods = expenses.reduce((acc, expense) => {
    const method = expense.paymentMethod?.toLowerCase() || '';
    if (method.includes('نقد') || method.includes('cash')) {
      acc.cash += expense.amount || 0;
    } else if (method.includes('شبك') || method.includes('card')) {
      acc.card += expense.amount || 0;
    } else if (method.includes('تحويل') || method.includes('transfer')) {
      acc.transfer += expense.amount || 0;
    } else {
      acc.other += expense.amount || 0;
    }
    return acc;
  }, { cash: 0, card: 0, transfer: 0, other: 0 });

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Category labels in Arabic
  const categoryLabels: Record<string, string> = {
    'salaries': 'الرواتب',
    'rent': 'الإيجار',
    'utilities': 'المرافق',
    'supplies': 'المستلزمات',
    'marketing': 'التسويق',
    'maintenance': 'الصيانة',
    'transportation': 'النقل',
    'other': 'أخرى'
  };

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
            subtitle="تقرير مفصل للمصروفات"
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
              ملخص المصروفات
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>إجمالي المصروفات</div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#dc3545' }}>
                  {totalExpenses.toLocaleString()} ريال
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>عدد العمليات</div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
                  {expenses.length}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10pt', color: '#000' }}>متوسط المصروف</div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
                  {expenses.length > 0 
                    ? Math.round(totalExpenses / expenses.length).toLocaleString() 
                    : 0} ريال
                </div>
              </div>
            </div>
          </div>
          
          {/* Expenses by Category */}
          <div className="print-only" style={{ 
            display: 'none',
            marginBottom: '10mm'
          }}>
            <h3 style={{ 
              fontSize: '11pt', 
              fontWeight: 'bold',
              marginBottom: '3mm',
              borderBottom: '1px solid #000',
              paddingBottom: '2mm'
            }}>
              المصروفات حسب الفئة
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
                    textAlign: 'right',
                    width: '40%'
                  }}>
                    الفئة
                  </th>
                  <th style={{ 
                    padding: '3mm',
                    border: '1px solid #000',
                    textAlign: 'center',
                    width: '20%'
                  }}>
                    عدد العمليات
                  </th>
                  <th style={{ 
                    padding: '3mm',
                    border: '1px solid #000',
                    textAlign: 'left',
                    width: '40%'
                  }}>
                    المجموع
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categoryTotals).map(([category, data]) => (
                  <tr key={category}>
                    <td style={{ 
                      padding: '2mm 3mm',
                      border: '1px solid #999'
                    }}>
                      {categoryLabels[category] || category}
                    </td>
                    <td style={{ 
                      padding: '2mm 3mm',
                      border: '1px solid #999',
                      textAlign: 'center'
                    }}>
                      {data.count}
                    </td>
                    <td style={{ 
                      padding: '2mm 3mm',
                      border: '1px solid #999',
                      textAlign: 'left',
                      fontWeight: 'bold'
                    }}>
                      {data.total.toLocaleString()} ريال
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
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    {expenses.length}
                  </td>
                  <td style={{ 
                    padding: '3mm',
                    border: '1px solid #000',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '11pt'
                  }}>
                    {totalExpenses.toLocaleString()} ريال
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Detailed Expenses Table */}
          <table className="invoice-table print-only" style={{ display: 'none' }}>
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '15%' }}>التاريخ</th>
                <th style={{ width: '15%' }}>الفئة</th>
                <th style={{ width: '30%' }}>الوصف</th>
                <th style={{ width: '15%' }}>المبلغ</th>
                <th style={{ width: '20%' }}>طريقة الدفع</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => (
                <tr key={expense.id}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>{format(new Date(expense.date), 'dd/MM/yyyy', { locale: ar })}</td>
                  <td>{categoryLabels[expense.category] || expense.category}</td>
                  <td style={{ fontSize: '9pt' }}>
                    {expense.description}
                    {expense.vendor && <div style={{ fontSize: '8pt', color: '#666' }}>المورد: {expense.vendor}</div>}
                  </td>
                  <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                    {expense.amount.toLocaleString()} ريال
                  </td>
                  <td>{expense.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#e8e8e8' }}>
                <td colSpan={4} style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  الإجمالي الكلي
                </td>
                <td style={{ 
                  textAlign: 'left', 
                  fontWeight: 'bold', 
                  fontSize: '11pt',
                  color: '#dc3545'
                }}>
                  {totalExpenses.toLocaleString()} ريال
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Methods Summary */}
          <div className="print-only" style={{ 
            display: 'none',
            marginTop: '10mm',
            padding: '5mm',
            border: '1px solid #000',
            pageBreakInside: 'avoid'
          }}>
            <h4 style={{ 
              fontSize: '10pt', 
              fontWeight: 'bold',
              marginBottom: '3mm'
            }}>
              طرق الدفع
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {paymentMethods.cash > 0 && (
                <div>
                  <span style={{ fontSize: '9pt' }}>نقدي: </span>
                  <span style={{ fontWeight: 'bold' }}>{paymentMethods.cash.toLocaleString()} ريال</span>
                </div>
              )}
              {paymentMethods.card > 0 && (
                <div>
                  <span style={{ fontSize: '9pt' }}>شبكة: </span>
                  <span style={{ fontWeight: 'bold' }}>{paymentMethods.card.toLocaleString()} ريال</span>
                </div>
              )}
              {paymentMethods.transfer > 0 && (
                <div>
                  <span style={{ fontSize: '9pt' }}>تحويل: </span>
                  <span style={{ fontWeight: 'bold' }}>{paymentMethods.transfer.toLocaleString()} ريال</span>
                </div>
              )}
              {paymentMethods.other > 0 && (
                <div>
                  <span style={{ fontSize: '9pt' }}>أخرى: </span>
                  <span style={{ fontWeight: 'bold' }}>{paymentMethods.other.toLocaleString()} ريال</span>
                </div>
              )}
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-sm text-gray-600">إجمالي المصروفات</div>
              <div className="text-2xl font-bold text-red-600">
                {totalExpenses.toLocaleString()} ريال
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">عدد العمليات</div>
              <div className="text-2xl font-bold">{expenses.length}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">متوسط المصروف</div>
              <div className="text-2xl font-bold">
                {expenses.length > 0 
                  ? Math.round(totalExpenses / expenses.length).toLocaleString() 
                  : 0} ريال
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpenseReportPrint;