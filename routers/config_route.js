const convertR = require("./convertJsonToFfmpegCommand");
const convertUR = require("./convertJsonToFfmpegCommandUpload");
const generateR=require("./generateFfmpegCommandForClient");
const statusR = require("./status");
const convertTR = require("./convertToRealJson");


exports.routesInit=(app)=>{

app.use("/", convertR);
app.use("/", convertUR);
app.use("/", statusR);
app.use("/",generateR);
app.use("/",convertTR);
}

