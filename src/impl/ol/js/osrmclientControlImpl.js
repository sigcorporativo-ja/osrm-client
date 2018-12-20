import namespace from 'util/decorator';

@namespace("M.impl.control")
export class OSRMClientControlImpl extends M.impl.Control {
  /**
   * @classdesc
   * Main constructor of the OSRMClientControl.
   *
   * @constructor
   * @extends {M.impl.Control}
   * @api stable
   */
  constructor() {
    super();
  };
  // goog.inherits(M.impl.control.OSRMClientControl, M.impl.Control);

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    // specific code

    // super addTo
    super.addTo(map, html);
  };

  calculateRoute(points, version, options, url_, version_, srsOrigin, timeOut_) {
    let routePromise = {};
    routePromise.fn = this.getPointsOfRoute.bind(this, points, version, options, url_, version_, srsOrigin, timeOut_);
    routePromise.then = function(cb) {
      try {
        if (cb && typeof cb === 'function') {
          this.fn.bind(this, cb)();
        }
      } catch (ex) {
        M.dialog.error("error en la promesa: " + ex, "Error");
      }
    };
    return routePromise;
  };


  /**
   * Recieved two points and srs origin, transform this points to srs 4326, change your positions
   * (x => y and y => x) by proyection and make the request
   */
  getPointsOfRoute(points, version, options, url_, version_, srsOrigin, timeOut_, cb) {
    let pointsTransform = [];
    // for (var i = 0; i < points.length; i = i +1) {
    //   let pointAux = points[i];
    //   let pointTransform = new ol.geom.Point(ol.proj.transform([pointAux[0], pointAux[1]], srsOrigin, 'EPSG:4326'));
    //   pointsTransform.push(pointTransform);
    // }
    points.forEach(p => {
      let pointAux = p;
      let pointTransform = new ol.geom.Point(ol.proj.transform([pointAux[0], pointAux[1]], srsOrigin, 'EPSG:4326'));
      pointsTransform.push(pointTransform);
    });

    let waypoints4326 = [];

    // for (let j = 0; j < pointsTransform.length; j = j +1) {
    //   let pointsTransformAux = pointsTransform[j];
    //   let aux = {
    // 			x : pointsTransformAux.getCoordinates()[1],
    // 			y : pointsTransformAux.getCoordinates()[0]
    // 		};
    //   waypoints4326.push(aux);
    // }
    pointsTransform.forEach(pt => {
      let pointsTransformAux = pt;
      let x = pointsTransformAux.getCoordinates()[1],
        y = pointsTransformAux.getCoordinates()[0];
      let aux = {
        x,
        y
      };
      waypoints4326.push(aux);
    });

    const url = this.buildRouteURL(waypoints4326, version, version_, options, url_);

    let promesa = M.remote.get(url);
    const timeout = timeOut_;
    this.timeOut = setTimeout(function() { M.dialog.error("No se ha podido calcular la ruta en este momento, por favor, intentelo mas tarde.", "Error"); }, timeout);
    let decodeResponseBind = this.decodeResponse.bind(this);
    promesa.then(function(data) {
      clearTimeout(this.timeOut);
      const jsonResponse = JSON.parse(data.text);
      if (data.code != 200) {
        // M.dialog.error("error realizando la petición entre dos puntos: " + url, "Error");
        M.dialog.error(`error realizando la petición entre dos puntos: ${url}`, "Error");
      } else {
        let routeEncode = jsonResponse.routes;
        if (routeEncode && routeEncode.length === 0) {
          // M.dialog.error("No se han encontrado ruta entre los dos puntos" + url, "Error")
          M.dialog.error(`error realizando la petición entre dos puntos: ${url}`, "Error");
        } else {
          let route = decodeResponseBind(
            routeEncode[0].geometry, 5, srsOrigin);
          if (!route || (typeof route === 'object' && route.length && route.length === 0)) {
            M.dialog.error("No se ha podido calcular la ruta en este momento, por favor, intentelo mas tarde.", "Error");
          } else if (route && route.length && route.length > 0) {
            jsonResponse["routeDecodified"] = route;
            cb.call(this, jsonResponse);
            return false;
          }
        }
      }
      cb.call(this, []);
    }.bind(this));

    promesa.catch((error) => {
      clearTimeout(this.timeOut);
      // M.dialog.error("error realizando la petición entre dos puntos" + url, "Error");
      M.dialog.error(`error realizando la petición entre dos puntos ${url}`, "Error");
    });

  };

  /**
   * @param waypoints => array to waypoints
   * @param version default
   * @param version_ specific
   * @options options for build url
   * @options url_ service
   */
  buildRouteURL(waypoints, version, version_, options, url_) {

    //Valid params for build url to osrm
    let paramsValid = {
      "alternatives": ["true", "false"],
      "steps": ["true", "false"],
      "annotations": ["true", "false"],
      "geometries": ["polyline", "geojson"],
      "overview": ["simplified", "full", "false"],
      "continue_straight": ["default", "true", "false"]
    };

    //If not specific a version, getting the constructor version
    let v = "v1";
    if (version != undefined) {
      v = version;
    } else if (version_ != undefined) {
      v = version_;
    }

    //Service of driving routes
    // let serviceURL = url_ + v + "/driving/";
    let serviceURL = `${url_}${v}/driving/`;
    //Add points
    for (var i = 0; i < waypoints.length; i++) {
      let wp = waypoints[i];
      // serviceURL = serviceURL + wp.y + "," + wp.x;
      serviceURL = `${serviceURL}${wp.y},${wp.x}`;
      if (i + 1 < waypoints.length) {
        // serviceURL = serviceURL + ";"
        serviceURL = `${serviceURL};`;
      }
    }

    let messageError = "";

    //Iterate the params
    if (options != undefined) {
      for (let key in options) {
        let valueParam = options[key];
        let keyParam = key;

        if (paramsValid[keyParam] != undefined) {
          let values = paramsValid[keyParam];

          if (values.includes(valueParam)) {
            if (serviceURL.includes("?") == true) {
              // serviceURL = serviceURL + "&" + keyParam + "=" + valueParam;
              serviceURL = `${serviceURL}&${keyParam}=${valueParam}`;
            } else {
              // serviceURL = serviceURL + "?" + keyParam + "=" + valueParam;
              serviceURL = `${serviceURL}?${keyParam}=${valueParam}`;
            }
          } else {
            // messageError = messageError + keyParam + " - " + valueParam + " ";
            messageError = `${messageError} ${keyParam} - ${valueParam} `;
          }
        } else {
          // messageError = messageError + keyParam + " ";
          messageError = `${messageError} ${keyParam} `;
        }
      }
    }
    if (messageError != "") {
      M.dialog.error(`Los siguientes parametros o valores no son validos por lo que no se incluirán en la petición ${messageError}`, "Error");
    }
    return serviceURL;

  };

  /**
   * Create object for build url
   */
  locationKey(locationKey) {
    return `${locationKey.x},${locationKey.y}`;
  };

  /**
   * This function recieved a precision and string enconded, decrypting a string and transform
   * to correct proyection the result array.
   */
  decodeResponse(encoded, precision, srsOrigin) {

    let len = encoded.length,
      index = 0,
      lat = 0,
      lng = 0,
      array = [];

    precision = Math.pow(10, -precision);

    while (index < len) {
      let b, shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      // array.push( {lat: lat * precision, lng: lng * precision}
      // );
      array.push([lat * precision, lng * precision]);
    }
    //return array;
    let arrayProjectionOrigin = [];

    for (let a = 0; a < array.length; a = a + 1) {

      //Tenemos que cambiar posición de x e y
      let point = new ol.geom.Point(ol.proj.transform([array[a][1], array[a][0]], 'EPSG:4326', srsOrigin));
      let arrayAux = [point.getCoordinates()[0], point.getCoordinates()[1]];
      arrayProjectionOrigin.push(arrayAux);
    }
    return arrayProjectionOrigin;
  };
}
