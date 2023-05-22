const countryIso = require('country-iso');
const ci18n = require('i18n-iso-countries');

module.exports = function (app) {
  var plugin = {};

  plugin.id = 'signalk-location-info';
  plugin.name = 'Location Info';
  plugin.description = 'Look up various info based on location.  Country, territory, flag, etc.';

  var unsubscribes = [];

  plugin.start = function (options, restartPlugin) {
    // Here we put our plugin logic
    app.debug('Plugin started');
    
    //its all based on our current location
    let lookupPeriod = 5 * 60 * 1000;
    let localSubscription = {
      context: 'self',
      subscribe: [{
        path: 'navigation.position',
        minPeriod: lookupPeriod,
        policy: 'instant'
      }]
    };
    
    //code to handle the current location
    app.subscriptionmanager.subscribe(
      localSubscription,
      unsubscribes,
      subscriptionError => {
        app.error('Error:' + subscriptionError);
      },
      delta => {
        if ( delta.updates ) {
          delta.updates.forEach(update => {
            if ( update.values ) {
              update.values.forEach(vp => {
                //did we finally get a position?
                if ( vp.path === 'navigation.position' ) {
                  position = vp.value
                  
                  var my_updates = []
                  
                  //lookup our country codes
                  var country_codes = lookupCountryCodes(position)
                  app.debug(country_codes)
                  my_updates.push(country_codes)
                  
                  //this puts it into the SignalK tree
                  if (my_updates.length) {
                    app.debug(my_updates);
                    app.handleMessage(plugin.id, {
                      updates: [
                        {
                          values: my_updates
                        }
                      ]
                    })
                  }
                }
              })
            }
          })
        }
      }
    );
  };
  
  function lookupCountryCodes(position) {

    var isocodes = countryIso.get(position.latitude, position.longitude);
    //app.debug(isocodes)

    var countries = [];
    isocodes.forEach(iso3 => {
      var cname = ci18n.getName(iso3, 'en')
      var iso2 = ci18n.alpha3ToAlpha2(iso3)
      
      countries.push({
        name: cname,
        iso3: iso3,
        iso2: iso2
      })
    })
    app.debug(countries)

    return {
      path: 'navigation.country',
      value: countries
    }
  }

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