import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'AppCenar <hola@appcenar.candelapereyra.site>', 
      to: [to], 
      subject: subject,
      html: html
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Correo enviado con éxito a:', to);
    return data;
  } catch (error) {
    console.error(' Error enviando email con Resend:', error);
    throw new Error(error.message);
  }
};