import { Subscription } from 'rxjs/Subscription';
import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { MapService } from '../services/map.service';
import { GeoJson, FeatureCollection } from '../map';
import { Observable } from 'rxjs/Observable';
import { AngularFirestore } from 'angularfire2/firestore';

@Component({
  selector: 'app-map-box',
  templateUrl: './map-box.component.html',
  styleUrls: ['./map-box.component.css']
})
export class MapBoxComponent implements OnInit {

  // Default settings
  map: mapboxgl.Map;
  style = 'mapbox://styles/mapbox/outdoors-v9';
  lat = 37.75;
  lng = -122.41;
  message = "Hello Mexico";

  // Data
  source: any;
  markers: any;

  constructor(private mapService: MapService) { }

  ngOnInit() {
    // Get markers from mapService
    this.mapService.getMarkers().subscribe(markers => this.markers = markers);

    // Initialize creation of map
    this.initializeMap();
  }

  private initializeMap() {
    // Center to the position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
          
        this.map.flyTo({
          center: [this.lng, this.lat]
        });
      });
    }

    this.buildMap();

  }

  buildMap() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: this.style,
      zoom: 13,
      center: [this.lng, this.lat]
    });

    // Add map controls
    this.map.addControl(new mapboxgl.NavigationControl());

    // Set point
    this.map.on('click', (event) => {
      this.lat = event.lngLat.lat;
      this.lng = event.lngLat.lng;

      this.map.flyTo({
        center: [this.lng, this.lat],
        zoom: 17
      });

    });

    // Add realtime data on map load
    this.map.on('load', (event) => {

      // Register source
      this.map.addSource('firebase', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Get source
      this.source = this.map.getSource('firebase');          
      
      // Set data
      let data = new FeatureCollection(this.markers);   
      this.source.setData(data);

      // Create map layers with realtime data
      this.map.addLayer({
        id: 'firebase',
        source: 'firebase',
        type: 'symbol',
        layout: {
          'text-field': '{message}',
          'text-size': 22,
          'icon-image': 'circle-15',
          'text-offset': [0, 1.5]
        },
        paint: {
          'text-color': '#E74C3C',
          'text-halo-color': '#fff',
          'text-halo-width': 2
        }
      });

    })

  }

  createMarker() {

    // Check duplicate row
    let duplicate = this.markers.filter(item => item.properties.message === this.message );
    if (duplicate.length > 0) {
      console.log("Duplicated!");
      return;
    }

    const coordinates = [this.lng, this.lat]
    const newMarker = new GeoJson(coordinates, { message: this.message });
    this.mapService.createMarker(newMarker);
  }

  removeMarker(marker) {
    this.mapService.removeMarker(marker.key)
      .then(function(resp){
        console.log("Removed!");
      })
      .catch(function(error){
        console.log(error);
      });
  }

  flyTo(data: GeoJson) {
    this.map.flyTo({
      center: data.geometry.coordinates,
      zoom: 13,
    })
  }

}
