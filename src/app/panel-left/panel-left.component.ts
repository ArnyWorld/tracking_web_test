import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-panel-left',
  standalone: true,
  imports: [ RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './panel-left.component.html',
  styleUrl: './panel-left.component.css'
})
export class PanelLeftComponent {

	hidePanel(ref){
		console.log(ref.style.display);
		if (ref.style.display!="none")
			ref.style.display = "none";
		else
			ref.style.display = "block";
		
	}
}
