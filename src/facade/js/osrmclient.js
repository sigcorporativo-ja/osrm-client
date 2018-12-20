import namespace from 'util/decorator';
import OSRMClientControl from './osrmclientControl.js';

@namespace("M.plugin")
class OSRMClient extends M.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {M.Plugin}
   * @param {Object} impl implementation object
   * @param {String} url of service osrm (default https://router.project-osrm.org/route/v1/driving/)
   * @param {String} version of service osrm (default v1)
   * @api stable
   */
  constructor(url, version) {
    super();
    this.map_ = null;
    if (url == undefined || url == "") {
      this.url_ = "https://router.project-osrm.org/route/";
    } else {
      this.url_ = url;
    }
    this.version_ = version;

  };
  // goog.inherits(M.plugin.OSRMClient, M.Plugin);

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api stable
   */
  route(points, version, options) {
    const timeout = 10000;
    let miControl = new M.control.OSRMClientControl();
    return miControl.calculateRoute(points, version, options, this.url_, this.version_, this.map_.getProjection().code, timeout);
  };

  addTo(map) {
    this.map_ = map;
    map.calculateRouteOsrm = this.route.bind(this);
  };
}
