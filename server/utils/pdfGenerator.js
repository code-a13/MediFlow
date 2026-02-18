const PDFDocument = require('pdfkit');
const moment = require('moment');

exports.generatePrescriptionPDF = (patient, prescription) => {
  return new Promise((resolve, reject) => {
    try {
      // 1. Setup Document
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50, 
        bufferPages: true,
        autoFirstPage: false 
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.addPage();

      // --- THEME CONSTANTS ---
      const COLORS = {
        primary: '#0F172A',    // Dark Slate (Text)
        accent: '#2563EB',     // Royal Blue (Headers)
        tableHeader: '#F1F5F9',// Light Gray
        border: '#E2E8F0',     // Border Gray
        zebra: '#F8FAFC'       // Zebra Stripe
      };

      const FONTS = {
        bold: 'Helvetica-Bold',
        regular: 'Helvetica',
        italic: 'Helvetica-Oblique'
      };

      // --- HELPER FUNCTIONS ---
      
      const drawHeader = () => {
        // Logo Placeholder
        doc.circle(70, 70, 20).fill(COLORS.accent);
        doc.fillColor('white').fontSize(16).font(FONTS.bold).text('+', 63, 64);
        
        // Clinic Name
        doc.fillColor(COLORS.primary).fontSize(20).font(FONTS.bold)
           .text('CITY HEALTH CLINIC', 100, 55);
        
        doc.fontSize(10).font(FONTS.regular).fillColor('#64748B')
           .text('Excellence in Compassionate Care', 100, 80);

        // Doctor Details (Right Aligned)
        doc.fontSize(10).fillColor(COLORS.primary).font(FONTS.bold)
           .text('Dr. S. Kavin', 400, 55, { align: 'right' });
        doc.font(FONTS.regular).text('MBBS, MD (Cardiology)', 400, 70, { align: 'right' });
        doc.text('Reg: 123456 | +91 98765 43210', 400, 85, { align: 'right' });

        // Divider
        doc.moveTo(50, 105).lineTo(545, 105).strokeColor(COLORS.accent).lineWidth(2).stroke();
      };

      const drawFooter = () => {
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          
          // Footer Line
          doc.moveTo(50, 780).lineTo(545, 780).strokeColor(COLORS.border).lineWidth(1).stroke();
          
          // Disclaimer
          doc.fontSize(8).fillColor('#94A3B8').font(FONTS.italic)
             .text('This is a digitally generated prescription and is valid without a physical signature.', 50, 790, { align: 'center' });
          
          // Page Number
          doc.fontSize(9).fillColor(COLORS.primary).font(FONTS.regular)
             .text(`Page ${i + 1} of ${range.count}`, 500, 790, { align: 'right' });
        }
      };

      // --- 2. BUILD CONTENT ---

      drawHeader();

      let y = 130; // Start Y position

      // A. Patient Demographics (Grid Layout)
      doc.rect(50, y, 495, 75).fill('#F8FAFC').stroke(COLORS.border);
      doc.fillColor(COLORS.primary);

      // Row 1
      doc.font(FONTS.bold).fontSize(10).text('PATIENT NAME:', 65, y + 15);
      doc.font(FONTS.regular).text(`${patient.firstName} ${patient.lastName}`, 160, y + 15);

      doc.font(FONTS.bold).text('DATE:', 350, y + 15);
      doc.font(FONTS.regular).text(moment(prescription.visitDate).format('DD MMM, YYYY'), 400, y + 15);

      // Row 2
      doc.font(FONTS.bold).text('AGE / GENDER:', 65, y + 35);
      const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
      doc.font(FONTS.regular).text(`${age} Years / ${patient.gender}`, 160, y + 35);

      doc.font(FONTS.bold).text('PATIENT ID:', 350, y + 35);
      doc.font(FONTS.regular).text(patient._id.toString().slice(-6).toUpperCase(), 400, y + 35);

      // Row 3
      doc.font(FONTS.bold).text('ADDRESS:', 65, y + 55);
      doc.font(FONTS.regular).text(patient.address || 'N/A', 160, y + 55, { width: 300, lineBreak: false, ellipsis: true });

      y += 95;

      // B. Vitals & Diagnosis Section
      doc.font(FONTS.bold).fontSize(12).fillColor(COLORS.accent).text('CLINICAL FINDINGS', 50, y);
      y += 20;

      // Vitals Strip
      const v = prescription.vitals || {};
      const vitals = [
        `BP: ${v.bloodPressure || '--'}`,
        `Pulse: ${v.pulse || '--'}`,
        `Temp: ${v.temperature || '--'}`,
        `Weight: ${v.weight || '--'}`,
        `SpO2: ${v.spo2 || '--'}`
      ].join('   |   ');

      doc.fontSize(10).font(FONTS.regular).fillColor(COLORS.primary).text(vitals, 50, y);
      y += 25;

      // Diagnosis
      doc.font(FONTS.bold).text('Diagnosis:', 50, y);
      doc.font(FONTS.regular).text(prescription.diagnosis, 120, y);
      y += 20;

      // Symptoms
      if (prescription.chiefComplaints && prescription.chiefComplaints.length > 0) {
        doc.font(FONTS.bold).text('Symptoms:', 50, y);
        doc.font(FONTS.regular).text(prescription.chiefComplaints.join(', '), 120, y);
        y += 30; // Extra spacing before table
      } else {
        y += 10;
      }

      y += 10;

      // --- C. MEDICINE TABLE (The Complex Part) ---
      
      const drawTableHeader = (topY) => {
        doc.rect(50, topY, 495, 25).fill(COLORS.accent);
        doc.fillColor('white').font(FONTS.bold).fontSize(9);
        doc.text('#', 60, topY + 8);
        doc.text('MEDICINE NAME', 90, topY + 8);
        doc.text('DOSAGE', 280, topY + 8);
        doc.text('FREQUENCY', 370, topY + 8);
        doc.text('DURATION', 460, topY + 8);
      };

      drawTableHeader(y);
      y += 25;

      // Loop Meds
      doc.fillColor(COLORS.primary).font(FONTS.regular).fontSize(10);
      
      prescription.medications.forEach((med, i) => {
        // 1. Check if page is full (leaving space for footer)
        if (y > 700) {
          doc.addPage();
          drawHeader(); // Redraw header on new page
          y = 130;      // Reset Y
          drawTableHeader(y); // Redraw table header
          y += 25;
        }

        // 2. Draw Row Background (Zebra)
        if (i % 2 === 0) {
          doc.rect(50, y, 495, 25).fill(COLORS.zebra);
        }

        // 3. Draw Text
        doc.fillColor(COLORS.primary);
        
        // Index
        doc.text(i + 1, 60, y + 8);
        
        // Name (Handle long names)
        doc.text(med.name, 90, y + 8, { width: 180, lineBreak: false, ellipsis: true });
        
        // Dosage
        doc.text(med.dosage, 280, y + 8);
        
        // Frequency (Boxed Style)
        doc.save();
        doc.roundedRect(368, y + 6, 60, 14, 2).stroke(COLORS.border);
        doc.text(med.frequency || med.freq, 370, y + 9, { width: 56, align: 'center' });
        doc.restore();

        // Duration
        doc.text(med.duration || med.dur, 460, y + 8);

        // Optional: Instruction text below name if exists
        if (med.instruction) {
             doc.fontSize(8).fillColor('#64748B')
                .text(`Note: ${med.instruction}`, 90, y + 20);
        }

        y += 30; // Row Height
      });

      // --- D. ADVICE & SIGNATURE ---
      
      // Check space again
      if (y > 650) {
        doc.addPage();
        drawHeader();
        y = 130;
      }

      y += 30;
      doc.rect(50, y, 495, 80).stroke(COLORS.border);
      doc.fontSize(10).font(FONTS.bold).fillColor(COLORS.primary)
         .text('ADVICE / INSTRUCTIONS:', 60, y + 10);
      doc.font(FONTS.regular).text(prescription.advice || 'Drink plenty of water. Take rest.', 60, y + 30);

      // Signature Area
      y += 100;
      doc.text('Dr. S. Kavin', 400, y, { align: 'right' });
      doc.moveTo(400, y - 5).lineTo(545, y - 5).strokeColor(COLORS.primary).lineWidth(1).stroke();
      doc.fontSize(8).text('(Signature)', 400, y + 5, { align: 'right' });

      // Apply Footer to all pages
      drawFooter();

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};