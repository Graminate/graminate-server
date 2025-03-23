import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { otpStore } from '@/stores/store';
const nodemailer = require('nodemailer');
const mjml2html = require('mjml');

@Injectable()
export class OtpService {
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateOtpEmailHTML(otp: string): string {
    try {
      const templatePath = path.resolve('src/templates/verifyEmail.mjml');

      if (!fs.existsSync(templatePath)) {
        console.error('Template file not found:', templatePath);
        return `<p>Your OTP is: <strong>${otp}</strong></p>`;
      }

      const mjmlTemplate = fs.readFileSync(templatePath, 'utf8');

      const otpFormatted = otp
        .split('')
        .map((digit) => `<span class="otp-digit">${digit}</span>`)
        .join('');

      const personalizedTemplate = mjmlTemplate.replace(
        '{{otpDigits}}',
        otpFormatted,
      );

      const htmlOutput = mjml2html(personalizedTemplate);

      return htmlOutput.html;
    } catch (error) {
      console.error('Error generating OTP email template:', error);
      return `<p>Your OTP is: <strong>${otp}</strong></p>`;
    }
  }

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendOtp(email: string) {
    if (!email || typeof email !== 'string') {
      return {
        status: 400,
        data: { error: 'Valid email is required' },
      };
    }

    try {
      const otp = this.generateOtp();
      otpStore[email] = otp;

      const emailHTML = this.generateOtpEmailHTML(otp);

      await this.transporter.sendMail({
        from: `"Graminate" <no-reply@graminate.com>`,
        to: email,
        subject: 'Verify your Email',
        html: emailHTML,
        text: `OTP for Email Verification: ${otp}`,
      });

      console.log('OTP sent to:', email);
      return {
        status: 200,
        data: { message: 'OTP sent successfully.' },
      };
    } catch (err) {
      console.error('Error sending OTP:', err);
      return {
        status: 500,
        data: { error: 'Something went wrong' },
      };
    }
  }

  async verifyOtp(email: string, otp: string) {
    if (!email || !otp) {
      return {
        status: 400,
        data: { success: false, message: 'Email and OTP are required' },
      };
    }

    if (otpStore[email] && otpStore[email] === otp) {
      delete otpStore[email];
      return {
        status: 200,
        data: { success: true, message: 'OTP verified successfully' },
      };
    } else {
      return {
        status: 400,
        data: { success: false, message: 'Invalid OTP' },
      };
    }
  }
}
