// Dynamically determine circle color depending on depth value
function depthColor(depth) {
    if (depth > 90) {
        return '#ea2c2c';
    } else if (depth > 70) {
        return '#ea822c';
    } else if (depth > 50) {
        return '#ee9c00';
    } else if (depth > 30) {
        return '#eecc00';
    } else if (depth > 10) {
        return '#d4ee00';
    } else {
        return '#98ee00';
    }
}

function createMap(data, geo_data) {
    // STEP 1: Init the Base Layers

    // Define variables for our tile layers.
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })

    let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    let darkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });

    // Step 2: Create the Overlay layers
    let markers = L.layerGroup();

    for (let i = 0; i < data.features.length; i++){
        let row = data.features[i];
        let magnitude = row.properties.mag;
        let depth = row.geometry.coordinates[2];
        let lat = row.geometry.coordinates[1];
        let lng = row.geometry.coordinates[0];
        let color = depthColor(depth);

        let timeInMS = row.properties.time;
        let date = new Date(timeInMS);
        let options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZoneName: 'short'
        };
        let legibleDate = date.toLocaleString('en-US', options);

        // Create marker
        let circleMarker = L.circleMarker([lat, lng], {
            radius: Math.sqrt(magnitude) * 6, // Adjust size based on magnitude
            fillColor: color,
            color: 'black',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.8
        });

        let popupContent = `<h2>Incident #${i + 1}</h2>
                <strong>Time:</strong> ${legibleDate}<br>
                <strong>Location:</strong> ${row.properties.place}<br>
                <strong>Magnitude:</strong> ${magnitude}<br>
                <strong>Depth:</strong> ${depth} km<br>
                <strong>Detail:</strong> <a href='${row.properties.url}' target='_blank'>link</a><br>
                <strong>Type:</strong> ${row.properties.type}`;
        circleMarker.bindPopup(popupContent);

        // Add marker to the layer group
        markers.addLayer(circleMarker);
    }

    let geo_layer = L.geoJSON(geo_data, {
        style: {
            color: "orange",
            fillOpacity: 0,
            weight: 2
        }
    });

    // Step 3: BUILD the Layer Controls

    // Only one base layer can be shown at a time.
    let baseLayers = {
        Street: street,
        Topography: topo,
        "Dark Mode": darkMatter
    };

    let overlayLayers = {
        Earthquakes: markers,
        "Tectonic Plates": geo_layer
    };

    // Step 4: INIT the Map
    let myMap = L.map("map", {
        center: [40.7128, -74.0059],
        zoom: 4,
        layers: [street, geo_layer, markers]
    });

    // Step 5: Add the Layer Control filter + legends as needed
    L.control.layers(baseLayers, overlayLayers).addTo(myMap);

    // Add Legend
    let legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            bins = [-10, 10, 30, 50, 70, 90]

        // Loop through bins and add new html element to include color sample for each value
        for (let k = 0; k < bins.length; k++) {
            div.innerHTML +=
                '<i style="background:' + depthColor(bins[k] + 1) + '"></i> ' +
                bins[k] + (bins[k + 1] ? '&ndash;' + bins[k + 1] + '<br>' : '+');
        }

        return div;
    };
    
    legend.addTo(myMap);

}

// Create map using GeoJSON data provided at the URL
function InitMap() {
    let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
    let url2 = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";
    d3.json(url).then(function (data) {
        d3.json(url2).then(function (geo_data) {
            createMap(data, geo_data);
        });
    });
}

InitMap();