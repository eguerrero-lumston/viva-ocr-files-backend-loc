var routes = require("ic-server").Router
var throttle = require("express-throttle");
var apiMiddleware = require("../Middlewares/apiMiddleware");
var cors = require('cors');

var DocController = new (require("../Controllers/DocumentController"))
var ReportsController = new (require("../Controllers/ReportController"))
var UserController = new (require("../Controllers/UserController"))
var bodyParser = require('body-parser');
routes.use(bodyParser.json({limit: '10mb', extended: true}))

routes.use(cors());
function setupCORS(req, res, next) {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type,Accept,X-Access-Token,X-Key');
    res.header('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
}
routes.all('/*', setupCORS);




// Login resource
routes.post("/api/auth",UserController.auth); // authenticate user with federated service

routes.group("/api",(router)=>{
    router.use(apiMiddleware); // token middleware
    
    // Document resources
    router.post('/docs',DocController.uploadDoc) // upload document to store in s3 
    router.get('/docs',throttle({ "burst": 5, "period": "1s" }),DocController.find) // get a list of docs stored 
    router.put('/docs',DocController.update) // update a manifest doc in database and moves to s3 folder 
    router.delete('/docs/:jobId',DocController.delete) // deletes a document given a jobId 
    router.get('/docs/pdf/clean',DocController.getCleanUrl) // get the file's signed url from clean bucket
    router.get('/docs/pdf/tmp',DocController.getTmpUrl) // get the file's signed url from temporary bucket
    router.get('/docs/analyze',DocController.analyze) // stores in db (¡deprecated!)
    //router.get('/docs/analyzed',DocController.analyzed) // just get info from database saved previously 
    router.get('/docs/filter',DocController.filter) // look for documents with specific filters params 
    router.get('/docs/filter/table',DocController.tableFilter) // look for documents with specific name and checkStatus 1, 2 or 3
    router.get('/docs/filter/suggestions',DocController.getFilterSuggestions) // Get suggestions for filter
    router.post('/docs/confirm',DocController.confirm) // confirm that the document is correct, and then moves to a new folder or an existent
    
    // Folder explorer resources
    router.get('/folders/(:arr?)*',DocController.files) // get the files and folders located in given url begining with /folders/  
    
    //Reports resources
    router.get('/reports',ReportsController.all)
    router.get('/reports/not-generated',ReportsController.notGenerated)

})