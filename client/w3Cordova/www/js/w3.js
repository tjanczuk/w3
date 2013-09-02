

// CreateMap helpers

var bingMap = {
    htmlHostElement: null,
    eventsList: null,
    map: null,
    clusterLayer: null,
    latLongList: null,
    infoboxLayer: null,

    init: function(myMap, callback) {

        this.htmlHostElement = myMap;

        var clusteringLoaded = function () {
            console.log("clustering loaded");
            callback();
        };

        var themeLoaded = function () {
            Microsoft.Maps.registerModule("PointBasedClusteringModule", "js/PointBasedClustering.js");
            Microsoft.Maps.loadModule("PointBasedClusteringModule", { callback: clusteringLoaded });
            console.log('BingTheme loaded');
            };


        Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', { callback: themeLoaded });
    //Register and load the Point Based Clustering Module

        console.log('map created');

    },

loadMap: function (options, showHere, callback) {

        var currentPositionSuccess = function (p) {
            bingMap.map.setView({ center: new Microsoft.Maps.Location(p.coords.latitude, p.coords.longitude) });
            if (showHere) {
                var pushpin = new Microsoft.Maps.Pushpin(bingMap.map.getCenter(), {
                    id: 'Here',
                    draggable: false,
                    icon: '/img/star-3.png'
                });
                bingMap.map.entities.push(pushpin);
                callback();
            }
        }

        var currentPositionFail = function () {
            alert('cannot determine current position');
        }

        var createPin = function (data, clusterInfo) {

            var pinInfobox = new Microsoft.Maps.Infobox(new Microsoft.Maps.Location(data.latitude, data.longitude),
                {
                    width: 200,
                    height: 200,
                    title: data.w3event.details.location_name,
                    description: data.w3event.details.text,
                    typeName: 'Microsoft.Maps.InfoboxType.micro'
                });

            //map.entities.push(pinInfobox);
            bingMap.clusterLayer.GetLayer().push(pinInfobox);

            pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(data.latitude, data.longitude), {
                id: data.w3event.id,
                infobox: pinInfobox,
                draggable: false,
                visible: true
            });

            return pushpin;
        };

        var createClusteredPin = function (clusterInfo) {

            
            var desc = '';
            var data = bingMap.clusterLayer.GetData();
            for (i = 0; i < clusterInfo.dataIndices.length ; i++)
                desc += '<span><b>' + data[clusterInfo.dataIndices[i]].w3event.details.location_name + '</b><br/>' + data[clusterInfo.dataIndices[i]].w3event.details.text + '</span><br/><br/>';

            var pinInfobox = new Microsoft.Maps.Infobox(new Microsoft.Maps.Location(clusterInfo.center.latitude, clusterInfo.center.longitude),
                {
                    width: 200,
                    height: 200,
                    title: 'Various events',
                    description: desc,
                    typeName: 'Microsoft.Maps.InfoboxType.micro'
                });

            //map.entities.push(pinInfobox);
            bingMap.clusterLayer.GetLayer().push(pinInfobox);

            pushpin = new Microsoft.Maps.Pushpin(clusterInfo.center, {
                text: clusterInfo.dataIndices.length.toString(),
                infobox: pinInfobox,
                draggable: false,
                visible: true
            });
            return pushpin;
        };

        this.map = new Microsoft.Maps.Map(document.getElementById(this.htmlHostElement), options);
//        Microsoft.Maps.Events.addHandler(this.map, 'viewchangeend', this.mapViewChanged);

    // setup clustering
        this.clusterLayer = new PointBasedClusteredEntityCollection(this.map, {
            singlePinCallback: createPin,
            clusteredPinCallback: createClusteredPin
        });

    //Add infobox layer that is above the clustered layers.
     //   var infoboxLayer = new Microsoft.Maps.EntityCollection();
     //   map.entities.push(infoboxLayer);
        navigator.geolocation.getCurrentPosition(currentPositionSuccess, currentPositionFail);
    },

