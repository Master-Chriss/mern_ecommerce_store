import mongoose from "mongoose"


export const connectDB = async () => {
    try {
        const connector = await mongoose
            .connect(process.env.CLUSTER_CONNECTION_STRING || 'mongodb+srv://Master_Chriss:9YF1WF1H6H4gyNsF@cluster0.mwmydzt.mongodb.net/mern_e-commerce_store?retryWrites=true&w=majority');
            console.log(`Mongo DB Connected: ${connector.connection.host} `);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Code 1 means exit with failure, 0 means exit with success
    }
};
