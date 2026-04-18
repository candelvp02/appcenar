import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Configuration from '../models/Configuration.js';
import CommerceType from '../models/CommerceType.js';

dotenv.config({ path: '.env.dev' });

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // admin by default
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      username: 'admin',
      email: 'admin@appcenar.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      firstName: 'Admin',
      lastName: 'Principal'
    });
    console.log('Admin creado: admin/admin123');
  }
  
  // config ITBIS by default
  const config = await Configuration.findOne();
  if (!config) {
    await Configuration.create({ itbis: 18 });
    console.log('ITBIS configurado en 18%');
  }
  
  // commerce types by default
  const types = await CommerceType.countDocuments();
  if (types === 0) {
    await CommerceType.create([
      { name: 'Restaurante', description: 'Comida rápida, gourmet, etc.', icon: '🍔' },
      { name: 'Supermercado', description: 'Abarrotes y víveres', icon: '🛒' },
      { name: 'Farmacia', description: 'Medicamentos y cuidado personal', icon: '💊' }
    ]);
    console.log('Tipos de comercio creados');
  }
  
  console.log('Seed completado');
  process.exit();
};

seed();