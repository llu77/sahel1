"use client";

import React, { useRef } from 'react';
import { Button } from './button';
import { Printer } from 'lucide-react';
import EnhancedPrintHeader from './enhanced-print-header';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface InvoiceItem {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoicePrintProps {
  title?: string;
  invoiceNumber?: string;
  items: InvoiceItem[];
  branch?: 'laban' | 'tuwaiq' | string;
  supervisor?: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  showPrintButton?: boolean;
  showApproval?: boolean;
  notes?: string;
  customerName?: string;
  date?: Date;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  title = 'فاتورة طلبات المنتجات',
  invoiceNumber,
  items,
  branch,
  supervisor,
  subtotal,
  tax = 0,
  discount = 0,
  total,
  showPrintButton = true,
  showApproval = true,
  notes,
  customerName,
  date = new Date()
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
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            طباعة الفاتورة
          </Button>
        </div>
      )}
      
      <div ref={printRef} className="print-page">
        <div className="print-container">
          <EnhancedPrintHeader
            title={title}
            branch={branch}
            supervisor={supervisor}
            showDate={true}
            showLogo={true}
            invoiceNumber={invoiceNumber || `INV-${Date.now()}`}
          />
          
          {/* Customer Info */}
          {customerName && (
            <div className="print-only" style={{ 
              display: 'none',
              marginBottom: '8mm',
              padding: '3mm',
              border: '1px solid #999'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>معلومات العميل:</div>
              <div>الاسم: {customerName}</div>
              <div>التاريخ: {format(date, 'dd/MM/yyyy', { locale: ar })}</div>
            </div>
          )}
          
          {/* Invoice Table */}
          <table className="invoice-table print-only" style={{ display: 'none' }}>
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '45%' }}>اسم المنتج</th>
                <th className="quantity">الكمية</th>
                <th className="price">السعر</th>
                <th className="total">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td className="product-name">{item.name}</td>
                  <td className="quantity">{item.quantity}</td>
                  <td className="price">{item.price.toLocaleString()} ريال</td>
                  <td className="total">{item.total.toLocaleString()} ريال</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  المجموع الفرعي:
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  {subtotal.toLocaleString()} ريال
                </td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'left' }}>
                    الخصم:
                  </td>
                  <td style={{ textAlign: 'left', color: '#dc3545' }}>
                    -{discount.toLocaleString()} ريال
                  </td>
                </tr>
              )}
              {tax > 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'left' }}>
                    الضريبة (15%):
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    {tax.toLocaleString()} ريال
                  </td>
                </tr>
              )}
              <tr style={{ backgroundColor: '#e8e8e8' }}>
                <td colSpan={4} style={{ 
                  textAlign: 'left', 
                  fontWeight: 'bold',
                  fontSize: '12pt' 
                }}>
                  المجموع الكلي:
                </td>
                <td style={{ 
                  textAlign: 'left', 
                  fontWeight: 'bold',
                  fontSize: '12pt' 
                }}>
                  {total.toLocaleString()} ريال
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Notes Section */}
          {notes && (
            <div className="print-only" style={{ 
              display: 'none',
              marginTop: '8mm',
              padding: '3mm',
              border: '1px solid #999',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>ملاحظات:</div>
              <div>{notes}</div>
            </div>
          )}

          {/* Approval Section */}
          {showApproval && (
            <div className="approval-section print-only" style={{ display: 'none' }}>
              <div className="approval-box">
                <div className="approval-stamp">معتمد</div>
                <div className="signature-line"></div>
                <div className="approval-label">توقيع المدير</div>
              </div>
              <div className="approval-box">
                <div className="approval-stamp">مستلم</div>
                <div className="signature-line"></div>
                <div className="approval-label">توقيع المستلم</div>
              </div>
              <div className="approval-box">
                <div className="approval-stamp">محاسب</div>
                <div className="signature-line"></div>
                <div className="approval-label">توقيع المحاسب</div>
              </div>
            </div>
          )}

          {/* Enhanced Branch Footer */}
          <EnhancedPrintHeader
            title=""
            branch={branch}
            supervisor={supervisor}
            showDate={false}
            showLogo={false}
          />
        </div>
      </div>

      {/* Screen Display */}
      <div className="screen-only">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          {invoiceNumber && (
            <p className="text-sm text-muted-foreground mb-4">
              رقم الفاتورة: {invoiceNumber}
            </p>
          )}
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">#</th>
                <th className="text-right p-2">اسم المنتج</th>
                <th className="text-center p-2">الكمية</th>
                <th className="text-left p-2">السعر</th>
                <th className="text-left p-2">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{item.name}</td>
                  <td className="text-center p-2">{item.quantity}</td>
                  <td className="text-left p-2">{item.price.toLocaleString()} ريال</td>
                  <td className="text-left p-2 font-semibold">
                    {item.total.toLocaleString()} ريال
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <td colSpan={4} className="text-left p-2 font-bold">
                  المجموع الكلي:
                </td>
                <td className="text-left p-2 font-bold text-lg">
                  {total.toLocaleString()} ريال
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
};

export default InvoicePrint;