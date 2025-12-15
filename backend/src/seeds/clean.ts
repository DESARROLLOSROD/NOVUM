
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from './config/logger';

dotenv.config();

const cleanDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI no está definida');
        }

        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.collections();
        for (const collection of collections) {
            await collection.deleteMany({});
            console.log(`Cleared collection: ${collection.collectionName}`);
        }

        console.log('Database cleaned successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning DB:', error);
        process.exit(1);
    }
};

cleanDB();