getMap:function(){ return this.map;},

setPushpinOpacity:function(date){

    function setOpacity(elem) {
        document.getElementById(elem.id).style.opacity = 0.4;
    };

 
   for (i = 0; i < this.map.entities.getLength() ; i++)
        if(typeof this.map.entities.get(i) == 'Pushpin')
            setOpacity(this.map.entities.get(i));
},

processW3Events: function (eList) {

        var initEvent = function (e) {
            var event=new w3Event();
            event.init(e,bingMap.map);
            this.eventsList = new Array();
            eventsList.push(event);
            bingMap.latLongList.push({
                name: e.id,
                longitude: e.location.coordinates[0],
                latitude: e.location.coordinates[1],
                w3event:event
            });
        };
        this.latLongList = new Array();
        eList.forEach(initEvent);
        this.clusterLayer.SetData(this.latLongList);
    },
mapViewChanged: function(e){
    // need to check if the View areas is changed and reload events
    // nothing to do if user just zoomed in 
    bingMap.loadW3Events();
},
loadW3Events: function () {

    var NW = bingMap.map.getTargetBounds().getNorthwest();
        var SE = bingMap.map.getTargetBounds().getSoutheast();

        var query = {
            geometry: {
                type: 'Polygon',
                coordinates: [[[NW.longitude, SE.latitude], [SE.longitude, SE.latitude], [SE.longitude, NW.latitude],
                    [NW.longitude, NW.latitude], [NW.longitude, SE.latitude]]]
            },
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
           
           bingMap.processW3Events(data);
        }).fail(function (xhr, status, error) {
            alert('cannot query server' + status + error);
        });
}
};


var w3Event = function(){
    var details= null;
    var map=null;
};
w3Event.prototype.init = function (event,m) {
        this.details = event;
        this.map = m;
    };

w3Event.prototype.setMap = function (m) { this.map = m; };




var sampleEvents=
[
  {
      "created": 1371701758573,
      "text": "Test message $(-120,24: My favorite fishing spot) ^(2013-06-19) ^(2013-06-20) #fishing /cc @theworld @tjanczuk",
      "tags": [
        "fishing"
      ],
      "people": [
        "theworld",
        "tjanczuk"
      ],
      "location": {
          "type": "Point",
          "coordinates": [
            -122.043556008789,
            47.6222513047473
          ]
      },
      "location_name": "My favorite fishing spot",
      "time": {
          "type": "Moment",
          "time": [
            1371600000000
          ]
      },
      "version": "0.0.1",
      "id": "51c28200e345dc7f22000012"
  },
  {
      "created": 1371701758573,
      "text": "Test message $(-120,24: My favorite fishing spot) ^(2013-06-19) ^(2013-06-20) #fishing /cc @theworld @tjanczuk",
      "tags": [
        "fishing"
      ],
      "people": [
        "theworld",
        "tjanczuk"
      ],
      "location": {
          "type": "Point",
          "coordinates": [
            -122.0510747771,
            47.6221120759618
          ]
      },
      "location_name": "My favorite fishing spot",
      "time": {
          "type": "Moment",
          "time": [
            1371686400000
          ]
      },
      "version": "0.0.1",
      "id": "51c28200e345dc7f22000013"
  },
    {
        "created": 1371701758573,
        "text": "Test message $(-120,24: My favorite fishing spot) ^(2013-06-19) ^(2013-06-20) #fishing /cc @theworld @tjanczuk",
        "tags": [
          "fishing"
        ],
        "people": [
          "theworld",
          "tjanczuk"
        ],
        "location": {
            "type": "Point",
            "coordinates": [
              -122.054988656494,
              47.6260920989013
            ]
        },
        "location_name": "My favorite fishing spot",
        "time": {
            "type": "Moment",
            "time": [
              1371686400000
            ]
        },
        "version": "0.0.1",
        "id": "51c28200e345dc7f22000013"
    }


]