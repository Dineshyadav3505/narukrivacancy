import dotenv from "dotenv"
import {connectDB} from "./config/db.config";
import {app} from "./app"

dotenv.config({
    path: "./.env"
});

connectDB()

.then (()=>{

    app.on("error", (error)  =>{
        console.log(error);
        throw error;
    });

    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running at PORT : ${process.env.PORT}`);
    } );
})
.catch((error)=>{
    console.log("MONGODB Connection failed :",error);
})
