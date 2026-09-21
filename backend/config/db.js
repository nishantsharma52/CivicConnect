import mongoose from 'mongoose';
import dotenv from "dotenv";
import dns from "node:dns"; // 1. Yeh naya import add karo

// 2. Node.js ko Google ka DNS use karne ke liye force karo (SRV error bypass)
dns.setServers(["8.8.8.8", "8.8.4.4"]); 

dotenv.config();

const connectDB = async () => {
    // 3. Optional: Chai aur Code series mein Hitesh sir DB name alag se lagwate hain
    // Agar tumhare MONGO_URI ke end mein DB ka naam nahi hai, toh yahan add kar lena
   await mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("MongoDB connected successfully");
      
    }).catch((error) => {
        console.log("Connection Error:", error);
    });
};

export default connectDB