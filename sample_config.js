module.exports = {
  default: {
    web: {
      port: 8080
    },
    store: {
      module: 'prodio-memory-store',
    },
    bus: {
      // bus module to load
      module: './plugins/bus',
      // connect to the local mongo host
      connectionString: 'mongodb://localhost:27017/local?replicaSet=1',
      // use the logging database logs collection
      ns: 'logging.logs',
      // You can set a startTime (1 will pull everything ever)
      // otherwise only records from the service start time will
      // be processed
      //startTime: 1,
    },
    plugins: [
      {
        // Set a module name to have the module npm installed
        // and used for you
        //module: 'precis-aggregator',

        // Or set a local location for the handlers to use
        location: './plugins/test',
        // Configuration for the module is held in the config
        // member
        config: {
          msgPrefix: 'First Record:'
        }
      },
    ],
  },
  // You can name configuration's whatever you want
  // there are built in alias for
  //   stg->stage
  //   prd->production
  //   dev->development
  // The configuration section is pulled from the NODE_ENV
  // environment variable
  release: {
  },
  development: {
  },
  stage: {
    store: {
      // Use a mongo store in the stage environment
      module: 'prodio-mongo-store',
      // Setup the connection string and pass in user credentials
      // Data should be stored in the logging-data database
      connectionString: 'mongodb://worker:Password1@stageurl.com:27017/logging-data',
    },
    bus: {
      // Using the admin superuser account to connect to the oplog
      connectionString: 'mongodb://superuser:Password1234@stageurl.com:27017/admin',
    },
  },
  production: {
    store: {
      // Use a mongo store in the stage environment
      module: 'prodio-mongo-store',
      // Setup the connection string and pass in user credentials
      // Data should be stored in the logging-data database
      // Note: Prod's logging url and oplog url are different
      connectionString: 'mongodb://worker:Password1@prodlogging.com:27017/logging-data',
    },
    bus: {
      // Using the admin superuser account to connect to the oplog
      connectionString: 'mongodb://superuser:Password1234@prodreplication.com:27017/admin',
    },
  }
};
