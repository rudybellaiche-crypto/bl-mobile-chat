/**
 * Bell & Lyons — ACORD 125 PDF Generator (WordPress-native, no Viktor dependency)
 * Uses pdf-lib to generate ACORD-style commercial insurance application PDFs
 * entirely in the browser. Posts the result to WordPress for emailing.
 *
 * Loaded by Code Snippet #21 on the commercial page.
 * CDN: https://cdn.jsdelivr.net/gh/rudybellaiche-crypto/bl-mobile-chat@main/bl-acord-generator.js
 */
(function(window) {
  'use strict';

  var AGENCY = {
    name: 'Bell & Lyons Insurance',
    address: '1666 79th Street Causeway, Ste 410',
    city: 'North Bay Village',
    state: 'FL',
    zip: '33141',
    phone: '954-998-3860',
    email: 'contact@bellandlyons.com',
    contact: 'Rudy Bellaiche'
  };

  var LOB_FORMS = {
    'General Liability': ['ACORD 125', 'ACORD 126'],
    'Workers Compensation': ['ACORD 125', 'ACORD 130'],
    'Property': ['ACORD 125', 'ACORD 140'],
    'Business Auto': ['ACORD 125', 'ACORD 127'],
    'BOP': ['ACORD 125', 'ACORD 126', 'ACORD 140'],
    'Commercial Umbrella': ['ACORD 125', 'ACORD 129'],
    'Inland Marine': ['ACORD 125'],
    'Crime': ['ACORD 125'],
    'Cyber Liability': ['ACORD 125']
  };

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return String(d.getMonth() + 1).padStart(2, '0') + '/' +
             String(d.getDate()).padStart(2, '0') + '/' +
             d.getFullYear();
    } catch(e) { return dateStr; }
  }

  function today() {
    var d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0') + '/' +
           String(d.getDate()).padStart(2, '0') + '/' +
           d.getFullYear();
  }

  function formatMoney(val) {
    if (!val) return 'N/A';
    var n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    if (isNaN(n)) return String(val);
    return '$' + n.toLocaleString();
  }

  // ── PDF Builder ──────────────────────────────────────────────────
  function PdfBuilder(doc, fontRegular, fontBold) {
    this.doc = doc;
    this.fontRegular = fontRegular;
    this.fontBold = fontBold;
    this.page = null;
    this.y = 0;
    this.pageNum = 0;
    this.margin = 50;
    this.pageWidth = 612;
    this.pageHeight = 792;
    this.contentWidth = this.pageWidth - 2 * this.margin;
  }

  PdfBuilder.prototype.newPage = function() {
    this.page = this.doc.addPage([this.pageWidth, this.pageHeight]);
    this.y = this.pageHeight - this.margin;
    this.pageNum++;
  };

  PdfBuilder.prototype.ensureSpace = function(needed) {
    if (this.y - needed < this.margin + 30) {
      this.drawFooter();
      this.newPage();
    }
  };

  PdfBuilder.prototype.drawHeader = function(title, subtitle) {
    var PDFLib = window.PDFLib;
    // Navy header bar
    this.page.drawRectangle({ x: 0, y: this.pageHeight - 80, width: this.pageWidth, height: 80, color: PDFLib.rgb(0.1, 0.15, 0.27) });
    // Gold accent
    this.page.drawRectangle({ x: 0, y: this.pageHeight - 84, width: this.pageWidth, height: 4, color: PDFLib.rgb(0.83, 0.66, 0.26) });
    // Title
    this.page.drawText(title, { x: this.margin, y: this.pageHeight - 40, size: 18, font: this.fontBold, color: PDFLib.rgb(1,1,1) });
    // Subtitle
    this.page.drawText(subtitle, { x: this.margin, y: this.pageHeight - 60, size: 10, font: this.fontRegular, color: PDFLib.rgb(0.8,0.8,0.8) });
    // Date
    this.page.drawText('Date: ' + today(), { x: this.pageWidth - this.margin - 100, y: this.pageHeight - 40, size: 10, font: this.fontRegular, color: PDFLib.rgb(0.83, 0.66, 0.26) });
    this.y = this.pageHeight - 100;
  };

  PdfBuilder.prototype.drawSectionHeader = function(title) {
    var PDFLib = window.PDFLib;
    this.ensureSpace(30);
    this.page.drawRectangle({ x: this.margin - 5, y: this.y - 16, width: this.contentWidth + 10, height: 22, color: PDFLib.rgb(0.1, 0.15, 0.27) });
    this.page.drawText(title, { x: this.margin + 5, y: this.y - 12, size: 11, font: this.fontBold, color: PDFLib.rgb(1,1,1) });
    this.y -= 30;
  };

  PdfBuilder.prototype.drawField = function(label, value) {
    var PDFLib = window.PDFLib;
    if (!value && value !== '0') return;
    this.ensureSpace(30);
    // Label
    this.page.drawText(label, { x: this.margin, y: this.y, size: 8, font: this.fontRegular, color: PDFLib.rgb(0.4,0.4,0.4) });
    // Value — wrap long text
    var words = String(value).split(' ');
    var line = '', lineY = this.y - 12;
    var maxW = this.contentWidth - 10;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      var w = this.fontBold.widthOfTextAtSize(test, 10);
      if (w > maxW && line) {
        this.page.drawText(line, { x: this.margin, y: lineY, size: 10, font: this.fontBold, color: PDFLib.rgb(0,0,0) });
        lineY -= 14;
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) {
      this.page.drawText(line, { x: this.margin, y: lineY, size: 10, font: this.fontBold, color: PDFLib.rgb(0,0,0) });
    }
    this.y = lineY - 16;
  };

  PdfBuilder.prototype.drawFieldRow = function(fields) {
    var PDFLib = window.PDFLib;
    this.ensureSpace(30);
    var colW = this.contentWidth / fields.length;
    var savedY = this.y;
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].value) continue;
      var x = this.margin + i * colW;
      this.page.drawText(fields[i].label, { x: x, y: savedY, size: 8, font: this.fontRegular, color: PDFLib.rgb(0.4,0.4,0.4) });
      this.page.drawText(String(fields[i].value), { x: x, y: savedY - 12, size: 10, font: this.fontBold, color: PDFLib.rgb(0,0,0) });
    }
    this.y = savedY - 28;
  };

  PdfBuilder.prototype.drawCheckboxRow = function(label, items) {
    var PDFLib = window.PDFLib;
    this.ensureSpace(20);
    this.page.drawText(label, { x: this.margin, y: this.y, size: 8, font: this.fontRegular, color: PDFLib.rgb(0.4,0.4,0.4) });
    this.y -= 14;
    var x = this.margin;
    for (var i = 0; i < items.length; i++) {
      var text = '[X] ' + items[i];
      var w = this.fontBold.widthOfTextAtSize(text, 10) + 15;
      if (x + w > this.pageWidth - this.margin) {
        x = this.margin;
        this.y -= 16;
        this.ensureSpace(20);
      }
      this.page.drawText(text, { x: x, y: this.y, size: 10, font: this.fontBold, color: PDFLib.rgb(0.1, 0.15, 0.27) });
      x += w;
    }
    this.y -= 20;
  };

  PdfBuilder.prototype.drawDivider = function() {
    var PDFLib = window.PDFLib;
    this.ensureSpace(10);
    this.page.drawLine({
      start: { x: this.margin, y: this.y },
      end: { x: this.pageWidth - this.margin, y: this.y },
      thickness: 0.5,
      color: PDFLib.rgb(0.85, 0.85, 0.85)
    });
    this.y -= 10;
  };

  PdfBuilder.prototype.drawInfoBox = function(text) {
    var PDFLib = window.PDFLib;
    this.ensureSpace(40);
    this.page.drawRectangle({
      x: this.margin, y: this.y - 25, width: this.contentWidth, height: 30,
      color: PDFLib.rgb(0.96, 0.97, 0.98),
      borderColor: PDFLib.rgb(0.1, 0.15, 0.27), borderWidth: 1
    });
    this.page.drawText(text, { x: this.margin + 10, y: this.y - 18, size: 9, font: this.fontRegular, color: PDFLib.rgb(0.1, 0.15, 0.27) });
    this.y -= 40;
  };

  PdfBuilder.prototype.drawFooter = function() {
    var PDFLib = window.PDFLib;
    var footerY = 30;
    this.page.drawLine({
      start: { x: this.margin, y: footerY + 10 },
      end: { x: this.pageWidth - this.margin, y: footerY + 10 },
      thickness: 0.5,
      color: PDFLib.rgb(0.83, 0.66, 0.26)
    });
    this.page.drawText(AGENCY.name + ' | ' + AGENCY.phone + ' | ' + AGENCY.email, {
      x: this.margin, y: footerY, size: 8, font: this.fontRegular, color: PDFLib.rgb(0.4,0.4,0.4)
    });
    this.page.drawText('Page ' + this.pageNum, {
      x: this.pageWidth - this.margin - 40, y: footerY, size: 8, font: this.fontRegular, color: PDFLib.rgb(0.4,0.4,0.4)
    });
  };

  // ── Main generation function ─────────────────────────────────────
  async function generateAcordPdf(sub) {
    var PDFLib = window.PDFLib;
    var doc = await PDFLib.PDFDocument.create();
    var fontRegular = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var fontBold = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    var b = new PdfBuilder(doc, fontRegular, fontBold);
    b.newPage();

    // Determine forms needed
    var allForms = {};
    var lobs = sub.linesOfBusiness || ['General Liability'];
    for (var i = 0; i < lobs.length; i++) {
      var forms = LOB_FORMS[lobs[i]] || ['ACORD 125'];
      for (var j = 0; j < forms.length; j++) allForms[forms[j]] = true;
    }
    var formsNeeded = Object.keys(allForms).sort().join(', ');

    // PAGE 1: HEADER + APPLICANT
    b.drawHeader('ACORD 125 — Commercial Insurance Application',
                  'Bell & Lyons Insurance | Quote Request | ' + formsNeeded);

    b.drawSectionHeader('PRODUCER INFORMATION');
    b.drawFieldRow([
      { label: 'Agency', value: AGENCY.name },
      { label: 'Contact', value: AGENCY.contact }
    ]);
    b.drawFieldRow([
      { label: 'Address', value: AGENCY.address + ', ' + AGENCY.city + ', ' + AGENCY.state + ' ' + AGENCY.zip },
      { label: 'Phone', value: AGENCY.phone }
    ]);

    b.drawDivider();

    b.drawSectionHeader('NAMED INSURED / APPLICANT');
    b.drawField('Business Name', sub.businessName || sub.business_name || '');
    if (sub.dba) b.drawField('DBA', sub.dba);

    b.drawFieldRow([
      { label: 'Contact Person', value: sub.contactName || sub.contact_name || '' },
      { label: 'Phone', value: sub.phone || '' }
    ]);
    b.drawFieldRow([
      { label: 'Email', value: sub.email || '' },
      { label: 'Website', value: sub.website || 'N/A' }
    ]);

    var addr = [sub.addressStreet || sub.address_street || '', sub.addressCity || sub.address_city || '', (sub.addressState || sub.address_state || '') + ' ' + (sub.addressZip || sub.address_zip || '')].filter(function(p){return p.trim();}).join(', ');
    b.drawField('Mailing Address', addr);

    b.drawFieldRow([
      { label: 'Entity Type', value: sub.entityType || sub.entity_type || '' },
      { label: 'FEIN', value: sub.fein || 'Not provided' }
    ]);

    if (sub.naicsCode || sub.naics_code) {
      b.drawFieldRow([
        { label: 'NAICS Code', value: sub.naicsCode || sub.naics_code || '' },
        { label: 'Nature of Business', value: sub.natureOfBusiness || sub.nature_of_business || '' }
      ]);
    }

    b.drawFooter();

    // PAGE 2: BUSINESS DETAILS
    b.drawSectionHeader('BUSINESS INFORMATION');
    b.drawField('Nature of Business', sub.natureOfBusiness || sub.nature_of_business || '');
    b.drawField('Description of Operations', sub.operationsDescription || sub.operations_description || sub.natureOfBusiness || sub.nature_of_business || '');
    b.drawFieldRow([
      { label: 'Date Business Started', value: sub.dateBusinessStarted ? formatDate(sub.dateBusinessStarted) : (sub.years_in_business ? sub.years_in_business + ' years' : '') },
      { label: 'Annual Revenue', value: formatMoney(sub.annualRevenue || sub.annual_revenue || sub.revenue) }
    ]);
    b.drawFieldRow([
      { label: 'Full-Time Employees', value: String(sub.fullTimeEmployees || sub.full_time_employees || sub.employees || '0') },
      { label: 'Part-Time Employees', value: String(sub.partTimeEmployees || sub.part_time_employees || '0') }
    ]);
    b.drawFieldRow([
      { label: 'Annual Payroll', value: formatMoney(sub.annualPayroll || sub.annual_payroll) },
      { label: 'Owner Date of Birth', value: sub.ownerDob || sub.owner_dob || 'Not provided' }
    ]);

    b.drawDivider();

    b.drawSectionHeader('PREMISES INFORMATION');
    var premAddr = [sub.premisesStreet || sub.addressStreet || sub.address_street || '', sub.premisesCity || sub.addressCity || sub.address_city || '', (sub.premisesState || sub.addressState || sub.address_state || '') + ' ' + (sub.premisesZip || sub.addressZip || sub.address_zip || '')].filter(function(p){return p.trim();}).join(', ');
    b.drawField('Location Address', premAddr);
    b.drawFieldRow([
      { label: 'Interest', value: sub.premisesOwnership || sub.premises_ownership || 'N/A' },
      { label: 'Square Footage', value: (sub.premisesSqFt || sub.premises_sqft) ? (sub.premisesSqFt || sub.premises_sqft) + ' sq ft' : 'N/A' }
    ]);

    b.drawDivider();

    // Coverage
    b.drawSectionHeader('COVERAGE REQUESTED');
    b.drawCheckboxRow('Lines of Business', lobs);
    b.drawFieldRow([
      { label: 'ACORD Forms Required', value: formsNeeded },
      { label: 'Desired Effective Date', value: formatDate(sub.desiredEffectiveDate || sub.desired_effective_date || '') }
    ]);

    try {
      var eff = new Date((sub.desiredEffectiveDate || sub.desired_effective_date) + 'T00:00:00');
      if (!isNaN(eff.getTime())) {
        var exp = new Date(eff);
        exp.setFullYear(exp.getFullYear() + 1);
        b.drawFieldRow([
          { label: 'Policy Status', value: 'Quote Request' },
          { label: 'Expiration Date', value: formatDate(exp.toISOString().split('T')[0]) }
        ]);
      }
    } catch(e) {}

    b.drawDivider();

    // Prior insurance
    b.drawSectionHeader('PRIOR INSURANCE');
    var priorCarrier = sub.priorCarrier || sub.prior_carrier || sub.prior_carrier_name || '';
    if (priorCarrier && priorCarrier.toLowerCase() !== 'none' && priorCarrier.toLowerCase() !== 'n/a') {
      b.drawFieldRow([
        { label: 'Prior Carrier', value: priorCarrier },
        { label: 'Policy Number', value: sub.priorPolicyNumber || sub.prior_policy_number || 'N/A' }
      ]);
      b.drawFieldRow([
        { label: 'Expiration Date', value: formatDate(sub.priorExpirationDate || sub.prior_policy_expiration || '') || 'N/A' },
        { label: 'Annual Premium', value: formatMoney(sub.priorPremium || sub.prior_premium) }
      ]);
    } else {
      b.drawField('Prior Coverage', 'No prior coverage reported');
    }

    b.drawDivider();

    // Claims
    b.drawSectionHeader('LOSS / CLAIMS HISTORY');
    var claimsVal = sub.claimsHistory || sub.claims_history || '';
    if (claimsVal && claimsVal.toLowerCase().indexOf('no') < 0 && claimsVal !== '') {
      b.drawField('Claims History', claimsVal);
      if (sub.claimsDescription) b.drawField('Description', sub.claimsDescription);
    } else if (sub.hasClaimsHistory && sub.claimsDescription) {
      b.drawField('Claims History', sub.claimsDescription);
    } else {
      b.drawInfoBox('[X] No prior losses or claims reported in the past 5 years');
    }

    b.drawDivider();

    // Signature
    b.drawSectionHeader('APPLICANT SIGNATURE');
    b.drawFieldRow([
      { label: 'Applicant Name', value: sub.contactName || sub.contact_name || '' },
      { label: 'Date', value: today() }
    ]);
    b.drawFieldRow([
      { label: 'Producer Representative', value: AGENCY.contact },
      { label: 'Agency', value: AGENCY.name }
    ]);

    b.drawFooter();

    return await doc.save();
  }

  // ── Public API ───────────────────────────────────────────────────
  /**
   * Generate ACORD PDF and email it via WordPress endpoint.
   * @param {Object} data - Submission data from Leo chatbot
   * @param {string} wpEmailUrl - WordPress REST endpoint for emailing
   * @returns {Promise<boolean>} - true if email sent successfully
   */
  async function generateAndEmailAcord(data, wpEmailUrl) {
    try {
      console.log('[BL-ACORD] Generating ACORD PDF...');
      var pdfBytes = await generateAcordPdf(data);
      console.log('[BL-ACORD] PDF generated, size:', pdfBytes.length);

      // Base64 encode
      var binary = '';
      for (var i = 0; i < pdfBytes.length; i++) {
        binary += String.fromCharCode(pdfBytes[i]);
      }
      var pdfBase64 = window.btoa(binary);

      var bizName = data.businessName || data.business_name || 'Unknown';
      var contactName = data.contactName || data.contact_name || 'Lead';
      var lobs = data.linesOfBusiness || ['General Liability'];

      var payload = {
        pdf: pdfBase64,
        filename: 'ACORD-125_' + bizName.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf',
        subject: 'ACORD Application — ' + bizName + ' (' + lobs.join(', ') + ')',
        business_name: bizName,
        contact_name: contactName,
        email: data.email || '',
        phone: data.phone || '',
        lines_of_business: lobs.join(', ')
      };

      console.log('[BL-ACORD] Sending to WordPress email endpoint...');
      var resp = await fetch(wpEmailUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      var result = await resp.json();
      console.log('[BL-ACORD] Email result:', result);
      return result.success === true;
    } catch(err) {
      console.error('[BL-ACORD] Error:', err);
      return false;
    }
  }

  // Expose globally
  window.BL_ACORD = {
    generate: generateAcordPdf,
    generateAndEmail: generateAndEmailAcord
  };

})(window);
