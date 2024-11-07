import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-trackplayermap',
  templateUrl: './trackplayermap.component.html',
  styleUrl: './trackplayermap.component.css'
})
export class TrackplayermapComponent {
	@Input() selectedTrack;
	@Input() selectedRoute;
}
