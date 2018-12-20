import namespace from 'util/decorator';
import OSRMClientControlImpl from 'impl/osrmclientControlImpl.js';

@namespace("M.control")
export class OSRMClientControl extends M.Control {

  /**
   * @classdesc
   * Main constructor of the class. Creates a OSRMClientControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */

  constructor() {
    if (M.utils.isUndefined(M.impl.control.OSRMClientControlImpl)) {
      M.exception('La implementación usada no puede crear controles OSRMClientControl');
    }

    let impl = new M.impl.control.OSRMClientControlImpl();

    super(impl, "OSRMClient");
  };
  // goog.inherits(M.control.OSRMClientControl, M.Control);


  /**
   * @classdesc
   *
   * @constructor
   * @param {Object} array of points
   * @param {String} version of osrm default
   * @param {Object} options to build url
   * @param {String} url service
   * @param {String} version of osrm
   * @param {String} srs origin of map
   * @api stable
   */
  calculateRoute(points, version, options, url_, version_, srsOrigin, timeOut_) {
    return this.getImpl().calculateRoute(points, version, options, url_, version_, srsOrigin, timeOut_);
  };
}
