import { AfterViewInit, Component, Input } from '@angular/core';
import { defaults as defaultControls } from 'ol/control';

import Map from 'ol/Map';
import View from 'ol/View';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {Icon, Style} from 'ol/style.js';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature.js';
import Select from 'ol/interaction/Select.js';
import {Fill, Stroke} from 'ol/style.js';
import {OGCMapTile, Vector as VectorSource} from 'ol/source.js';
import {altKeyOnly, click, pointerMove} from 'ol/events/condition.js';
import {fromLonLat} from 'ol/proj.js';


import XYZ from 'ol/source/XYZ';
import ZoomToExtent from 'ol/control/ZoomToExtent';

@Component({
  selector: 'app-olmap',
  standalone: true,
  imports: [],
  templateUrl: './olmap.component.html',
  styleUrl: './olmap.component.css',
})


export class OlmapComponent implements AfterViewInit {
  map!: Map;
  @Input() lon:     number = 0;
  @Input() lat:     number = 0;
  @Input() zoom:    number = 16;
  //https://stackoverflow.com/questions/49699067/property-has-no-initializer-and-is-not-definitely-assigned-in-the-construc
  
  ngAfterViewInit() {
    //this.map.setTarget('map');
    const iconFeature = new Feature({
      geometry: new Point(fromLonLat([this.lon,this.lat])),
      name: 'Null Island',
      population: 4000,
      rainfall: 500,
    });
    
    const iconStyle = new Style({
      image: new Icon({
        //anchor: [0.5, 46],
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        scale: 0.4,
        //src: 'data/icon.png',
        src: 'assets/icon_device.png',
      }),
    });
    
  const vectorSource = new VectorSource({
    features: [iconFeature],
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });
    iconFeature.setStyle(iconStyle);
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          }),
        }),vectorLayer,
      ],
      view: new View({
        center:  fromLonLat([this.lon,this.lat]),
        zoom: this.zoom,
      }),
      controls: defaultControls().extend([
        new ZoomToExtent({
          extent: [
            813079.7791264898, 5929220.284081122, 848966.9639063801,
            5936863.986909639,
          ],
        }),
      ]),
    });


    const selected = new Style({
      fill: new Fill({
        color: '#eeeeee',
      }),
      stroke: new Stroke({
        color: 'rgba(255, 255, 255, 0.7)',
        width: 2,
      }),
    });
    
    const selectStyle = (feature:any)=>  {
      const color = feature.get('COLOR') || '#eeeeee';
      selected?.getFill()?.setColor(color);
      return selected;
    }

    const selectClick = new Select({
      condition: click,
      style: selectStyle,
    });
    let select:any = selectClick; 
      this.map.addInteraction(select);
      select.on('select', function (e:any) {
        console.log(e);
        /*document?.getElementById('status')?.innerHTML = '&nbsp;' +
          e.target.getFeatures()?.getLength() +
          ' selected features (last operation selected ' +
          e.selected.length +
          ' and deselected ' +
          e.deselected.length +
          ' features)';*/
      });
  }
}
