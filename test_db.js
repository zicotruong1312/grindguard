require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 Đang thử kết nối với MongoDB Atlas bằng URI trong .env ...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ KẾT NỐI MONGODB THÀNH CÔNG! MongoDB Atlas đã hoạt động tốt!');
    process.exit(0);
  } catch (err) {
    console.error('❌ LỖI KẾT NỐI MONGODB:');
    console.error(err.message);
    process.exit(1);
  }
}

testConnection();
