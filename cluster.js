var cluster = require('cluster');
var os = require('os');

if(cluster.isMaster){
  var clusterSize = os.cpus().length;
  var i;
  for(i=0; i<clusterSize; i++){
    console.log('Starting worker: ', i);
    cluster.fork();
  }
  return cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });
}
require('./server');
