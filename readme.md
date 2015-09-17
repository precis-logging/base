#Precis-Base

This is a very flexible base framework for dynamic and plugable services and Web UI's.  It may
not be the fastest to render due to having to talk to the server so much to
get the components and pages, but it allows a great deal of configuration
and setup by only installing plugins and configuring them in the server code.

##Technology

Built using Babel, Hapi 8, Hapi-Swagger, React 0.13, Bootstrap 3.3, Reflux, and React-Router

##Installation

```
npm install
mkdir config
cp sample_config.js config/config.js
```

##Configuration

Look at sample_config.js to get an idea of what the configuration file for Precis-Base should look like.  It should give you a valid local only configuration starting point.

To use the sample_config.js create a config folder and move sample_config.js to config/config.js

###Bus

In the default configuration, and by default, MongoDB is used as a message bus to move data to the UI.  If you don't use Mongo, or don't want to use Mongo, or don't want to use a message bus, or simply have no reason to use a message bus to push data to the UI then you can remove the bus configuration and none will be loaded or utilized.

As an example when configured as a stand alone UI for Precis the the base is configured without a bus.  Instead it pulls data from the individual service providers.

Each service provider is an instance of Base configured with a Bus.  Then the service or services workers are plugged into this instance of Base.

##Usage

```
NODE_ENV=dev node server
```

With nodemon
```
NODE_ENV=dev nodemon server
```

With Debug Messages and nodemon
```
NODE_ENV=dev nodemon server -d
```

##Plugins

Plugins are used to extend the functionality available in the UI and/or the backend.  The sample plugin in plugins/test/index.js provides a sample of everything a plugin can do.

It modifies the UI by adding dashboard widgets, sections, new pages, stand alone pages, and events pushed to a server configured Reflux store.

Plugins are configured for use in the config.js file inside the plugins array.  Each plugin will get its configuration passed to it from this entry as well.  As config.js is a plain old javascript file it may be better to put each plugin entry into its own file with a module.exports statement and then simply require that configuration file into the main configuration file's plugins section.

No plugin will be loaded that is not configured.

##Tests

Testing is already setup to use Mocha using "npm test" as this is a base framework there are no tests provided with it by default.  Still need to setup UI testing.

##UI Skinning

The UI is built in React and the basic skin has been placed in the web/* folder.

Support libraries are in web/js/lib.

Main application source is in web/js/app.jsx.

Styles are defined in web/styles.

###Bower Components

The bower_components folder is automatically surfaced to the UI as /vendor.

See how React (or any other component) is loaded in the index.html file as an
example.

You can change this in the configuration or in the served.js if you don't like
it.

Most of the concepts in the UI are from this blog article https://nylas.com/blog/react-plugins the basic idea was converted from Coffeescript over to JSX and then updated/modified to work for this base project.  The origional source can be found at https://github.com/nylas/component-store-example

##API

API Documentation is provided by Hapi-Swagger as long as you define your plugin routes properly.  Take a look at the test plugin to see how to setup routes properly to support builtin documentation.  Documenation is provided via the /documentation route.

##TODO's

  * Need to setup integration between DataStore and API Routes
  * Better Documentation
  * Example of how to use 3rd party libraries like D3
