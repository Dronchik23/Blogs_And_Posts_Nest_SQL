import nodemailer from 'nodemailer';

export const emailAdapter = {
  async sendEmail(email: string, subject: string, message: string) {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bonjorim@gmail.com',
        pass: 'nronmxaommldkjpc',
      },
    });
    return await transport.sendMail({
      from: 'Drone <bonjorim@gmail.com>',
      to: email,
      subject: subject,
      html: message,
    });
  },
};
