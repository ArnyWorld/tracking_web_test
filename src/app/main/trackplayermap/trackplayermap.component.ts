import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-trackplayermap',
  templateUrl: './trackplayermap.component.html',
  styleUrl: './trackplayermap.component.css'
})
export class TrackplayermapComponent {
	@Input() selectedTracks;
	/*@Input() selectedTrack;
	@Input() selectedRoute;*/
	
	signalType(acc){
		if (acc <14)
			return 'buena';
		if (acc <20)
			return 'regular';
		return 'mala';
	}
	
}
