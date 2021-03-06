// Set map defaults
var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/lucienlizlepiorz/ckd61fpi915jk1ioyhcpvd10y",
  center: [-87.6441, 41.8846], // Haymarket Square
  zoom: 12,
  attributionControl: false,
});

// Create legend
var legendContainer = document.createElement("div");
var legendTitle = document.createElement("h4");
var legend100plus = document.createElement("div");
var legend10plus = document.createElement("div");
var legend3plus = document.createElement("div");
var legendLess3 = document.createElement("div");
var legendUndetermined = document.createElement("div");
var legendSizes = document.createElement("div");

// Set content
legendContainer.id = "legend";
legendTitle.innerHTML = "Owned by a landlord with...";
legend100plus.innerHTML =
  "<span style='background-color: " + color4 + "'></span>100+ properties";
legend10plus.innerHTML =
  "<span style='background-color: " + color3 + "'></span>10+ properties";
legend3plus.innerHTML =
  "<span style='background-color: " + color2 + "'></span>3+ properties";
legendLess3.innerHTML =
  "<span style='background-color: " + color1 + "'></span>1-2 properties";
legendUndetermined.innerHTML =
  "<span style='background-color: " + white + "'></span># not determined";
legendSizes.innerHTML =
  "<b>Circle size indicates amount of units at an address</b>";

// Add attribution control
var attributionControl = new mapboxgl.AttributionControl({
  customAttribution:
    "<a href='mailto:tenantscdsa@gmail.com' target='_blank' rel='noopener'><b>Improve our data</b></a> | <a href='https://github.com/ChicagoDSA/find-my-landlord' target='_blank' rel='noopener'>View on Github</a>",
});
map.addControl(attributionControl);

// Get map control
var bottomRightClass = document.getElementsByClassName(
  "mapboxgl-ctrl-bottom-right"
);
var bottomRightControl = bottomRightClass[0];

// Add legend inside control
bottomRightControl.insertBefore(legendContainer, bottomRightControl.firstChild);
legendContainer.appendChild(legendTitle);
legendContainer.appendChild(legend100plus);
legendContainer.appendChild(legend10plus);
legendContainer.appendChild(legend3plus);
legendContainer.appendChild(legendLess3);
legendContainer.appendChild(legendUndetermined);
legendContainer.appendChild(legendSizes);

// Add navigation
var navigationControl = new mapboxgl.NavigationControl();
map.addControl(navigationControl, "top-right");

map.on("load", function () {
  // Load search keys
  var request = new XMLHttpRequest();
  request.open("GET", searchIndex, true);
  request.onload = function () {
    if (this.status >= 200 && this.status < 400) {
      json = JSON.parse(this.response);

      // Set source data
      map.addSource("propertyData", {
        type: "vector",
        maxzoom: 14, // Allows overzoom
        tiles: [tiles],
        promoteId: propertyIndexColumn,
      });

      map.addLayer({
        id: "allProperties",
        type: "circle",
        source: "propertyData",
        "source-layer": "features",
        paint: {
          "circle-radius": defaultRadius,
          "circle-color": defaultColors,
          "circle-opacity": defaultOpacity,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(0, 0, 0, .25)",
        },
      });

      // Disable functionality if IE
      if (checkIE() == true) {
        // Show unsupported message
        searchInput.value = "Internet Explorer isn't supported. Try Chrome!";
        searchInput.disabled = true;
        searchInputContainer.style.display = "block";
      } else {
        // Remove persisted value
        searchInput.value = "";
        // Show search
        searchInputContainer.style.display = "block";
        // Add input listeners
        searchInput.addEventListener("keypress", matchAddresses);
        searchInput.addEventListener("input", matchAddresses); // Registers backspace
        // Allow hover and click
        setHoverState("propertyData", "features", "allProperties");
      }

      // Hide spinner
      spinner.style.display = "none";
    }
  };
  request.send();
});

map.on("error", function (e) {
  // Don't log empty tile errors
  if (e && e.error.status != 403) {
    console.error(e);
  }
});

