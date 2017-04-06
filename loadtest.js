var path = require('path'), 
async = require('async'),
newman = require('newman');


// Set detauls
var maxload = 5;
var increment = 1;

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " <max load> <increment>");
    console.log("Where: 'max load' is max number of simulaneous requests and ");
    console.logI("'increment' specifies how fast to add the load from 1 to max load")
    process.exit(-1);
} else if (process.argv.length == 3) {
    maxload = parseInt(process.argv[2]);
 } else if (process.argv.length == 4) {
    maxload = parseInt(process.argv[2]); 
    increment = parseInt(process.argv[3]);
 }


runtest = function (numparallel, numseries, callback) {

    var options = {
        collection: path.join(__dirname, '3dtrans_collection.json'),
        iterationCount: numseries,
        environment: '3dtrans_env.json'
    },
    parallelCollectionRun = function (done) {
        newman.run(options, done).on('start', function(err, args) {
            console.log('running a collection...');
        });
    };

    var funccalls = [];
    for (var i=0;i<numparallel;i++) {
        funccalls.push(parallelCollectionRun);
    }

    async.parallel(funccalls,
    function (err, summary) {
        err && console.error(err);

        summary.forEach(function (result) {
            var failures = result.run.failures;
            var timings = result.run.timings;
            var stat = result.run.stats;
            var statsString = 'Parallel Requests: ' + numparallel + ' ';
            statsString += failures.length ? 'FAILED ' + JSON.stringify(failures.failures, null, 2) :
                        `${result.collection.name} ran successfully.`;
            statsString += ' ' + 'Average Time: ' + timings.responseAverage + ' ms';
            statsString += ' Requests: ' + stat.assertions.total;
            statsString += ' Failures: ' + stat.assertions.failed;
            console.info(statsString);
            
        });
        callback(null);
    })
}

var tests = []
for (var i=1; i<=maxload;i = i + increment) {
    console.info(`adding test for ${i} parallel tasks`);
    tests.push(createfunc(i));
}

function createfunc(i) {
    return function(cb) { runtest(i,2, cb)}
   
}

// Run set of tests
 async.series(tests);