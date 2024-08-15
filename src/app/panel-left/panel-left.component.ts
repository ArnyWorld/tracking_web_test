import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-panel-left',
  standalone: true,
  imports: [ RouterOutlet, RouterLink, RouterLinkActive,CommonModule],
  templateUrl: './panel-left.component.html',
  styleUrl: './panel-left.component.css'
})
export class PanelLeftComponent {

	is_hide = false;
	hidePanel(ref){
		console.log(ref);
		if (!this.is_hide) this.is_hide=true;
		else this.is_hide = false;
			//ref.nativeElement.classList.add("hide-panel");
		/*if (ref.style.display!="none")
			ref.style.display = "none";
		else
			ref.style.display = "block";*/
		
	}
}
