import PDFDocument from 'pdfkit';

/**
 * Generate an authentic Indian Railways (IRCTC / CRIS) style e-Ticket PDF as a Buffer
 * @param {Object} booking 
 * @returns {Promise<Buffer>}
 */
export const generateTicketPdf = (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // 1. HEADER (Official Indian Railways & IRCTC Branding)
      doc.rect(36, 36, 523, 50).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text('INDIAN RAILWAYS / IRCTC e-TICKETING SERVICE', 46, 46, { align: 'center', width: 503 });
      doc.fontSize(9).font('Helvetica')
        .text('ELECTRONIC RESERVATION SLIP (ERS) - CONFIRMED TRAVEL AUTHORIZATION', 46, 68, { align: 'center', width: 503 });

      let y = 96;

      // 2. PNR & BOOKING SUMMARY BOX
      doc.rect(36, y, 523, 62).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
      
      doc.text('PNR NUMBER', 48, y + 10);
      doc.fillColor('#1d4ed8').fontSize(14).font('Helvetica-Bold')
        .text(booking.pnr || '1234567890', 48, y + 24);

      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10)
        .text('TRAIN NO. & NAME', 180, y + 10);
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica')
        .text(`${booking.trainNumber || ''} - ${booking.trainName || 'SF Express'}`, 180, y + 25);

      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10)
        .text('QUOTA', 440, y + 10);
      doc.fillColor('#047857').fontSize(11).font('Helvetica-Bold')
        .text(booking.quota || 'GN (GENERAL)', 440, y + 25);

      y += 72;

      // 3. JOURNEY & TIMING DETAILS
      doc.rect(36, y, 523, 76).fillAndStroke('#ffffff', '#cbd5e1');

      // Origin
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('FROM STATION', 48, y + 8);
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(booking.from || 'Origin', 48, y + 20);
      doc.fillColor('#2563eb').fontSize(9).font('Helvetica').text(`Dep: ${booking.departureTime || '10:00 AM'}`, 48, y + 36);
      doc.fillColor('#475569').fontSize(8).text(`Date: ${booking.date || 'Today'}`, 48, y + 50);

      // Arrow
      doc.fillColor('#94a3b8').fontSize(18).font('Helvetica-Bold').text('➔', 240, y + 22);

      // Destination
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('TO STATION', 340, y + 8);
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(booking.to || 'Destination', 340, y + 20);
      doc.fillColor('#047857').fontSize(9).font('Helvetica').text(`Arr: ${booking.arrivalTime || 'Next Day'}`, 340, y + 36);
      doc.fillColor('#475569').fontSize(8).text(`Class: ${booking.classType || booking.className || '3A'}`, 340, y + 50);

      // Platform & Distance
      doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('PLATFORM', 470, y + 8);
      doc.fillColor('#d97706').fontSize(12).font('Helvetica-Bold').text(booking.platform || 'PF 1', 470, y + 20);
      doc.fillColor('#475569').fontSize(8).font('Helvetica').text('Status: CNF', 470, y + 36);

      y += 86;

      // 4. PASSENGER DETAILS TABLE
      doc.rect(36, y, 523, 20).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('S.NO', 44, y + 6);
      doc.text('PASSENGER NAME', 80, y + 6);
      doc.text('AGE / GENDER', 240, y + 6);
      doc.text('BOOKING STATUS', 330, y + 6);
      doc.text('CURRENT COACH / BERTH', 430, y + 6);

      y += 20;

      doc.rect(36, y, 523, 30).fillAndStroke('#ffffff', '#e2e8f0');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica');
      doc.text('1.', 44, y + 10);
      doc.font('Helvetica-Bold').text(booking.passengerName || booking.passenger || 'Passenger', 80, y + 10);
      doc.font('Helvetica').text(`${booking.age || '28'} Yrs / ${booking.gender || 'M'}`, 240, y + 10);
      doc.fillColor('#047857').font('Helvetica-Bold').text(booking.status || 'CONFIRMED', 330, y + 10);
      doc.fillColor('#1d4ed8').text(`${booking.coach || 'B2'} - ${booking.seat || '23 (MB)'}`, 430, y + 10);

      y += 40;

      // 5. PAYMENT & FARE BREAKUP
      doc.rect(36, y, 523, 58).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('PAYMENT & FARE BREAKUP (OFFICIAL RAILONE R-WALLET)', 48, y + 8);
      
      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text(`Ticket Fare: Rs. ${(booking.fare || 0).toFixed(2)}`, 48, y + 24);
      doc.text('IRCTC Convenience Fee (Incl. GST): Rs. 0.00 (Waived for R-Wallet)', 48, y + 38);
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#047857');
      doc.text(`TOTAL AMOUNT PAID: Rs. ${(booking.fare || 0).toFixed(2)}`, 320, y + 24);
      doc.fontSize(8).fillColor('#1d4ed8')
        .text(`Payment Mode: ${booking.paymentMethod || 'R-WALLET (Official)'}`, 320, y + 38);

      y += 70;

      // 6. IMPORTANT INSTRUCTIONS
      doc.rect(36, y, 523, 110).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
        .text('IMPORTANT PASSENGER INSTRUCTIONS (INDIAN RAILWAYS RULES)', 48, y + 8);

      const rules = [
        '1. One of the passengers booked on an e-ticket must carry original valid Government ID proof (Aadhaar, Voter ID, Passport, Driving License, Student ID).',
        '2. Valid proof of travel includes this digital ERS slip or SMS along with original ID proof during ticket checking by TTE.',
        '3. Chart is normally prepared 4 hours prior to the scheduled departure of the train from train originating station.',
        '4. In case of train cancellation / delay by more than 3 hours, full refund will be credited directly to your R-Wallet.',
        '5. Contact Railway Helpline: 139 for 24x7 enquiry, security, catering or medical assistance on train.'
      ];

      let ry = y + 22;
      rules.forEach(r => {
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(r, 48, ry, { width: 499 });
        ry += 15;
      });

      y += 122;

      // 7. FOOTER BAR
      doc.rect(36, y, 523, 24).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica')
        .text('Centre for Railway Information Systems (CRIS) • RailOne Indian Railways Portal • Official E-Ticket', 46, y + 8, { align: 'center', width: 503 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
