import { Injectable } from '@angular/core';
import { InvoiceResponse, PrescriptionResponse } from './visit.service';

interface PatientSnap {
  firstName: string;
  lastName: string;
  medicalRecordNumber: string;
  dateOfBirth?: string;
}

const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: #fff; padding: 2rem; }
  .doc-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  .clinic-brand { display: flex; align-items: center; gap: 0.75rem; }
  .clinic-icon { width: 42px; height: 42px; background: linear-gradient(135deg,#3b82f6,#6366f1); border-radius: 10px; display:flex; align-items:center; justify-content:center; }
  .clinic-icon svg { width: 22px; height: 22px; fill: #fff; }
  .clinic-name { font-size: 18px; font-weight: 800; color: #1e2a45; letter-spacing: -0.03em; }
  .clinic-sub  { font-size: 10px; color: #8a94a6; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 1px; }
  .doc-type { text-align: right; }
  .doc-type h1 { font-size: 22px; font-weight: 800; color: #3b82f6; letter-spacing: 0.05em; text-transform: uppercase; }
  .doc-type .doc-num { font-size: 11px; color: #6b7280; margin-top: 2px; font-family: monospace; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
  .meta-box { background: #f8faff; border: 1px solid #e5e9f5; border-radius: 8px; padding: 0.875rem 1rem; }
  .meta-box h3 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8a94a6; margin-bottom: 0.5rem; }
  .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
  .meta-label { color: #6b7280; font-size: 11px; }
  .meta-value { font-weight: 600; font-size: 11px; color: #1e2a45; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; }
  thead tr { background: #1e2a45; }
  thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.07em; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #f8faff; }
  tbody td { padding: 7px 10px; font-size: 11px; color: #374151; vertical-align: top; }
  tbody td:last-child { text-align: right; font-weight: 600; }
  .totals-box { margin-left: auto; width: 260px; background: #f8faff; border: 1px solid #e5e9f5; border-radius: 8px; padding: 0.875rem 1rem; }
  .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
  .total-row.grand { border-top: 2px solid #1e2a45; margin-top: 6px; padding-top: 8px; font-size: 13px; font-weight: 800; color: #1e2a45; }
  .total-row.paid   { color: #10b981; font-weight: 600; }
  .total-row.balance { color: #ef4444; font-weight: 700; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .status-PAID    { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
  .status-ISSUED  { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
  .status-PARTIALLY_PAID { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .status-OVERDUE { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .status-ACTIVE  { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
  .status-COMPLETED { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
  .sig-area { margin-top: 2rem; display: flex; justify-content: space-between; gap: 2rem; }
  .sig-box { flex: 1; border-top: 1px solid #374151; padding-top: 8px; font-size: 10px; color: #6b7280; text-align: center; }
  .instructions-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.625rem 0.875rem; margin-top: 4px; font-size: 10px; color: #78350f; line-height: 1.5; }
  .doc-footer { margin-top: 2rem; border-top: 1px solid #e5e9f5; padding-top: 0.75rem; text-align: center; font-size: 9px; color: #9ca3af; }
  @media print { body { padding: 0.5rem 1rem; } @page { margin: 1cm; } }
`;

@Injectable({ providedIn: 'root' })
export class PdfService {

  printInvoice(invoice: InvoiceResponse, patient: PatientSnap, clinicName = 'Aster Clinic') {
    const win = window.open('', `Invoice-${invoice.invoiceNumber}`, 'width=860,height=960');
    if (!win) { alert('Please allow popups to download PDF.'); return; }
    win.document.write(this.invoiceHtml(invoice, patient, clinicName));
    win.document.close();
    win.addEventListener('load', () => { win.focus(); win.print(); });
  }

  printDischargeSummary(visit: any, patient: PatientSnap, vitals: any, diagnoses: any[], prescriptions: any[], doctor = '', clinicName = 'Aster Clinic') {
    const win = window.open('', `Discharge-${visit.id?.slice(0,8)}`, 'width=860,height=960');
    if (!win) { alert('Please allow popups to download PDF.'); return; }
    win.document.write(this.dischargeHtml(visit, patient, vitals, diagnoses, prescriptions, doctor, clinicName));
    win.document.close();
    win.addEventListener('load', () => { win.focus(); win.print(); });
  }

  printPrescription(rx: PrescriptionResponse, patient: PatientSnap, doctor = '', clinicName = 'Aster Clinic') {
    const win = window.open('', `Rx-${rx.prescriptionNumber}`, 'width=860,height=960');
    if (!win) { alert('Please allow popups to download PDF.'); return; }
    win.document.write(this.rxHtml(rx, patient, doctor, clinicName));
    win.document.close();
    win.addEventListener('load', () => { win.focus(); win.print(); });
  }

  // ─── Discharge Summary HTML ────────────────────────────────────────────────
  private dischargeHtml(visit: any, p: PatientSnap, vitals: any, diagnoses: any[], prescriptions: any[], doctor: string, clinic: string): string {
    const fmtDate = (s: string) => s ? new Date(s).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    const dxRows = diagnoses.map(d =>
      `<tr><td>${d.diagnosisType || '—'}</td><td><strong>${d.icdDescription || d.clinicalDescription || '—'}</strong></td><td><code style="font-size:10px">${d.icdCode || '—'}</code></td></tr>`
    ).join('') || '<tr><td colspan="3" style="color:#6b7280;text-align:center">No diagnoses recorded</td></tr>';

    const rxRows = prescriptions.flatMap((rx: any) =>
      (rx.items || []).map((item: any) =>
        `<tr><td><strong>${item.medicationNameSnapshot}</strong></td><td>${item.dosage}</td><td>${item.frequency?.replace(/_/g,' ')}</td><td>${item.durationDays ? item.durationDays + ' days' : '—'}</td><td style="font-size:10px">${item.instructions || '—'}</td></tr>`
      )
    ).join('') || '<tr><td colspan="5" style="color:#6b7280;text-align:center">No medications prescribed</td></tr>';

    const vRow = vitals ? `
      <div class="meta-box" style="margin-bottom:1rem">
        <h3>Vitals at Discharge</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem">
          ${vitals.bpSystolic ? `<div class="meta-row"><span class="meta-label">BP</span><span class="meta-value">${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg</span></div>` : ''}
          ${vitals.heartRate ? `<div class="meta-row"><span class="meta-label">HR</span><span class="meta-value">${vitals.heartRate} bpm</span></div>` : ''}
          ${vitals.temperature ? `<div class="meta-row"><span class="meta-label">Temp</span><span class="meta-value">${vitals.temperature} °C</span></div>` : ''}
          ${vitals.oxygenSaturation ? `<div class="meta-row"><span class="meta-label">O₂ Sat</span><span class="meta-value">${vitals.oxygenSaturation}%</span></div>` : ''}
          ${vitals.weightKg ? `<div class="meta-row"><span class="meta-label">Weight</span><span class="meta-value">${vitals.weightKg} kg</span></div>` : ''}
          ${vitals.bmi ? `<div class="meta-row"><span class="meta-label">BMI</span><span class="meta-value">${vitals.bmi}</span></div>` : ''}
        </div>
      </div>` : '';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Discharge Summary</title>
    <style>${BASE_CSS}</style></head><body>
    <div class="doc-header">
      <div class="clinic-brand">
        <div class="clinic-icon"><svg viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg></div>
        <div><div class="clinic-name">${clinic}</div><div class="clinic-sub">Discharge Summary</div></div>
      </div>
      <div class="doc-type"><h1>DISCHARGE</h1><div class="doc-num">SUMMARY</div></div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>Patient</h3>
        <div class="meta-row"><span class="meta-label">Name</span><span class="meta-value">${p.firstName} ${p.lastName}</span></div>
        <div class="meta-row"><span class="meta-label">MRN</span><span class="meta-value" style="font-family:monospace">${p.medicalRecordNumber}</span></div>
        ${p.dateOfBirth ? `<div class="meta-row"><span class="meta-label">DOB</span><span class="meta-value">${new Date(p.dateOfBirth).toLocaleDateString('en-US',{dateStyle:'medium'})}</span></div>` : ''}
      </div>
      <div class="meta-box">
        <h3>Visit Details</h3>
        <div class="meta-row"><span class="meta-label">Admitted</span><span class="meta-value">${fmtDate(visit.checkedInAt)}</span></div>
        <div class="meta-row"><span class="meta-label">Discharged</span><span class="meta-value">${fmtDate(visit.checkedOutAt)}</span></div>
        <div class="meta-row"><span class="meta-label">Physician</span><span class="meta-value">${doctor || '—'}</span></div>
        <div class="meta-row"><span class="meta-label">Visit Type</span><span class="meta-value">${visit.visitType?.replace(/_/g,' ')}</span></div>
      </div>
    </div>

    ${visit.chiefComplaint ? `<div class="meta-box" style="margin-bottom:1rem"><h3>Chief Complaint</h3><p style="font-size:12px;color:#374151;margin-top:4px">${visit.chiefComplaint}</p></div>` : ''}

    ${vRow}

    <h3 style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:.5rem">Diagnoses</h3>
    <table style="margin-bottom:1.25rem">
      <thead><tr><th>Type</th><th>Diagnosis</th><th>ICD-10</th></tr></thead>
      <tbody>${dxRows}</tbody>
    </table>

    <h3 style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:.5rem">Discharge Medications</h3>
    <table style="margin-bottom:1.25rem">
      <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
      <tbody>${rxRows}</tbody>
    </table>

    ${visit.clinicalNotes ? `<div class="meta-box" style="margin-bottom:1rem"><h3>Clinical Notes</h3><p style="font-size:11px;color:#374151;margin-top:4px;line-height:1.6">${visit.clinicalNotes}</p></div>` : ''}

    <div class="sig-area" style="margin-top:2.5rem">
      <div class="sig-box">${doctor || 'Attending Physician'}</div>
      <div class="sig-box">Date: ${new Date().toLocaleDateString('en-US',{dateStyle:'long'})}</div>
    </div>

    <div class="doc-footer">${clinic} · Generated on ${new Date().toLocaleString()} · This summary was prepared at time of discharge.</div>
    </body></html>`;
  }

  // ─── Invoice HTML ──────────────────────────────────────────────────────────
  private invoiceHtml(inv: InvoiceResponse, p: PatientSnap, clinic: string): string {
    const balance = (inv.totalAmount - inv.paidAmount);
    const fmt = (n: number) => n.toFixed(2);
    const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—';

    const rows = (inv.items ?? []).map((item: any) =>
      `<tr>
        <td>${item.description ?? '—'}</td>
        <td>${item.serviceType ?? ''}</td>
        <td style="text-align:right">${Number(item.quantity ?? 1).toFixed(0)}</td>
        <td style="text-align:right">${fmt(item.unitPrice ?? 0)}</td>
        <td style="text-align:right">${item.discountAmount > 0 ? fmt(item.discountAmount) : '—'}</td>
        <td>${fmt(item.totalPrice ?? 0)}</td>
      </tr>`
    ).join('');

    const payments = (inv.payments ?? []).map((pay: any) =>
      `<tr>
        <td>${fmtDate(pay.paidAt)}</td>
        <td>${pay.paymentMethod?.replace(/_/g,' ') ?? ''}</td>
        <td>${pay.paymentNumber ?? ''}</td>
        <td>${fmt(pay.amount ?? 0)}</td>
      </tr>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${inv.invoiceNumber}</title>
    <style>${BASE_CSS}</style></head><body>
    <div class="doc-header">
      <div class="clinic-brand">
        <div class="clinic-icon"><svg viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg></div>
        <div><div class="clinic-name">${clinic}</div><div class="clinic-sub">Medical Clinic Management</div></div>
      </div>
      <div class="doc-type">
        <h1>Invoice</h1>
        <div class="doc-num">${inv.invoiceNumber}</div>
        <div style="margin-top:6px"><span class="status-badge status-${inv.status}">${inv.status.replace(/_/g,' ')}</span></div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>Bill To</h3>
        <div class="meta-row"><span class="meta-label">Patient</span><span class="meta-value">${p.firstName} ${p.lastName}</span></div>
        <div class="meta-row"><span class="meta-label">MRN</span><span class="meta-value" style="font-family:monospace">${p.medicalRecordNumber}</span></div>
      </div>
      <div class="meta-box">
        <h3>Invoice Details</h3>
        <div class="meta-row"><span class="meta-label">Issued</span><span class="meta-value">${fmtDate(inv.createdAt)}</span></div>
        <div class="meta-row"><span class="meta-label">Due Date</span><span class="meta-value">${fmtDate(inv.dueDate)}</span></div>
      </div>
    </div>

    <table>
      <thead><tr><th>Description</th><th>Type</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Discount</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#6b7280">No line items</td></tr>'}</tbody>
    </table>

    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>${fmt(inv.subtotal ?? 0)}</span></div>
      ${(inv as any).discountAmount > 0 ? `<div class="total-row"><span>Discount</span><span>-${fmt((inv as any).discountAmount)}</span></div>` : ''}
      <div class="total-row grand"><span>Total</span><span>${fmt(inv.totalAmount)}</span></div>
      <div class="total-row paid"><span>Amount Paid</span><span>${fmt(inv.paidAmount)}</span></div>
      <div class="total-row balance"><span>Balance Due</span><span>${fmt(balance)}</span></div>
    </div>

    ${payments ? `<div style="margin-top:1.5rem">
      <h3 style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;margin-bottom:0.5rem">Payment History</h3>
      <table><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${payments}</tbody></table></div>` : ''}

    <div class="doc-footer">${clinic} · Generated on ${new Date().toLocaleString()} · This is a computer-generated document.</div>
    </body></html>`;
  }

  // ─── Prescription HTML ────────────────────────────────────────────────────
  private rxHtml(rx: PrescriptionResponse, p: PatientSnap, doctor: string, clinic: string): string {
    const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—';

    const rows = (rx.items ?? []).map(item =>
      `<tr>
        <td><strong>${item.medicationNameSnapshot}</strong></td>
        <td>${item.dosage}</td>
        <td>${item.frequency?.replace(/_/g,' ').toLowerCase() ?? '—'}</td>
        <td>${item.route?.replace(/_/g,' ').toLowerCase() ?? 'oral'}</td>
        <td>${item.durationDays ? item.durationDays + ' days' : '—'}</td>
        <td>${item.quantity ?? '—'}</td>
        <td class="instructions-cell">${item.instructions ?? '—'}</td>
      </tr>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Prescription ${rx.prescriptionNumber}</title>
    <style>${BASE_CSS}
    .rx-symbol { font-size: 28px; font-weight: 900; color: #3b82f6; font-style: italic; margin-right: 4px; }
    .instructions-cell { font-size: 10px; color: #6b7280; max-width: 160px; }
    </style></head><body>
    <div class="doc-header">
      <div class="clinic-brand">
        <div class="clinic-icon"><svg viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg></div>
        <div><div class="clinic-name">${clinic}</div><div class="clinic-sub">Medical Prescription</div></div>
      </div>
      <div class="doc-type">
        <h1><span class="rx-symbol">Rx</span></h1>
        <div class="doc-num">${rx.prescriptionNumber}</div>
        <div style="margin-top:6px"><span class="status-badge status-${rx.status}">${rx.status}</span></div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>Patient Information</h3>
        <div class="meta-row"><span class="meta-label">Name</span><span class="meta-value">${p.firstName} ${p.lastName}</span></div>
        <div class="meta-row"><span class="meta-label">MRN</span><span class="meta-value" style="font-family:monospace">${p.medicalRecordNumber}</span></div>
        ${p.dateOfBirth ? `<div class="meta-row"><span class="meta-label">DOB</span><span class="meta-value">${fmtDate(p.dateOfBirth)}</span></div>` : ''}
      </div>
      <div class="meta-box">
        <h3>Prescription Details</h3>
        <div class="meta-row"><span class="meta-label">Date Issued</span><span class="meta-value">${fmtDate(rx.createdAt)}</span></div>
        ${rx.validUntil ? `<div class="meta-row"><span class="meta-label">Valid Until</span><span class="meta-value">${fmtDate(rx.validUntil)}</span></div>` : ''}
        ${doctor ? `<div class="meta-row"><span class="meta-label">Prescriber</span><span class="meta-value">${doctor}</span></div>` : ''}
      </div>
    </div>

    <table>
      <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Route</th><th>Duration</th><th>Qty</th><th>Instructions</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#6b7280">No items</td></tr>'}</tbody>
    </table>

    ${rx.notes ? `<div class="instructions-box"><strong>Notes: </strong>${rx.notes}</div>` : ''}

    <div class="sig-area" style="margin-top:3rem">
      <div class="sig-box">${doctor || 'Prescribing Physician'}</div>
      <div class="sig-box">Date: ${fmtDate(rx.createdAt)}</div>
      <div class="sig-box">Pharmacist Signature</div>
    </div>

    <div class="doc-footer">${clinic} · Issued: ${fmtDate(rx.createdAt)} · This prescription is valid for the period stated above.</div>
    </body></html>`;
  }
}
