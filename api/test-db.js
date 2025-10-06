const mongoose = require('mongoose');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔍 Testing database connection in Vercel...');
        console.log('📡 MONGODB_URI set:', !!process.env.MONGODB_URI);
        console.log('📡 MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
        
        if (!process.env.MONGODB_URI) {
            return res.status(500).json({ 
                error: 'MONGODB_URI not set',
                env: Object.keys(process.env).filter(key => key.includes('MONGO'))
            });
        }

        // Test connection
        const uri = process.env.MONGODB_URI;
        console.log('🔗 Connecting to:', uri.substring(0, 50) + '...');
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            connectTimeoutMS: 10000,
        });
        
        console.log('✅ Database connected successfully!');
        console.log('📊 Connection state:', mongoose.connection.readyState);
        
        // Test a simple query
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📋 Collections found:', collections.length);
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
        
        res.status(200).json({
            success: true,
            message: 'Database connection successful',
            connectionState: mongoose.connection.readyState,
            collectionsCount: collections.length,
            collections: collections.map(c => c.name)
        });
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('🔍 Error details:', error);
        
        res.status(500).json({
            success: false,
            error: error.message,
            mongodbUriSet: !!process.env.MONGODB_URI,
            mongodbUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0
        });
    }
}
