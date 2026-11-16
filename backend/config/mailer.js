import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'zeeshandivanextechnologies@gmail.com',
    pass: process.env.SMTP_PASS || 'kdcaittadawaqjf'
  }
});

/**
 * Send OTP Verification Email
 */
export const sendOtpEmail = async (toEmail, otpCode, passengerName = 'Passenger') => {
  try {
    const mailOptions = {
      from: `"RailOne CRIS Official" <${process.env.SMTP_USER || 'zeeshandivanextechnologies@gmail.com'}>`,
      to: toEmail,
      subject: `RailOne Verification OTP: ${otpCode} (Indian Railways)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="background-color: #1e3a8a; color: #ffffff; display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 18px;">
              Rail<span style="color: #fbbf24;">One</span> Indian Railways
            </div>
          </div>
          <p style="font-size: 14px; color: #334155;">Namaste <strong>${passengerName}</strong>,</p>
          <p style="font-size: 14px; color: #334155;">Your verification code for RailOne passenger account is:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1e3a8a; background-color: #f1f5f9; padding: 10px 24px; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            This OTP is valid for 10 minutes. Do not share this code with anyone including Indian Railways or CRIS officials.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            Centre for Railway Information Systems (CRIS) • Government of India
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ OTP email sent successfully to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email via Nodemailer:', error.message);
    return false;
  }
};

/**
 * Send Confirmed Railway E-Ticket with attached PDF to passenger email
 */
export const sendTicketEmail = async (toEmail, booking, pdfBuffer) => {
  try {
    if (!toEmail) return false;

    const mailOptions = {
      from: `"Indian Railways - RailOne E-Ticketing" <${process.env.SMTP_USER || 'zeeshandivanextechnologies@gmail.com'}>`,
      to: toEmail,
      subject: `Booking Confirmed: PNR ${booking.pnr} - ${booking.trainNumber} ${booking.trainName} (Indian Railways)`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #fbbf24; font-weight: bold; margin-bottom: 4px;">
              IRCTC / Indian Railways Electronic Reservation Slip (ERS)
            </div>
            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
              Ticket Confirmed • PNR: <span style="color: #60a5fa;">${booking.pnr}</span>
            </div>
          </div>

          <p style="font-size: 15px; margin-bottom: 16px;">
            Dear <strong>${booking.passengerName || 'Passenger'}</strong>,
          </p>
          <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
            Thank you for booking with <strong>RailOne</strong>. Your train journey is confirmed. Please find your official Electronic Reservation Slip (PDF) attached to this email.
          </p>

          <!-- Journey Summary Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
              <div>
                <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; display: block;">Train</span>
                <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${booking.trainNumber} - ${booking.trainName}</span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; display: block;">Class / Quota</span>
                <span style="font-size: 13px; font-weight: 800; color: #2563eb;">${booking.classType || '3A'} (${booking.quota || 'GN'})</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <div style="font-size: 18px; font-weight: 900; color: #0f172a;">${booking.from}</div>
                <div style="font-size: 11px; color: #64748b; font-weight: 600;">Dep: ${booking.departureTime || '10:00 AM'}</div>
                <div style="font-size: 10px; color: #94a3b8;">${booking.date || 'Today'}</div>
              </div>
              <div style="font-size: 18px; color: #94a3b8; font-weight: bold;">➔</div>
              <div style="text-align: right;">
                <div style="font-size: 18px; font-weight: 900; color: #0f172a;">${booking.to}</div>
                <div style="font-size: 11px; color: #64748b; font-weight: 600;">Arr: ${booking.arrivalTime || 'Next Day'}</div>
                <div style="font-size: 10px; color: #d97706; font-weight: bold;">Platform: ${booking.platform || 'PF 1'}</div>
              </div>
            </div>

            <!-- Berth Details -->
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: bold; color: #065f46;">Coach & Berth Allocation:</span>
              <span style="font-size: 13px; font-weight: 900; color: #047857;">Coach ${booking.coach || 'B2'}, Seat ${booking.seat || '23 (MB)'} (CNF)</span>
            </div>
          </div>

          <!-- Fare Details -->
          <div style="border-top: 1px solid #f1f5f9; padding-top: 12px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 6px;">
              <span>Total Ticket Fare:</span>
              <strong style="color: #0f172a;">₹${parseFloat(booking.fare || 0).toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
              <span>Payment Mode:</span>
              <strong style="color: #2563eb;">${booking.paymentMethod || 'R-WALLET (Official)'}</strong>
            </div>
          </div>

          <!-- Instructions -->
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; font-size: 11px; color: #64748b; line-height: 1.5; margin-bottom: 20px;">
            <strong>Important Travel Rules:</strong><br/>
            • Carry original government-issued photo ID (Aadhaar, Voter ID, Passport, DL) during journey.<br/>
            • Showing this email or attached PDF ticket on mobile is fully valid for travel under Indian Railways rules.<br/>
            • In case of any assistance on train or station, dial <strong>139</strong> (24x7 Railway Helpline).
          </div>

          <div style="text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            Centre for Railway Information Systems (CRIS) • Government of India<br/>
            This is a system generated email confirmation for your Indian Railways booking.
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `RailOne_Ticket_${booking.pnr}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Ticket PDF email sent to ${toEmail} for PNR ${booking.pnr}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('❌ Error sending ticket PDF email:', err.message);
    return false;
  }
};

