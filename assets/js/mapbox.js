mapboxgl.accessToken = "pk.eyJ1IjoibHVjaWVubGl6bGVwaW9yeiIsImEiOiJjaWluY3lweWUwMWU5dHBrcHlsYnpscjF5In0.siT3_mzRABrCBeG4iGCEYQ";

var bounds = [
	[-88.045342, 41.612104], // Southwest coordinates
	[-87.326560, 42.181465] // Northeast coordinates
];

var map = new mapboxgl.Map({
	container: "map",
	style: "mapbox://styles/mapbox/dark-v10",
	center: [-87.695787, 41.881302], // Fred Hampton mural
	zoom: 11,
	maxBounds: bounds
});

var url = "assets/data/features.geojson";
var matchingAddresses = [];
var searchInput = document.getElementById("search-input");
var searchResultsContainer = document.getElementById("search-results-container");
var searchResultsCounter = document.getElementById("search-results-counter");
var searchResultsList = document.getElementById("search-results-list");

map.addControl(new mapboxgl.NavigationControl());

function renderResults(features) {
	clearSearchResults();
	
	if (features.length) {		
		// Results were found
		// Show container
		searchResultsContainer.style.display = "block";

		// Change language depending on number of results
		if (features.length == 1) {
			searchResultsCounter.innerHTML = "<h4>"+features.length+" search result";
		} else {
			searchResultsCounter.innerHTML = "<h4>"+features.length+" search results";
		};

		console.log("features"+JSON.stringify(features));

		features.forEach(function(feature) {
			var item = document.createElement('div');
			try {
				var layerArray = map.queryRenderedFeatures({ layers: [feature] });
				console.log("layer array"+layerArray);

				var address = layerArray[0].properties.Address;
				var owner = layerArray[0].properties.Owner;
				var owned = layerArray[0].properties.Owned;

				item.className = "search-result";
				item.innerHTML = "<h3>"+address+"</h3><p>Owned by: "+owner+"</br>Total properties owned: "+owned+"</p><button type='button'>Download their data</button>";
				searchResultsList.appendChild(item);
			} catch (e) {
				console.log(e);
			}
		});
	} else if (features.length == 0 && searchInput.value != '') {
		// No results found
		searchResultsContainer.style.display = "block";
		searchResultsCounter.innerHTML = "<h4>No search results</h4>";
		searchResultsList.innerHTML = "<p style='margin: 0'>Sorry, we couldn't find that address. Try something like <b>634 E 50th Pl</b>.</p>";
	};

	if (searchInput.value == '') {
		// Input is empty
		clearSearchResults();
	};
}

function clearSearchResults() {
	// Hide container
	searchResultsContainer.style.display = "none";

	// Clear counter and list HTML
	searchResultsCounter.innerHTML = "";
	searchResultsList.innerHTML = "";
}

map.on("load", function() {
	// Load GeoJSON
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.onload = function() {
		if (this.status >= 200 && this.status < 400) {
			var json = JSON.parse(this.response);
			console.log(json);

			map.addSource("buildings", {
				type: "geojson",
				data: json
			});

			json.features.forEach(function(feature) {	
				var address = feature.properties['Address'];
				var matchingAddress = address.trim().toLowerCase();

				if (!map.getLayer(matchingAddress)) {
					map.addLayer({
						"id": matchingAddress,
						"type": "circle",
						"source": "buildings",
						"paint": {
							"circle-radius": 4,
							"circle-color": [
								"step",
								["get", "Owned"],
								"#000",
								0, "#ff9900",
								5, "#990000",
								50, "#ff6666",
								200, "#ff9999"
							],
							"circle-stroke-color": "#660000",
							"circle-stroke-width": 1,
						},
						"filter": ["==", "Address", address]
					});
					matchingAddresses.push(matchingAddress);
				}
			});
			searchInput.style.display = "block";
		}
	};
	request.send();

	searchInput.addEventListener("keyup", function(e) {
		var value = e.target.value.trim().toLowerCase();
		console.log(value);

		// Create list of search results
		var results = matchingAddresses.filter(function(matchingAddress) {
			return matchingAddress.indexOf(value) > -1;
		});
		renderResults(results);
		console.log("search results"+results);

		// Show and hide buildings based on results
		matchingAddresses.forEach(function(matchingAddress) {
			if (results.indexOf(matchingAddress) > -1) {
				map.setLayoutProperty(
					matchingAddress,
					"visibility",
					"visible"
				);
			} else {
				map.setLayoutProperty(
					matchingAddress,
					"visibility",
					"none"
				);
			}
		});
	});	
});