function addLayer(name, data, radius, color, opacity) {
  // Set source data
  map.addSource(name, {
    type: "geojson",
    data: data,
    promoteId: propertyIndexColumn,
  });

  // Add to map
  map.addLayer({
    id: name,
    type: "circle",
    source: name,
    paint: {
      "circle-radius": radius,
      "circle-color": color,
      "circle-opacity": opacity,
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(0, 0, 0, .25)",
    },
  });

  // Style hover
  setHoverState(data, null, name);
}

function setHoverState(sourceData, sourceLayer, hoverLayer) {
  // Building under cursor
  var buildingAtPoint = null;
  // Declared here to fix duplicates
  var buildingID = null;

  map.on("mousemove", hoverLayer, function (e) {
    var featuresAtPoint = map.queryRenderedFeatures(e.point, {
      layers: [hoverLayer],
    });
    if (sourceLayer != null) {
      // Vector source
      buildingAtPoint = getBuildingAtPoint(featuresAtPoint, sourceData);
    } else {
      // GeoJSON source
      buildingAtPoint = getBuildingAtPoint(featuresAtPoint, hoverLayer);
    }

    if (buildingAtPoint) {
      map.getCanvas().style.cursor = "pointer";
      // Remove existing state
      if (buildingID) {
        if (sourceLayer != null) {
          // Vector source
          map.removeFeatureState({
            source: sourceData,
            sourceLayer: sourceLayer,
          });
        } else {
          // GeoJSON source
          map.removeFeatureState({
            source: hoverLayer,
            id: buildingID,
          });
        }
      }

      // Set new ID
      buildingID = featuresAtPoint[0].properties[propertyIndexColumn];

      // Hover to true
      if (sourceLayer != null) {
        // Vector source
        map.setFeatureState(
          {
            source: sourceData,
            sourceLayer: sourceLayer,
            id: buildingID,
          },
          {
            hover: true,
          }
        );
      } else {
        // GeoJSON source
        map.setFeatureState(
          {
            source: hoverLayer,
            id: buildingID,
          },
          {
            hover: true,
          }
        );
      }
    } else {
      // Clear var
      buildingAtPoint = null;
    }
  });

  map.on("click", hoverLayer, function (e) {
    // Hover to false
    if (buildingID) {
      if (sourceLayer != null) {
        // Vector source
        map.setFeatureState(
          {
            source: sourceData,
            sourceLayer: sourceLayer,
            id: buildingID,
          },
          {
            hover: false,
          }
        );
      } else {
        // GeoJSON source
        map.setFeatureState(
          {
            source: hoverLayer,
            id: buildingID,
          },
          {
            hover: false,
          }
        );
      }
    }

    // Select property
    if (buildingAtPoint) {
      // Reset UI
      resetMap();
      // Update it
      renderSelectedUI(buildingAtPoint);
      // Log event
      firebase.analytics().logEvent("map-point-clicked", {
        property_address: buildingAtPoint.properties[propertyAddressColumn],
        taxpayer: buildingAtPoint.properties[taxpayerColumn],
        affiliated_with: buildingAtPoint.properties[affiliatedWithColumn],
      });
    }
  });

  map.on("mouseleave", hoverLayer, function () {
    // Hover to false
    if (buildingID) {
      if (sourceLayer != null) {
        // Vector source
        map.setFeatureState(
          {
            source: sourceData,
            sourceLayer: sourceLayer,
            id: buildingID,
          },
          {
            hover: false,
          }
        );
      } else {
        // GeoJSON source
        map.setFeatureState(
          {
            source: hoverLayer,
            id: buildingID,
          },
          {
            hover: false,
          }
        );
      }
    }

    // Clear var
    buildingID = null;

    // Restore cursor
    map.getCanvas().style.cursor = "";
  });
}

function getBuildingAtPoint(features, source) {
  var filtered = features.filter(function (feature) {
    var pointSource = feature.layer.source;
    // Return feature when trimmed input is found in buildings array
    return pointSource.indexOf(source) > -1;
  });
  return filtered[0];
}
