

// CreateMap helpers
var w3Settings = {
    pushpinIcon:'img/pin_55light.png',
    pushpinIconHighlighted: 'img/pin_55light_h.png',
    pushpinIconClick: 'img/pin_55light_s.png',
    clusterTitle: 'Various Events',
    hereIcon: '/img/YouAreHereBC.png'
};

var pushpinStatus = {
    icon: w3Settings.pushpinIcon,
    opacity: 1.0,
    pushpinOutsideRange: "w3pushpinOutsideRange",
    pushpinInRange: "w3pushpinInRange"

    // other properties can be added here, ex. size, color, ....
};


function w3Theme(myMap) {
    
    var _htmlHostElement,
    _eventsList,
    _map,
    _clusterLayer,
    _infoboxLayer,
    _pinInfobox=null,
    _latLongList,
    _initCompleted = false,
    _currentNW,
    _currentSE,
    _dateRange = { min: null, max: null };


    function _init(myMap) {

        _htmlHostElement = myMap;


        Microsoft.Maps.registerModule("PointBasedClusteringModule", "js/PointBasedClustering.js");
        Microsoft.Maps.loadModule("PointBasedClusteringModule", { callback: function () {
            console.log("clustering loaded");
        } });
        Microsoft.Maps.registerModule("CustomInfoboxModule", "js/V7CustomInfobox.min.js");
        Microsoft.Maps.loadModule("CustomInfoboxModule", {
            callback: function () {
                console.log("custom InfoBox module loaded");}});

        // add custom property
        Microsoft.Maps.Pushpin.prototype.data = null;

        console.log('map created');
    };


    function _mapViewChanged(e) {
        // need to check if the View areas is changed and reload events
        // nothing to do if user just zoomed in 
        // it is a bigger areas, here need to query the server if
        // NW.latitude > current NW.Latitude
        // NW.Longitude < current NW.longitude
        // NE.latitude < current SE.latitude
        // NE.longitude > current SE.longitude
       
        if (_initCompleted) {
            if (_pinInfobox === null) {
                _pinInfobox = new Microsoft.Maps.Infobox(_map.getCenter(),
                                        {
                                            title: '',
                                            description: '',
                                            typeName: Microsoft.Maps.InfoboxType.expanded,
                                            zIndex: 0,
                                            visible: false
                                        });

                _infoboxLayer.push(_pinInfobox);
            } else
                _pinInfobox.setOptions({ visible: false });

            var NW = _map.getTargetBounds().getNorthwest();
            var SE = _map.getTargetBounds().getSoutheast();

            if (NW.latitude > _currentNW.latitude ||
                NW.longitude < _currentNW.longitude ||
                SE.latitude < _currentSE.latitude ||
                SE.longitude > _currentSE.longitude) {
                _loadW3Events();

            }
           
        }

    };

    function _pushpinMouseover(e) {
        if (e.targetType == 'pushpin') {
            e.target.setOptions({ icon: w3Settings.pushpinIconHighlighted });

            var title = null;
            if (e.target.type === "pushpinCluster")
                title = w3Settings.clusterTitle;
            else {
                title = (e.target.data.w3event.getDetails().location_name == "" ? "Event" : e.target.data.w3event.getDetails().location_name);
                title += " - " + new Date(e.target.data.w3event.getDetails().time.time[0]).toDateString();
            }
                _pinInfobox.setOptions({
                title: title,
                typeName: Microsoft.Maps.InfoboxType.mini,
                visible: true,
                showPointer: false,
                zindex: 0,
                offset: new Microsoft.Maps.Point(0, 0),
                showCloseButton: false
            });
            _pinInfobox.setLocation(e.target.getLocation());
            console.log(e.target.getLocation().latitude, "-", e.target.getLocation().longitude, " ", _pinInfobox.getLocation().latitude, "-", _pinInfobox.getLocation().longitude);
        }
   };

    function _pushpinMouseout(e) {
        if (e.targetType == 'pushpin') {
              e.target.setOptions({ icon: w3Settings.pushpinIcon });
          }
    };

    function _pushpinMouseclick(e) {
        if (e.targetType == 'pushpin') {
            var title = null,
                description = null,
                offset = null;
                
            if (e.target.type === "pushpinCluster") {
                title = w3Settings.clusterTitle;
                var data = _clusterLayer.GetData();
                for (i = 0; i < e.target.data.dataIndices.length ; i++)
                    description += '<span><b>' + data[e.target.data.dataIndices[i]].w3event.getDetails().location_name + '</b><br/>' + data[e.target.data.dataIndices[i]].w3event.getDetails().text + '</span><br/><br/>';
                offset = new Microsoft.Maps.Point(0, 130);

            } else {
                title = (e.target.data.w3event.getDetails().location_name == "" ? "Event" : e.target.data.w3event.getDetails().location_name);
                description = e.target.data.w3event.getDetails().text;
                offset = new Microsoft.Maps.Point(0, 47);
            }
            _pinInfobox.setOptions({
                title: title,
                description: description,
                typeName: Microsoft.Maps.InfoboxType.expanded,
                visible: true,
                offset: offset,
                icon: w3Settings.pushpinIconClick,
                showPointer: true,
                zindex:0,
                showCloseButton: true
            });
        }
    };



    function _createPushpin(id, latitude, longitude, pushpinType, text) {


        var pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(latitude, longitude), {
            id: id,
            draggable: false,
            visible: true,
            text: text,
            icon: w3Settings.pushpinIcon,
            typeName: 'w3pushpin'
        });

        pushpin.type = pushpinType;
        _bindPushpinEvents(pushpin);

        return pushpin;

    };
    function _pushpinUpdate(e) {

        _pushpinUpdateUI( e.target, e.dateMin, e.dateMax);
    };

    /*
    function to customize the pushpin visualization based on the date range
    selected by the user
    */
    /*
    Main function to define how the pushpin should look like.
    */
    function _pushpinUpdateUI(pushpin, dateMin, dateMax) {

        pushpin.setOptions({ typeName: pushpin._typeName + " " + _updatePushpinOpacity(pushpin, dateMin, dateMax) });
    };

    function _updatePushpinOpacity(pushpin, dateMin, dateMax) {
   
        var retValue = "";
        if (dateMin != null && dateMax != null) {
            if (pushpin.type != "pushpinCluster") {

                if (pushpin.data.w3event.getDetails().time.time[0] < dateMin.getTime() ||
                    pushpin.data.w3event.getDetails().time.time[0] > dateMax.getTime()) {
                    retValue = pushpinStatus.pushpinOutsideRange;
                }
            }
            else {
                // for cluster pushpin:
                // all pushpin in the cluster outside the range => outside range
                // if there is at least one in Range => In Range
                var data = _clusterLayer.GetData();
                var inRange = false;
                for (i = 0; i < pushpin.data.dataIndices.length ; i++) {
                    if(data[pushpin.data.dataIndices[i]].w3event.getDetails().time.time[0] >= dateMin.getTime() &&
                        data[pushpin.data.dataIndices[i]].w3event.getDetails().time.time[0] <= dateMax.getTime()) {
                        inRange = true;
                        break;
                    }
                }
                    if (inRange)
                        retValue = pushpinStatus.pushpinInRange;
                    else
                        retValue = pushpinStatus.pushpinOutsideRange;
                }
            }
        return retValue;
    };

    function _updatePushpinSize(pushpin, dateMin, datemax) {

    };

    // ********************************************************************


    function _processW3Events(eList) {

        var initEvent = function (e) {
            var event = new w3Event();
            event.init(e);

            _eventsList = new Array();
            _eventsList.push(event);
            _latLongList.push({
                name: e.id,
                longitude: e.location.coordinates[0],
                latitude: e.location.coordinates[1],
                w3event: event
            });
        };
        _latLongList = new Array();
        eList.forEach(initEvent);
        _clusterLayer.SetData(_latLongList);
    };

    function _loadW3Events() {

        var NW = _map.getTargetBounds().getNorthwest();
        var SE = _map.getTargetBounds().getSoutheast();
        _currentNW = NW;
        _currentSE = SE;
        var w3map = this.processW3Events;

        var query = {
            geometry: {
                type: 'Polygon',
                coordinates: [[[NW.longitude, SE.latitude], [SE.longitude, SE.latitude], [SE.longitude, NW.latitude],
                    [NW.longitude, NW.latitude], [NW.longitude, SE.latitude]]]
            },
            // TODO: set the right time window
            time: {
                type: 'Period',
                time: [new Date('01/01/2013').getTime(), new Date('12/31/2013').getTime()]
            }
        };

        $.ajax({
            url: 'http://w3.surla.mobi/api/v1/query?apiKey=gow3go',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(query),
            timeout: 30000
        }).done(function (data, status, xhr) {
            // add new results to the map 

            _processW3Events(data);

        }).fail(function (xhr, status, error) {
            alert('cannot query server' + status + error);
        });
    };

    function _getPushpins() {
        var retValue = new Array();
        var layer = _clusterLayer.GetLayer();
        var len = layer.getLength();

        for (i = 0; i < len; i++)
            if (layer.get(i).type == "pushpin" || layer.get(i).type == "pushpinCluster")
                retValue.push(layer.get(i));

        return retValue;
    };

    function _bindPushpinEvents(pushpin) {

        Microsoft.Maps.Events.addHandler(pushpin, 'mouseover', _pushpinMouseover);
        Microsoft.Maps.Events.addHandler(pushpin, 'mouseout', _pushpinMouseout);
        Microsoft.Maps.Events.addHandler(pushpin, 'click', _pushpinMouseclick);
        Microsoft.Maps.Events.addHandler(pushpin, 'update', _pushpinUpdate);


    };

    function _updatePushpins(dateMin, dateMax) {
        var pushpins = _getPushpins();
        for (var i = 0; i < pushpins.length; i++)
            Microsoft.Maps.Events.invoke(pushpins[i], "update", {
                target: pushpins[i],
                dateMin: dateMin,
                dateMax: dateMax
            });

    };

    this.loadMap = function (options, showHere, callback) {

        var currentPositionSuccess = function (p) {
            _map.setView({ center: new Microsoft.Maps.Location(p.coords.latitude, p.coords.longitude) });
            if (showHere) {
                var pushpin = new Microsoft.Maps.Pushpin(_map.getCenter(), {
                    id: 'Here',
                    draggable: false,
                    icon: w3Settings.hereIcon,
                });
                _map.entities.push(pushpin);
                _initCompleted = true;
                callback();
            }
        }

        var currentPositionFail = function () {
            alert('cannot determine current position');
        }

        var createPin = function (data, clusterInfo) {

            var pushpin = _createPushpin(data.w3event.getDetails().id,data.latitude,data.longitude,"pushpin");

            pushpin.data = data;
            _pushpinUpdateUI(pushpin, _dateRange.min, _dateRange.max);
            return pushpin;
        };

        var createClusteredPin = function (clusterInfo) {

            var pushpin = _createPushpin('cluster' + clusterInfo.index.toString(),
                                          clusterInfo.center.latitude,
                                          clusterInfo.center.longitude,
                                          "pushpinCluster",
                                          (clusterInfo.dataIndices.length > 99 ? "...":clusterInfo.dataIndices.length.toString()));

            pushpin.data = clusterInfo;
            _pushpinUpdateUI(pushpin, _dateRange.min, _dateRange.max);
            return pushpin;
        };

        _map = new Microsoft.Maps.Map(document.getElementById(_htmlHostElement), options);
        Microsoft.Maps.Events.addHandler(_map, 'viewchangeend', _mapViewChanged);

        // setup clustering
        _clusterLayer = new PointBasedClusteredEntityCollection(_map, {
            singlePinCallback: createPin,
            clusteredPinCallback: createClusteredPin
        });
        _infoboxLayer= new Microsoft.Maps.EntityCollection();
        _map.entities.push(_infoboxLayer);

        navigator.geolocation.getCurrentPosition(currentPositionSuccess, currentPositionFail);
    };

    this.getMap = function () { return _map; };



    this.updatePushpins = function (dateMin, dateMax) {
        _updatePushpins(dateMin, dateMax);
        _dateRange.min = dateMin;
        _dateRange.max = dateMax;
    };

    this.loadW3Events = function () {
        _loadW3Events();
    };

    _init(myMap);

};

var w3Event = function(){
    var _details= null;
 
    this.init = function (event) {
        _details = event;
    };
    this.getDetails = function () {
        return _details;
    };
};



