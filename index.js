module.exports = function (app) {
  var plugin = {};

  plugin.id = 'signalk-location-info';
  plugin.name = 'Location Info';
  plugin.description = 'Plugin for SignalK to lookup information like country, ocean, sea zones, etc. based on your current location.';

  var unsubscribes = [];

  plugin.start = function (options, restartPlugin) {
    // Here we put our plugin logic
    app.debug('Plugin started');
    
    let localSubscription = {
      context: 'self',
      subscribe: [{
        path: 'navigation.position', // Get all paths
        period: 5000 // Every 5000ms
      }]
    };
    
    app.subscriptionmanager.subscribe(
      localSubscription,
      unsubscribes,
      subscriptionError => {
        app.error('Error:' + subscriptionError);
      },
      delta => {
        delta.updates.forEach(u => {
          app.debug(u);
        });
      }
    );
  };

  plugin.stop = function () {
    // Here we put logic we need when the plugin stops
    app.debug('Plugin stopped');

    unsubscribes.forEach(f => f());
    unsubscribes = [];
  };

  plugin.schema = {
    // The plugin schema
  };

  return plugin;
};