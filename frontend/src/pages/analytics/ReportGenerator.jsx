import React, { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

const formatCurrency = (v) => (v == null ? '—' : `$${v.toFixed(2)}`);
const formatPercent = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);
const formatRR = (v) => (v == null ? '—' : v.toFixed(2));

export default function ReportGenerator() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/journal/report-data', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch report data');
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    const [{ jsPDF }, html2canvas] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const canvas = await html2canvas.default(reportRef.current, {
      scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    // Add extra pages if height overflow
    if (pdfHeight > pageHeight) {
      let remainingHeight = pdfHeight - pageHeight;
      while (remainingHeight > 0) {
        position = remainingHeight - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        remainingHeight -= pageHeight;
      }
    }
    pdf.save('trading_report.pdf');
  };

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return null;

  const { overall, symbols, strategies, tags } = data;

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📄 Trading Performance Report</h1>
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Download className="h-5 w-5 mr-2" />
          Download PDF
        </button>
      </div>

      {/* Report content */}
      <div ref={reportRef} className="space-y-8 bg-white p-8 shadow-lg rounded">
        {/* Overall */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Total Trades</p>
              <p className="text-xl font-bold">{overall.total_trades}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total PnL</p>
              <p className="text-xl font-bold">{formatCurrency(overall.total_pnl)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="text-xl font-bold">{formatPercent(overall.win_rate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Average R:R</p>
              <p className="text-xl font-bold">{formatRR(overall.avg_rr)}</p>
            </div>
          </div>
        </section>

        {/* Symbols */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Symbol Breakdown</h2>
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Symbol</th>
                <th className="p-2">Trades</th>
                <th className="p-2">Win Rate</th>
                <th className="p-2">Avg R:R</th>
                <th className="p-2">PnL</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((row,i)=>(
                <tr key={i} className="border-t">
                  <td className="p-2 font-medium">{row.symbol}</td>
                  <td className="p-2">{row.trades}</td>
                  <td className="p-2">{formatPercent(row.win_rate)}</td>
                  <td className="p-2">{formatRR(row.avg_rr)}</td>
                  <td className="p-2">{formatCurrency(row.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Strategies */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Strategy Breakdown</h2>
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Strategy</th>
                <th className="p-2">Trades</th>
                <th className="p-2">Win Rate</th>
                <th className="p-2">Avg R:R</th>
                <th className="p-2">PnL</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((row,i)=>(
                <tr key={i} className="border-t">
                  <td className="p-2 font-medium">{row.strategy}</td>
                  <td className="p-2">{row.trades}</td>
                  <td className="p-2">{formatPercent(row.win_rate)}</td>
                  <td className="p-2">{formatRR(row.avg_rr)}</td>
                  <td className="p-2">{formatCurrency(row.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Tags */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Variable / Tag Breakdown</h2>
          {tags.map((group,gIdx)=>(
            <div key={gIdx} className="mb-6">
              <h3 className="font-semibold mb-2 capitalize">{group.tag.replace(/_/g,' ')}</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2">Label</th>
                    <th className="p-2">Trades</th>
                    <th className="p-2">Win Rate</th>
                    <th className="p-2">Avg PnL</th>
                    <th className="p-2">Avg R:R</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item,i)=>(
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium">{item.label}</td>
                      <td className="p-2">{item.trades}</td>
                      <td className="p-2">{formatPercent(item.win_rate)}</td>
                      <td className="p-2">{formatCurrency(item.avg_pnl)}</td>
                      <td className="p-2">{formatRR(item.avg_rr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
