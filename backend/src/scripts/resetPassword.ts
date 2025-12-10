import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

const fixAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('Conectado a MongoDB');

        const User = mongoose.connection.collection('users');

        // Buscar todos los usuarios
        const users = await User.find({}).toArray();
        console.log('\n📋 Usuarios encontrados:', users.length);

        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role})`);
        });

        // Nueva contraseña
        const newPassword = 'Admin123!';
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar TODOS los usuarios con la misma contraseña para pruebas
        const result = await User.updateMany(
            {},
            { $set: { password: hashedPassword } }
        );

        console.log(`\n✅ ${result.modifiedCount} usuarios actualizados`);
        console.log('\n🔑 Ahora todos los usuarios tienen contraseña: Admin123!');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixAdminUser();
