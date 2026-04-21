import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"AppCenar" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    
    console.log(`Correo enviado exitosamente a: ${to}`);
  } catch (error) {
    console.error("Error detallado de Nodemailer:", error);
    throw error;
  }
};