console.log("express app is ready to lunch");

const express=require("express");//import express module
const http=require("http");//import http for server running
const path=require("path");
const{routesInit}=require("./routers/config_route")
const app=express();//server definition
const fs = require('fs');
const PORT=process.env.PORT||"3000";
app.use(express.json());
routesInit(app);
app.use(express.static(path.join(__dirname,"public")));
const server=http.createServer(app);//create http server
server.listen(PORT);
